import { describe, expect, it } from "vitest";
import {
  canReserveCapital,
  excludedCapitalSources,
  splitRecovery,
  validateLotBalance,
} from "./capital-rules";

describe("capital source and use controls", () => {
  it("allows a reservation only within the available lot balance", () => {
    expect(canReserveCapital(2_000_000, 1_000_000)).toBe(true);
    expect(canReserveCapital(2_000_000, 2_000_001)).toBe(false);
    expect(canReserveCapital(2_000_000, 0)).toBe(false);
  });

  it("rejects lot balances above verified capital", () => {
    expect(() =>
      validateLotBalance({
        originalPesewas: 1_000_000,
        availablePesewas: 500_001,
        reservedPesewas: 500_000,
        committedPesewas: 0,
        disbursedPesewas: 0,
        recoveredPesewas: 0,
      }),
    ).toThrow("exceed verified capital");
  });

  it("keeps recovered principal separate from interest", () => {
    expect(splitRecovery(166_667, 33_333)).toEqual({
      principalPesewas: 166_667,
      interestPesewas: 33_333,
      totalPesewas: 200_000,
    });
  });

  it("excludes non-funding sources and locked investor principal", () => {
    expect(excludedCapitalSources).toEqual(
      expect.arrayContaining([
        "EXCLUDED_CUSTODY",
        "EXCLUDED_RECEIVABLE",
        "EXCLUDED_SUSPENSE",
        "EXCLUDED_OVERPAYMENT",
        "INVESTOR_PRINCIPAL",
      ]),
    );
  });
});
