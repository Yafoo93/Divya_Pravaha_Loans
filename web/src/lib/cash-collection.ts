export type CashCollectionValues = {
  amount: string;
  receivedDate: string;
  borrowerConfirmed: boolean;
};

export function validateCollectionChannel(
  paymentMethod: unknown,
  submissionMode: unknown,
) {
  if (paymentMethod !== "CASH")
    throw new Error("Only physical cash payments are accepted.");
  if (submissionMode !== "ONLINE")
    throw new Error("An online submission is required to issue a receipt.");
}

export function allocateCashPayment(amountGhs: number) {
  const totalPesewas = Math.round(amountGhs * 100);
  const principalPesewas = Math.round((totalPesewas * 5) / 6);
  return {
    principalPesewas,
    interestPesewas: totalPesewas - principalPesewas,
    totalPesewas,
  };
}

export type OutstandingInstalment = {
  id: string;
  principalPesewas: number;
  interestPesewas: number;
  principalPaidPesewas: number;
  interestPaidPesewas: number;
};

export function allocateOldestDueFirst(
  amountPesewas: number,
  instalments: readonly OutstandingInstalment[],
) {
  if (!Number.isInteger(amountPesewas) || amountPesewas <= 0)
    throw new Error("Payment must be a positive whole number of pesewas.");

  const outstanding = instalments.reduce(
    (sum, item) =>
      sum +
      Math.max(0, item.principalPesewas - item.principalPaidPesewas) +
      Math.max(0, item.interestPesewas - item.interestPaidPesewas),
    0,
  );
  if (amountPesewas > outstanding)
    throw new Error(
      "Cash received cannot exceed the outstanding loan balance.",
    );

  let remaining = amountPesewas;
  const allocations = [];
  for (const instalment of instalments) {
    if (remaining === 0) break;
    const principalDue = Math.max(
      0,
      instalment.principalPesewas - instalment.principalPaidPesewas,
    );
    const interestDue = Math.max(
      0,
      instalment.interestPesewas - instalment.interestPaidPesewas,
    );
    const instalmentDue = principalDue + interestDue;
    if (instalmentDue === 0) continue;

    const applied = Math.min(remaining, instalmentDue);
    const principal =
      applied === instalmentDue
        ? principalDue
        : Math.min(
            principalDue,
            Math.round((applied * principalDue) / instalmentDue),
          );
    const interest = applied - principal;
    allocations.push({
      instalmentId: instalment.id,
      amountPesewas: applied,
      principalAllocatedPesewas: principal,
      interestAllocatedPesewas: interest,
      principalPaidBeforePesewas: instalment.principalPaidPesewas,
      interestPaidBeforePesewas: instalment.interestPaidPesewas,
      principalDuePesewas: instalment.principalPesewas,
      interestDuePesewas: instalment.interestPesewas,
    });
    remaining -= applied;
  }
  if (remaining !== 0)
    throw new Error("The loan schedule cannot absorb this payment.");
  return allocations;
}

export function validateCashCollection(values: CashCollectionValues) {
  const errors: Partial<Record<keyof CashCollectionValues, string>> = {};
  const amount = Number(values.amount);
  if (!values.amount || !Number.isFinite(amount) || amount <= 0)
    errors.amount = "Enter the physical cash amount received.";
  if (!values.receivedDate)
    errors.receivedDate = "Select the actual cash-received date.";
  if (!values.borrowerConfirmed)
    errors.borrowerConfirmed =
      "Confirm the borrower and loan before issuing a receipt.";
  return errors;
}

export { formatGhsFromPesewas } from "./formatters";
