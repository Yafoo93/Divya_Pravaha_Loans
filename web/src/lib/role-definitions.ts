import type { StaffRole } from "./workspace-navigation";

export type RoleDefinition = {
  code: StaffRole;
  name: string;
  description: string;
  permissions: readonly string[];
  restrictions: readonly string[];
  featureGate: string | null;
};

export const roleDefinitions: readonly RoleDefinition[] = [
  {
    code: "SYSTEM_ADMIN",
    name: "System Administrator",
    description: "Manages users, roles, and security configuration.",
    permissions: [
      "manage_users",
      "manage_roles",
      "manage_security_configuration",
    ],
    restrictions: [
      "cannot_approve_loans_by_default",
      "cannot_post_or_reverse_finance_by_default",
    ],
    featureGate: null,
  },
  {
    code: "MANAGER",
    name: "Manager",
    description:
      "Operates and oversees every business and finance area except System Administration.",
    permissions: [
      "manage_borrower_drafts",
      "manage_groups",
      "record_verification",
      "submit_loan_applications",
      "approve_or_reject_loans",
      "approve_exceptions",
      "approve_disbursements",
      "resolve_operational_disputes",
      "view_assignments",
      "record_cash_receipts",
      "submit_cash_handovers",
      "verify_cash_handovers",
      "post_reconciled_receipts",
      "manage_ledger",
      "perform_reconciliation",
      "prepare_period_close",
      "read_financial_history",
      "manage_capital_sources",
      "manage_private_investors",
      "prepare_investor_payouts",
      "approve_investor_payouts",
    ],
    restrictions: [],
    featureGate: null,
  },
  {
    code: "LOAN_OFFICER",
    name: "Loan Officer",
    description: "Manages borrowers, groups, verification, and applications.",
    permissions: [
      "manage_borrower_drafts",
      "manage_groups",
      "record_verification",
      "submit_loan_applications",
    ],
    restrictions: [],
    featureGate: null,
  },
  {
    code: "FIELD_COLLECTOR",
    name: "Field Collector",
    description: "Records cash receipts and submits cash handovers.",
    permissions: [
      "view_assignments",
      "record_cash_receipts",
      "submit_cash_handovers",
    ],
    restrictions: [
      "cannot_verify_own_handover",
      "cannot_reverse_posted_receipts",
    ],
    featureGate: null,
  },
  {
    code: "CASHIER_ACCOUNTANT",
    name: "Cashier / Accountant",
    description: "Reconciles cash and maintains the ledger.",
    permissions: [
      "verify_cash_handovers",
      "post_reconciled_receipts",
      "manage_ledger",
      "perform_reconciliation",
      "prepare_period_close",
    ],
    restrictions: [],
    featureGate: null,
  },
  {
    code: "INVESTOR_PORTFOLIO_OFFICER",
    name: "Investor Portfolio Officer",
    description: "Prepares gated investor records.",
    permissions: [
      "manage_capital_sources",
      "manage_private_investors",
      "prepare_investor_records",
      "prepare_contracts",
      "prepare_payout_requests",
      "prepare_investor_payouts",
    ],
    restrictions: [],
    featureGate: null,
  },
  {
    code: "AUDITOR",
    name: "Auditor",
    description: "Reads financial history, audits, and exception reports.",
    permissions: [
      "read_financial_history",
      "read_audit_events",
      "read_exception_reports",
    ],
    restrictions: ["read_only"],
    featureGate: null,
  },
  {
    code: "INVESTOR_PORTAL_USER",
    name: "Investor Portal User",
    description: "Reads only the investor records owned by that identity.",
    permissions: [
      "view_own_contracts",
      "view_own_statements",
      "view_own_maturities",
    ],
    restrictions: ["own_records_only", "read_only"],
    featureGate: null,
  },
] as const;

export function roleDefinition(code: StaffRole) {
  return roleDefinitions.find((role) => role.code === code);
}
