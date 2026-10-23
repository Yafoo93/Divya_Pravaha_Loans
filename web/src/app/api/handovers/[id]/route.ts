import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  canPostReconciliation,
  countDenominations,
  reconciliationResult,
  type DenominationInput,
} from "@/lib/handover-rules";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { assertIndependentChecker } from "@/server/auth/maker-checker-policy";
import { getServerSession } from "@/server/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const action = body.action;
  const permission =
    action === "POST" ? "post_reconciled_receipts" : "verify_cash_handovers";
  if (
    !canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      permission,
      session.user.featureGate,
      true,
      session.user.role,
    )
  )
    return NextResponse.json(
      { error: "Handover control permission is required." },
      { status: 403 },
    );

  const { id } = await params;
  const handover = await db.handover.findFirst({
    where: { OR: [{ id }, { handoverNumber: id }] },
    include: { reconciliation: true },
  });
  if (!handover)
    return NextResponse.json(
      { error: "Handover was not found." },
      { status: 404 },
    );
  const scope = await requireBranchScope(session);
  try {
    assertBranchAccess(handover.branchId, scope);
    assertIndependentChecker(handover.collectorUserId, session.user.id);
    if (action === "VERIFY") {
      if (handover.status !== "SUBMITTED" || handover.reconciliation)
        throw new Error(
          "Only a submitted, unchecked handover can be verified.",
        );
      const denominations = Array.isArray(body.denominations)
        ? (body.denominations as DenominationInput[])
        : [];
      const countedPesewas = countDenominations(denominations);
      const positiveVarianceType =
        body.positiveVarianceType === "UNIDENTIFIED_CASH"
          ? "UNIDENTIFIED_CASH"
          : "EXCESS";
      const result = reconciliationResult(
        handover.expectedPesewas,
        countedPesewas,
        positiveVarianceType,
      );
      const note = typeof body.note === "string" ? body.note.trim() : "";
      if (note.length < 5)
        throw new Error(
          "A reconciliation note of at least five characters is required.",
        );
      const suffix = randomUUID()
        .replaceAll("-", "")
        .slice(0, 10)
        .toUpperCase();
      await db.$transaction(async (tx) => {
        await tx.denominationCount.createMany({
          data: denominations
            .filter((item) => item.quantity > 0)
            .map((item) => ({
              denominationPesewas: item.denominationPesewas,
              quantity: item.quantity,
              countedPesewas: item.denominationPesewas * item.quantity,
              handoverId: handover.id,
            })),
        });
        await tx.reconciliation.create({
          data: {
            reconciliationNumber: `REC-${suffix}`,
            status: result.status,
            expectedPesewas: handover.expectedPesewas,
            countedPesewas,
            variancePesewas: result.variancePesewas,
            note,
            handoverId: handover.id,
            checkerUserId: session.user.id,
          },
        });
        if (result.exceptionType)
          await tx.cashException.create({
            data: {
              exceptionNumber: `EXC-${suffix}`,
              type: result.exceptionType,
              amountPesewas: result.exceptionAmountPesewas,
              notes: note,
              handoverId: handover.id,
            },
          });
        await tx.handover.update({
          where: { id: handover.id },
          data: {
            status: "VERIFIED",
            countedPesewas,
            variancePesewas: result.variancePesewas,
            verifiedAt: new Date(),
            checkerUserId: session.user.id,
          },
        });
        await tx.receipt.updateMany({
          where: {
            handoverLinks: { some: { handoverId: handover.id, active: true } },
          },
          data: { status: "VERIFIED" },
        });
      });
    } else if (action === "POST") {
      if (
        handover.status !== "VERIFIED" ||
        !handover.reconciliation ||
        !canPostReconciliation(
          handover.reconciliation.status,
          handover.reconciliation.variancePesewas,
        )
      )
        throw new Error("Only a balanced verified handover can be posted.");
      const suffix = randomUUID()
        .replaceAll("-", "")
        .slice(0, 10)
        .toUpperCase();
      const postedAt = new Date();
      await db.$transaction(
        async (tx) => {
          const period = await tx.accountingPeriod.findFirst({
            where: {
              branchId: handover.branchId,
              status: "OPEN",
              startsAt: { lte: postedAt },
              endsAt: { gte: postedAt },
            },
          });
          if (!period)
            throw new Error("No open accounting period covers this handover.");
          const accounts = await tx.ledgerAccount.findMany({
            where: { code: { in: ["1000", "1010"] }, isActive: true },
          });
          const accountIds = new Map(
            accounts.map((account) => [account.code, account.id]),
          );
          if (!accountIds.get("1000") || !accountIds.get("1010"))
            throw new Error(
              "Cash and collector-custody ledger accounts are required.",
            );
          const journal = await tx.journalEntry.create({
            data: {
              journalNumber: `J-HND-${suffix}`,
              description: `Verified custody transfer ${handover.handoverNumber}`,
              sourceEventType: "CUSTODY_TRANSFER",
              sourceReference: handover.handoverNumber,
              entryDate: postedAt,
              branchId: handover.branchId,
              periodId: period.id,
              actorUserId: session.user.id,
              lines: {
                create: [
                  {
                    accountId: accountIds.get("1000")!,
                    debitPesewas: handover.expectedPesewas,
                  },
                  {
                    accountId: accountIds.get("1010")!,
                    creditPesewas: handover.expectedPesewas,
                  },
                ],
              },
            },
          });
          const custody = await tx.custodyMovement.aggregate({
            where: { collectorUserId: handover.collectorUserId },
            _sum: { amountPesewas: true },
          });
          await tx.custodyMovement.create({
            data: {
              movementNumber: `CST-HND-${suffix}`,
              type: "HANDOVER_POSTED",
              amountPesewas: -handover.expectedPesewas,
              balanceAfterPesewas:
                (custody._sum.amountPesewas ?? 0) - handover.expectedPesewas,
              occurredAt: postedAt,
              branchId: handover.branchId,
              collectorUserId: handover.collectorUserId,
            },
          });
          await tx.receipt.updateMany({
            where: {
              handoverLinks: {
                some: { handoverId: handover.id, active: true },
              },
            },
            data: { status: "POSTED" },
          });
          await tx.handover.update({
            where: { id: handover.id },
            data: { status: "POSTED", postedAt, journalId: journal.id },
          });
        },
        { isolationLevel: "Serializable" },
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported handover action." },
        { status: 400 },
      );
    }
    await recordAuditEvent({
      eventType:
        action === "POST" ? "CASH_HANDOVER_POSTED" : "CASH_HANDOVER_VERIFIED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission,
      resource: `handover:${handover.handoverNumber}`,
      branchId: handover.branchId,
    });
    return NextResponse.json({ id: handover.id, action });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Handover action failed.",
      },
      { status: 409 },
    );
  }
}
