export const supportedDenominationsPesewas = [
  20_000, 10_000, 5_000, 2_000, 1_000, 500, 200, 100,
] as const;

export type DenominationInput = {
  denominationPesewas: number;
  quantity: number;
};

export function countDenominations(inputs: readonly DenominationInput[]) {
  const seen = new Set<number>();
  return inputs.reduce((total, input) => {
    if (
      !supportedDenominationsPesewas.includes(
        input.denominationPesewas as (typeof supportedDenominationsPesewas)[number],
      ) ||
      !Number.isSafeInteger(input.quantity) ||
      input.quantity < 0 ||
      seen.has(input.denominationPesewas)
    )
      throw new Error(
        "Denomination counts must be unique non-negative quantities.",
      );
    seen.add(input.denominationPesewas);
    return total + input.denominationPesewas * input.quantity;
  }, 0);
}

export function reconciliationResult(
  expectedPesewas: number,
  countedPesewas: number,
  positiveVarianceType: "EXCESS" | "UNIDENTIFIED_CASH" = "EXCESS",
) {
  if (
    !Number.isSafeInteger(expectedPesewas) ||
    !Number.isSafeInteger(countedPesewas) ||
    expectedPesewas < 0 ||
    countedPesewas < 0
  )
    throw new Error("Reconciliation balances must be non-negative pesewas.");
  const variancePesewas = countedPesewas - expectedPesewas;
  return {
    variancePesewas,
    status:
      variancePesewas === 0 ? ("BALANCED" as const) : ("EXCEPTION" as const),
    exceptionType:
      variancePesewas < 0
        ? ("SHORTAGE" as const)
        : variancePesewas > 0
          ? positiveVarianceType
          : null,
    exceptionAmountPesewas: Math.abs(variancePesewas),
  };
}

export function canPostReconciliation(status: string, variancePesewas: number) {
  return status === "BALANCED" && variancePesewas === 0;
}
