export function contractualReceivablesPesewas(
  schedules: readonly {
    principalPesewas: number;
    interestPesewas: number;
    principalPaidPesewas: number;
    interestPaidPesewas: number;
  }[],
) {
  return schedules.reduce(
    (total, item) =>
      total +
      Math.max(0, item.principalPesewas - item.principalPaidPesewas) +
      Math.max(0, item.interestPesewas - item.interestPaidPesewas),
    0,
  );
}

export function collectorCustodyPesewas(
  movements: readonly { amountPesewas: number }[],
) {
  return movements.reduce(
    (total, movement) => total + movement.amountPesewas,
    0,
  );
}

export function availableFundingPesewas(
  lots: readonly {
    availablePesewas: number;
    fundAccount: { eligibleForFunding: boolean; sourceType: string };
  }[],
) {
  return lots
    .filter(
      (lot) =>
        lot.fundAccount.eligibleForFunding &&
        !lot.fundAccount.sourceType.startsWith("EXCLUDED_") &&
        lot.fundAccount.sourceType !== "INVESTOR_PRINCIPAL",
    )
    .reduce((total, lot) => total + Math.max(0, lot.availablePesewas), 0);
}

export function collectionRatePercent(
  receivedPesewas: number,
  duePesewas: number,
) {
  return duePesewas <= 0
    ? 0
    : Math.min(100, (receivedPesewas / duePesewas) * 100);
}
