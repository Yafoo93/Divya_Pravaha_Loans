import { describe, expect, it } from "vitest";
import {
  financialPostingLines,
  type FinancialPostingType,
} from "./financial-posting-rules";
import { validateBalancedJournal } from "./journal-rules";

describe("financial event posting rules", () => {
  const cases: [
    FinancialPostingType,
    string,
    string,
    Record<string, number>,
  ][] = [
    ["LOAN_DISBURSEMENT", "1100", "1000", { amountPesewas: 100_000 }],
    ["INTEREST_ACCRUAL", "1110", "4000", { interestPesewas: 20_000 }],
    [
      "CASH_RECEIPT",
      "1010",
      "1100",
      { principalPesewas: 50_000, interestPesewas: 10_000 },
    ],
    ["CUSTODY_TRANSFER", "1000", "1010", { amountPesewas: 60_000 }],
    ["UNIDENTIFIED_CASH", "1000", "2000", { amountPesewas: 5_000 }],
    ["CUSTOMER_OVERPAYMENT", "1000", "2010", { amountPesewas: 4_000 }],
    [
      "JOINT_LIABILITY_CONTRIBUTION",
      "1010",
      "1100",
      { principalPesewas: 5_000, interestPesewas: 1_000 },
    ],
  ];
  it.each(cases)("builds balanced %s lines", (type, debit, credit, amounts) => {
    const result = financialPostingLines(type, amounts);
    expect(
      result.some(
        (line) => line.accountCode === debit && line.debitPesewas > 0,
      ),
    ).toBe(true);
    expect(
      result.some(
        (line) => line.accountCode === credit && line.creditPesewas > 0,
      ),
    ).toBe(true);
    expect(validateBalancedJournal(result).debits).toBeGreaterThan(0);
  });
  it("rejects fractional or missing event amounts", () => {
    expect(() =>
      financialPostingLines("LOAN_DISBURSEMENT", { amountPesewas: 10.5 }),
    ).toThrow("integer");
    expect(() =>
      financialPostingLines("CASH_RECEIPT", { principalPesewas: 100 }),
    ).toThrow("Interest");
  });
});
