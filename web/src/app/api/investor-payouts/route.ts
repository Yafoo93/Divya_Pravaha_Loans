import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  parseGhsToPesewas,
  remainingInvestorBalances,
} from "@/lib/private-capital";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (
    !session ||
    !canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "prepare_investor_payouts",
      session.user.featureGate,
      true,
      session.user.role,
    )
  )
    return NextResponse.json(
      { error: "Payout preparation permission is required." },
      { status: 403 },
    );
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const investmentId =
      typeof body.investmentId === "string" ? body.investmentId : "";
    const returnAmountPesewas = body.returnAmountGhs
      ? parseGhsToPesewas(body.returnAmountGhs)
      : 0;
    const principalAmountPesewas = body.principalAmountGhs
      ? parseGhsToPesewas(body.principalAmountGhs)
      : 0;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason || (!returnAmountPesewas && !principalAmountPesewas))
      throw new Error("A reason and payout amount are required.");
    const investment = await db.privateInvestment.findUniqueOrThrow({
      where: { id: investmentId },
    });
    const scope = await requireBranchScope(session);
    assertBranchAccess(investment.branchId, scope);
    if (principalAmountPesewas && new Date() < investment.maturityDate)
      throw new Error(
        "Principal cannot be repaid before maturity without an approved early-exit policy.",
      );
    const pending = await db.investorPayout.aggregate({
      where: { investmentId, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { returnAmountPesewas: true, principalAmountPesewas: true },
    });
    const balances = remainingInvestorBalances(investment);
    if (
      returnAmountPesewas + (pending._sum.returnAmountPesewas ?? 0) >
      balances.returnDuePesewas
    )
      throw new Error("Return payout exceeds accrued returns payable.");
    if (
      principalAmountPesewas + (pending._sum.principalAmountPesewas ?? 0) >
      balances.principalDuePesewas
    )
      throw new Error("Principal payout exceeds principal outstanding.");
    const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
    const payout = await db.investorPayout.create({
      data: {
        payoutNumber: `IPO-${suffix}`,
        idempotencyKey:
          typeof body.idempotencyKey === "string" && body.idempotencyKey
            ? body.idempotencyKey
            : `IPO-${suffix}`,
        type:
          returnAmountPesewas && principalAmountPesewas
            ? "MIXED"
            : principalAmountPesewas
              ? "PRINCIPAL"
              : "RETURN",
        returnAmountPesewas,
        principalAmountPesewas,
        reason,
        payeeVerified: body.payeeVerified === true,
        branchId: investment.branchId,
        investmentId,
        requestedByUserId: session.user.id,
      },
    });
    await recordAuditEvent({
      eventType: "INVESTOR_PAYOUT_REQUESTED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "prepare_investor_payouts",
      resource: `payout:${payout.payoutNumber}`,
      reason,
      branchId: investment.branchId,
    });
    return NextResponse.json(
      { id: payout.id, payoutNumber: payout.payoutNumber },
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
          ? "This payout request was already recorded."
          : error instanceof Error
            ? error.message
            : "Payout request failed.",
      },
      { status: 409 },
    );
  }
}
