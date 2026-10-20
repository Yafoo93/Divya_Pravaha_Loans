import { describe, expect, it } from "vitest";
import { prototypeStaff } from "./prototype-staff";
import {
  countStaffByRole,
  filterPrototypeRoles,
  prototypeRoles,
} from "./prototype-roles";

describe("prototype role matrix", () => {
  it("contains all eight approved roles as sample data", () => {
    expect(prototypeRoles).toHaveLength(8);
    expect(new Set(prototypeRoles.map((role) => role.code)).size).toBe(8);
    expect(prototypeRoles.every((role) => role.isSampleData)).toBe(true);
  });

  it("retains high-risk restrictions and investor gates", () => {
    expect(
      prototypeRoles.find((role) => role.code === "FIELD_COLLECTOR")
        ?.restrictions,
    ).toContain("Cannot verify own handover");
    expect(
      prototypeRoles
        .filter((role) => role.code.startsWith("INVESTOR"))
        .every((role) => role.state === "LOCKED" && role.featureGate),
    ).toBe(true);
  });

  it("searches permissions and counts assigned staff", () => {
    expect(
      filterPrototypeRoles(prototypeRoles, "reconciliation", "ALL").map(
        (role) => role.code,
      ),
    ).toEqual(["CASHIER_ACCOUNTANT"]);
    expect(countStaffByRole(prototypeStaff, "MANAGER")).toBe(2);
  });
});
