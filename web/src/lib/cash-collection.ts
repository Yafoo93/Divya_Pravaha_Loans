export type CashCollectionValues = {
  amount: string;
  receivedDate: string;
  borrowerConfirmed: boolean;
};

export function allocateCashPayment(amountGhs: number) {
  const totalPesewas = Math.round(amountGhs * 100);
  const principalPesewas = Math.round((totalPesewas * 5) / 6);
  return {
    principalPesewas,
    interestPesewas: totalPesewas - principalPesewas,
    totalPesewas,
  };
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
