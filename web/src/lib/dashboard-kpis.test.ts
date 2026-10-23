import { describe, expect, it } from "vitest";
import {
  availableFundingPesewas,
  collectionRatePercent,
  collectorCustodyPesewas,
  contractualReceivablesPesewas,
} from "./dashboard-kpis";

describe("dashboard KPI formulas", () => {
  it("calculates remaining contractual receivables", () => {
    expect(
      contractualReceivablesPesewas([
        {
          principalPesewas: 1000,
          interestPesewas: 200,
          principalPaidPesewas: 250,
          interestPaidPesewas: 50,
        },
      ]),
    ).toBe(900);
  });

  it("uses signed custody movements", () => {
    expect(
      collectorCustodyPesewas([
        { amountPesewas: 1000 },
        { amountPesewas: -400 },
      ]),
    ).toBe(600);
  });

  it("excludes all nonspendable and investor sources from available funding", () => {
    expect(
      availableFundingPesewas([
        {
          availablePesewas: 1000,
          fundAccount: {
            eligibleForFunding: true,
            sourceType: "OWNER_CAPITAL",
          },
        },
        {
          availablePesewas: 9000,
          fundAccount: {
            eligibleForFunding: false,
            sourceType: "EXCLUDED_CUSTODY",
          },
        },
        {
          availablePesewas: 8000,
          fundAccount: {
            eligibleForFunding: true,
            sourceType: "INVESTOR_PRINCIPAL",
          },
        },
      ]),
    ).toBe(1000);
  });

  it("defines collection rate as receipts divided by due cash", () => {
    expect(collectionRatePercent(750, 1000)).toBe(75);
    expect(collectionRatePercent(100, 0)).toBe(0);
  });
});
