import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { validateDisbursementEvidence } from "@/lib/disbursement-rules";
import { calculateLoanTerms } from "@/lib/loan-application";
import { assertIndependentChecker } from "@/server/auth/maker-checker-policy";

export type ReleaseCashInput = {
  loanId: string;
  reservationId: string;
  beneficiaryBorrowerId: string;
  identityConfirmed: boolean;
  voucherNumber: string;
  voucherDocumentReference: string;
  voucherSignedAt: Date;
  actualCashOutAt: Date;
  idempotencyKey: string;
  preparedByUserId: string;
};

export async function releaseLoanCash(input: ReleaseCashInput) {
  if (input.idempotencyKey.trim().length < 12)
    throw new Error(
      "A stable idempotency key of at least 12 characters is required",
    );
  if (!input.voucherNumber.trim())
    throw new Error("A unique cash-voucher number is required");
  if (
    Number.isNaN(input.voucherSignedAt.getTime()) ||
    Number.isNaN(input.actualCashOutAt.getTime())
  )
    throw new Error(
      "Valid voucher-signing and physical cash-out dates are required",
    );

  return db.$transaction(async (tx) => {
    const replay = await tx.disbursement.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { voucher: true, loan: true },
    });
    if (replay) {
      if (
        replay.loanId !== input.loanId ||
        replay.reservationId !== input.reservationId
      )
        throw new Error("Idempotency key is already bound to another release");
      return replay;
    }

    const loan = await tx.loan.findUnique({
      where: { id: input.loanId },
      include: {
        borrower: true,
        applicationDocuments: true,
        decisions: { orderBy: { decidedAt: "desc" }, take: 1 },
      },
    });
    if (!loan) throw new Error("Approved loan was not found");
    const reservation = await tx.fundingReservation.findUnique({
      where: { id: input.reservationId },
      include: { fundLot: { include: { fundAccount: true } } },
    });
    if (!reservation || reservation.loanId !== loan.id)
      throw new Error("Funding reservation does not belong to this loan");
    const decision = loan.decisions[0];
    const signedContract = loan.applicationDocuments.some(
      (document) =>
        document.type === "SIGNED_CONTRACT" && document.status === "VERIFIED",
    );
    validateDisbursementEvidence({
      loanStatus: loan.status,
      principalPesewas: loan.principalPesewas,
      reservationStatus: reservation.status,
      reservationPesewas: reservation.amountPesewas,
      fundingVerified: Boolean(reservation.fundLot.verifiedAt),
      fundingEligible: reservation.fundLot.fundAccount.eligibleForFunding,
      beneficiaryMatchesBorrower:
        input.beneficiaryBorrowerId === loan.borrowerId,
      identityConfirmed: input.identityConfirmed,
      signedContract,
      signedVoucher:
        input.voucherDocumentReference.trim().length > 0 &&
        input.voucherSignedAt <= input.actualCashOutAt,
      managerAuthorized: Boolean(
        decision?.status === "APPROVED" && decision.decidedByUserId,
      ),
    });
    assertIndependentChecker(input.preparedByUserId, decision.decidedByUserId);
    const period = await tx.accountingPeriod.findFirst({
      where: {
        branchId: loan.branchId,
        status: "OPEN",
        startsAt: { lte: input.actualCashOutAt },
        endsAt: { gte: input.actualCashOutAt },
      },
    });
    if (!period)
      throw new Error("Cash-out date is not in an open accounting period");
    const accounts = await tx.ledgerAccount.findMany({
      where: { code: { in: ["1000", "1100"] }, isActive: true },
    });
    const accountIds = new Map(
      accounts.map((account) => [account.code, account.id]),
    );
    if (accountIds.size !== 2)
      throw new Error("Disbursement ledger accounts are unavailable");

    const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
    const disbursementNumber = `DIS-${suffix}`;
    const journal = await tx.journalEntry.create({
      data: {
        journalNumber: `J-${disbursementNumber}`,
        description: `Physical cash disbursement for ${loan.loanNumber}`,
        sourceEventType: "LOAN_DISBURSEMENT",
        sourceReference: disbursementNumber,
        entryDate: input.actualCashOutAt,
        branchId: loan.branchId,
        periodId: period.id,
        actorUserId: input.preparedByUserId,
        lines: {
          create: [
            {
              accountId: accountIds.get("1100")!,
              debitPesewas: loan.principalPesewas,
              creditPesewas: 0,
            },
            {
              accountId: accountIds.get("1000")!,
              debitPesewas: 0,
              creditPesewas: loan.principalPesewas,
            },
          ],
        },
      },
    });
    const schedule = calculateLoanTerms(
      loan.principalPesewas,
      loan.termMonths,
      loan.repaymentFrequency,
      input.actualCashOutAt,
    ).schedule;
    await tx.repaymentInstalment.createMany({
      data: schedule.map((instalment) => ({
        loanId: loan.id,
        instalmentNumber: instalment.number,
        principalPesewas: instalment.principalPesewas,
        interestPesewas: instalment.interestPesewas,
        totalPesewas: instalment.totalPesewas,
        contractualDueDate: instalment.contractualDueDate!,
        effectiveCollectionDate: instalment.effectiveCollectionDate!,
      })),
    });
    await tx.fundingReservation.update({
      where: { id: reservation.id },
      data: { status: "COMMITTED", committedAt: input.actualCashOutAt },
    });
    await tx.fundLot.update({
      where: { id: reservation.fundLotId },
      data: {
        reservedPesewas: { decrement: reservation.amountPesewas },
        disbursedPesewas: { increment: reservation.amountPesewas },
        status: "DISBURSED",
      },
    });
    await tx.fundAllocation.create({
      data: {
        allocationNumber: `ALLOC-${disbursementNumber}`,
        amountPesewas: reservation.amountPesewas,
        status: "DISBURSED",
        allocatedAt: input.actualCashOutAt,
        disbursedAt: input.actualCashOutAt,
        fundLotId: reservation.fundLotId,
        loanId: loan.id,
        reservationId: reservation.id,
      },
    });
    await tx.fundMovement.create({
      data: {
        movementNumber: `MOV-${disbursementNumber}`,
        movementType: "DISBURSED",
        sourceReference: disbursementNumber,
        amountPesewas: reservation.amountPesewas,
        notes: `Reservation consumed by physical cash release to ${loan.borrower.legalName}`,
        occurredAt: input.actualCashOutAt,
        fundLotId: reservation.fundLotId,
        actorUserId: input.preparedByUserId,
      },
    });
    await tx.loan.update({
      where: { id: loan.id },
      data: { status: "ACTIVE", disbursedAt: input.actualCashOutAt },
    });
    return await tx.disbursement.create({
      data: {
        disbursementNumber,
        idempotencyKey: input.idempotencyKey,
        amountPesewas: loan.principalPesewas,
        beneficiaryName: loan.borrower.legalName,
        beneficiaryIdentity: loan.borrower.ghanaCardNumber,
        identityConfirmed: true,
        contractReference: loan.applicationDocuments.find(
          (document) => document.type === "SIGNED_CONTRACT",
        )!.reference,
        managerAuthorization: decision.decisionNumber,
        actualCashOutAt: input.actualCashOutAt,
        loanId: loan.id,
        reservationId: reservation.id,
        journalId: journal.id,
        preparedByUserId: input.preparedByUserId,
        authorizedByUserId: decision.decidedByUserId,
        voucher: {
          create: {
            voucherNumber: input.voucherNumber,
            documentReference: input.voucherDocumentReference,
            signedAt: input.voucherSignedAt,
          },
        },
      },
      include: { voucher: true, loan: true },
    });
  });
}
