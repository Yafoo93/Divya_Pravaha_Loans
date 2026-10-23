import { describe, expect, it } from "vitest";
import {
  assertIndependentRequestChecker,
  assertRefundWithinLiability,
  availableRefundPesewas,
} from "./correction-rules";

describe("controlled correction rules", () => {
  it("reserves pending refunds and never exposes a negative balance", () => {
    expect(availableRefundPesewas(10_000, 2_000, 3_000)).toBe(5_000);
    expect(availableRefundPesewas(10_000, 11_000)).toBe(0);
  });

  it("rejects refunds above the recorded available liability", () => {
    expect(() => assertRefundWithinLiability(5_001, 5_000)).toThrow("exceeds");
    expect(() => assertRefundWithinLiability(5_000, 5_000)).not.toThrow();
  });

  it("requires an independent checker", () => {
    expect(() => assertIndependentRequestChecker("maker", "maker")).toThrow(
      "cannot approve",
    );
    expect(() =>
      assertIndependentRequestChecker("maker", "manager"),
    ).not.toThrow();
  });
});
