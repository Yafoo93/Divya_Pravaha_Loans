import { describe, expect, it } from "vitest";
import {
  assertBorrowerMayApply,
  generateCustomerId,
  RestrictedBorrowerError,
} from "./borrower-controls";

describe("borrower controls", () => {
  it("generates stable-format unique customer IDs", () => {
    const date = new Date("2026-10-21T10:00:00Z");
    const first = generateCustomerId(
      date,
      "aaaaaaaa-0000-0000-0000-000000000000",
    );
    const second = generateCustomerId(
      date,
      "bbbbbbbb-0000-0000-0000-000000000000",
    );
    expect(first).toMatch(/^CUS-[A-Z0-9]+-[A-F0-9]{8}$/);
    expect(first).not.toBe(second);
  });

  it("blocks restricted borrowers from applications", () => {
    expect(() => assertBorrowerMayApply("ACTIVE")).not.toThrow();
    expect(() => assertBorrowerMayApply("RESTRICTED")).toThrow(
      RestrictedBorrowerError,
    );
  });
});
