import { describe, expect, it } from "vitest";
import { allocateCashPayment, validateCashCollection } from "./cash-collection";

describe("mobile cash collection", () => {
  it("allocates GHS 300 as five-sixths principal and one-sixth interest", () => {
    expect(allocateCashPayment(300)).toEqual({
      principalPesewas: 25_000,
      interestPesewas: 5_000,
      totalPesewas: 30_000,
    });
  });

  it("preserves the exact pesewa total when rounding", () => {
    const result = allocateCashPayment(100.01);
    expect(result.principalPesewas + result.interestPesewas).toBe(
      result.totalPesewas,
    );
  });

  it("requires amount, date, and borrower confirmation", () => {
    expect(
      Object.keys(
        validateCashCollection({
          amount: "",
          receivedDate: "",
          borrowerConfirmed: false,
        }),
      ),
    ).toEqual(["amount", "receivedDate", "borrowerConfirmed"]);
  });
});
