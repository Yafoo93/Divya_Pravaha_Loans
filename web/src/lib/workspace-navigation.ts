export const staffRoles = [
  "SYSTEM_ADMIN",
  "MANAGER",
  "LOAN_OFFICER",
  "FIELD_COLLECTOR",
  "CASHIER_ACCOUNTANT",
  "INVESTOR_PORTFOLIO_OFFICER",
  "AUDITOR",
  "INVESTOR_PORTAL_USER",
] as const;

export type StaffRole = (typeof staffRoles)[number];

export type WorkspaceNavigationItem = {
  label: string;
  href: string;
  shortLabel: string;
  allowedRoles: readonly StaffRole[];
};

const allStaff: readonly StaffRole[] = staffRoles.filter(
  (role) => role !== "INVESTOR_PORTAL_USER",
);

export const workspaceNavigation: readonly WorkspaceNavigationItem[] = [
  {
    label: "Overview",
    href: "/workspace",
    shortLabel: "OV",
    allowedRoles: allStaff,
  },
  {
    label: "Borrowers",
    href: "/workspace/borrowers",
    shortLabel: "BR",
    allowedRoles: ["MANAGER", "LOAN_OFFICER", "AUDITOR"],
  },
  {
    label: "Groups",
    href: "/workspace/groups",
    shortLabel: "GR",
    allowedRoles: ["MANAGER", "LOAN_OFFICER", "AUDITOR"],
  },
  {
    label: "Loan applications",
    href: "/workspace/loan-applications",
    shortLabel: "AP",
    allowedRoles: ["MANAGER", "LOAN_OFFICER", "AUDITOR"],
  },
  {
    label: "Disbursements",
    href: "/workspace/disbursements",
    shortLabel: "DS",
    allowedRoles: ["MANAGER", "CASHIER_ACCOUNTANT", "AUDITOR"],
  },
  {
    label: "Loan portfolio",
    href: "/workspace/loans",
    shortLabel: "LN",
    allowedRoles: [
      "MANAGER",
      "LOAN_OFFICER",
      "FIELD_COLLECTOR",
      "CASHIER_ACCOUNTANT",
      "AUDITOR",
    ],
  },
  {
    label: "Today's assignments",
    href: "/field/assignments",
    shortLabel: "FA",
    allowedRoles: ["MANAGER", "FIELD_COLLECTOR"],
  },
  {
    label: "Cash collections",
    href: "/workspace/cash-collections",
    shortLabel: "CC",
    allowedRoles: [
      "MANAGER",
      "FIELD_COLLECTOR",
      "CASHIER_ACCOUNTANT",
      "AUDITOR",
    ],
  },
  {
    label: "Handovers",
    href: "/workspace/handovers",
    shortLabel: "HO",
    allowedRoles: [
      "MANAGER",
      "FIELD_COLLECTOR",
      "CASHIER_ACCOUNTANT",
      "AUDITOR",
    ],
  },
  {
    label: "Arrears",
    href: "/workspace/arrears",
    shortLabel: "AR",
    allowedRoles: ["MANAGER", "LOAN_OFFICER", "FIELD_COLLECTOR", "AUDITOR"],
  },
  {
    label: "Accounting & reports",
    href: "/workspace/accounting",
    shortLabel: "AC",
    allowedRoles: ["MANAGER", "CASHIER_ACCOUNTANT", "AUDITOR"],
  },
  {
    label: "Capital source & use",
    href: "/workspace/capital",
    shortLabel: "CP",
    allowedRoles: ["MANAGER", "CASHIER_ACCOUNTANT", "AUDITOR"],
  },
  {
    label: "Administration",
    href: "/workspace/administration",
    shortLabel: "AD",
    allowedRoles: ["SYSTEM_ADMIN", "AUDITOR"],
  },
  {
    label: "Staff accounts",
    href: "/workspace/administration/staff",
    shortLabel: "ST",
    allowedRoles: ["SYSTEM_ADMIN"],
  },
  {
    label: "Branches",
    href: "/workspace/administration/branches",
    shortLabel: "BH",
    allowedRoles: ["SYSTEM_ADMIN"],
  },
  {
    label: "Roles & permissions",
    href: "/workspace/administration/roles",
    shortLabel: "RP",
    allowedRoles: ["SYSTEM_ADMIN"],
  },
] as const;

export function navigationForRole(role: StaffRole) {
  return workspaceNavigation.filter((item) => item.allowedRoles.includes(role));
}

export function isNavigationItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/workspace") return false;
  const moreSpecificItemMatches = workspaceNavigation.some(
    (item) =>
      item.href !== href &&
      item.href.startsWith(`${href}/`) &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
  return !moreSpecificItemMatches && pathname.startsWith(`${href}/`);
}

export type BreadcrumbItem = { label: string; href?: string };

export function breadcrumbsForPath(pathname: string): BreadcrumbItem[] {
  const root: BreadcrumbItem = { label: "Workspace", href: "/workspace" };
  if (pathname === "/workspace") return [{ label: "Workspace" }];

  const section = workspaceNavigation.find(
    (item) =>
      item.href !== "/workspace" && isNavigationItemActive(pathname, item.href),
  );
  if (!section) return [root];

  const trail: BreadcrumbItem[] = [root, { label: section.label }];
  const remaining = pathname
    .slice(section.href.length)
    .split("/")
    .filter(Boolean);
  for (const segment of remaining) {
    trail[trail.length - 1].href ??= section.href;
    trail.push({ label: decodeURIComponent(segment).replaceAll("-", " ") });
  }
  return trail;
}
