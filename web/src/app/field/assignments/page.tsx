import Link from "next/link";
import { db } from "@/lib/db";
import { formatAccraLongDate, formatGhsFromPesewas } from "@/lib/formatters";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { requirePermission } from "@/server/auth/session";

export const instant = false;

export default async function FieldAssignmentsPage() {
  const session = await requirePermission("view_assignments");
  const scope = await requireBranchScope(session);
  const today = new Date(
    `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
  );
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const [assignments, receipts] = await Promise.all([
    db.assignment.findMany({
      where: {
        branchId: { in: [...scope.branchIds] },
        collectionDate: today,
        ...(session.user.role === "MANAGER"
          ? {}
          : { collectorUserId: session.user.id }),
        status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
      },
      include: {
        loan: {
          include: {
            borrower: true,
            group: true,
            receipts: true,
            repaymentInstalments: {
              where: { status: { not: "PAID" } },
              orderBy: { instalmentNumber: "asc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { assignmentNumber: "asc" },
    }),
    db.receipt.findMany({
      where: {
        branchId: { in: [...scope.branchIds] },
        ...(session.user.role === "MANAGER"
          ? {}
          : { collectorUserId: session.user.id }),
        receivedAt: { gte: today, lt: tomorrow },
        status: { in: ["CAPTURED", "HANDED_OVER"] },
      },
    }),
  ]);
  const loans = assignments.map((assignment) => assignment.loan);
  const dueFor = (loan: (typeof loans)[number]) =>
    loan.repaymentInstalments[0]?.totalPesewas ??
    Math.round(loan.totalRepayablePesewas / Math.max(loan.termMonths, 1));
  const target = loans.reduce((sum, loan) => sum + dueFor(loan), 0);
  const collected = receipts.reduce(
    (sum, receipt) => sum + receipt.amountPesewas,
    0,
  );
  const custody = receipts
    .filter((receipt) => receipt.status === "CAPTURED")
    .reduce((sum, receipt) => sum + receipt.amountPesewas, 0);
  const groups = Map.groupBy(loans, (loan) => loan.group.name);

  return (
    <main className="px-4 py-6">
      <p className="text-primary text-[10px] font-bold tracking-wider uppercase">
        {formatAccraLongDate(new Date())} · Collection route
      </p>
      <h1 className="mt-2 text-2xl font-bold">Today&apos;s assignments</h1>
      <p className="text-muted mt-2 text-sm">
        {scope.branches.map((branch) => branch.name).join(", ")} ·{" "}
        {loans.length} stops
      </p>

      <section className="bg-primary mt-5 rounded-2xl p-5 text-white shadow-sm">
        <p className="text-xs font-bold text-white/75 uppercase">
          Collected today
        </p>
        <p className="mt-2 text-3xl font-bold">
          {formatGhsFromPesewas(collected)}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white"
            style={{
              width: `${Math.min(100, target ? (collected / target) * 100 : 0)}%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-white/80">
          Target {formatGhsFromPesewas(target)} · {loans.length} stops assigned
        </p>
      </section>

      <section className="border-border bg-surface mt-4 grid grid-cols-2 divide-x rounded-2xl border p-4 shadow-sm">
        <div>
          <p className="text-muted text-xs">Receipts issued</p>
          <p className="mt-1 text-xl font-bold">{receipts.length}</p>
        </div>
        <div className="pl-4">
          <p className="text-muted text-xs">Cash in your custody</p>
          <p className="mt-1 text-xl font-bold">
            {formatGhsFromPesewas(custody)}
          </p>
        </div>
      </section>

      {[...groups.entries()].map(([groupName, stops]) => (
        <section key={groupName} className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">{groupName}</h2>
            <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-[10px] font-bold">
              {stops.length} {stops.length === 1 ? "STOP" : "STOPS"}
            </span>
          </div>
          <div className="space-y-3">
            {stops.map((loan) => (
              <article
                key={loan.id}
                className="border-border bg-surface rounded-2xl border p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{loan.borrower.legalName}</h3>
                    <p className="text-muted mt-1 text-xs">
                      {loan.borrower.customerId} · {loan.loanNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted text-[10px] font-bold uppercase">
                      Due · GHS
                    </p>
                    <p className="text-lg font-bold">
                      {formatGhsFromPesewas(dueFor(loan)).replace("GHS ", "")}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/field/loans/${loan.id}/collect`}
                  className="bg-primary mt-4 flex min-h-12 items-center justify-center rounded-xl px-4 font-bold text-white"
                >
                  Capture cash
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
      {loans.length === 0 && (
        <section className="border-border bg-surface text-muted mt-6 rounded-2xl border p-8 text-center">
          No active loan stops are assigned in your branch.
        </section>
      )}
    </main>
  );
}
