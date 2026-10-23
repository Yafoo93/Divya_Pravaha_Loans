import { NextResponse, type NextRequest } from "next/server";
import type { FinancialPostingType } from "@/lib/financial-posting-rules";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";
import { postFinancialEvent } from "@/server/accounting/financial-postings";
import { db } from "@/lib/db";
import { randomUUID } from "node:crypto";

const eventTypes = new Set<FinancialPostingType>([
  "LOAN_DISBURSEMENT",
  "INTEREST_ACCRUAL",
  "CASH_RECEIPT",
  "CUSTODY_TRANSFER",
  "UNIDENTIFIED_CASH",
  "CUSTOMER_OVERPAYMENT",
  "JOINT_LIABILITY_CONTRIBUTION",
]);
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const allowed = Boolean(
    session &&
    canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "manage_ledger",
      session.user.featureGate,
      true,
      session.user.role,
    ),
  );
  if (!session || !allowed)
    return NextResponse.json(
      { error: "Ledger posting permission is required." },
      { status: 403 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const type =
    typeof body.type === "string"
      ? (body.type as FinancialPostingType)
      : ("" as FinancialPostingType);
  const branchId = typeof body.branchId === "string" ? body.branchId : "";
  const sourceReference =
    typeof body.sourceReference === "string" ? body.sourceReference : "";
  const entryDate = new Date(
    typeof body.entryDate === "string" ? body.entryDate : "",
  );
  if (!eventTypes.has(type) || Number.isNaN(entryDate.getTime()))
    return NextResponse.json(
      { error: "Valid posting type and entry date are required." },
      { status: 400 },
    );
  const scope = await requireBranchScope(session);
  try {
    assertBranchAccess(branchId, scope);
  } catch {
    return NextResponse.json(
      { error: "Branch is outside your assignment." },
      { status: 403 },
    );
  }
  try {
    if (
      type === "CUSTOMER_OVERPAYMENT" &&
      (!(typeof body.payerName === "string" && body.payerName.trim()) ||
        !(
          typeof body.payerReference === "string" && body.payerReference.trim()
        ))
    )
      throw new Error(
        "Payer name and verification reference are required for overpayments.",
      );
    const journal = await postFinancialEvent({
      type,
      sourceReference,
      entryDate,
      branchId,
      actorUserId: session.user.id,
      amounts: {
        amountPesewas: Number(body.amountPesewas),
        principalPesewas: Number(body.principalPesewas),
        interestPesewas: Number(body.interestPesewas),
      },
    });
    const shortId = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    if (type === "UNIDENTIFIED_CASH") {
      await db.suspenseItem.create({
        data: {
          suspenseNumber: `SUS-${shortId}`,
          sourceReference,
          amountPesewas: Number(body.amountPesewas),
          payerName:
            typeof body.payerName === "string" ? body.payerName.trim() : null,
          branchId,
          originJournalId: journal.id,
        },
      });
    }
    if (type === "CUSTOMER_OVERPAYMENT") {
      const payerName =
        typeof body.payerName === "string" ? body.payerName.trim() : "";
      const payerReference =
        typeof body.payerReference === "string"
          ? body.payerReference.trim()
          : "";
      await db.overpaymentLiability.create({
        data: {
          liabilityNumber: `OVP-${shortId}`,
          payerName,
          payerReference,
          amountPesewas: Number(body.amountPesewas),
          branchId,
          originJournalId: journal.id,
        },
      });
    }
    await recordAuditEvent({
      eventType: "FINANCIAL_EVENT_POSTED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "manage_ledger",
      resource: `journal:${journal.journalNumber}`,
      reason: type,
      branchId,
    });
    return NextResponse.json(
      { journalNumber: journal.journalNumber },
      { status: 201 },
    );
  } catch (error) {
    const duplicate =
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002";
    return NextResponse.json(
      {
        error: duplicate
          ? "This source event has already been posted."
          : error instanceof Error
            ? error.message
            : "Posting failed.",
      },
      { status: 409 },
    );
  }
}
