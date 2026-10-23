import { describe, expect, it } from "vitest";
import { calculateLoanTerms } from "./loan-application";

describe("loan application terms", () => {
  it("calculates flat contractual interest and an exact schedule", () => {
    const result = calculateLoanTerms(1_000_000, 6);
    expect(result.interestPesewas).toBe(200_000);
    expect(result.totalRepayablePesewas).toBe(1_200_000);
    expect(result.instalments.reduce((sum, value) => sum + value, 0)).toBe(
      1_200_000,
    );
  });
  it("rejects terms outside the prototype maximum", () => {
    expect(() => calculateLoanTerms(100_000, 7)).toThrow();
  });

  it.each([
    ["WEEKLY", 24, 7],
    ["FORTNIGHTLY", 12, 14],
    ["MONTHLY", 6, null],
  ] as const)("supports %s recurrence", (frequency, count, dayGap) => {
    const result = calculateLoanTerms(
      1_000_001,
      6,
      frequency,
      new Date("2026-01-15T12:00:00Z"),
    );
    expect(result.schedule).toHaveLength(count);
    expect(
      result.schedule.reduce((sum, row) => sum + row.principalPesewas, 0),
    ).toBe(1_000_001);
    expect(
      result.schedule.reduce((sum, row) => sum + row.interestPesewas, 0),
    ).toBe(result.interestPesewas);
    if (dayGap) {
      const first = result.schedule[0].contractualDueDate!;
      expect(
        (first.getTime() - new Date("2026-01-15T12:00:00Z").getTime()) /
          86_400_000,
      ).toBe(dayGap);
    }
  });

  it("preserves month-end and moves weekend collection to Monday", () => {
    const result = calculateLoanTerms(
      100_000,
      2,
      "MONTHLY",
      new Date("2026-01-31T12:00:00Z"),
    );
    expect(
      result.schedule[0].contractualDueDate?.toISOString().slice(0, 10),
    ).toBe("2026-02-28");
    expect(
      result.schedule[0].effectiveCollectionDate?.toISOString().slice(0, 10),
    ).toBe("2026-03-02");
    expect(
      result.schedule[1].contractualDueDate?.toISOString().slice(0, 10),
    ).toBe("2026-03-31");
  });
});
