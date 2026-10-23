import { db } from "@/lib/db";
import { contractualBalance } from "@/lib/loan-portfolio";
import {
  branchScopeLabel,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { LoanPortfolioDirectory } from "../../components/loan-portfolio-directory";
import { PageHeading } from "../../components/page-heading";

export const instant = false;

export default async function LoanPortfolioPage() {
  const session = await requireWorkspacePath("/workspace/loans");
  const scope = await requireBranchScope(session);
  const loans = await db.loan.findMany({
    where: {
      branchId: { in: [...scope.branchIds] },
      status: { in: ["APPROVED", "AWAITING_DISBURSEMENT", "ACTIVE", "CLOSED"] },
    },
    include: {
      borrower: true,
      group: true,
      repaymentInstalments: { orderBy: { instalmentNumber: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const branch = branchScopeLabel(scope);
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Loan portfolio"
          description="Search contractual balances, schedules, receipts, guarantees, and retained history."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
        />
        <LoanPortfolioDirectory
          loans={loans.map((loan) => {
            const balance = contractualBalance(
              loan.repaymentInstalments.length > 0
                ? loan.repaymentInstalments
                : [
                    {
                      principalPesewas: loan.principalPesewas,
                      interestPesewas: loan.contractualInterest,
                      principalPaidPesewas: 0,
                      interestPaidPesewas: 0,
                    },
                  ],
            );
            const nextDue = loan.repaymentInstalments.find(
              (instalment) => instalment.status !== "PAID",
            );
            return {
              id: loan.id,
              number: loan.loanNumber,
              borrower: loan.borrower.legalName,
              customerId: loan.borrower.customerId,
              group: loan.group.name,
              status: loan.status,
              principalPesewas: loan.principalPesewas,
              balancePesewas:
                balance.remainingPrincipalPesewas +
                balance.remainingInterestPesewas,
              nextDueDate:
                nextDue?.effectiveCollectionDate.toISOString() ?? null,
            };
          })}
        />
      </div>
    </main>
  );
}
