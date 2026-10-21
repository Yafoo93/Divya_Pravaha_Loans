import { describe, expect, it } from "vitest";
import {
  normalizeGhanaCard,
  validateBorrowerOnboarding,
  type BorrowerOnboardingValues,
} from "./borrower-onboarding";

const valid: BorrowerOnboardingValues = {
  legalName: "Nana Akua Asare",
  phone: "+233245550136",
  residentialAddress: "14 Asafoatse Nettey Road, Accra",
  businessDetails: "Retail groceries at Makola Market",
  ghanaCardNumber: "GHA-123456789-1",
  ghanaCardVerified: true,
  branchId: "branch-1",
  groupId: "",
  consentReference: "CONS-0136.pdf",
  consentConfirmed: true,
};

describe("borrower onboarding", () => {
  it("normalizes Ghana Card input", () => {
    expect(normalizeGhanaCard(" gha-123456789-1 ")).toBe("GHA-123456789-1");
  });

  it("accepts a complete borrower record", () => {
    expect(validateBorrowerOnboarding(valid)).toEqual({});
  });

  it("requires valid identity, branch, and consent evidence", () => {
    expect(
      validateBorrowerOnboarding({
        ...valid,
        ghanaCardNumber: "invalid",
        branchId: "",
        consentConfirmed: false,
      }),
    ).toMatchObject({
      ghanaCardNumber: expect.any(String),
      branchId: expect.any(String),
      consentConfirmed: expect.any(String),
    });
  });
});
