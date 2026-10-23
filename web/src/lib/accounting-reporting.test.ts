import { describe, expect, it } from "vitest";
import {
  naturalBalancePesewas,
  provisionalCreditLossPesewas,
  trialBalanceDifferencePesewas,
} from "./accounting-reporting";

describe("accounting reporting", () => {
  it("uses debit natural balances for assets and expenses", () => {
    expect(naturalBalancePesewas("ASSET", 10_000, 2_500)).toBe(7_500);
    expect(naturalBalancePesewas("EXPENSE", 4_000, 500)).toBe(3_500);
  });

  it("uses credit natural balances for liabilities, equity, and income", () => {
    expect(naturalBalancePesewas("LIABILITY", 2_000, 9_000)).toBe(7_000);
    expect(naturalBalancePesewas("INCOME", 0, 3_000)).toBe(3_000);
  });

  it("reports zero only for a balanced trial balance", () => {
    expect(trialBalanceDifferencePesewas(25_000, 25_000)).toBe(0);
    expect(trialBalanceDifferencePesewas(25_001, 25_000)).toBe(1);
  });

  it("applies the provisional aging matrix to unpaid exposure", () => {
    expect(
      provisionalCreditLossPesewas([
        { daysPastDue: 0, unpaidAmountPesewas: 10_000 },
        { daysPastDue: 7, unpaidAmountPesewas: 10_000 },
        { daysPastDue: 45, unpaidAmountPesewas: 10_000 },
        { daysPastDue: 75, unpaidAmountPesewas: 10_000 },
        { daysPastDue: 100, unpaidAmountPesewas: 10_000 },
      ]),
    ).toBe(18_000);
  });
});
