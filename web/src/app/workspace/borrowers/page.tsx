import { db } from "@/lib/db";
import { maskGhanaCard } from "@/lib/borrower-directory";
import {
  branchScopeLabel,
  branchScopeWhere,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { BorrowerDirectory } from "../../components/borrower-directory";
import { PageHeading } from "../../components/page-heading";

export default async function BorrowersPage() {
  const session = await requireWorkspacePath("/workspace/borrowers");
  const scope = await requireBranchScope(session);
  const branch = branchScopeLabel(scope);
  const borrowers = await db.borrower.findMany({
    where: branchScopeWhere(scope),
    orderBy: [{ legalName: "asc" }, { customerId: "asc" }],
    select: {
      id: true,
      customerId: true,
      legalName: true,
      phone: true,
      ghanaCardNumber: true,
      ghanaCardVerified: true,
      status: true,
      isSampleData: true,
      branch: { select: { name: true } },
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { joinedAt: "desc" },
        take: 1,
        select: {
          group: { select: { name: true, groupNumber: true } },
        },
      },
      loans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { loanNumber: true, status: true },
      },
    },
  });

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Borrowers"
          description="Search identity, membership, and loan status for borrowers within your assigned branch scope."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
        />
        <div className="mt-8">
          <BorrowerDirectory
            canCreate={session.user.permissions.includes(
              "manage_borrower_drafts",
            )}
            initialBorrowers={borrowers.map((borrower) => ({
              id: borrower.id,
              customerId: borrower.customerId,
              legalName: borrower.legalName,
              phone: borrower.phone,
              maskedGhanaCard: maskGhanaCard(borrower.ghanaCardNumber),
              ghanaCardVerified: borrower.ghanaCardVerified,
              status: borrower.status,
              groupName: borrower.memberships[0]?.group.name ?? null,
              groupNumber: borrower.memberships[0]?.group.groupNumber ?? null,
              loanNumber: borrower.loans[0]?.loanNumber ?? null,
              loanStatus: borrower.loans[0]?.status ?? null,
              branchName: borrower.branch.name,
              isSampleData: borrower.isSampleData,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
