type NaturalBalanceType =
  "ASSET" | "CONTRA_ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export function naturalBalancePesewas(
  type: NaturalBalanceType,
  debitPesewas: number,
  creditPesewas: number,
) {
  return type === "ASSET" || type === "EXPENSE"
    ? debitPesewas - creditPesewas
    : creditPesewas - debitPesewas;
}

export function trialBalanceDifferencePesewas(
  debitPesewas: number,
  creditPesewas: number,
) {
  return debitPesewas - creditPesewas;
}

export function provisionalCreditLossPesewas(
  exposures: readonly { daysPastDue: number; unpaidAmountPesewas: number }[],
) {
  return exposures.reduce((total, exposure) => {
    const rate =
      exposure.daysPastDue <= 0
        ? 0
        : exposure.daysPastDue <= 30
          ? 0.05
          : exposure.daysPastDue <= 60
            ? 0.25
            : exposure.daysPastDue <= 90
              ? 0.5
              : 1;
    return total + Math.round(exposure.unpaidAmountPesewas * rate);
  }, 0);
}
