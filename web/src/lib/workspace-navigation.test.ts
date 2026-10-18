import { describe, expect, it } from "vitest";
import {
  breadcrumbsForPath,
  isNavigationItemActive,
  navigationForRole,
} from "./workspace-navigation";

describe("permission-aware workspace navigation", () => {
  it("shows administration but no finance operations to a system administrator", () => {
    const labels = navigationForRole("SYSTEM_ADMIN").map((item) => item.label);
    expect(labels).toContain("Administration");
    expect(labels).not.toContain("Accounting & reports");
    expect(labels).not.toContain("Disbursements");
  });

  it("shows collection work but no administration to a field collector", () => {
    const labels = navigationForRole("FIELD_COLLECTOR").map(
      (item) => item.label,
    );
    expect(labels).toContain("Cash collections");
    expect(labels).toContain("Handovers");
    expect(labels).not.toContain("Administration");
    expect(labels).not.toContain("Accounting & reports");
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
