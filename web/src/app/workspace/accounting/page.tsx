import { db } from "@/lib/db";
import {
  naturalBalancePesewas,
  provisionalCreditLossPesewas,
  trialBalanceDifferencePesewas,
} from "@/lib/accounting-reporting";
import { formatAccraDateTime, formatGhsFromPesewas } from "@/lib/formatters";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { CorrectionAction } from "../../components/correction-controls";
import { PeriodReopeningControl } from "../../components/period-reopening-control";
import { PageHeading } from "../../components/page-heading";
import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, Card as BaseCard } from "../../components/ui/data-display";

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <BaseCard>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </BaseCard>
  );
}

export const instant = false;

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; account?: string; report?: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/accounting");
  const scope = await requireBranchScope(session);
  const filters = await searchParams;
  const query = filters.q?.trim() ?? "";
  const selectedAccount = filters.account ?? "";
  const branches = await db.branch.findMany({
    where: { id: { in: [...scope.branchIds] } },
    select: { name: true },
  });
  const [
    journals,
    reversalRequests,
    suspense,
    liabilities,
    accounts,
    periods,
    openHandovers,
    openExceptions,
    loans,
    receipts,
    custodyMovements,
    arrears,
    fundLots,
    reversals,
  ] = await Promise.all([
    db.journalEntry.findMany({
      where: {
        branchId: { in: [...scope.branchIds] },
        ...(query
          ? {
              OR: [
                { journalNumber: { contains: query, mode: "insensitive" } },
                { sourceReference: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(selectedAccount
          ? { lines: { some: { account: { code: selectedAccount } } } }
          : {}),
      },
      include: {
        lines: { include: { account: true } },
        actor: true,
        period: true,
      },
      orderBy: { entryDate: "desc" },
      take: 50,
    }),
    db.reversalRequest.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
      include: { originalJournal: true, requestedBy: true, decidedBy: true },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }),
    db.suspenseItem.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
      include: { originJournal: true, resolutionJournal: true },
      orderBy: { createdAt: "desc" },
    }),
    db.overpaymentLiability.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
      include: {
        refundRequests: {
          include: { requestedBy: true, decidedBy: true },
          orderBy: { requestedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.ledgerAccount.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    db.accountingPeriod.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
      include: {
        reopeningRequests: {
          include: { requestedBy: true, decidedBy: true },
          orderBy: { requestedAt: "desc" },
        },
      },
      orderBy: { startsAt: "desc" },
      take: 6,
    }),
    db.handover.count({
      where: {
        branchId: { in: [...scope.branchIds] },
        status: { in: ["DRAFT", "SUBMITTED", "VERIFIED"] },
      },
    }),
    db.cashException.count({
      where: {
        handover: { branchId: { in: [...scope.branchIds] } },
        status: "OPEN",
      },
    }),
    db.loan.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
      include: { repaymentInstalments: true },
    }),
    db.receipt.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
    }),
    db.custodyMovement.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
    }),
    db.arrear.findMany({
      where: { loan: { branchId: { in: [...scope.branchIds] } } },
    }),
    db.fundLot.findMany({
      where: { fundAccount: { branchId: { in: [...scope.branchIds] } } },
      include: { fundAccount: true },
    }),
    db.reversal.findMany({
      where: { originalJournal: { branchId: { in: [...scope.branchIds] } } },
      include: {
        originalJournal: true,
        reversingJournal: true,
        replacementJournal: true,
      },
    }),
  ]);
  const isManager = session.user.role === "MANAGER";
  const journalTotals = journals.reduce(
    (totals, journal) => ({
      debit:
        totals.debit +
        journal.lines.reduce((sum, line) => sum + line.debitPesewas, 0),
      credit:
        totals.credit +
        journal.lines.reduce((sum, line) => sum + line.creditPesewas, 0),
    }),
    { debit: 0, credit: 0 },
  );
  const accountActivity = accounts.map((account) => {
    const lines = journals.flatMap((journal) =>
      journal.lines.filter((line) => line.account.code === account.code),
    );
    const debit = lines.reduce((sum, line) => sum + line.debitPesewas, 0);
    const credit = lines.reduce((sum, line) => sum + line.creditPesewas, 0);
    return {
      ...account,
      debit,
      credit,
      balance: naturalBalancePesewas(account.type, debit, credit),
    };
  });
  const trialBalanceDifference = trialBalanceDifferencePesewas(
    journalTotals.debit,
    journalTotals.credit,
  );
  const reportNames = [
    "Trial balance",
    "Financial position",
    "Income statement",
    "Cash flow",
    "General ledger",
    "Portfolio and aging",
    "Collections and custody",
    "Interest accrual",
    "Credit-loss provision",
    "Fund source and use",
    "Reversals and exceptions",
  ];
  const accountBalance = (code: string) =>
    accountActivity.find((account) => account.code === code)?.balance ?? 0;
  const totalAssets =
    accountActivity
      .filter((account) => account.type === "ASSET")
      .reduce((sum, account) => sum + account.balance, 0) -
    accountActivity
      .filter((account) => account.type === "CONTRA_ASSET")
      .reduce((sum, account) => sum + account.balance, 0);
  const totalLiabilities = accountActivity
    .filter((account) => account.type === "LIABILITY")
    .reduce((sum, account) => sum + account.balance, 0);
  const totalEquity = accountActivity
    .filter((account) => account.type === "EQUITY")
    .reduce((sum, account) => sum + account.balance, 0);
  const income = accountActivity
    .filter((account) => account.type === "INCOME")
    .reduce((sum, account) => sum + account.balance, 0);
  const expenses = accountActivity
    .filter((account) => account.type === "EXPENSE")
    .reduce((sum, account) => sum + account.balance, 0);
  const portfolioPrincipal = loans
    .filter((loan) => loan.status === "ACTIVE")
    .reduce((sum, loan) => sum + loan.principalPesewas, 0);
  const outstandingContract = loans
    .filter((loan) => loan.status === "ACTIVE")
    .reduce(
      (sum, loan) =>
        sum +
        loan.repaymentInstalments.reduce(
          (scheduleSum, item) =>
            scheduleSum +
            item.principalPesewas +
            item.interestPesewas -
            item.principalPaidPesewas -
            item.interestPaidPesewas,
          0,
        ),
      0,
    );
  const receiptTotal = receipts
    .filter((receipt) => receipt.status !== "REVERSED")
    .reduce((sum, receipt) => sum + receipt.amountPesewas, 0);
  const custodyBalance = custodyMovements.reduce(
    (sum, movement) => sum + movement.amountPesewas,
    0,
  );
  const arrearsTotal = arrears
    .filter((item) => item.status !== "RESOLVED")
    .reduce((sum, item) => sum + item.unpaidAmountPesewas, 0);
  const provisionPreview = provisionalCreditLossPesewas(
    arrears.filter((item) => item.status !== "RESOLVED"),
  );
  const capitalAvailable = fundLots
    .filter((lot) => lot.fundAccount.eligibleForFunding)
    .reduce((sum, lot) => sum + lot.availablePesewas, 0);
  const selectedReport = filters.report ?? "";
  const reportMetrics: Record<string, { label: string; value: string }[]> = {
    "trial-balance": [
      { label: "Debits", value: formatGhsFromPesewas(journalTotals.debit) },
      { label: "Credits", value: formatGhsFromPesewas(journalTotals.credit) },
      {
        label: "Difference",
        value: formatGhsFromPesewas(trialBalanceDifference),
      },
    ],
    "financial-position": [
      { label: "Assets", value: formatGhsFromPesewas(totalAssets) },
      { label: "Liabilities", value: formatGhsFromPesewas(totalLiabilities) },
      { label: "Equity", value: formatGhsFromPesewas(totalEquity) },
    ],
    "income-statement": [
      { label: "Income", value: formatGhsFromPesewas(income) },
      { label: "Expenses", value: formatGhsFromPesewas(expenses) },
      { label: "Surplus", value: formatGhsFromPesewas(income - expenses) },
    ],
    "cash-flow": [
      {
        label: "Company cash",
        value: formatGhsFromPesewas(accountBalance("1000")),
      },
      {
        label: "Collector custody",
        value: formatGhsFromPesewas(custodyBalance),
      },
      { label: "Receipts", value: formatGhsFromPesewas(receiptTotal) },
    ],
    "general-ledger": [
      { label: "Journals", value: String(journals.length) },
      {
        label: "Ledger lines",
        value: String(
          journals.reduce((sum, journal) => sum + journal.lines.length, 0),
        ),
      },
      {
        label: "Control difference",
        value: formatGhsFromPesewas(trialBalanceDifference),
      },
    ],
    "portfolio-and-aging": [
      {
        label: "Active principal",
        value: formatGhsFromPesewas(portfolioPrincipal),
      },
      {
        label: "Contract outstanding",
        value: formatGhsFromPesewas(outstandingContract),
      },
      { label: "Past due", value: formatGhsFromPesewas(arrearsTotal) },
    ],
    "collections-and-custody": [
      { label: "Issued receipts", value: formatGhsFromPesewas(receiptTotal) },
      { label: "Custody balance", value: formatGhsFromPesewas(custodyBalance) },
      { label: "Receipt count", value: String(receipts.length) },
    ],
    "interest-accrual": [
      {
        label: "Interest receivable",
        value: formatGhsFromPesewas(accountBalance("1110")),
      },
      {
        label: "Interest income",
        value: formatGhsFromPesewas(accountBalance("4000")),
      },
      {
        label: "Accrual difference",
        value: formatGhsFromPesewas(
          accountBalance("1110") - accountBalance("4000"),
        ),
      },
    ],
    "credit-loss-provision": [
      {
        label: "Allowance",
        value: formatGhsFromPesewas(accountBalance("1200")),
      },
      {
        label: "Provisional matrix preview",
        value: formatGhsFromPesewas(provisionPreview),
      },
      {
        label: "Unposted difference",
        value: formatGhsFromPesewas(provisionPreview - accountBalance("1200")),
      },
    ],
    "fund-source-and-use": [
      {
        label: "Eligible available",
        value: formatGhsFromPesewas(capitalAvailable),
      },
      {
        label: "Reserved",
        value: formatGhsFromPesewas(
          fundLots.reduce((sum, lot) => sum + lot.reservedPesewas, 0),
        ),
      },
      { label: "Lots", value: String(fundLots.length) },
    ],
    "reversals-and-exceptions": [
      { label: "Completed reversals", value: String(reversals.length) },
      { label: "Open cash exceptions", value: String(openExceptions) },
      {
        label: "Open suspense",
        value: String(
          suspense.filter((item) => item.status !== "RESOLVED").length,
        ),
      },
    ],
  };
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeading
          title="Accounting & reports"
          description="Searchable journals, account activity, monthly close readiness, reports, and controlled corrections."
          branchName={branches.map((b) => b.name).join(", ")}
          date={new Date()}
          currency="GHS"
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <Card
            title="Journal & ledger search"
            description={`${journals.length} matching journals · immutable once posted`}
          >
            <form className="mb-4 grid gap-3 md:grid-cols-[1fr_14rem_auto]">
              <input
                name="q"
                defaultValue={query}
                className="min-h-11 rounded-lg border px-3"
                placeholder="Journal, reference, or description"
              />
              <select
                name="account"
                defaultValue={selectedAccount}
                className="min-h-11 rounded-lg border px-3"
              >
                <option value="">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.code}>
                    {account.code} · {account.name}
                  </option>
                ))}
              </select>
              <button className="min-h-11 rounded-lg bg-blue-700 px-5 font-semibold text-white">
                Search
              </button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">Journal / source</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Account</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Credit</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.flatMap((journal) =>
                    journal.lines.map((line, index) => (
                      <tr key={line.id} className="border-b">
                        <td className="p-3">
                          {index === 0 ? (
                            <>
                              <strong>{journal.journalNumber}</strong>
                              <div className="text-xs text-slate-500">
                                {journal.sourceReference}
                              </div>
                            </>
                          ) : null}
                        </td>
                        <td className="p-3">
                          {index === 0
                            ? formatAccraDateTime(journal.entryDate)
                            : null}
                        </td>
                        <td className="p-3">
                          {line.account.code} · {line.account.name}
                        </td>
                        <td className="p-3 text-right">
                          {line.debitPesewas
                            ? formatGhsFromPesewas(line.debitPesewas)
                            : "—"}
                        </td>
                        <td className="p-3 text-right">
                          {line.creditPesewas
                            ? formatGhsFromPesewas(line.creditPesewas)
                            : "—"}
                        </td>
                        <td className="p-3">
                          {index === 0 ? (
                            <Badge
                              variant={
                                journal.status === "POSTED"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {journal.status}
                            </Badge>
                          ) : null}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className="p-3" colSpan={3}>
                      Selected total · debits must equal credits
                    </td>
                    <td className="p-3 text-right">
                      {formatGhsFromPesewas(journalTotals.debit)}
                    </td>
                    <td className="p-3 text-right">
                      {formatGhsFromPesewas(journalTotals.credit)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              {journals.length === 0 ? (
                <p className="p-6 text-center text-slate-600">
                  No journals match these filters.
                </p>
              ) : null}
            </div>
          </Card>
          <div className="space-y-6">
            <Card
              title="Report library"
              description="Live previews from the controlled ledger"
            >
              <nav className="divide-y">
                {reportNames.map((name) => (
                  <Link
                    key={name}
                    href={`/workspace/accounting?report=${encodeURIComponent(name.toLowerCase().replaceAll(" ", "-"))}`}
                    className="flex min-h-11 items-center justify-between text-sm font-semibold text-blue-700"
                  >
                    {name}
                    <span aria-hidden>→</span>
                  </Link>
                ))}
              </nav>
            </Card>
            <Card
              title="Period controls"
              description="Closed periods reject ordinary posting; reopening uses accountant maker and Manager checker."
            >
              <div className="space-y-3">
                {periods.map((period) => {
                  const pending = period.reopeningRequests.find(
                    (request) => request.status === "PENDING",
                  );
                  return (
                    <div key={period.id} className="border-b pb-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <span>{period.name}</span>
                        <Badge
                          variant={
                            period.status === "OPEN" ? "success" : "neutral"
                          }
                        >
                          {period.status}
                        </Badge>
                      </div>
                      {period.status === "CLOSED" && !pending ? (
                        <PeriodReopeningControl
                          periodId={period.id}
                          action="REQUEST"
                        />
                      ) : null}
                      {pending ? (
                        <div className="mt-2 rounded-lg bg-amber-50 p-3">
                          <p>
                            <strong>{pending.requestNumber}</strong> · requested
                            by {pending.requestedBy.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {pending.reason}
                          </p>
                          {isManager ? (
                            <div className="grid gap-2 md:grid-cols-2">
                              <PeriodReopeningControl
                                periodId={period.id}
                                requestId={pending.id}
                                action="APPROVE"
                              />
                              <PeriodReopeningControl
                                periodId={period.id}
                                requestId={pending.id}
                                action="REJECT"
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card
              title="CSV exports"
              description="Branch-scoped core tables with integer-pesewa values"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {["journals", "loans", "receipts", "arrears"].map((table) => (
                  <a
                    key={table}
                    href={`/api/accounting/exports?table=${table}`}
                    className="min-h-11 rounded-lg border px-3 py-2 text-center text-sm font-semibold text-blue-700 capitalize"
                  >
                    Export {table}
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </div>
        {selectedReport && reportMetrics[selectedReport] ? (
          <Card
            title={selectedReport
              .replaceAll("-", " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase())}
            description="Reconciled summary generated from branch-scoped ledger and operational records."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {reportMetrics[selectedReport].map((metric) => (
                <div key={metric.label} className="rounded-xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-600">{metric.label}</span>
                  <strong className="block text-xl">{metric.value}</strong>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              Reconciliation control: the summary is calculated from the same
              journal, loan, receipt, arrears, custody, capital-lot, reversal,
              and exception records displayed in the detailed registers and CSV
              exports.
            </p>
          </Card>
        ) : null}
        <div className="grid gap-6 xl:grid-cols-2">
          <Card
            title="Account activity"
            description="Debit, credit, and natural balance for the selected journal range."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left">Account</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Credit</th>
                    <th className="p-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accountActivity.map((account) => (
                    <tr key={account.id} className="border-b">
                      <td className="p-3">
                        <Link
                          className="font-semibold text-blue-700"
                          href={`/workspace/accounting?account=${account.code}`}
                        >
                          {account.code} · {account.name}
                        </Link>
                      </td>
                      <td className="p-3 text-right">
                        {formatGhsFromPesewas(account.debit)}
                      </td>
                      <td className="p-3 text-right">
                        {formatGhsFromPesewas(account.credit)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatGhsFromPesewas(account.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card
            title="Monthly close-readiness preview"
            description="Operational controls required before the current period can close."
          >
            <div className="space-y-3">
              {[
                [
                  "Balanced selected trial balance",
                  trialBalanceDifference === 0,
                  `Difference ${formatGhsFromPesewas(trialBalanceDifference)}`,
                ],
                [
                  "Cash handovers completed",
                  openHandovers === 0,
                  `${openHandovers} open handovers`,
                ],
                [
                  "Cash exceptions resolved",
                  openExceptions === 0,
                  `${openExceptions} open exceptions`,
                ],
                [
                  "Suspense cleared",
                  suspense.every((item) => item.status === "RESOLVED"),
                  `${suspense.filter((item) => item.status !== "RESOLVED").length} unresolved items`,
                ],
                [
                  "Reversal decisions completed",
                  reversalRequests.every((item) => item.status !== "PENDING"),
                  `${reversalRequests.filter((item) => item.status === "PENDING").length} pending requests`,
                ],
                ["Manager review", false, "Independent sign-off pending"],
              ].map(([label, ready, detail]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-4 rounded-xl border p-3"
                >
                  <div>
                    <strong className="text-sm">{String(label)}</strong>
                    <p className="text-xs text-slate-500">{String(detail)}</p>
                  </div>
                  <Badge variant={ready ? "success" : "warning"}>
                    {ready ? "READY" : "PENDING"}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Preview only. Period closure remains blocked until every control
              and independent Manager review is complete.
            </p>
          </Card>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card
            title="Reversal request queue"
            description="Original receipts and journals remain immutable; approval creates linked reversing entries."
          >
            <div className="space-y-4">
              {reversalRequests.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <strong>{item.requestNumber}</strong>
                      <p className="text-sm text-slate-600">
                        {item.originalJournal.journalNumber} · maker{" "}
                        {item.requestedBy.name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.status === "PENDING"
                          ? "warning"
                          : item.status === "APPROVED"
                            ? "success"
                            : "danger"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="my-2 text-sm">{item.reason}</p>
                  {isManager && item.status === "PENDING" ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      <CorrectionAction
                        action="APPROVE_REVERSAL"
                        idName="requestId"
                        id={item.id}
                        label="Approve reversal"
                        manager
                      />
                      <CorrectionAction
                        action="REJECT_REVERSAL"
                        idName="requestId"
                        id={item.id}
                        label="Reject request"
                        manager
                      />
                    </div>
                  ) : null}
                </div>
              ))}
              {reversalRequests.length === 0 ? (
                <p className="text-sm text-slate-600">No reversal requests.</p>
              ) : null}
            </div>
          </Card>
          <Card
            title="Request a reversal"
            description="Select a posted journal. Receipt-linked requests reverse ledger, schedule, payment, and custody effects together."
          >
            <div className="space-y-3">
              {journals.map((journal) => (
                <div key={journal.id}>
                  <div className="mb-1 text-sm">
                    <strong>{journal.journalNumber}</strong> ·{" "}
                    {journal.sourceReference} ·{" "}
                    {formatAccraDateTime(journal.entryDate)}
                  </div>
                  <CorrectionAction
                    action="REQUEST_REVERSAL"
                    idName="journalId"
                    id={journal.id}
                    label="Submit reversal request"
                  />
                </div>
              ))}
            </div>
          </Card>
          <Card
            title="Suspense register"
            description="Unidentified cash stays outside borrower balances and funding availability until resolved."
          >
            <div className="space-y-4">
              {suspense.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex justify-between">
                    <strong>{item.suspenseNumber}</strong>
                    <Badge
                      variant={
                        item.status === "RESOLVED" ? "success" : "warning"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p>
                    {formatGhsFromPesewas(item.amountPesewas)} ·{" "}
                    {item.sourceReference}
                  </p>
                  {item.status === "PENDING" ? (
                    <CorrectionAction
                      action="RESOLVE_SUSPENSE"
                      idName="itemId"
                      id={item.id}
                      label="Resolve suspense"
                    />
                  ) : (
                    <p className="text-sm text-slate-600">
                      Resolution journal:{" "}
                      {item.resolutionJournal?.journalNumber}
                    </p>
                  )}
                </div>
              ))}
              {suspense.length === 0 ? (
                <p className="text-sm text-slate-600">No suspense items.</p>
              ) : null}
            </div>
          </Card>
          <Card
            title="Overpayment liabilities & refunds"
            description="Refunds require verified payer evidence, an independent Manager, and cannot exceed liability."
          >
            <div className="space-y-4">
              {liabilities.map((item) => {
                const available = item.amountPesewas - item.refundedPesewas;
                return (
                  <div key={item.id} className="rounded-xl border p-4">
                    <strong>
                      {item.liabilityNumber} · {item.payerName}
                    </strong>
                    <p className="text-sm">
                      Recorded {formatGhsFromPesewas(item.amountPesewas)} ·
                      available {formatGhsFromPesewas(available)}
                    </p>
                    {available > 0 ? (
                      <CorrectionAction
                        action="REQUEST_REFUND"
                        idName="liabilityId"
                        id={item.id}
                        label="Request verified refund"
                        amount
                        payerVerification
                      />
                    ) : null}
                    {item.refundRequests.map((request) => (
                      <div
                        key={request.id}
                        className="mt-3 rounded-lg bg-slate-50 p-3"
                      >
                        <div className="flex justify-between">
                          <span>
                            {request.requestNumber} ·{" "}
                            {formatGhsFromPesewas(request.amountPesewas)}
                          </span>
                          <Badge
                            variant={
                              request.status === "PENDING"
                                ? "warning"
                                : request.status === "APPROVED"
                                  ? "success"
                                  : "danger"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        {isManager && request.status === "PENDING" ? (
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <CorrectionAction
                              action="APPROVE_REFUND"
                              idName="requestId"
                              id={request.id}
                              label="Approve refund"
                              manager
                            />
                            <CorrectionAction
                              action="REJECT_REFUND"
                              idName="requestId"
                              id={request.id}
                              label="Reject refund"
                              manager
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                );
              })}
              {liabilities.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No overpayment liabilities.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
