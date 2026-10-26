import { describe, expect, it } from "vitest";
import {
  calculatePrivateCapitalReturn,
  remainingInvestorBalances,
} from "./private-capital";

describe("private capital return", () => {
  it("accrues 60 percent simple return over a normal year", () => {
    const result = calculatePrivateCapitalReturn({
      principalPesewas: 1_000_000,
      startDate: new Date("2025-01-01T00:00:00Z"),
      throughDate: new Date("2026-01-01T00:00:00Z"),
    });
    expect(result.days).toBe(365);
    expect(result.returnPesewas).toBe(600_000);
  });

  it("caps accrual at maturity and never compounds", () => {
    const result = calculatePrivateCapitalReturn({
      principalPesewas: 500_000,
      startDate: new Date("2025-01-01T00:00:00Z"),
      maturityDate: new Date("2025-07-02T00:00:00Z"),
      throughDate: new Date("2026-01-01T00:00:00Z"),
    });
    expect(result.days).toBe(182);
    expect(result.returnPesewas).toBe(149_589);
  });

  it("separates outstanding principal and accrued return", () => {
    expect(
      remainingInvestorBalances({
        principalPesewas: 1_000_000,
        principalRepaidPesewas: 200_000,
        accruedReturnPesewas: 300_000,
        returnPaidPesewas: 100_000,
      }),
    ).toEqual({ principalDuePesewas: 800_000, returnDuePesewas: 200_000 });
  });
});
