import { describe, expect, it } from "vitest";
import {
  canRequestReactivation,
  isRestrictionAction,
  validateRestrictionReason,
} from "./borrower-restriction";

describe("borrower restriction workflow", () => {
  it("accepts only known workflow actions", () => {
    expect(isRestrictionAction("RESTRICT")).toBe(true);
    expect(isRestrictionAction("APPROVE_REACTIVATION")).toBe(true);
    expect(isRestrictionAction("DELETE")).toBe(false);
  });

  it("requires a meaningful recorded reason", () => {
    expect(validateRestrictionReason("Too short")).toBeTruthy();
    expect(
      validateRestrictionReason("Identity evidence requires manager review."),
    ).toBeNull();
  });

  it("allows another request after rejection but not while pending", () => {
    expect(canRequestReactivation("ACTIVE")).toBe(true);
    expect(canRequestReactivation("REACTIVATION_REJECTED")).toBe(true);
    expect(canRequestReactivation("REACTIVATION_PENDING")).toBe(false);
  });
});
