import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  allocateOldestDueFirst,
  validateCollectionChannel,
  validateCashCollection,
} from "@/lib/cash-collection";
import { db } from "@/lib/db";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";
import { canPerformPermission } from "@/lib/workspace-authorization";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (
    !session ||
    !canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "record_cash_receipts",
      session.user.featureGate,
      true,
      session.user.role,
    )
  )
    return NextResponse.json(
      { error: "Cash-receipt permission is required." },
      { status: 403 },
    );

  const body = (await request.json()) as Record<string, unknown>;
  const loanId = typeof body.loanId === "string" ? body.loanId : "";
  const amount = typeof body.amount === "string" ? body.amount : "";
  const receivedDate =
    typeof body.receivedDate === "string" ? body.receivedDate : "";
  const borrowerConfirmed = body.borrowerConfirmed === true;
  const idempotencyKey =
    typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  const paymentMethod = body.paymentMethod;
  const submissionMode = body.submissionMode;
  const errors = validateCashCollection({
    amount,
    receivedDate,
    borrowerConfirmed,
  });
  if (Object.keys(errors).length > 0 || idempotencyKey.length < 12)
    return NextResponse.json(
      { error: "Complete the cash form and submit a valid request." },
      { status: 400 },
    );
  try {
    validateCollectionChannel(paymentMethod, submissionMode);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid payment channel.",
      },
      { status: 400 },
    );
  }
  if (
    "allocations" in body ||
    "principalAllocatedPesewas" in body ||
    "interestAllocatedPesewas" in body
  )
    return NextResponse.json(
      { error: "Manual payment allocation is not allowed." },
      { status: 400 },
    );

  const existing = await db.receipt.findUnique({ where: { idempotencyKey } });
  if (existing) {
    if (existing.loanId !== loanId)
      return NextResponse.json(
        { error: "This submission key belongs to another receipt." },
        { status: 409 },
      );
    return NextResponse.json({ id: existing.id, replayed: true });
  }

  const loan = await db.loan.findUnique({
    where: { id: loanId },
    include: { borrower: true },
  });
  if (!loan || loan.status !== "ACTIVE")
    return NextResponse.json(
      { error: "An active assigned loan was not found." },
      { status: 404 },
    );
  const scope = await requireBranchScope(session);
  try {
    assertBranchAccess(loan.branchId, scope);
    if (!loan.borrower.ghanaCardVerified)
      throw new Error("Borrower identity must be verified before collection.");
    const amountPesewas = Math.round(Number(amount) * 100);
    const date = new Date(`${receivedDate}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime()))
      throw new Error("Cash-received date is invalid.");
    const collectionDate = new Date(`${receivedDate}T00:00:00.000Z`);
    const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
    const receipt = await db.$transaction(
      async (tx) => {
        const assignment = await tx.assignment.findFirst({
          where: {
            loanId: loan.id,
            collectionDate,
            ...(session.user.role === "MANAGER"
              ? { branchId: loan.branchId }
              : { collectorUserId: session.user.id }),
            status: { in: ["ASSIGNED", "IN_PROGRESS"] },
          },
        });
        if (!assignment)
          throw new Error(
            "No active collection assignment was found for this loan and date.",
          );

        const instalments = await tx.repaymentInstalment.findMany({
          where: { loanId: loan.id, status: { not: "PAID" } },
          orderBy: [
            { effectiveCollectionDate: "asc" },
            { instalmentNumber: "asc" },
          ],
        });
        const allocations = allocateOldestDueFirst(amountPesewas, instalments);
        const principalAllocatedPesewas = allocations.reduce(
          (sum, item) => sum + item.principalAllocatedPesewas,
          0,
        );
        const interestAllocatedPesewas = allocations.reduce(
          (sum, item) => sum + item.interestAllocatedPesewas,
          0,
        );
        const payment = await tx.payment.create({
          data: {
            paymentNumber: `PAY-${receivedDate.replaceAll("-", "")}-${suffix}`,
            idempotencyKey,
            amountPesewas,
            principalAllocatedPesewas,
            interestAllocatedPesewas,
            method: "CASH",
            submissionMode: "ONLINE",
            receivedAt: date,
            branchId: loan.branchId,
            borrowerId: loan.borrowerId,
            loanId: loan.id,
            assignmentId: assignment.id,
            collectorUserId: session.user.id,
            allocations: {
              create: allocations.map((item, sequence) => ({
                sequence: sequence + 1,
                amountPesewas: item.amountPesewas,
                principalAllocatedPesewas: item.principalAllocatedPesewas,
                interestAllocatedPesewas: item.interestAllocatedPesewas,
                instalmentId: item.instalmentId,
              })),
            },
          },
        });
        for (const item of allocations) {
          const principalPaid =
            item.principalPaidBeforePesewas + item.principalAllocatedPesewas;
          const interestPaid =
            item.interestPaidBeforePesewas + item.interestAllocatedPesewas;
          await tx.repaymentInstalment.update({
            where: { id: item.instalmentId },
            data: {
              principalPaidPesewas: principalPaid,
              interestPaidPesewas: interestPaid,
              status:
                principalPaid === item.principalDuePesewas &&
                interestPaid === item.interestDuePesewas
                  ? "PAID"
                  : "PART_PAID",
            },
          });
        }
        const custody = await tx.custodyMovement.aggregate({
          where: { collectorUserId: session.user.id },
          _sum: { amountPesewas: true },
        });
        await tx.custodyMovement.create({
          data: {
            movementNumber: `CST-${receivedDate.replaceAll("-", "")}-${suffix}`,
            type: "CASH_RECEIVED",
            amountPesewas,
            balanceAfterPesewas:
              (custody._sum.amountPesewas ?? 0) + amountPesewas,
            occurredAt: date,
            branchId: loan.branchId,
            collectorUserId: session.user.id,
            paymentId: payment.id,
          },
        });
        const createdReceipt = await tx.receipt.create({
          data: {
            receiptNumber: `RCT-${receivedDate.replaceAll("-", "")}-${suffix}`,
            idempotencyKey,
            amountPesewas,
            principalAllocatedPesewas,
            interestAllocatedPesewas,
            status: "CAPTURED",
            receivedAt: date,
            collectionNote:
              typeof body.collectionNote === "string"
                ? body.collectionNote.trim().slice(0, 500) || null
                : null,
            branchId: loan.branchId,
            borrowerId: loan.borrowerId,
            loanId: loan.id,
            collectorUserId: session.user.id,
            paymentId: payment.id,
          },
        });
        const remaining = instalments.reduce(
          (sum, item) =>
            sum +
            item.principalPesewas -
            item.principalPaidPesewas +
            item.interestPesewas -
            item.interestPaidPesewas,
          0,
        );
        await tx.assignment.update({
          where: { id: assignment.id },
          data: {
            status: amountPesewas >= remaining ? "COMPLETED" : "IN_PROGRESS",
            completedAt: amountPesewas >= remaining ? date : null,
          },
        });
        if (amountPesewas >= remaining)
          await tx.loan.update({
            where: { id: loan.id },
            data: { status: "CLOSED" },
          });
        return createdReceipt;
      },
      { isolationLevel: "Serializable" },
    );
    await recordAuditEvent({
      eventType: "CASH_RECEIPT_CAPTURED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "record_cash_receipts",
      resource: `receipt:${receipt.receiptNumber}`,
      branchId: loan.branchId,
    });
    return NextResponse.json(
      { id: receipt.id, receiptNumber: receipt.receiptNumber, replayed: false },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Receipt capture failed.",
      },
      { status: 409 },
    );
  }
}
