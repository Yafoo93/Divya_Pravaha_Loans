export type CapitalLotBalance = {
  originalPesewas: number;
  availablePesewas: number;
  reservedPesewas: number;
  committedPesewas: number;
  disbursedPesewas: number;
  recoveredPesewas: number;
};

export function assertPesewas(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(
      `${label} must be a non-negative integer number of pesewas`,
    );
}

export function validateLotBalance(lot: CapitalLotBalance) {
  for (const [label, value] of Object.entries(lot)) assertPesewas(value, label);
  if (lot.originalPesewas === 0)
    throw new Error("A funding lot must have a positive original balance");
  const attributed =
    lot.availablePesewas +
    lot.reservedPesewas +
    lot.committedPesewas +
    lot.disbursedPesewas;
  if (attributed > lot.originalPesewas + lot.recoveredPesewas)
    throw new Error("Funding-lot balances exceed verified capital");
  return lot;
}

export function canReserveCapital(
  availablePesewas: number,
  amountPesewas: number,
) {
  assertPesewas(availablePesewas, "Available balance");
  assertPesewas(amountPesewas, "Reservation amount");
  return amountPesewas > 0 && amountPesewas <= availablePesewas;
}

export function splitRecovery(
  principalPesewas: number,
  interestPesewas: number,
) {
  assertPesewas(principalPesewas, "Recovered principal");
  assertPesewas(interestPesewas, "Recovered interest");
  return {
    principalPesewas,
    interestPesewas,
    totalPesewas: principalPesewas + interestPesewas,
  };
}

export const excludedCapitalSources = [
  "EXCLUDED_CUSTODY",
  "EXCLUDED_RECEIVABLE",
  "EXCLUDED_SUSPENSE",
  "EXCLUDED_OVERPAYMENT",
  "INVESTOR_PRINCIPAL",
] as const;
