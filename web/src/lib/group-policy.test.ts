import { describe, expect, it } from "vitest";
import { captureGroupSnapshot, isGroupActivationReady } from "./group-policy";

describe("group policy", () => {
  it("requires five verified consenting members and a signed agreement", () => {
    const eligible = Array.from({ length: 5 }, () => ({
      hasConsented: true,
      verified: true,
    }));
    expect(isGroupActivationReady(eligible, true)).toBe(true);
    expect(isGroupActivationReady(eligible.slice(0, 4), true)).toBe(false);
    expect(isGroupActivationReady(eligible, false)).toBe(false);
    expect(
      isGroupActivationReady(
        [...eligible.slice(0, 4), { hasConsented: false, verified: true }],
        true,
      ),
    ).toBe(false);
  });

  it("preserves exited members and excludes later members from old snapshots", () => {
    const approvalSnapshot = captureGroupSnapshot(["A", "B", "C", "D", "E"]);
    const currentMembers = ["B", "C", "D", "E", "F"];
    const laterSnapshot = captureGroupSnapshot(currentMembers);
    expect(approvalSnapshot).toContain("A");
    expect(approvalSnapshot).not.toContain("F");
    expect(laterSnapshot).not.toContain("A");
    expect(laterSnapshot).toContain("F");
  });
});
