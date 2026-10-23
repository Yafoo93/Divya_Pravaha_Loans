import "server-only";

export const makerCheckerActions = {
  loan_approval: "approve_or_reject_loans",
  disbursement: "approve_disbursements",
  receipt_reversal: "reverse_posted_receipts",
  period_reopening: "reopen_period",
  investor_payout: "investor_payout",
  manual_financial_adjustment: "manual_financial_adjustment",
} as const;

export type MakerCheckerAction = keyof typeof makerCheckerActions;

export class MakerCheckerViolation extends Error {
  readonly code = "MAKER_CHECKER_SAME_USER";

  constructor(message = "The maker cannot approve or check their own work.") {
    super(message);
    this.name = "MakerCheckerViolation";
  }
}

export function isMakerCheckerPermission(permission: string): boolean {
  return Object.values(makerCheckerActions).includes(
    permission as (typeof makerCheckerActions)[MakerCheckerAction],
  );
}

export function assertIndependentChecker(
  makerUserId: string,
  checkerUserId: string,
): void {
  if (!makerUserId || !checkerUserId) {
    throw new MakerCheckerViolation(
      "Maker and checker identities are required.",
    );
  }
  if (makerUserId === checkerUserId) throw new MakerCheckerViolation();
}
