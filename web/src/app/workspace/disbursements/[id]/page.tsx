import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { calculateLoanTerms } from "@/lib/loan-application";
import {
  formatAccraDate,
  formatAccraDateTime,
  formatGhsFromPesewas,
} from "@/lib/formatters";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { CashReleaseForm } from "../../../components/cash-release-form";
import { PageHeading } from "../../../components/page-heading";
import { Badge, Card } from "../../../components/ui/data-display";

// Authenticated session and record data are request-bound.
export const instant = false;

export default async function DisbursementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/disbursements");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const loan = await db.loan.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { loanNumber: id }] }),
    include: {
      branch: true,
      borrower: true,
      applicationDocuments: true,
      decisions: {
        include: { decidedBy: true },
        orderBy: { decidedAt: "desc" },
        take: 1,
      },
      fundingReservations: {
        include: { fundLot: true },
        orderBy: { reservedAt: "desc" },
        take: 1,
      },
      disbursement: {
        include: {
          voucher: true,
          journal: true,
          preparedBy: true,
          authorizedBy: true,
        },
      },
      repaymentInstalments: { orderBy: { instalmentNumber: "asc" } },
    },
  });
  if (!loan) notFound();
  const reservation = loan.fundingReservations[0];
  const decision = loan.decisions[0];
  const contract = loan.applicationDocuments.find(
    (document) =>
      document.type === "SIGNED_CONTRACT" && document.status === "VERIFIED",
  );
  const preview = calculateLoanTerms(
    loan.principalPesewas,
    loan.termMonths,
    loan.repaymentFrequency,
    loan.disbursement?.actualCashOutAt,
  );
  const canRelease = session.user.permissions.some((permission) =>
    ["approve_disbursements", "post_reconciled_receipts"].includes(permission),
  );
  const isIndependentReleaser =
    Boolean(decision) && decision.decidedByUserId !== session.user.id;
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title={`Cash release · ${loan.loanNumber}`}
          description={`${loan.borrower.legalName} · Controlled disbursement evidence and final schedule.`}
          branchName={loan.branch.name}
          date={new Date()}
          currency="GHS"
          actions={
            <Link
              href="/workspace/disbursements"
              className="border-border rounded-lg border px-4 py-3 text-sm font-bold"
            >
              Back to queue
            </Link>
          }
        />
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Summary
            label="Release amount"
            value={formatGhsFromPesewas(loan.principalPesewas)}
            primary
          />
          <Summary
            label="Reservation"
            value={reservation?.reservationNumber ?? "MISSING"}
          />
          <Summary
            label="State"
            value={
              loan.disbursement ? "RELEASED" : loan.status.replaceAll("_", " ")
            }
          />
        </section>
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_22rem]">
          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg font-bold">
                Beneficiary and release controls
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail
                  label="Beneficiary"
                  value={`${loan.borrower.legalName} · ${loan.borrower.customerId}`}
                />
                <Detail
                  label="Identity"
                  value={
                    loan.disbursement?.identityConfirmed
                      ? "CONFIRMED"
                      : loan.borrower.ghanaCardVerified
                        ? "VERIFIED · confirm at cash-out"
                        : "NOT VERIFIED"
                  }
                />
                <Detail
                  label="Funding reservation"
                  value={
                    reservation
                      ? `${reservation.reservationNumber} · ${reservation.status}`
                      : "MISSING"
                  }
                />
                <Detail
                  label="Source lot"
                  value={reservation?.fundLot.lotNumber ?? "MISSING"}
                />
                <Detail
                  label="Signed contract"
                  value={contract?.reference ?? "MISSING"}
                />
                <Detail
                  label="Manager authorization"
                  value={
                    decision
                      ? `${decision.decisionNumber} · ${decision.decidedBy.name}`
                      : "MISSING"
                  }
                />
              </dl>
            </Card>
            <Card className="overflow-hidden">
              <div className="border-border border-b p-5">
                <h2 className="text-lg font-bold">
                  Repayment schedule{" "}
                  {loan.disbursement ? "· final" : "· preview"}
                </h2>
                <p className="text-muted text-sm">
                  {loan.disbursement
                    ? `Anchored to actual physical cash-out ${formatAccraDateTime(loan.disbursement.actualCashOutAt)}.`
                    : "Dates remain provisional until actual physical cash-out."}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-3xl text-left text-sm">
                  <thead className="bg-background text-muted text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Contractual due</th>
                      <th className="px-5 py-3">Effective due</th>
                      <th className="px-5 py-3 text-right">Principal</th>
                      <th className="px-5 py-3 text-right">Interest</th>
                      <th className="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {preview.schedule.map((item) => (
                      <tr key={item.number}>
                        <td className="px-5 py-3">{item.number}</td>
                        <td className="px-5 py-3">
                          {item.contractualDueDate
                            ? formatAccraDate(item.contractualDueDate)
                            : "Pending"}
                        </td>
                        <td className="px-5 py-3">
                          {item.effectiveCollectionDate
                            ? formatAccraDate(item.effectiveCollectionDate)
                            : "Pending"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {formatGhsFromPesewas(item.principalPesewas)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {formatGhsFromPesewas(item.interestPesewas)}
                        </td>
                        <td className="px-5 py-3 text-right font-bold">
                          {formatGhsFromPesewas(item.totalPesewas)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <aside>
            <Card className="p-5">
              {loan.disbursement ? (
                <>
                  <Badge variant="success">RELEASE POSTED</Badge>
                  <h2 className="mt-3 text-2xl font-bold">
                    {loan.disbursement.disbursementNumber}
                  </h2>
                  <dl className="mt-4 space-y-3">
                    <Detail
                      label="Actual cash-out"
                      value={formatAccraDateTime(
                        loan.disbursement.actualCashOutAt,
                      )}
                    />
                    <Detail
                      label="Voucher"
                      value={loan.disbursement.voucher?.voucherNumber ?? "—"}
                    />
                    <Detail
                      label="Journal"
                      value={loan.disbursement.journal.journalNumber}
                    />
                    <Detail
                      label="Prepared by"
                      value={loan.disbursement.preparedBy.name}
                    />
                    <Detail
                      label="Authorized by"
                      value={loan.disbursement.authorizedBy.name}
                    />
                  </dl>
                </>
              ) : canRelease && reservation && isIndependentReleaser ? (
                <>
                  <h2 className="text-lg font-bold">Record physical release</h2>
                  <p className="text-muted mt-1 mb-4 text-sm">
                    All records are committed in one database transaction.
                  </p>
                  <CashReleaseForm
                    loanId={loan.id}
                    reservationId={reservation.id}
                    borrowerId={loan.borrowerId}
                    voucherNumber={`CV-${loan.loanNumber}`}
                  />
                </>
              ) : !isIndependentReleaser && decision ? (
                <div className="bg-warning/10 text-warning rounded-lg p-4 text-sm">
                  <p className="font-bold">Independent release required</p>
                  <p className="mt-1">
                    {decision.decidedBy.name} approved this loan and cannot also
                    record its cash release. Sign in as the other Manager or the
                    Cashier/Accountant.
                  </p>
                </div>
              ) : (
                <p className="text-muted">
                  Release controls are incomplete or you do not have permission.
                </p>
              )}
            </Card>
          </aside>
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
  value: string;
  primary?: boolean;
}) {
  return (
    <Card className={`p-5 ${primary ? "bg-primary text-white" : ""}`}>
      <p className={primary ? "text-white/80" : "text-muted"}>{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </Card>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-semibold uppercase">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
