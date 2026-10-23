import { describe, expect, it } from "vitest";
import {
  prototypeBranches,
  staffAssignedToBranch,
  staffAvailableForBranch,
} from "./prototype-branches";
import { prototypeStaff } from "./prototype-staff";

describe("prototype branch assignments", () => {
  it("represents the seeded Kasoa Market branch", () => {
    expect(prototypeBranches).toHaveLength(1);
    expect(prototypeBranches[0]).toMatchObject({
      code: "KASOA-MARKET",
      name: "Kasoa Market",
      state: "ACTIVE",
    });
  });

  it("separates assigned and available staff without duplication", () => {
    const assigned = staffAssignedToBranch(
      prototypeBranches[0],
      prototypeStaff,
    );
    const available = staffAvailableForBranch(
      prototypeBranches[0],
      prototypeStaff,
    );
    expect(assigned).toHaveLength(7);
    expect(available.map((record) => record.name)).toEqual(["Adjoa Nyarko"]);
    expect(
      new Set([...assigned, ...available].map((record) => record.id)).size,
    ).toBe(
      prototypeStaff.filter((record) => record.role !== "INVESTOR_PORTAL_USER")
        .length,
    );
    expect(
      available.some((record) => record.role === "INVESTOR_PORTAL_USER"),
    ).toBe(false);
  });
});
