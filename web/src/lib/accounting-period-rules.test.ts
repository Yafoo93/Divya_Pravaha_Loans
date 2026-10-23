import { describe, expect, it } from "vitest";
import {
  assertIndependentPeriodChecker,
  assertOrdinaryPostingAllowed,
} from "./accounting-period-rules";

describe("accounting period controls", () => {
  it("blocks ordinary posting to closed periods", () => {
    expect(() => assertOrdinaryPostingAllowed("CLOSED")).toThrow("not allowed");
    expect(() => assertOrdinaryPostingAllowed("OPEN")).not.toThrow();
  });

  it("requires an independent reopening checker", () => {
    expect(() => assertIndependentPeriodChecker("maker", "maker")).toThrow(
      "cannot approve",
    );
    expect(() =>
      assertIndependentPeriodChecker("maker", "manager"),
    ).not.toThrow();
  });
});
