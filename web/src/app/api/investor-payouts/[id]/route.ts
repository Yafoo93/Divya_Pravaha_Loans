import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { remainingInvestorBalances } from "@/lib/private-capital";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";
import { postPrivateCapitalJournal } from "@/server/accounting/private-capital-journal";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (
    !session ||
    !canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "approve_investor_payouts",
      session.user.featureGate,
      true,
      session.user.role,
    )
  )
    return NextResponse.json(
      { error: "Manager payout approval is required." },
      { status: 403 },
    );
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action === "REJECT" ? "REJECT" : "APPROVE";
    const decisionReason =
      typeof body.decisionReason === "string" ? body.decisionReason.trim() : "";
    const paymentReference =
      typeof body.paymentReference === "string"
        ? body.paymentReference.trim()
        : "";
    if (!decisionReason) throw new Error("A decision reason is required.");
    const payout = await db.investorPayout.findUniqueOrThrow({
      where: { id },
      include: { investment: { include: { fundLot: true } } },
    });
    if (payout.status !== "PENDING")
      throw new Error("This payout has already been decided.");
    if (payout.requestedByUserId === session.user.id)
      throw new Error(
        "The payout checker must be different from the requester.",
      );
    const scope = await requireBranchScope(session);
    assertBranchAccess(payout.branchId, scope);
    if (action === "REJECT") {
      await db.investorPayout.update({
        where: { id },
        data: {
          status: "REJECTED",
          decidedAt: new Date(),
          decidedByUserId: session.user.id,
          decisionReason,
        },
      });
    } else {
      if (!payout.payeeVerified || !paymentReference)
        throw new Error("Verified payee and payment reference are required.");
      const balances = remainingInvestorBalances(payout.investment);
      if (
        payout.returnAmountPesewas > balances.returnDuePesewas ||
        payout.principalAmountPesewas > balances.principalDuePesewas
      )
        throw new Error("Payout exceeds the current liability balance.");
      const suffix = randomUUID()
        .replaceAll("-", "")
        .slice(0, 10)
        .toUpperCase();
      await db.$transaction(async (tx) => {
        const cashAccount = await tx.ledgerAccount.findUnique({
          where: { code: "1000" },
          include: {
            journalLines: {
              where: {
                journal: { branchId: payout.branchId, status: "POSTED" },
              },
              select: { debitPesewas: true, creditPesewas: true },
            },
          },
        });
        const cashBalance =
          cashAccount?.journalLines.reduce(
            (sum, line) => sum + line.debitPesewas - line.creditPesewas,
            0,
          ) ?? 0;
        const payoutTotal =
          payout.returnAmountPesewas + payout.principalAmountPesewas;
        if (payoutTotal > cashBalance)
          throw new Error(
            "Posted company cash is insufficient for this payout.",
          );
        if (payout.returnAmountPesewas)
          await postPrivateCapitalJournal(tx, {
            branchId: payout.branchId,
            actorUserId: session.user.id,
            entryDate: new Date(),
            sourceEventType: "PRIVATE_RETURN_PAID",
            sourceReference: `IPR-${suffix}`,
            description: `Return paid for ${payout.investment.contractNumber}`,
            debitCode: "2110",
            creditCode: "1000",
            amountPesewas: payout.returnAmountPesewas,
          });
        if (payout.principalAmountPesewas)
          await postPrivateCapitalJournal(tx, {
            branchId: payout.branchId,
            actorUserId: session.user.id,
            entryDate: new Date(),
            sourceEventType: "PRIVATE_PRINCIPAL_REPAID",
            sourceReference: `IPP-${suffix}`,
            description: `Principal repaid for ${payout.investment.contractNumber}`,
            debitCode: "2100",
            creditCode: "1000",
            amountPesewas: payout.principalAmountPesewas,
          });
        const nextReturnPaid =
          payout.investment.returnPaidPesewas + payout.returnAmountPesewas;
        const nextPrincipalPaid =
          payout.investment.principalRepaidPesewas +
          payout.principalAmountPesewas;
        await tx.privateInvestment.update({
          where: { id: payout.investmentId },
          data: {
            returnPaidPesewas: nextReturnPaid,
            principalRepaidPesewas: nextPrincipalPaid,
            ...(nextPrincipalPaid === payout.investment.principalPesewas &&
            nextReturnPaid === payout.investment.accruedReturnPesewas
              ? { status: "CLOSED" as const }
              : {}),
          },
        });
        if (payout.principalAmountPesewas) {
          if (
            payout.investment.fundLot.availablePesewas <
            payout.principalAmountPesewas
          )
            throw new Error(
              "Available traced principal is insufficient for this repayment.",
            );
          await tx.fundLot.update({
            where: { id: payout.investment.fundLotId },
            data: {
              availablePesewas: { decrement: payout.principalAmountPesewas },
            },
          });
          await tx.fundMovement.create({
            data: {
              movementNumber: `MOV-IPP-${suffix}`,
              movementType: "CANCELLED",
              sourceReference: `PAYOUT:${payout.payoutNumber}`,
              amountPesewas: payout.principalAmountPesewas,
              principalAmountPesewas: payout.principalAmountPesewas,
              notes: "Private capital principal repaid to contributor",
              fundLotId: payout.investment.fundLotId,
              actorUserId: session.user.id,
            },
          });
        }
        await tx.investorPayout.update({
          where: { id },
          data: {
            status: "PAID",
            decidedAt: new Date(),
            paidAt: new Date(),
            decidedByUserId: session.user.id,
            decisionReason,
            paymentReference,
          },
        });
      });
    }
    await recordAuditEvent({
      eventType:
        action === "APPROVE"
          ? "INVESTOR_PAYOUT_PAID"
          : "INVESTOR_PAYOUT_REJECTED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "approve_investor_payouts",
      resource: `payout:${payout.payoutNumber}`,
      reason: decisionReason,
      branchId: payout.branchId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Payout decision failed.",
      },
      { status: 409 },
    );
  }
}
