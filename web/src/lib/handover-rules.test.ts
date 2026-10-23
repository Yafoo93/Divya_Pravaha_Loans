import { describe, expect, it } from "vitest";
import {
  canPostReconciliation,
  countDenominations,
  reconciliationResult,
} from "./handover-rules";

describe("cash handover controls", () => {
  it("counts Ghana cedi denominations in pesewas", () => {
    expect(
      countDenominations([
        { denominationPesewas: 20_000, quantity: 2 },
        { denominationPesewas: 5_000, quantity: 3 },
      ]),
    ).toBe(55_000);
  });

  it("classifies shortage, excess, and unidentified cash", () => {
    expect(reconciliationResult(300_000, 295_000)).toMatchObject({
      variancePesewas: -5_000,
      exceptionType: "SHORTAGE",
    });
    expect(reconciliationResult(300_000, 305_000)).toMatchObject({
      variancePesewas: 5_000,
      exceptionType: "EXCESS",
    });
    expect(
      reconciliationResult(300_000, 305_000, "UNIDENTIFIED_CASH"),
    ).toMatchObject({ exceptionType: "UNIDENTIFIED_CASH" });
  });

  it("allows posting only after a balanced verification", () => {
    expect(canPostReconciliation("BALANCED", 0)).toBe(true);
    expect(canPostReconciliation("EXCEPTION", -5_000)).toBe(false);
  });
});
