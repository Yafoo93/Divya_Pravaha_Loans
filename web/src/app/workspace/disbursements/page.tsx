import Link from "next/link";
import { db } from "@/lib/db";
import { formatAccraDateTime, formatGhsFromPesewas } from "@/lib/formatters";
import {
  branchScopeLabel,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../components/page-heading";
import { Badge, Card } from "../../components/ui/data-display";

// Authenticated session and branch data are request-bound and must not be
// evaluated during an instant prerender attempt.
export const instant = false;

export default async function DisbursementsPage() {
  const session = await requireWorkspacePath("/workspace/disbursements");
  const scope = await requireBranchScope(session);
  const loans = await db.loan.findMany({
    where: {
      branchId: { in: [...scope.branchIds] },
      status: { in: ["AWAITING_DISBURSEMENT", "ACTIVE"] },
    },
    include: {
      borrower: true,
      fundingReservations: { orderBy: { reservedAt: "desc" }, take: 1 },
      disbursement: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  const awaiting = loans.filter((loan) => !loan.disbursement);
  const released = loans.filter((loan) => loan.disbursement);
  const branch = branchScopeLabel(scope);
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Cash disbursements"
          description="Approved loans awaiting controlled physical cash release."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
        />
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Summary
            label="Awaiting cash release"
            value={String(awaiting.length)}
          />
          <Summary
            label="Reserved amount"
            value={formatGhsFromPesewas(
              awaiting.reduce(
                (sum, loan) =>
                  sum + (loan.fundingReservations[0]?.amountPesewas ?? 0),
                0,
              ),
            )}
            primary
          />
          <Summary label="Released records" value={String(released.length)} />
        </section>
        <Card className="mt-6 overflow-hidden">
          <div className="border-border border-b p-5">
            <h2 className="text-lg font-bold">Approved release queue</h2>
            <p className="text-muted text-sm">
              Reservation, contract, voucher, identity, and independent
              authorization are checked before posting.
            </p>
          </div>
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-4xl text-left text-sm">
              <thead className="bg-background text-muted text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Loan / beneficiary</th>
                  <th className="px-5 py-3">Reservation</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-5 py-4">
                      <p className="font-bold">{loan.loanNumber}</p>
                      <p className="text-muted text-xs">
                        {loan.borrower.legalName} · {loan.borrower.customerId}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      {loan.fundingReservations[0]?.reservationNumber ??
                        "MISSING"}
                    </td>
                    <td className="px-5 py-4 text-right font-bold tabular-nums">
                      {formatGhsFromPesewas(loan.principalPesewas)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={loan.disbursement ? "success" : "warning"}
                      >
                        {loan.disbursement ? "RELEASED" : "AWAITING"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/workspace/disbursements/${loan.loanNumber}`}
                        className="text-primary font-bold"
                      >
                        Review release →
                      </Link>
                    </td>
                  </tr>
                ))}
                {loans.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted px-5 py-10 text-center"
                    >
                      No approved loans are awaiting disbursement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        {released.length > 0 && (
          <p className="text-muted mt-4 text-xs">
            Most recent release:{" "}
            {formatAccraDateTime(released[0].disbursement!.actualCashOutAt)}
          </p>
        )}
      </div>
    </main>
  );
}

function Summary({
  label,
  value,
  primary = false,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <Card className={`p-5 ${primary ? "bg-primary text-white" : ""}`}>
      <p className={primary ? "text-white/80" : "text-muted"}>{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}
