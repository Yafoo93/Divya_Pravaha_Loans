import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { JournalLineInput } from "@/lib/journal-rules";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertIndependentRequestChecker,
  assertRefundWithinLiability,
  availableRefundPesewas,
} from "@/lib/correction-rules";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordSensitiveAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";
import { reversePostedJournal } from "@/server/accounting/journal";

const suffix = () =>
  randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : "";
  const managerAction = [
    "APPROVE_REVERSAL",
    "REJECT_REVERSAL",
    "APPROVE_REFUND",
    "REJECT_REFUND",
  ].includes(action);
  const permission = managerAction ? "approve_exceptions" : "manage_ledger";
  const allowed = canPerformPermission(
    session.user.permissions,
    session.user.restrictions,
    permission,
    session.user.featureGate,
    true,
    session.user.role,
  );
  if (!allowed || (managerAction && session.user.role !== "MANAGER"))
    return NextResponse.json(
      { error: "Controlled accounting permission is required." },
      { status: 403 },
    );
  const scope = await requireBranchScope(session);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 10)
    return NextResponse.json(
      { error: "A reason of at least ten characters is required." },
      { status: 400 },
    );

  try {
    let resource = "accounting-correction";
    if (action === "REQUEST_REVERSAL") {
      const journalId =
        typeof body.journalId === "string" ? body.journalId : "";
      const journal = await db.journalEntry.findUnique({
        where: { id: journalId },
      });
      if (!journal || journal.status !== "POSTED")
        throw new Error("A posted journal is required.");
      assertBranchAccess(journal.branchId, scope);
      const receipt = await db.receipt.findFirst({
        where: {
          OR: [
            { receiptNumber: journal.sourceReference },
            { payment: { paymentNumber: journal.sourceReference } },
          ],
        },
      });
      const existing = await db.reversalRequest.findFirst({
        where: { originalJournalId: journal.id, status: "PENDING" },
      });
      if (existing)
        throw new Error("A pending reversal request already exists.");
      const created = await db.reversalRequest.create({
        data: {
          requestNumber: `RRQ-${suffix()}`,
          reason,
          branchId: journal.branchId,
          originalJournalId: journal.id,
          receiptId: receipt?.id,
          requestedByUserId: session.user.id,
          replacementData:
            body.replacement && typeof body.replacement === "object"
              ? JSON.parse(JSON.stringify(body.replacement))
              : undefined,
        },
      });
      resource = `reversal-request:${created.requestNumber}`;
    } else if (action === "APPROVE_REVERSAL" || action === "REJECT_REVERSAL") {
      const requestId =
        typeof body.requestId === "string" ? body.requestId : "";
      const pending = await db.reversalRequest.findUnique({
        where: { id: requestId },
        include: { originalJournal: true },
      });
      if (!pending || pending.status !== "PENDING")
        throw new Error("A pending reversal request is required.");
      assertBranchAccess(pending.branchId, scope);
      assertIndependentRequestChecker(
        pending.requestedByUserId,
        session.user.id,
      );
      if (action === "REJECT_REVERSAL") {
        await db.reversalRequest.update({
          where: { id: pending.id },
          data: {
            status: "REJECTED",
            decisionReason: reason,
            decidedAt: new Date(),
            decidedByUserId: session.user.id,
          },
        });
      } else {
        const rawReplacement =
          pending.replacementData &&
          typeof pending.replacementData === "object" &&
          !Array.isArray(pending.replacementData)
            ? (pending.replacementData as Record<string, unknown>)
            : null;
        const replacement = rawReplacement
          ? {
              journalNumber: `J-REP-${suffix()}`,
              description:
                typeof rawReplacement.description === "string"
                  ? rawReplacement.description
                  : `Corrected replacement for ${pending.originalJournal.journalNumber}`,
              sourceEventType: "JOURNAL_REPLACEMENT",
              sourceReference:
                typeof rawReplacement.sourceReference === "string"
                  ? rawReplacement.sourceReference
                  : "",
              entryDate: new Date(),
              lines: Array.isArray(rawReplacement.lines)
                ? (rawReplacement.lines as JournalLineInput[])
                : [],
            }
          : undefined;
        const reversal = await reversePostedJournal(
          pending.originalJournalId,
          session.user.id,
          reason,
          replacement,
          pending.receiptId ?? undefined,
        );
        await db.reversalRequest.update({
          where: { id: pending.id },
          data: {
            status: "APPROVED",
            decisionReason: reason,
            decidedAt: new Date(),
            decidedByUserId: session.user.id,
            reversalId: reversal.id,
          },
        });
      }
      resource = `reversal-request:${pending.requestNumber}`;
    } else if (action === "RESOLVE_SUSPENSE") {
      const itemId = typeof body.itemId === "string" ? body.itemId : "";
      const item = await db.suspenseItem.findUnique({ where: { id: itemId } });
      if (!item || item.status !== "PENDING")
        throw new Error("An open suspense item is required.");
      assertBranchAccess(item.branchId, scope);
      const principal = Number(body.principalPesewas ?? item.amountPesewas);
      const interest = Number(body.interestPesewas ?? 0);
      if (
        !Number.isInteger(principal) ||
        !Number.isInteger(interest) ||
        principal < 0 ||
        interest < 0 ||
        principal + interest !== item.amountPesewas
      )
        throw new Error(
          "Resolution components must exactly equal the suspense amount.",
        );
      const now = new Date();
      const journal = await createControlledJournal({
        branchId: item.branchId,
        actorUserId: session.user.id,
        sourceReference: `RESOLVE-${item.suspenseNumber}`,
        description: `Resolve ${item.suspenseNumber}: ${reason}`,
        lines: [
          { code: "2000", debit: item.amountPesewas, credit: 0 },
          ...(principal ? [{ code: "1100", debit: 0, credit: principal }] : []),
          ...(interest ? [{ code: "1110", debit: 0, credit: interest }] : []),
        ],
      });
      await db.suspenseItem.update({
        where: { id: item.id },
        data: {
          status: "RESOLVED",
          resolutionNote: reason,
          resolvedAt: now,
          resolvedByUserId: session.user.id,
          resolutionJournalId: journal.id,
        },
      });
      resource = `suspense:${item.suspenseNumber}`;
    } else if (action === "REQUEST_REFUND") {
      const liabilityId =
        typeof body.liabilityId === "string" ? body.liabilityId : "";
      const amount = Number(body.amountPesewas);
      const liability = await db.overpaymentLiability.findUnique({
        where: { id: liabilityId },
        include: { refundRequests: true },
      });
      if (!liability) throw new Error("Overpayment liability not found.");
      assertBranchAccess(liability.branchId, scope);
      const pending = liability.refundRequests
        .filter((item) => item.status === "PENDING")
        .reduce((sum, item) => sum + item.amountPesewas, 0);
      assertRefundWithinLiability(
        amount,
        availableRefundPesewas(
          liability.amountPesewas,
          liability.refundedPesewas,
          pending,
        ),
      );
      if (body.payerVerified !== true)
        throw new Error(
          "Payer identity must be verified before requesting a refund.",
        );
      const created = await db.refundRequest.create({
        data: {
          requestNumber: `RFQ-${suffix()}`,
          amountPesewas: amount,
          payerVerified: true,
          reason,
          liabilityId: liability.id,
          requestedByUserId: session.user.id,
        },
      });
      resource = `refund-request:${created.requestNumber}`;
    } else if (action === "APPROVE_REFUND" || action === "REJECT_REFUND") {
      const requestId =
        typeof body.requestId === "string" ? body.requestId : "";
      const pending = await db.refundRequest.findUnique({
        where: { id: requestId },
        include: { liability: true },
      });
      if (!pending || pending.status !== "PENDING")
        throw new Error("A pending refund request is required.");
      assertBranchAccess(pending.liability.branchId, scope);
      assertIndependentRequestChecker(
        pending.requestedByUserId,
        session.user.id,
      );
      if (!pending.payerVerified)
        throw new Error("Payer identity has not been verified.");
      if (action === "REJECT_REFUND") {
        await db.refundRequest.update({
          where: { id: pending.id },
          data: {
            status: "REJECTED",
            decisionReason: reason,
            decidedAt: new Date(),
            decidedByUserId: session.user.id,
          },
        });
      } else {
        const available = availableRefundPesewas(
          pending.liability.amountPesewas,
          pending.liability.refundedPesewas,
        );
        assertRefundWithinLiability(pending.amountPesewas, available);
        const journal = await createControlledJournal({
          branchId: pending.liability.branchId,
          actorUserId: session.user.id,
          sourceReference: `REFUND-${pending.requestNumber}`,
          description: `Approved overpayment refund: ${reason}`,
          lines: [
            { code: "2010", debit: pending.amountPesewas, credit: 0 },
            { code: "1000", debit: 0, credit: pending.amountPesewas },
          ],
        });
        await db.$transaction([
          db.overpaymentLiability.update({
            where: { id: pending.liabilityId },
            data: { refundedPesewas: { increment: pending.amountPesewas } },
          }),
          db.refundRequest.update({
            where: { id: pending.id },
            data: {
              status: "APPROVED",
              decisionReason: reason,
              decidedAt: new Date(),
              decidedByUserId: session.user.id,
              refundJournalId: journal.id,
            },
          }),
        ]);
      }
      resource = `refund-request:${pending.requestNumber}`;
    } else throw new Error("Unsupported correction action.");

    await recordSensitiveAuditEvent(managerAction ? "approval" : "reversal", {
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission,
      resource,
      reason,
    });
    return NextResponse.json({ action, resource });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Correction action failed.",
      },
      { status: 409 },
    );
  }
}

