import { describe, expect, it } from "vitest";
import { fieldNavigation, isFieldNavigationActive } from "./field-navigation";

describe("collector mobile navigation", () => {
  it("contains the four collector destinations", () => {
    expect(fieldNavigation.map((item) => item.label)).toEqual([
      "Assignments",
      "Receipts",
      "Handover",
      "Overview",
    ]);
  });

  it("marks exact and nested routes active", () => {
    expect(isFieldNavigationActive("/field/receipts", "/field/receipts")).toBe(
      true,
    );
    expect(
      isFieldNavigationActive("/field/receipts/RCT-0057", "/field/receipts"),
    ).toBe(true);
    expect(isFieldNavigationActive("/field/handover", "/field/receipts")).toBe(
      false,
    );
  });
});
