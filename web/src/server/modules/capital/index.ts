import "server-only";

import { db } from "@/lib/db";
import { canReserveCapital, splitRecovery } from "@/lib/capital-rules";

type ReserveCapitalInput = {
  lotId: string;
  loanId: string;
  amountPesewas: number;
  reservationNumber: string;
  actorUserId: string;
};

export async function reserveCapital(input: ReserveCapitalInput) {
  if (!canReserveCapital(Number.MAX_SAFE_INTEGER, input.amountPesewas))
    throw new Error("Reservation amount must be positive integer pesewas");

  return db.$transaction(async (tx) => {
    const lot = await tx.fundLot.findUnique({
      where: { id: input.lotId },
      include: { fundAccount: true },
    });
    if (!lot?.fundAccount.eligibleForFunding || !lot.verifiedAt)
      throw new Error("Only verified eligible funding lots may be reserved");

    const changed = await tx.fundLot.updateMany({
      where: {
        id: input.lotId,
        availablePesewas: { gte: input.amountPesewas },
        status: { not: "CANCELLED" },
      },
      data: {
        availablePesewas: { decrement: input.amountPesewas },
        reservedPesewas: { increment: input.amountPesewas },
        status: "RESERVED",
      },
    });
    if (changed.count !== 1)
      throw new Error("Funding lot has insufficient available balance");

    const reservation = await tx.fundingReservation.create({
      data: {
        reservationNumber: input.reservationNumber,
        amountPesewas: input.amountPesewas,
        fundLotId: input.lotId,
        loanId: input.loanId,
      },
    });
    await tx.fundMovement.create({
      data: {
        movementNumber: `MOV-${input.reservationNumber}`,
        movementType: "RESERVED",
        sourceReference: input.reservationNumber,
        amountPesewas: input.amountPesewas,
        notes: "Capital reserved atomically against verified available balance",
        fundLotId: input.lotId,
        actorUserId: input.actorUserId,
      },
    });
    return reservation;
  });
}

export async function recordCapitalRecovery(input: {
  allocationId: string;
  sourceReference: string;
  principalPesewas: number;
  interestPesewas: number;
  actorUserId: string;
}) {
  const recovery = splitRecovery(input.principalPesewas, input.interestPesewas);
  if (recovery.totalPesewas === 0) throw new Error("Recovery cannot be zero");

  return db.$transaction(async (tx) => {
    const allocation = await tx.fundAllocation.findUniqueOrThrow({
      where: { id: input.allocationId },
    });
    await tx.fundAllocation.update({
      where: { id: allocation.id },
      data: {
        recoveredPrincipalPesewas: { increment: recovery.principalPesewas },
        recoveredInterestPesewas: { increment: recovery.interestPesewas },
        recoveredAt: new Date(),
        status: "RECOVERED",
      },
    });
    await tx.fundLot.update({
      where: { id: allocation.fundLotId },
      data: {
        availablePesewas: { increment: recovery.principalPesewas },
        recoveredPesewas: { increment: recovery.principalPesewas },
        disbursedPesewas: { decrement: recovery.principalPesewas },
        status: "RECOVERED",
      },
    });
    return tx.fundMovement.create({
      data: {
        movementNumber: `MOV-${input.sourceReference}`,
        movementType: "RECOVERED",
        sourceReference: input.sourceReference,
        amountPesewas: recovery.totalPesewas,
        principalAmountPesewas: recovery.principalPesewas,
        interestAmountPesewas: recovery.interestPesewas,
        notes:
          "Recovered principal returned to capital availability; interest traced separately",
        fundLotId: allocation.fundLotId,
        actorUserId: input.actorUserId,
      },
    });
  });
}
