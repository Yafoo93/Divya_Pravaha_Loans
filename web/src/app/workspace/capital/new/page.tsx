import { CapitalSourceForm } from "@/app/components/capital-source-form";
import { Card } from "@/app/components/ui/data-display";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { requirePermission } from "@/server/auth/session";

export const instant = false;
export default async function NewCapitalSourcePage() {
  const session = await requirePermission("manage_capital_sources", true);
  const scope = await requireBranchScope(session);
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Record capital source</h1>
        <p className="text-muted mt-2">
          Add cleared owner capital or other verified business income to an
          auditable funding lot.
        </p>
        <Card className="mt-6 p-6">
          <CapitalSourceForm branches={scope.branches} />
        </Card>
      </div>
    </main>
  );
}
