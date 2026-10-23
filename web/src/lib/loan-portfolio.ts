export type InstalmentBalance = {
  principalPesewas: number;
  interestPesewas: number;
  principalPaidPesewas: number;
  interestPaidPesewas: number;
};

export function contractualBalance(instalments: readonly InstalmentBalance[]) {
  return instalments.reduce(
    (balance, instalment) => ({
      remainingPrincipalPesewas:
        balance.remainingPrincipalPesewas +
        Math.max(
          0,
          instalment.principalPesewas - instalment.principalPaidPesewas,
        ),
      remainingInterestPesewas:
        balance.remainingInterestPesewas +
        Math.max(
          0,
          instalment.interestPesewas - instalment.interestPaidPesewas,
        ),
    }),
    { remainingPrincipalPesewas: 0, remainingInterestPesewas: 0 },
  );
}

export function earlySettlementQuote(
  instalments: readonly InstalmentBalance[],
  quotedAt: Date,
) {
  const balance = contractualBalance(instalments);
  return {
    quotedAt,
    ...balance,
    settlementPesewas:
      balance.remainingPrincipalPesewas + balance.remainingInterestPesewas,
    rebatePesewas: 0,
    waiverPesewas: 0,
    penaltyPesewas: 0,
    restructuringPesewas: 0,
  };
}

export function shouldCloseRepaidLoan(
  instalments: readonly InstalmentBalance[],
) {
  const balance = contractualBalance(instalments);
  return (
    balance.remainingPrincipalPesewas === 0 &&
    balance.remainingInterestPesewas === 0
  );
}
