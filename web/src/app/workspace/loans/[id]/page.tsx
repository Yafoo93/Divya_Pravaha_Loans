import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  formatAccraDate,
  formatAccraDateTime,
  formatGhsFromPesewas,
} from "@/lib/formatters";
import { contractualBalance, earlySettlementQuote } from "@/lib/loan-portfolio";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../../components/page-heading";
import { Badge, Card } from "../../../components/ui/data-display";

export const instant = false;

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/loans");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const loan = await db.loan.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { loanNumber: id }] }),
    include: {
      branch: true,
      borrower: true,
      group: true,
      product: true,
      repaymentInstalments: { orderBy: { instalmentNumber: "asc" } },
      receipts: {
        include: { collector: true },
        orderBy: { receivedAt: "desc" },
      },
      applicationEvents: {
        include: { actor: true },
        orderBy: { occurredAt: "desc" },
      },
      applicationDocuments: { orderBy: { createdAt: "desc" } },
      guaranteeSnapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
      disbursement: true,
    },
  });
  if (!loan) notFound();
  const guarantee = loan.guaranteeSnapshots[0];
  const guarantors = guarantee
    ? await db.borrower.findMany({
        where: { id: { in: guarantee.guarantorBorrowerIds } },
        orderBy: { legalName: "asc" },
      })
    : [];
  const sourceReferences = [
    loan.loanNumber,
    ...loan.receipts.map((receipt) => receipt.receiptNumber),
    ...(loan.disbursement ? [loan.disbursement.disbursementNumber] : []),
  ];
  const journals = await db.journalEntry.findMany({
    where: {
      branchId: loan.branchId,
      OR: [
        { sourceReference: { in: sourceReferences } },
        { sourceReference: { contains: loan.loanNumber } },
      ],
    },
    include: { lines: { include: { account: true } }, actor: true },
    orderBy: { entryDate: "desc" },
  });
  const contractualSchedule =
    loan.repaymentInstalments.length > 0
      ? loan.repaymentInstalments
      : [
          {
            principalPesewas: loan.principalPesewas,
            interestPesewas: loan.contractualInterest,
            principalPaidPesewas: 0,
            interestPaidPesewas: 0,
          },
        ];
  const balance = contractualBalance(contractualSchedule);
  const quote = earlySettlementQuote(contractualSchedule, new Date());
  const accruedIncomePesewas = journals.reduce(
    (sum, journal) =>
      sum +
      journal.lines
        .filter((line) => line.account.code === "4000")
        .reduce(
          (lineSum, line) => lineSum + line.creditPesewas - line.debitPesewas,
          0,
        ),
    0,
  );
  const contractBalancePesewas =
    balance.remainingPrincipalPesewas + balance.remainingInterestPesewas;
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title={`${loan.borrower.legalName} · ${loan.loanNumber}`}
          description={`${loan.borrower.customerId} · ${loan.group.name} · ${loan.product?.code ?? "Legacy product"}`}
          branchName={loan.branch.name}
          date={new Date()}
          currency="GHS"
        />
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge
            variant={
              loan.status === "ACTIVE"
                ? "success"
                : loan.status === "CLOSED"
                  ? "neutral"
                  : "warning"
            }
          >
            {loan.status}
          </Badge>
          {loan.status === "CLOSED" && (
            <Badge variant="primary">HISTORY RETAINED</Badge>
          )}
        </div>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Original principal"
            value={formatGhsFromPesewas(loan.principalPesewas)}
          />
          <Metric
            label="Contractual interest"
            value={formatGhsFromPesewas(loan.contractualInterest)}
          />
          <Metric
            label="Remaining contract balance"
            value={formatGhsFromPesewas(contractBalancePesewas)}
            primary
          />
          <Metric
            label="Accrued accounting income"
            value={formatGhsFromPesewas(accruedIncomePesewas)}
          />
        </section>
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="border-border border-b p-5">
                <h2 className="text-lg font-bold">Repayment schedule</h2>
                <p className="text-muted text-sm">
                  Contract dates never change; effective dates apply the
                  next-business-day collection rule.
                </p>
              </div>
              <div className="overflow-x-auto" tabIndex={0}>
                <table className="w-full min-w-4xl text-left text-sm">
                  <thead className="bg-background text-muted text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Instalment</th>
                      <th className="px-4 py-3">Contractual due</th>
                      <th className="px-4 py-3">Effective due</th>
                      <th className="px-4 py-3 text-right">Principal</th>
                      <th className="px-4 py-3 text-right">Interest</th>
                      <th className="px-4 py-3 text-right">Received</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {loan.repaymentInstalments.map((instalment) => (
                      <tr key={instalment.id}>
                        <td className="px-4 py-3 font-bold">
                          {instalment.instalmentNumber}
                        </td>
                        <td className="px-4 py-3">
                          {formatAccraDate(instalment.contractualDueDate)}
                        </td>
                        <td className="px-4 py-3">
                          {formatAccraDate(instalment.effectiveCollectionDate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatGhsFromPesewas(instalment.principalPesewas)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatGhsFromPesewas(instalment.interestPesewas)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatGhsFromPesewas(
                            instalment.principalPaidPesewas +
                              instalment.interestPaidPesewas,
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              instalment.status === "PAID"
                                ? "success"
                                : instalment.status === "PART_PAID"
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {instalment.status.replaceAll("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="border-border border-b p-5">
                <h2 className="text-lg font-bold">Receipts and activity</h2>
              </div>
              <div className="divide-border divide-y">
                {loan.receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex flex-wrap justify-between gap-3 p-4 text-sm"
                  >
                    <div>
                      <Link
                        href={`/workspace/cash-collections/${receipt.receiptNumber}`}
                        className="text-primary font-bold"
                      >
                        {receipt.receiptNumber}
                      </Link>
                      <p className="text-muted text-xs">
                        {formatAccraDateTime(receipt.receivedAt)} ·{" "}
                        {receipt.collector.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatGhsFromPesewas(receipt.amountPesewas)}
                      </p>
                      <p className="text-muted text-xs">{receipt.status}</p>
                    </div>
                  </div>
                ))}
                {loan.receipts.length === 0 && (
                  <p className="text-muted p-5 text-sm">No receipts issued.</p>
                )}
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="border-border border-b p-5">
                <h2 className="text-lg font-bold">Accounting journals</h2>
                <p className="text-muted text-sm">
                  Accrued income is ledger-derived and is not the contractual
                  settlement balance.
                </p>
              </div>
              <div className="divide-border divide-y">
                {journals.map((journal) => (
                  <div
                    key={journal.id}
                    className="grid gap-2 p-4 text-sm sm:grid-cols-[10rem_1fr_10rem]"
                  >
                    <div>
                      <p className="font-bold">{journal.journalNumber}</p>
                      <p className="text-muted text-xs">
                        {formatAccraDate(journal.entryDate)}
                      </p>
                    </div>
                    <div>
                      <p>{journal.description}</p>
                      <p className="text-muted text-xs">
                        {journal.sourceReference}
                      </p>
                    </div>
                    <p className="text-right font-bold">
                      {formatGhsFromPesewas(
                        journal.lines.reduce(
                          (sum, line) => sum + line.debitPesewas,
                          0,
                        ),
                      )}
                    </p>
                  </div>
                ))}
                {journals.length === 0 && (
                  <p className="text-muted p-5 text-sm">No linked journals.</p>
                )}
              </div>
            </Card>
          </div>
          <aside className="space-y-6">
            <Card className="p-5 print:break-inside-avoid">
              <h2 className="text-lg font-bold">Early-settlement quote</h2>
              <p className="text-muted text-xs">
                As at {formatAccraDate(quote.quotedAt)} · no interest rebate
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <Row
                  label="Remaining principal"
                  value={formatGhsFromPesewas(quote.remainingPrincipalPesewas)}
                />
                <Row
                  label="All remaining contractual interest"
                  value={formatGhsFromPesewas(quote.remainingInterestPesewas)}
                />
                <Row
                  label="Rebate / waiver / penalty"
                  value={formatGhsFromPesewas(0)}
                />
                <Row
                  label="Settlement amount"
                  value={formatGhsFromPesewas(quote.settlementPesewas)}
                  strong
                />
              </dl>
              <p className="bg-primary/10 text-primary mt-4 rounded-lg p-3 text-xs">
                No rebate, waiver, penalty, or restructuring is applied.
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Frozen guarantee</h2>
              {guarantee ? (
                <>
                  <p className="text-muted mt-1 text-xs">
                    {guarantee.snapshotNumber} · agreement{" "}
                    {guarantee.agreementNumber} v{guarantee.agreementVersion}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {guarantors.map((guarantor) => (
                      <li key={guarantor.id}>
                        {guarantor.legalName} · {guarantor.customerId}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted mt-2 text-sm">
                  No guarantee snapshot.
                </p>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Documents</h2>
              <div className="mt-3 space-y-3">
                {loan.applicationDocuments.map((document) => (
                  <div key={document.id} className="text-sm">
                    <p className="font-bold">
                      {document.type.replaceAll("_", " ")}
                    </p>
                    <p className="text-muted text-xs break-all">
                      {document.reference} · {document.status}
                    </p>
                  </div>
                ))}
                {loan.applicationDocuments.length === 0 && (
                  <p className="text-muted text-sm">No linked documents.</p>
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Lifecycle history</h2>
              <div className="mt-3 space-y-4">
                {loan.applicationEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border-border border-l-2 pl-3 text-sm"
                  >
                    <p className="font-bold">
                      {event.eventType.replaceAll("_", " ")}
                    </p>
                    <p className="text-muted text-xs">
                      {formatAccraDateTime(event.occurredAt)} ·{" "}
                      {event.actor.name}
                    </p>
                    <p className="text-muted mt-1 text-xs">{event.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Metric({
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
      <p className={primary ? "text-white/75" : "text-muted"}>{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}
function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-3 ${strong ? "border-border border-t pt-3 text-base" : ""}`}
    >
      <dt>{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}
