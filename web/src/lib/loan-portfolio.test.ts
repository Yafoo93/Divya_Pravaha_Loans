import { describe, expect, it } from "vitest";
import {
  contractualBalance,
  earlySettlementQuote,
  shouldCloseRepaidLoan,
} from "./loan-portfolio";

const schedule = [
  {
    principalPesewas: 166_667,
    interestPesewas: 33_333,
    principalPaidPesewas: 166_667,
    interestPaidPesewas: 33_333,
  },
  {
    principalPesewas: 166_667,
    interestPesewas: 33_333,
    principalPaidPesewas: 0,
    interestPaidPesewas: 0,
  },
];

describe("loan portfolio balances", () => {
  it("keeps remaining principal and contractual interest separate", () => {
    expect(contractualBalance(schedule)).toEqual({
      remainingPrincipalPesewas: 166_667,
      remainingInterestPesewas: 33_333,
    });
  });

  it("quotes all remaining contract amounts without adjustments", () => {
    expect(
      earlySettlementQuote(schedule, new Date("2026-10-22T00:00:00Z")),
    ).toMatchObject({
      settlementPesewas: 200_000,
      rebatePesewas: 0,
      waiverPesewas: 0,
      penaltyPesewas: 0,
      restructuringPesewas: 0,
    });
  });

  it("closes only a fully repaid schedule", () => {
    expect(shouldCloseRepaidLoan(schedule)).toBe(false);
    expect(
      shouldCloseRepaidLoan(
        schedule.map((item) => ({
          ...item,
          principalPaidPesewas: item.principalPesewas,
          interestPaidPesewas: item.interestPesewas,
        })),
      ),
    ).toBe(true);
  });
});
