import { db } from "@/lib/db";
import {
  requireBranchScope,
  branchScopeLabel,
} from "@/server/auth/branch-scope";
import { requirePermission } from "@/server/auth/session";
import { GroupCreateForm } from "../../../components/group-create-form";
import { PageHeading } from "../../../components/page-heading";
export default async function NewGroupPage() {
  const session = await requirePermission("manage_groups", true);
  const scope = await requireBranchScope(session);
  const borrowers = await db.borrower.findMany({
    where: { branchId: { in: [...scope.branchIds] }, status: "ACTIVE" },
    orderBy: { legalName: "asc" },
    select: { id: true, legalName: true, customerId: true, branchId: true },
  });
  const branch = branchScopeLabel(scope);
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <PageHeading
          title="New group"
          description="Create a draft group and record its initial consenting members."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
        />
        <GroupCreateForm
          branches={scope.branches.map(({ id, name }) => ({ id, name }))}
          borrowers={borrowers.map((b) => ({
            id: b.id,
            name: b.legalName,
            customerId: b.customerId,
            branchId: b.branchId,
          }))}
        />
      </div>
    </main>
  );
}
