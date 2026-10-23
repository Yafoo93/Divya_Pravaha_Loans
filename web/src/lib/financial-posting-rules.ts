import type { JournalLineInput } from "./journal-rules";

export type FinancialPostingType =
  | "LOAN_DISBURSEMENT"
  | "INTEREST_ACCRUAL"
  | "CASH_RECEIPT"
  | "CUSTODY_TRANSFER"
  | "UNIDENTIFIED_CASH"
  | "CUSTOMER_OVERPAYMENT"
  | "JOINT_LIABILITY_CONTRIBUTION";

export type PostingAmounts = {
  amountPesewas?: number;
  principalPesewas?: number;
  interestPesewas?: number;
};

function positiveInteger(value: number | undefined, label: string) {
  if (!Number.isSafeInteger(value) || (value ?? 0) <= 0)
    throw new Error(`${label} must be a positive integer number of pesewas.`);
  return value!;
}

export function financialPostingLines(
  type: FinancialPostingType,
  amounts: PostingAmounts,
): JournalLineInput[] {
  if (
    type === "LOAN_DISBURSEMENT" ||
    type === "CUSTODY_TRANSFER" ||
    type === "UNIDENTIFIED_CASH" ||
    type === "CUSTOMER_OVERPAYMENT"
  ) {
    const amount = positiveInteger(amounts.amountPesewas, "Amount");
    if (type === "LOAN_DISBURSEMENT") return lines("1100", "1000", amount);
    if (type === "CUSTODY_TRANSFER") return lines("1000", "1010", amount);
    if (type === "UNIDENTIFIED_CASH") return lines("1000", "2000", amount);
    return lines("1000", "2010", amount);
  }
  if (type === "INTEREST_ACCRUAL") {
    const amount = positiveInteger(amounts.interestPesewas, "Interest");
    return lines("1110", "4000", amount);
  }
  const principal = positiveInteger(amounts.principalPesewas, "Principal");
  const interest = positiveInteger(amounts.interestPesewas, "Interest");
  return [
    {
      accountCode: "1010",
      debitPesewas: principal + interest,
      creditPesewas: 0,
    },
    { accountCode: "1100", debitPesewas: 0, creditPesewas: principal },
    { accountCode: "1110", debitPesewas: 0, creditPesewas: interest },
  ];
}

function lines(
  debitAccount: string,
  creditAccount: string,
  amountPesewas: number,
): JournalLineInput[] {
  return [
    {
      accountCode: debitAccount,
      debitPesewas: amountPesewas,
      creditPesewas: 0,
    },
    {
      accountCode: creditAccount,
      debitPesewas: 0,
      creditPesewas: amountPesewas,
    },
  ];
}
