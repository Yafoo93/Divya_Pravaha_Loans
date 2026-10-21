import { db } from "@/lib/db";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { requirePermission } from "@/server/auth/session";
import { BorrowerOnboardingForm } from "../../../components/borrower-onboarding-form";
import { PageHeading } from "../../../components/page-heading";

export default async function NewBorrowerPage() {
  const session = await requirePermission("manage_borrower_drafts", true);
  const scope = await requireBranchScope(session);
  const groups = await db.borrowerGroup.findMany({
    where: {
      branchId: { in: [...scope.branchIds] },
      status: { in: ["DRAFT", "ACTIVE"] },
    },
    orderBy: [{ name: "asc" }],
    select: { id: true, groupNumber: true, name: true, branchId: true },
  });
  const branchLabel =
    scope.branches.length === 1 ? scope.branches[0].name : "Assigned branches";

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <PageHeading
          title="New borrower"
          description="Create a controlled borrower identity with contact, business, Ghana Card, branch, group, and consent evidence."
          branchName={branchLabel}
          date={new Date()}
          currency="GHS"
        />
        <div className="mt-8">
          <BorrowerOnboardingForm branches={scope.branches} groups={groups} />
        </div>
      </div>
    </main>
  );
}
