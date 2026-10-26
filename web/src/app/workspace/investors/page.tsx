import Link from "next/link";
import { db } from "@/lib/db";
import { formatAccraDate, formatGhsFromPesewas } from "@/lib/formatters";
import { remainingInvestorBalances } from "@/lib/private-capital";
import {
  branchScopeLabel,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../components/page-heading";
import { Badge, Card } from "../../components/ui/data-display";

export const instant = false;
export default async function InvestorsPage() {
  const session = await requireWorkspacePath("/workspace/investors");
  const scope = await requireBranchScope(session);
  const contributors = await db.capitalContributor.findMany({
    where: { branchId: { in: [...scope.branchIds] } },
    include: {
      investments: {
        include: { payouts: true },
        orderBy: { startDate: "desc" },
      },
    },
    orderBy: { legalName: "asc" },
  });
  const investments = contributors.flatMap((contributor) =>
    contributor.investments.map((investment) => ({ contributor, investment })),
  );
  const totals = investments.reduce(
    (sum, { investment }) => {
      const due = remainingInvestorBalances(investment);
      return {
        principal: sum.principal + due.principalDuePesewas,
        accrued: sum.accrued + investment.accruedReturnPesewas,
        returnsDue: sum.returnsDue + due.returnDuePesewas,
      };
    },
    { principal: 0, accrued: 0, returnsDue: 0 },
  );
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Private capital portfolio"
          description="Owner-approved family and other private funding contracts. Public investment solicitation is not supported."
          branchName={branchScopeLabel(scope).name}
          date={new Date()}
          currency="GHS"
          actions={
            session.user.permissions.includes("manage_private_investors") ? (
              <Link
                href="/workspace/investors/new"
                className="bg-primary rounded-lg px-4 py-3 text-sm font-bold text-white"
              >
                Record private capital
              </Link>
            ) : undefined
          }
        />
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Summary label="Principal outstanding" value={totals.principal} />
          <Summary label="Returns accrued" value={totals.accrued} />
          <Summary label="Returns payable" value={totals.returnsDue} />
        </section>
        <Card className="mt-6 overflow-hidden">
          <div className="border-border border-b p-5">
            <h2 className="text-lg font-bold">Contributors and contracts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-4xl text-left text-sm">
              <thead className="bg-background text-muted text-xs uppercase">
                <tr>
                  <th className="p-4">Contributor</th>
                  <th className="p-4">Contract</th>
                  <th className="p-4">Maturity</th>
                  <th className="p-4 text-right">Principal</th>
                  <th className="p-4 text-right">Return payable</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {investments.map(({ contributor, investment }) => {
                  const due = remainingInvestorBalances(investment);
                  return (
                    <tr key={investment.id}>
                      <td className="p-4">
                        <Link
                          className="text-primary font-bold hover:underline"
                          href={`/workspace/investors/${contributor.id}`}
                        >
                          {contributor.legalName}
                        </Link>
                        <p className="text-muted text-xs">
                          {contributor.contributorNumber} · {contributor.type}
                        </p>
                      </td>
                      <td className="p-4 font-mono text-xs">
                        {investment.contractNumber}
                      </td>
                      <td className="p-4">
                        {formatAccraDate(investment.maturityDate)}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatGhsFromPesewas(due.principalDuePesewas)}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatGhsFromPesewas(due.returnDuePesewas)}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            investment.status === "CLOSED"
                              ? "success"
                              : investment.status === "MATURED"
                                ? "warning"
                                : "primary"
                          }
                        >
                          {investment.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {investments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-muted p-10 text-center">
                      No private capital contracts recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-muted text-sm">{label}</p>
      <p className="mt-2 text-2xl font-bold">{formatGhsFromPesewas(value)}</p>
    </Card>
  );
}
