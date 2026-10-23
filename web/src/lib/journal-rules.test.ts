import { describe, expect, it } from "vitest";
import { reversedLines, validateBalancedJournal } from "./journal-rules";

describe("journal controls", () => {
  const balanced = [
    { accountCode: "1000", debitPesewas: 10_001, creditPesewas: 0 },
    { accountCode: "3000", debitPesewas: 0, creditPesewas: 10_001 },
  ];
  it("accepts balanced integer-pesewa journals", () => {
    expect(validateBalancedJournal(balanced)).toEqual({
      debits: 10_001,
      credits: 10_001,
    });
  });
  it("rejects unbalanced and fractional money", () => {
    expect(() =>
      validateBalancedJournal([
        { ...balanced[0], debitPesewas: 1.5 },
        balanced[1],
      ]),
    ).toThrow("integer pesewas");
    expect(() =>
      validateBalancedJournal([
        balanced[0],
        { ...balanced[1], creditPesewas: 10_000 },
      ]),
    ).toThrow("balance");
  });
  it("creates an exact linked reversal allocation", () => {
    expect(reversedLines(balanced)).toEqual([
      { accountCode: "1000", debitPesewas: 0, creditPesewas: 10_001 },
      { accountCode: "3000", debitPesewas: 10_001, creditPesewas: 0 },
    ]);
  });
});
