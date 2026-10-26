import { describe, expect, it } from "vitest";
import { roleDefinition, roleDefinitions } from "./role-definitions";
import { staffRoles } from "./workspace-navigation";

describe("requirements role definitions", () => {
  it("implements every required role exactly once", () => {
    expect(roleDefinitions.map(({ code }) => code).sort()).toEqual(
      [...staffRoles].sort(),
    );
  });

  it("preserves financial and read-only restrictions", () => {
    expect(roleDefinition("SYSTEM_ADMIN")?.restrictions).toContain(
      "cannot_post_or_reverse_finance_by_default",
    );
    expect(roleDefinition("AUDITOR")?.restrictions).toEqual(["read_only"]);
  });

  it("activates private-capital roles without a public-investment gate", () => {
    expect(
      roleDefinitions
        .filter(({ code }) => code.startsWith("INVESTOR"))
        .every(({ featureGate }) => featureGate === null),
    ).toBe(true);
  });
});
