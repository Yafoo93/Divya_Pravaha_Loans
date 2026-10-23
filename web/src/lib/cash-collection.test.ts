import { describe, expect, it } from "vitest";
import {
  allocateCashPayment,
  allocateOldestDueFirst,
  validateCollectionChannel,
  validateCashCollection,
} from "./cash-collection";

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

  it("accepts cash through online submission only", () => {
    expect(() => validateCollectionChannel("CASH", "ONLINE")).not.toThrow();
    expect(() => validateCollectionChannel("MOBILE_MONEY", "ONLINE")).toThrow(
      "Only physical cash",
    );
    expect(() => validateCollectionChannel("CASH", "OFFLINE")).toThrow(
      "online submission",
    );
  });

  it("allocates oldest due first and pro rata within each instalment", () => {
    expect(
      allocateOldestDueFirst(25_000, [
        {
          id: "one",
          principalPesewas: 20_000,
          interestPesewas: 4_000,
          principalPaidPesewas: 0,
          interestPaidPesewas: 0,
        },
        {
          id: "two",
          principalPesewas: 20_000,
          interestPesewas: 4_000,
          principalPaidPesewas: 0,
          interestPaidPesewas: 0,
        },
      ]).map(
        ({
          instalmentId,
          amountPesewas,
          principalAllocatedPesewas,
          interestAllocatedPesewas,
        }) => ({
          instalmentId,
          amountPesewas,
          principalAllocatedPesewas,
          interestAllocatedPesewas,
        }),
      ),
    ).toEqual([
      {
        instalmentId: "one",
        amountPesewas: 24_000,
        principalAllocatedPesewas: 20_000,
        interestAllocatedPesewas: 4_000,
      },
      {
        instalmentId: "two",
        amountPesewas: 1_000,
        principalAllocatedPesewas: 833,
        interestAllocatedPesewas: 167,
      },
    ]);
  });

  it("rejects overpayment beyond the remaining schedule", () => {
    expect(() =>
      allocateOldestDueFirst(101, [
        {
          id: "one",
          principalPesewas: 80,
          interestPesewas: 20,
          principalPaidPesewas: 0,
          interestPaidPesewas: 0,
        },
      ]),
    ).toThrow("cannot exceed");
  });

  it("supports a full settlement of all outstanding components", () => {
    const allocations = allocateOldestDueFirst(30_000, [
      {
        id: "one",
        principalPesewas: 20_000,
        interestPesewas: 4_000,
        principalPaidPesewas: 10_000,
        interestPaidPesewas: 2_000,
      },
      {
        id: "two",
        principalPesewas: 20_000,
        interestPesewas: 4_000,
        principalPaidPesewas: 0,
        interestPaidPesewas: 0,
      },
    ]);
    expect(allocations).toHaveLength(2);
    expect(
      allocations.reduce(
        (sum, allocation) => sum + allocation.amountPesewas,
        0,
      ),
    ).toBe(30_000);
    expect(allocations[0]).toMatchObject({
      principalAllocatedPesewas: 10_000,
      interestAllocatedPesewas: 2_000,
    });
  });
});
