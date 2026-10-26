import { db } from "@/lib/db";
import { formatAccraDate, formatGhsFromPesewas } from "@/lib/formatters";
import {
  branchScopeLabel,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../components/page-heading";
import { Badge, Card } from "../../components/ui/data-display";

export const instant = false;

const badgeVariant = {
  AVAILABLE: "success",
  RESERVED: "warning",
  COMMITTED: "primary",
  DISBURSED: "primary",
  RECOVERED: "success",
  CANCELLED: "danger",
} as const;

export default async function CapitalPage() {
  const session = await requireWorkspacePath("/workspace/capital");
  const scope = await requireBranchScope(session);
  const accounts = await db.fundAccount.findMany({
    where: { branchId: { in: [...scope.branchIds] }, isActive: true },
    include: {
      lots: {
        include: {
          movements: { orderBy: { occurredAt: "asc" } },
          reservations: { include: { loan: true } },
          allocations: { include: { loan: true } },
        },
        orderBy: { lotNumber: "asc" },
      },
    },
    orderBy: { accountNumber: "asc" },
  });
  const branch = branchScopeLabel(scope);
  const eligibleLots = accounts
    .filter((account) => account.eligibleForFunding)
    .flatMap((account) => account.lots.map((lot) => ({ account, lot })));
  const excludedAccounts = accounts.filter(
    (account) => !account.eligibleForFunding,
  );
  const total = eligibleLots.reduce(
    (sum, { lot }) => ({
      verified: sum.verified + lot.originalPesewas,
      available: sum.available + lot.availablePesewas,
      reserved: sum.reserved + lot.reservedPesewas,
      allocated: sum.allocated + lot.committedPesewas + lot.disbursedPesewas,
      recovered: sum.recovered + lot.recoveredPesewas,
    }),
    { verified: 0, available: 0, reserved: 0, allocated: 0, recovered: 0 },
  );

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Capital source & use"
          description="Trace verified cash from its eligible source lot to reservations, loan allocations, and principal recovery."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
        />

        <div className="bg-primary/5 text-primary border-primary/15 mt-6 rounded-xl border px-4 py-3 text-sm">
          Capital attribution is a management subledger. The balanced general
          ledger remains the accounting truth; cash is not counted twice.
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Summary label="Verified source cash" value={total.verified} />
          <Summary label="Reserved" value={total.reserved} />
          <Summary
            label="Available to allocate"
            value={total.available}
            primary
          />
          <Summary label="Allocated / deployed" value={total.allocated} />
          <Summary label="Recovered principal" value={total.recovered} />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <SectionTitle
                title="Verified funding lots"
                detail="Only verified, eligible cash can fund a loan."
              />
              <div className="overflow-x-auto" tabIndex={0}>
                <table className="w-full min-w-4xl text-left text-sm">
                  <thead className="bg-background text-muted text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3">Lot / source</th>
                      <th className="px-5 py-3 text-right">Verified</th>
                      <th className="px-5 py-3 text-right">Reserved</th>
                      <th className="px-5 py-3 text-right">Available</th>
                      <th className="px-5 py-3">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {eligibleLots.map(({ account, lot }) => (
                      <tr key={lot.id}>
                        <td className="px-5 py-4">
                          <p className="font-bold">{lot.lotNumber}</p>
                          <p className="text-muted text-xs">
                            {account.name} · {lot.evidenceReference}
                          </p>
                        </td>
                        <Money value={lot.originalPesewas} />
                        <Money value={lot.reservedPesewas} />
                        <Money value={lot.availablePesewas} />
                        <td className="px-5 py-4">
                          <Badge variant={badgeVariant[lot.status]}>
                            {lot.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {eligibleLots.map(({ lot }) => (
              <Card key={lot.id} className="overflow-hidden">
                <SectionTitle
                  title={`${lot.lotNumber} · forward and backward trace`}
                  detail={`${lot.description} · received ${formatAccraDate(lot.receivedAt)}`}
                />
                <div className="overflow-x-auto" tabIndex={0}>
                  <table className="w-full min-w-4xl text-left text-sm">
                    <thead className="bg-background text-muted text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3">Date / state</th>
                        <th className="px-5 py-3">Source or destination</th>
                        <th className="px-5 py-3 text-right">Principal</th>
                        <th className="px-5 py-3 text-right">Interest</th>
                        <th className="px-5 py-3 text-right">Movement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      {lot.movements.map((movement) => (
                        <tr key={movement.id}>
                          <td className="px-5 py-4">
                            <p>{formatAccraDate(movement.occurredAt)}</p>
                            <Badge
                              variant={badgeVariant[movement.movementType]}
                            >
                              {movement.movementType}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-mono text-xs">
                              {movement.sourceReference}
                            </p>
                            <p className="text-muted mt-1 text-xs">
                              {movement.notes}
                            </p>
                          </td>
                          <Money value={movement.principalAmountPesewas} />
                          <Money value={movement.interestAmountPesewas} />
                          <Money value={movement.amountPesewas} />
                        </tr>
                      ))}
                      {lot.movements.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-muted px-5 py-8 text-center"
                          >
                            No movements recorded for this lot.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {(lot.reservations.length > 0 ||
                  lot.allocations.length > 0) && (
                  <div className="border-border bg-primary/5 border-t px-5 py-4 text-sm">
                    {lot.reservations.map((reservation) => (
                      <p key={reservation.id}>
                        <strong>{reservation.reservationNumber}</strong> →{" "}
                        {reservation.loan?.loanNumber ?? "Unassigned"} ·{" "}
                        {formatGhsFromPesewas(reservation.amountPesewas)}
                      </p>
                    ))}
                    {lot.allocations.map((allocation) => (
                      <p key={allocation.id}>
                        <strong>{allocation.allocationNumber}</strong> →{" "}
                        {allocation.loan.loanNumber} · principal recovered{" "}
                        {formatGhsFromPesewas(
                          allocation.recoveredPrincipalPesewas,
                        )}
                        ; interest traced separately{" "}
                        {formatGhsFromPesewas(
                          allocation.recoveredInterestPesewas,
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card className="h-fit p-5">
            <h2 className="text-lg font-bold">Excluded from funding</h2>
            <p className="text-muted mt-1 text-sm">
              Visible boundaries prevent ineligible balances being lent.
            </p>
            <div className="divide-border mt-4 divide-y">
              {excludedAccounts.map((account) => (
                <div key={account.id} className="py-4">
                  <p className="font-semibold">{account.name}</p>
                  <p className="text-muted mt-1 text-xs">
                    {account.exclusionReason}
                  </p>
                  <Badge variant="warning">EXCLUDED</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
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
  value: number;
  primary?: boolean;
}) {
  return (
    <Card className={`p-5 ${primary ? "bg-primary text-white" : ""}`}>
      <p className={`text-sm ${primary ? "text-white/80" : "text-muted"}`}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums">
        {formatGhsFromPesewas(value)}
      </p>
    </Card>
  );
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border-border border-b px-5 py-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-muted text-sm">{detail}</p>
    </div>
  );
}

function Money({ value }: { value: number }) {
  return (
    <td className="px-5 py-4 text-right font-medium tabular-nums">
      {formatGhsFromPesewas(value)}
    </td>
  );
}
