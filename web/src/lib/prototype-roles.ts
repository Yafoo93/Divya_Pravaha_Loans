import type { StaffRole } from "./workspace-navigation";

export type PrototypeRole = {
  code: StaffRole;
  name: string;
  description: string;
  permissions: readonly string[];
  restrictions: readonly string[];
  featureGate?: string;
  state: "ACTIVE" | "LOCKED";
  isSampleData: true;
};

export const prototypeRoles: readonly PrototypeRole[] = [
  {
    code: "SYSTEM_ADMIN",
    name: "System Administrator",
    description: "Manages staff identities, roles, and security configuration.",
    permissions: [
      "Manage users",
      "Manage roles",
      "Manage security configuration",
    ],
    restrictions: [
      "Cannot approve loans by default",
      "Cannot post or reverse finance by default",
    ],
    state: "ACTIVE",
    isSampleData: true,
  },
  {
    code: "MANAGER",
    name: "Manager",
    description: "Makes independent operational and credit decisions.",
    permissions: [
      "Approve or reject loans",
      "Approve exceptions",
      "Approve disbursements",
      "Resolve operational disputes",
    ],
    restrictions: ["Cannot approve own work (maker/checker enforced)"],
    state: "ACTIVE",
    isSampleData: true,
  },
  {
    code: "LOAN_OFFICER",
    name: "Loan Officer",
    description: "Prepares borrowers, groups, verification, and applications.",
    permissions: [
      "Manage borrower drafts",
      "Manage groups",
      "Record verification",
      "Submit loan applications",
    ],
    restrictions: ["Submit only; cannot self-approve a loan"],
    state: "ACTIVE",
    isSampleData: true,
  },
  {
    code: "FIELD_COLLECTOR",
    name: "Field Collector",
    description: "Records assigned collections and submits cash custody.",
    permissions: [
      "View assignments",
      "Record cash receipts",
      "Submit cash handovers",
    ],
    restrictions: [
      "Cannot verify own handover",
      "Cannot reverse posted receipts",
    ],
    state: "ACTIVE",
    isSampleData: true,
  },
  {
    code: "CASHIER_ACCOUNTANT",
    name: "Cashier / Accountant",
    description:
      "Verifies cash, reconciles receipts, and maintains the ledger.",
    permissions: [
      "Verify cash handovers",
      "Post reconciled receipts",
      "Manage ledger",
      "Perform reconciliation",
      "Prepare period close",
    ],
    restrictions: ["Independent checker for controlled cash corrections"],
    state: "ACTIVE",
    isSampleData: true,
  },
  {
    code: "INVESTOR_PORTFOLIO_OFFICER",
    name: "Investor Portfolio Officer",
    description: "Prepares investor records for a legally gated module.",
    permissions: [
      "Prepare investor records",
      "Prepare contracts",
      "Prepare payout requests",
    ],
    restrictions: [
      "No operational investor action until activation gates pass",
    ],
    featureGate: "Investor module legal approval",
    state: "LOCKED",
    isSampleData: true,
  },
  {
    code: "AUDITOR",
    name: "Auditor",
    description: "Reviews financial history, audit events, and exceptions.",
    permissions: [
      "Read financial history",
      "Read audit events",
      "Read exception reports",
    ],
    restrictions: ["Read-only access; no mutations"],
    state: "ACTIVE",
    isSampleData: true,
  },
  {
    code: "INVESTOR_PORTAL_USER",
    name: "Investor Portal User",
    description: "Views only the investor records owned by that identity.",
    permissions: [
      "View own contracts",
      "View own statements",
      "View own maturities",
    ],
    restrictions: ["Own records only", "Read-only access"],
    featureGate: "Investor module legal approval",
    state: "LOCKED",
    isSampleData: true,
  },
] as const;

export function filterPrototypeRoles(
  roles: readonly PrototypeRole[],
  query: string,
  state: string,
) {
  const normalized = query.trim().toLowerCase();
  return roles.filter((role) => {
    const searchable = [
      role.code,
      role.name,
      role.description,
      ...role.permissions,
      ...role.restrictions,
    ]
      .join(" ")
      .toLowerCase();
    return (
      searchable.includes(normalized) &&
      (state === "ALL" || role.state === state)
    );
  });
}

export function countStaffByRole(
  staff: readonly { role: StaffRole }[],
  role: StaffRole,
) {
  return staff.filter((person) => person.role === role).length;
}
