import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import {
  availableFundingPesewas,
  collectionRatePercent,
  collectorCustodyPesewas,
  contractualReceivablesPesewas,
} from "@/lib/dashboard-kpis";
import { formatGhsFromPesewas } from "@/lib/formatters";
import {
  requireBranchScope,
  branchScopeLabel,
} from "@/server/auth/branch-scope";
import { requireServerSession } from "@/server/auth/session";
import { PageHeading } from "../components/page-heading";
import { Badge, Card } from "../components/ui/data-display";

export const instant = false;

function KpiCard({
  label,
  value,
  formula,
  href,
}: {
  label: string;
  value: ReactNode;
  formula: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      <Card className="h-full p-5 transition hover:border-blue-300 hover:shadow-sm">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        <p className="mt-2 text-xs text-slate-500">{formula}</p>
        <span className="mt-3 inline-block text-sm font-semibold text-blue-700">
          View filtered detail →
        </span>
      </Card>
    </Link>
  );
}

export default async function WorkspaceOverviewPage() {
  const session = await requireServerSession();
  const scope = await requireBranchScope(session);
  const branchName = branchScopeLabel(scope).name;
  const branchIds = [...scope.branchIds];
  const [
    schedules,
    custody,
    lots,
    receipts,
    arrears,
    loans,
    borrowers,
    groups,
    handovers,
    exceptions,
    journals,
    periods,
    audits,
    users,
    roles,
  ] = await Promise.all([
    db.repaymentInstalment.findMany({
      where: { loan: { branchId: { in: branchIds }, status: "ACTIVE" } },
    }),
    db.custodyMovement.findMany({
      where: { branchId: { in: branchIds } },
      select: { amountPesewas: true },
    }),
    db.fundLot.findMany({
      where: { fundAccount: { branchId: { in: branchIds } } },
      include: { fundAccount: true },
    }),
    db.receipt.findMany({
      where: { branchId: { in: branchIds }, status: { not: "REVERSED" } },
      orderBy: { receivedAt: "desc" },
      take: 100,
    }),
    db.arrear.findMany({
      where: {
        loan: { branchId: { in: branchIds } },
        status: { not: "RESOLVED" },
      },
    }),
    db.loan.findMany({
      where: { branchId: { in: branchIds } },
      orderBy: { updatedAt: "desc" },
    }),
    db.borrower.count({ where: { branchId: { in: branchIds } } }),
    db.borrowerGroup.count({ where: { branchId: { in: branchIds } } }),
    db.handover.findMany({
      where: { branchId: { in: branchIds } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.cashException.findMany({
      where: { handover: { branchId: { in: branchIds } }, status: "OPEN" },
    }),
    db.journalEntry.findMany({
      where: { branchId: { in: branchIds } },
      orderBy: { entryDate: "desc" },
      take: 30,
    }),
    db.accountingPeriod.findMany({
      where: { branchId: { in: branchIds } },
      orderBy: { startsAt: "desc" },
      take: 3,
    }),
    db.auditEvent.findMany({
      where: { OR: [{ branchId: { in: branchIds } }, { branchId: null }] },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.user.count(),
    db.role.count({ where: { isActive: true } }),
  ]);

  const receivables = contractualReceivablesPesewas(schedules);
  const custodyBalance = collectorCustodyPesewas(custody);
  const availableFunding = availableFundingPesewas(lots);
  const receiptTotal = receipts.reduce(
    (sum, receipt) => sum + receipt.amountPesewas,
    0,
  );
  const arrearsTotal = arrears.reduce(
    (sum, item) => sum + item.unpaidAmountPesewas,
    0,
  );
  const dueTotal = schedules.reduce((sum, item) => sum + item.totalPesewas, 0);
  const collectionRate = collectionRatePercent(receiptTotal, dueTotal);
  const pendingLoans = loans.filter((loan) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(loan.status),
  ).length;
  const draftLoans = loans.filter((loan) => loan.status === "DRAFT").length;
  const activeAssignments = await db.assignment.count({
    where: {
      branchId: { in: branchIds },
      status: "ASSIGNED",
      ...(session.user.role === "FIELD_COLLECTOR"
        ? { collectorUserId: session.user.id }
        : {}),
    },
  });
  const openHandovers = handovers.filter((item) =>
    ["DRAFT", "SUBMITTED", "VERIFIED"].includes(item.status),
  ).length;
  const role = session.user.role;

  const managerCards = [
    [
      "Contractual receivables",
      formatGhsFromPesewas(receivables),
      "Σ unpaid principal + unpaid contractual interest",
      "/workspace/loans?status=ACTIVE",
    ],
    [
      "Collector custody",
      formatGhsFromPesewas(custodyBalance),
      "Σ signed custody movements; unavailable for lending",
      "/workspace/handovers?status=SUBMITTED",
    ],
    [
      "Available funding",
      formatGhsFromPesewas(availableFunding),
      "Σ eligible fund-lot available balances only",
      "/workspace/capital?view=available",
    ],
    [
      "Receipts recorded",
      formatGhsFromPesewas(receiptTotal),
      "Σ non-reversed branch receipts in the displayed register",
      "/workspace/cash-collections",
    ],
    [
      "Past-due exposure",
      formatGhsFromPesewas(arrearsTotal),
      "Σ unresolved arrears unpaid amounts",
      "/workspace/arrears?status=open",
    ],
    [
      "Pending decisions",
      String(pendingLoans),
      "Count of submitted and under-review applications",
      "/workspace/loan-applications?status=UNDER_REVIEW",
    ],
    [
      "Open exceptions",
      String(exceptions.length),
      "Count of unresolved cash exceptions",
      "/workspace/handovers?exception=OPEN",
    ],
    [
      "Collection rate",
      `${collectionRate.toFixed(1)}%`,
      "Non-reversed receipts ÷ scheduled contractual cash",
      "/workspace/cash-collections",
    ],
  ] as const;

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <PageHeading
          title={
            role === "MANAGER"
              ? "Manager overview"
              : role === "LOAN_OFFICER"
                ? "Loan Officer queue"
                : role === "FIELD_COLLECTOR"
                  ? "Collector operations"
                  : role === "CASHIER_ACCOUNTANT"
                    ? "Finance control centre"
                    : role === "AUDITOR"
                      ? "Audit traceability"
                      : role === "SYSTEM_ADMIN"
                        ? "Administration overview"
                        : "Workspace overview"
          }
          description={`Role-scoped operational summary for ${session.user.name}.`}
          branchName={branchName}
          date={new Date()}
          currency="GHS"
        />

        {role === "MANAGER" ? (
          <section
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            aria-label="Manager KPIs"
          >
            {managerCards.map(([label, value, formula, href]) => (
              <KpiCard
                key={label}
                label={label}
                value={value}
                formula={formula}
                href={href}
              />
            ))}
          </section>
        ) : null}

        {role === "LOAN_OFFICER" ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Borrowers"
              value={borrowers}
              formula="Count of branch borrower records"
              href="/workspace/borrowers"
            />
            <KpiCard
              label="Groups"
              value={groups}
              formula="Count of branch lending groups"
              href="/workspace/groups"
            />
            <KpiCard
              label="Draft applications"
              value={draftLoans}
              formula="Applications currently in DRAFT"
              href="/workspace/loan-applications?status=DRAFT"
            />
            <KpiCard
              label="Submitted queue"
              value={pendingLoans}
              formula="SUBMITTED + UNDER_REVIEW applications"
              href="/workspace/loan-applications?status=SUBMITTED"
            />
          </section>
        ) : null}

        {role === "FIELD_COLLECTOR" ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Today's assignments"
                value={activeAssignments}
                formula="Assigned stops for the authenticated collector"
                href="/field/assignments"
              />
              <KpiCard
                label="Receipts"
                value={receipts.length}
                formula="Count of non-reversed receipts in branch scope"
                href="/field/receipts"
              />
              <KpiCard
                label="Cash in custody"
                value={formatGhsFromPesewas(custodyBalance)}
                formula="Cash received − verified handovers − reversals"
                href="/field/assignments"
              />
              <KpiCard
                label="Open handovers"
                value={openHandovers}
                formula="Draft + submitted + verified-not-posted batches"
                href="/field/handovers/new"
              />
            </section>
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Custody cash is not available for new lending until independently
              verified and posted.
            </p>
          </>
        ) : null}

        {role === "CASHIER_ACCOUNTANT" ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Reconciliation queue"
              value={openHandovers}
              formula="Unposted custody handovers requiring finance control"
              href="/workspace/handovers"
            />
            <KpiCard
              label="Posted journals"
              value={journals.length}
              formula="Most recent branch journals displayed"
              href="/workspace/accounting"
            />
            <KpiCard
              label="Current period"
              value={periods[0]?.status ?? "MISSING"}
              formula="Status of latest configured accounting period"
              href="/workspace/accounting"
            />
            <KpiCard
              label="Open exceptions"
              value={exceptions.length}
              formula="Unresolved cash discrepancies"
              href="/workspace/handovers?exception=OPEN"
            />
          </section>
        ) : null}

        {role === "AUDITOR" ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <KpiCard
                label="Audit events"
                value={audits.length}
                formula="Latest append-only events in authorized scope"
                href="/workspace/administration#audit"
              />
              <KpiCard
                label="Reversed journals"
                value={
                  journals.filter((journal) => journal.status === "REVERSED")
                    .length
                }
                formula="Count of reversed journals in displayed history"
                href="/workspace/accounting?report=reversals-and-exceptions"
              />
              <KpiCard
                label="Open exceptions"
                value={exceptions.length}
                formula="Unresolved operational exceptions"
                href="/workspace/handovers?exception=OPEN"
              />
            </section>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Read-only traceability</h2>
              <div className="mt-3 divide-y">
                {audits.slice(0, 8).map((event) => (
                  <div
                    key={event.id}
                    className="grid gap-1 py-3 text-sm md:grid-cols-4"
                  >
                    <span>{event.eventType}</span>
                    <span>{event.actorName ?? "System"}</span>
                    <span>{event.resource ?? "—"}</span>
                    <Badge
                      variant={
                        event.outcome === "SUCCESS" ? "success" : "warning"
                      }
                    >
                      {event.outcome}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : null}

        {role === "SYSTEM_ADMIN" ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Staff accounts"
              value={users}
              formula="Count of configured staff identities"
              href="/workspace/administration/staff"
            />
            <KpiCard
              label="Active roles"
              value={roles}
              formula="Count of enabled role definitions"
              href="/workspace/administration/roles"
            />
            <KpiCard
              label="Policy sign-offs"
              value="Approved prototype"
              formula="Owner-approved prototype controls; production gates retained"
              href="/workspace/administration#sign-offs"
            />
            <KpiCard
              label="Investor gate"
              value="LOCKED"
              formula="Unavailable until legal and accounting activation"
              href="/workspace/administration#investor-gates"
            />
          </section>
        ) : null}

        {![
          "MANAGER",
          "LOAN_OFFICER",
          "FIELD_COLLECTOR",
          "CASHIER_ACCOUNTANT",
          "AUDITOR",
          "SYSTEM_ADMIN",
        ].includes(role) ? (
          <Card className="p-6">
            <p>This role has no operational dashboard in Phase 1.</p>
          </Card>
        ) : null}

        <Card className="p-5">
          <h2 className="text-lg font-bold">KPI controls and exclusions</h2>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <p>
              <strong>Available funding:</strong> eligible fund-lot available
              balances after reservations and allocations.
            </p>
            <p>
              <strong>Excluded:</strong> collector custody, receivables,
              suspense, customer overpayments, and investor principal.
            </p>
            <p>
              <strong>Receivables:</strong> unpaid scheduled principal plus
              unpaid contractual interest.
            </p>
            <p>
              <strong>Aging:</strong> unresolved unpaid amounts after the
              effective due date, with zero grace.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
