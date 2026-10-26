import { PrivateInvestorForm } from "@/app/components/private-investor-form";
import { Card } from "@/app/components/ui/data-display";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { requirePermission } from "@/server/auth/session";

export const instant = false;
export default async function NewPrivateInvestorPage() {
  const session = await requirePermission('manage_private_investors', true);
  const scope = await requireBranchScope(session);
  return <main className="px-6 py-8 lg:px-10"><div className="mx-auto max-w-3xl"><h1 className="text-3xl font-bold">Record private capital</h1><p className="text-muted mt-2">Create the contributor, cleared funding lot, 60% simple-return contract, and accounting liability together.</p><Card className="mt-6 p-6"><PrivateInvestorForm branches={scope.branches} /></Card></div></main>;
}