async function createControlledJournal(input: {
  branchId: string;
  actorUserId: string;
  sourceReference: string;
  description: string;
  lines: { code: string; debit: number; credit: number }[];
}) {
  const now = new Date();
  return db.$transaction(async (tx) => {
    const period = await tx.accountingPeriod.findFirst({
      where: {
        branchId: input.branchId,
        status: "OPEN",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });
    const accounts = await tx.ledgerAccount.findMany({
      where: {
        code: { in: input.lines.map((line) => line.code) },
        isActive: true,
      },
    });
    const ids = new Map(accounts.map((account) => [account.code, account.id]));
    if (
      !period ||
      ids.size !== new Set(input.lines.map((line) => line.code)).size
    )
      throw new Error(
        "Open accounting period and required accounts are needed.",
      );
    return tx.journalEntry.create({
      data: {
        journalNumber: `J-COR-${suffix()}`,
        description: input.description,
        sourceEventType: "CONTROLLED_CORRECTION",
        sourceReference: input.sourceReference,
        entryDate: now,
        branchId: input.branchId,
        periodId: period.id,
        actorUserId: input.actorUserId,
        lines: {
          create: input.lines.map((line) => ({
            accountId: ids.get(line.code)!,
            debitPesewas: line.debit,
            creditPesewas: line.credit,
          })),
        },
      },
    });
  });
}
