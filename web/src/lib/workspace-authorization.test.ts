import { describe, expect, it } from "vitest";
import { roleDefinition } from "./role-definitions";
import {
  canAccessWorkspacePath,
  workspacePagePermissions,
} from "./workspace-authorization";

describe("manager workspace authorization", () => {
  const manager = roleDefinition("MANAGER")!;

  it("allows every operational workspace area including capital", () => {
    const operationalPaths = Object.keys(workspacePagePermissions).filter(
      (path) =>
        !path.startsWith("/workspace/administration") &&
        !path.startsWith("/workspace/interface-"),
    );
    for (const path of operationalPaths) {
      expect(
        canAccessWorkspacePath(
          path,
          "MANAGER",
          manager.permissions,
          manager.featureGate,
          manager.restrictions,
        ),
        `Manager should access ${path}`,
      ).toBe(true);
    }
  });

  it("allows managers into the collector assignment workspace", () => {
    expect(
      canAccessWorkspacePath(
        "/field/assignments",
        "MANAGER",
        manager.permissions,
        manager.featureGate,
        manager.restrictions,
      ),
    ).toBe(true);
  });

  it("does not inherit System Administrator authority", () => {
    for (const path of [
      "/workspace/administration/staff",
      "/workspace/administration/branches",
      "/workspace/administration/roles",
    ]) {
      expect(
        canAccessWorkspacePath(
          path,
          "MANAGER",
          manager.permissions,
          manager.featureGate,
          manager.restrictions,
        ),
      ).toBe(false);
    }
    expect(manager.permissions).not.toEqual(
      expect.arrayContaining([
        "manage_users",
        "manage_roles",
        "manage_security_configuration",
      ]),
    );
  });
});
