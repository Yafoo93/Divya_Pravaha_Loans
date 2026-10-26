import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { calculatePrivateCapitalReturn } from "@/lib/private-capital";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { getServerSession } from "@/server/auth/session";
import { recordAuditEvent } from "@/server/auth/audit";
import { postPrivateCapitalJournal } from "@/server/accounting/private-capital-journal";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (
    !session ||
    !canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "manage_private_investors",
      session.user.featureGate,
      true,
      session.user.role,
    )
  )
    return NextResponse.json(
      { error: "Private-investor permission is required." },
      { status: 403 },
    );
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const requestedThrough = new Date(
      typeof body.throughDate === "string"
        ? body.throughDate
        : new Date().toISOString(),
    );
    if (Number.isNaN(requestedThrough.getTime()))
      throw new Error("A valid accrual date is required.");
    const investment = await db.privateInvestment.findUniqueOrThrow({
      where: { id },
    });
    const scope = await requireBranchScope(session);
    assertBranchAccess(investment.branchId, scope);
    if (!["ACTIVE", "MATURED"].includes(investment.status))
      throw new Error("Only active or matured contracts can accrue returns.");
    const expected = calculatePrivateCapitalReturn({
      principalPesewas: investment.principalPesewas,
      startDate: investment.startDate,
      throughDate: requestedThrough,
      maturityDate: investment.maturityDate,
      annualReturnBps: investment.annualReturnBps,
    });
    const amountPesewas =
      expected.returnPesewas - investment.accruedReturnPesewas;
    if (amountPesewas <= 0)
      throw new Error("Returns are already accrued through that date.");
    const last = await db.investorReturnAccrual.findFirst({
      where: { investmentId: id },
      orderBy: { throughDate: "desc" },
    });
    const fromDate = last?.throughDate ?? investment.startDate;
    const daysAccrued = Math.round(
      (expected.throughDate.getTime() - fromDate.getTime()) / 86_400_000,
    );
    if (daysAccrued <= 0)
      throw new Error("Returns are already accrued through that date.");
    const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
    const result = await db.$transaction(async (tx) => {
      const accrual = await tx.investorReturnAccrual.create({
        data: {
          accrualNumber: `IAC-${suffix}`,
          fromDate,
          throughDate: expected.throughDate,
          daysAccrued,
          amountPesewas,
          sourceReference: `IAC-${suffix}`,
          investmentId: id,
        },
      });
      await tx.privateInvestment.update({
        where: { id },
        data: {
          accruedReturnPesewas: { increment: amountPesewas },
          ...(expected.throughDate >= investment.maturityDate
            ? { status: "MATURED" as const }
            : {}),
        },
      });
      await postPrivateCapitalJournal(tx, {
        branchId: investment.branchId,
        actorUserId: session.user.id,
        entryDate: expected.throughDate,
        sourceEventType: "PRIVATE_RETURN_ACCRUED",
        sourceReference: accrual.sourceReference,
        description: `60% simple return accrued for ${investment.contractNumber}`,
        debitCode: "5000",
        creditCode: "2110",
        amountPesewas,
      });
      return accrual;
    });
    await recordAuditEvent({
      eventType: "PRIVATE_RETURN_ACCRUED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "manage_private_investors",
      resource: `investment:${investment.contractNumber}`,
      reason: result.accrualNumber,
      branchId: investment.branchId,
    });
    return NextResponse.json({
      accrualNumber: result.accrualNumber,
      amountPesewas,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Return accrual failed.",
      },
      { status: 409 },
    );
  }
}
