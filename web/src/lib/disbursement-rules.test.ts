import { describe, expect, it } from "vitest";
import { validateDisbursementEvidence } from "./disbursement-rules";

const valid = {
  loanStatus: "AWAITING_DISBURSEMENT",
  principalPesewas: 1_000_000,
  reservationStatus: "RESERVED",
  reservationPesewas: 1_000_000,
  fundingVerified: true,
  fundingEligible: true,
  beneficiaryMatchesBorrower: true,
  identityConfirmed: true,
  signedContract: true,
  signedVoucher: true,
  managerAuthorized: true,
};

describe("controlled cash release", () => {
  it("accepts a fully evidenced release", () => {
    expect(validateDisbursementEvidence(valid)).toBe(true);
  });

  it.each([
    ["loanStatus", "APPROVED"],
    ["reservationStatus", "CANCELLED"],
    ["fundingVerified", false],
    ["fundingEligible", false],
    ["beneficiaryMatchesBorrower", false],
    ["identityConfirmed", false],
    ["signedContract", false],
    ["signedVoucher", false],
    ["managerAuthorized", false],
  ] as const)("rejects invalid %s evidence", (field, value) => {
    expect(() =>
      validateDisbursementEvidence({ ...valid, [field]: value }),
    ).toThrow();
  });

  it("requires reservation value to equal the approved principal", () => {
    expect(() =>
      validateDisbursementEvidence({ ...valid, reservationPesewas: 999_999 }),
    ).toThrow("matching active funding reservation");
  });
});
