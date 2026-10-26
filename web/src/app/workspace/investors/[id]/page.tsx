import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatAccraDate, formatGhsFromPesewas } from "@/lib/formatters";
import {
  calculatePrivateCapitalReturn,
  remainingInvestorBalances,
} from "@/lib/private-capital";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import {
  AccrueReturnControl,
  PayoutDecision,
  PayoutRequestForm,
} from "../../../components/investor-contract-actions";
import { Badge, Card } from "../../../components/ui/data-display";

export const instant = false;
export default async function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/investors");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const contributor = await db.capitalContributor.findFirst({
    where: { id, branchId: { in: [...scope.branchIds] } },
    include: {
      investments: {
        include: {
          fundLot: true,
          accruals: { orderBy: { throughDate: "desc" } },
          payouts: {
            include: { requestedBy: true, decidedBy: true },
            orderBy: { requestedAt: "desc" },
          },
        },
        orderBy: { startDate: "desc" },
      },
    },
  });
  if (!contributor) notFound();
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-primary text-xs font-bold uppercase">
          Private capital contributor
        </p>
        <h1 className="mt-2 text-3xl font-bold">{contributor.legalName}</h1>
        <p className="text-muted mt-2">
          {contributor.contributorNumber} · {contributor.type} ·{" "}
          {contributor.phone ?? "No phone"}
        </p>
        <div className="mt-6 space-y-6">
          {contributor.investments.map((investment) => {
            const balances = remainingInvestorBalances(investment);
            const projected = calculatePrivateCapitalReturn({
              principalPesewas: investment.principalPesewas,
              startDate: investment.startDate,
              throughDate: investment.maturityDate,
              maturityDate: investment.maturityDate,
            });
            return (
              <Card key={investment.id} className="overflow-hidden">
                <div className="border-border border-b p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold">
                        {investment.contractNumber}
                      </h2>
                      <p className="text-muted text-sm">
                        {formatAccraDate(investment.startDate)} –{" "}
                        {formatAccraDate(investment.maturityDate)} · evidence{" "}
                        {investment.evidenceReference}
                      </p>
                    </div>
                    <Badge
                      variant={
                        investment.status === "CLOSED" ? "success" : "primary"
                      }
                    >
                      {investment.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric
                    label="Original principal"
                    value={investment.principalPesewas}
                  />
                  <Metric
                    label="Principal outstanding"
                    value={balances.principalDuePesewas}
                  />
                  <Metric
                    label="Accrued return payable"
                    value={balances.returnDuePesewas}
                  />
                  <Metric
                    label="Projected return at maturity"
                    value={projected.returnPesewas}
                  />
                </div>
                <div className="border-border grid gap-6 border-t p-5 lg:grid-cols-2">
                  <section>
                    <h3 className="font-bold">Return accrual</h3>
                    <p className="text-muted mb-4 text-sm">
                      Post the cumulative 60% simple return through a controlled
                      date.
                    </p>
                    {session.user.permissions.includes(
                      "manage_private_investors",
                    ) && <AccrueReturnControl investmentId={investment.id} />}
                  </section>
                  <section>
                    <h3 className="font-bold">Request payout</h3>
                    <p className="text-muted mb-4 text-sm">
                      A different Manager must approve and execute the payment.
                    </p>
                    {session.user.permissions.includes(
                      "prepare_investor_payouts",
                    ) && <PayoutRequestForm investmentId={investment.id} />}
                  </section>
                </div>
                <div className="border-border border-t p-5">
                  <h3 className="font-bold">Payout history</h3>
                  {investment.payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="border-border mt-3 rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <p>
                          <strong>{payout.payoutNumber}</strong> · {payout.type}
                        </p>
                        <Badge
                          variant={
                            payout.status === "PAID"
                              ? "success"
                              : payout.status === "REJECTED"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {payout.status}
                        </Badge>
                      </div>
                      <p className="text-muted mt-1 text-sm">
                        Return{" "}
                        {formatGhsFromPesewas(payout.returnAmountPesewas)} ·
                        Principal{" "}
                        {formatGhsFromPesewas(payout.principalAmountPesewas)} ·
                        requested by {payout.requestedBy.name}
                      </p>
                      {payout.status === "PENDING" &&
                        session.user.permissions.includes(
                          "approve_investor_payouts",
                        ) && <PayoutDecision payoutId={payout.id} />}
                    </div>
                  ))}
                  {investment.payouts.length === 0 && (
                    <p className="text-muted mt-3 text-sm">
                      No payout requests.
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted text-xs uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold">{formatGhsFromPesewas(value)}</p>
    </div>
  );
}
