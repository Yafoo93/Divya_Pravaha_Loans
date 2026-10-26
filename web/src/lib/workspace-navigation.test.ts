import { describe, expect, it } from "vitest";
import {
  breadcrumbsForPath,
  isNavigationItemActive,
  navigationForRole,
} from "./workspace-navigation";

describe("permission-aware workspace navigation", () => {
  it("shows account administration but no finance operations to a system administrator", () => {
    const labels = navigationForRole("SYSTEM_ADMIN").map((item) => item.label);
    expect(labels).toContain("Staff accounts");
    expect(labels).toContain("Administration");
    expect(labels).toContain("Branches");
    expect(labels).toContain("Roles & permissions");
    expect(labels).not.toContain("Borrowers");
    expect(labels).not.toContain("Accounting & reports");
    expect(labels).not.toContain("Disbursements");
  });

  it("shows collection work but no administration to a field collector", () => {
    const labels = navigationForRole("FIELD_COLLECTOR").map(
      (item) => item.label,
    );
    expect(labels).toContain("Cash collections");
    expect(labels).toContain("Handovers");
    expect(labels).toContain("Today's assignments");
    expect(labels).not.toContain("Administration");
    expect(labels).not.toContain("Accounting & reports");
  });

  it("gives managers every non-administration workspace section", () => {
    const managerLinks = navigationForRole("MANAGER").map((item) => item.href);
    const operationalLinks = navigationForRole("MANAGER")
      .filter((item) => !item.href.startsWith("/workspace/administration"))
      .map((item) => item.href);
    expect(managerLinks).toEqual(operationalLinks);
    expect(managerLinks).toContain("/workspace/capital");
    expect(managerLinks).toContain("/workspace/investors");
    expect(managerLinks).toContain("/workspace/accounting");
    expect(managerLinks).toContain("/workspace/cash-collections");
    expect(managerLinks).toContain("/workspace/handovers");
    expect(managerLinks).toContain("/field/assignments");
    expect(
      managerLinks.some((href) => href.startsWith("/workspace/administration")),
    ).toBe(false);
  });

  it("gives the auditor read-only navigation coverage without collector-only actions", () => {
    const labels = navigationForRole("AUDITOR").map((item) => item.label);
    expect(labels).toContain("Accounting & reports");
    expect(labels).toContain("Administration");
  });

  it("matches nested routes without activating the overview", () => {
    expect(
      isNavigationItemActive(
        "/workspace/borrowers/CUS-0104",
        "/workspace/borrowers",
      ),
    ).toBe(true);
    expect(isNavigationItemActive("/workspace/borrowers", "/workspace")).toBe(
      false,
    );
    expect(
      isNavigationItemActive(
        "/workspace/administration/staff",
        "/workspace/administration",
      ),
    ).toBe(false);
    expect(
      isNavigationItemActive(
        "/workspace/administration/staff",
        "/workspace/administration/staff",
      ),
    ).toBe(true);
  });

  it("builds readable breadcrumbs for sections and records", () => {
    expect(breadcrumbsForPath("/workspace")).toEqual([{ label: "Workspace" }]);
    expect(breadcrumbsForPath("/workspace/loan-applications/APP-0268")).toEqual(
      [
        { label: "Workspace", href: "/workspace" },
        { label: "Loan applications", href: "/workspace/loan-applications" },
        { label: "APP 0268" },
      ],
    );
  });
});
