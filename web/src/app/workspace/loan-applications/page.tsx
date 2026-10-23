import { db } from "@/lib/db";
import {
  branchScopeWhere,
  branchScopeLabel,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { LoanApplicationQueue } from "../../components/loan-application-queue";
import { PageHeading } from "../../components/page-heading";

export default async function LoanApplicationsPage() {
  const session = await requireWorkspacePath("/workspace/loan-applications");
  const scope = await requireBranchScope(session);
  const applications = await db.loan.findMany({
    where: {
      ...branchScopeWhere(scope),
      status: {
        in: [
          "DRAFT",
          "SUBMITTED",
          "UNDER_REVIEW",
          "APPROVED",
          "AWAITING_DISBURSEMENT",
          "REJECTED",
        ],
      },
    },
    include: { borrower: true, group: true },
    orderBy: { createdAt: "desc" },
  });
  const branch = branchScopeLabel(scope);
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Loan applications"
          description="Follow every application from draft through independent manager decision."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
        />
        <LoanApplicationQueue
          canCreate={session.user.permissions.includes(
            "submit_loan_applications",
          )}
          canReview={session.user.permissions.includes(
            "approve_or_reject_loans",
          )}
          applications={applications.map((a) => ({
            id: a.id,
            number: a.loanNumber,
            borrower: a.borrower.legalName,
            group: a.group.name,
            amount: a.principalPesewas,
            status: a.status,
            createdAt: a.createdAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
