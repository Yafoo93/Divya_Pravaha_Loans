import type { StaffRole } from "./workspace-navigation";

const systemAdminAllowedPermissions = new Set([
  "manage_users",
  "manage_roles",
  "manage_security_configuration",
]);

export const workspacePagePermissions = {
  "/field/assignments": ["view_assignments"],
  "/workspace": [],
  "/workspace/borrowers": [
    "manage_borrower_drafts",
    "record_verification",
    "approve_or_reject_loans",
    "read_financial_history",
  ],
  "/workspace/groups": [
    "manage_groups",
    "approve_or_reject_loans",
    "read_financial_history",
  ],
  "/workspace/loan-applications": [
    "submit_loan_applications",
    "approve_or_reject_loans",
    "read_financial_history",
  ],
  "/workspace/disbursements": [
    "approve_disbursements",
    "post_reconciled_receipts",
    "read_financial_history",
  ],
  "/workspace/loans": [
    "manage_borrower_drafts",
    "approve_or_reject_loans",
    "view_assignments",
    "manage_ledger",
    "read_financial_history",
  ],
  "/workspace/cash-collections": [
    "record_cash_receipts",
    "post_reconciled_receipts",
    "read_financial_history",
  ],
  "/workspace/handovers": [
    "submit_cash_handovers",
    "verify_cash_handovers",
    "read_financial_history",
  ],
  "/workspace/arrears": [
    "manage_borrower_drafts",
    "approve_or_reject_loans",
    "view_assignments",
    "read_financial_history",
  ],
  "/workspace/accounting": [
    "manage_ledger",
    "prepare_period_close",
    "read_financial_history",
  ],
  "/workspace/capital": ["manage_ledger", "read_financial_history"],
  "/workspace/administration": [
    "manage_users",
    "manage_roles",
    "manage_security_configuration",
    "read_audit_events",
  ],
  "/workspace/administration/staff": ["manage_users"],
  "/workspace/administration/branches": ["manage_users"],
  "/workspace/administration/roles": ["manage_roles"],
  "/workspace/interface-forms": ["manage_security_configuration"],
  "/workspace/interface-states": ["manage_security_configuration"],
} as const satisfies Record<string, readonly string[]>;

export type WorkspacePath = keyof typeof workspacePagePermissions;

const pathsBySpecificity = Object.keys(workspacePagePermissions).sort(
  (a, b) => b.length - a.length,
);

export function workspacePathForRole(path: string, role: StaffRole) {
  if (role === "INVESTOR_PORTAL_USER") return null;
  return pathsBySpecificity.find(
    (candidate) => path === candidate || path.startsWith(`${candidate}/`),
  ) as WorkspacePath | undefined;
}

export function canAccessWorkspacePath(
  path: string,
  role: StaffRole,
  permissions: readonly string[],
  featureGate: string | null = null,
  restrictions: readonly string[] = [],
) {
  const matchedPath = workspacePathForRole(path, role);
  if (!matchedPath || featureGate) return false;
  const required = workspacePagePermissions[matchedPath];
  if (required.length === 0) return true;
  return required.some((permission) =>
    canPerformPermission(
      permissions,
      restrictions,
      permission,
      featureGate,
      false,
      role,
    ),
  );
}

export function canPerformPermission(
  permissions: readonly string[],
  restrictions: readonly string[],
  permission: string,
  featureGate: string | null = null,
  mutation = false,
  role?: StaffRole,
) {
  if (featureGate || !permissions.includes(permission)) return false;
  if (
    role === "SYSTEM_ADMIN" &&
    !systemAdminAllowedPermissions.has(permission)
  ) {
    return false;
  }
  if (mutation && restrictions.includes("read_only")) return false;
  if (
    restrictions.includes("cannot_approve_loans_by_default") &&
    permission === "approve_or_reject_loans"
  ) {
    return false;
  }
  if (
    restrictions.includes("cannot_post_or_reverse_finance_by_default") &&
    [
      "post_reconciled_receipts",
      "manage_ledger",
      "reverse_posted_receipts",
      "manual_financial_adjustment",
      "reopen_period",
      "investor_payout",
    ].includes(permission)
  ) {
    return false;
  }
  return true;
}
