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
import { LoanTermsResubmission } from "../../../components/loan-terms-resubmission";
import { PageHeading } from "../../../components/page-heading";
import { Badge, Card, DataTable } from "../../../components/ui/data-display";

export default async function LoanApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/loan-applications");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const application = await db.loan.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { loanNumber: id }] }),
    include: {
      branch: true,
      borrower: {
        include: {
          verifications: { orderBy: { createdAt: "desc" }, take: 1 },
          consentRecords: { orderBy: { recordedAt: "desc" }, take: 1 },
        },
      },
      group: {
        include: { snapshots: { orderBy: { capturedAt: "desc" }, take: 1 } },
      },
      submittedBy: true,
      applicationDocuments: { orderBy: { createdAt: "asc" } },
      applicationEvents: {
        orderBy: { occurredAt: "desc" },
        include: { actor: true },
      },
      termsSnapshots: {
        orderBy: { version: "desc" },
        include: { decision: { include: { decidedBy: true } } },
      },
    },
  });
  if (!application) notFound();
  const terms = calculateLoanTerms(
    application.principalPesewas,
    application.termMonths,
    application.repaymentFrequency,
    application.disbursedAt ?? application.createdAt,
  );
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title={application.loanNumber}
          description={`${application.borrower.legalName} · Application terms, evidence, repayment preview, and event history.`}
          branchName={application.branch.name}
          date={new Date()}
          currency="GHS"
          actions={
            <Link
              href="/workspace/loan-applications"
              className="border-border rounded-lg border px-4 py-3 text-sm font-bold"
            >
              Back to queue
            </Link>
          }
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary
            label="Stage"
            value={
              <Badge
                variant={
                  application.status === "APPROVED"
                    ? "success"
                    : application.status === "REJECTED"
                      ? "danger"
                      : "warning"
                }
              >
                {application.status.replaceAll("_", " ")}
              </Badge>
            }
          />
          <Summary
            label="Principal"
            value={formatGhsFromPesewas(application.principalPesewas)}
          />
          <Summary
            label="Interest"
            value={formatGhsFromPesewas(application.contractualInterest)}
          />
          <Summary
            label="Total repayment"
            value={formatGhsFromPesewas(application.totalRepayablePesewas)}
          />
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg font-bold">Submitted application</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail
                  label="Borrower"
                  value={`${application.borrower.legalName} · ${application.borrower.customerId}`}
                />
                <Detail
                  label="Guaranteeing group"
                  value={`${application.group.name} · ${application.group.groupNumber}`}
                />
                <Detail
                  label="Term / frequency"
                  value={`${application.termMonths} months / ${application.repaymentFrequency.toLowerCase()}`}
                />
                <Detail
                  label="Submitted by"
                  value={application.submittedBy?.name ?? "Legacy record"}
                />
                <div className="sm:col-span-2">
                  <Detail
                    label="Business purpose"
                    value={application.businessPurpose}
                  />
                </div>
              </dl>
            </Card>
            <Card className="overflow-hidden">
              <div className="p-5">
                <h2 className="text-lg font-bold">
                  Repayment schedule preview
                </h2>
                <p className="text-muted text-sm">
                  {application.disbursedAt
                    ? "Final schedule anchored to actual cash-out."
                    : "Preview only. Actual cash-out anchors the final contract schedule."}
                </p>
              </div>
              <DataTable
                columns={[
                  { key: "number", label: "Instalment" },
                  { key: "due", label: "Contractual due" },
                  { key: "effective", label: "Collection due" },
                  { key: "principal", label: "Principal" },
                  { key: "interest", label: "Interest" },
                  { key: "amount", label: "Total" },
                ]}
                rows={terms.schedule.map((item) => ({
                  id: String(item.number),
                  cells: {
                    number: String(item.number),
                    due: item.contractualDueDate
                      ? formatAccraDate(item.contractualDueDate)
                      : "Pending cash-out",
                    effective: item.effectiveCollectionDate
                      ? formatAccraDate(item.effectiveCollectionDate)
                      : "Pending cash-out",
                    principal: formatGhsFromPesewas(item.principalPesewas),
                    interest: formatGhsFromPesewas(item.interestPesewas),
                    amount: formatGhsFromPesewas(item.totalPesewas),
                  },
                }))}
              />
            </Card>
            <Card className="overflow-hidden">
              <div className="p-5">
                <h2 className="text-lg font-bold">Application event history</h2>
                <p className="text-muted text-sm">
                  Append-only lifecycle events with actor and reason.
                </p>
              </div>
              <DataTable
                columns={[
                  { key: "time", label: "Time" },
                  { key: "event", label: "Event" },
                  { key: "stage", label: "Stage" },
                  { key: "actor", label: "Actor" },
                  { key: "reason", label: "Reason" },
                ]}
                rows={application.applicationEvents.map((event) => ({
                  id: event.id,
                  cells: {
                    time: formatAccraDateTime(event.occurredAt),
                    event: event.eventType.replaceAll("_", " "),
                    stage: `${event.fromStatus ?? "Created"} → ${event.toStatus}`,
                    actor: event.actor.name,
                    reason: event.reason,
                  },
                }))}
                emptyMessage="No lifecycle events recorded for this legacy application."
              />
            </Card>
          </div>
          <aside className="space-y-6">
            {session.user.permissions.includes("submit_loan_applications") &&
              ["DRAFT", "REJECTED"].includes(application.status) && (
                <LoanTermsResubmission
                  applicationId={application.loanNumber}
                  rejected={application.status === "REJECTED"}
                  initial={{
                    principalGhs: (application.principalPesewas / 100).toFixed(
                      2,
                    ),
                    termMonths: application.termMonths,
                    frequency: application.repaymentFrequency,
                    purpose: application.businessPurpose,
                  }}
                />
              )}
            <Card className="p-5">
              <h2 className="font-bold">Eligibility evidence</h2>
              <dl className="mt-4 divide-y">
                <Detail
                  label="Borrower status"
                  value={application.borrower.status}
                />
                <Detail
                  label="Identity verification"
                  value={
                    application.borrower.verifications[0]?.status ??
                    "NOT RECORDED"
                  }
                />
                <Detail
                  label="Consent"
                  value={
                    application.borrower.consentRecords[0]?.status ??
                    "NOT RECORDED"
                  }
                />
                <Detail
                  label="Guarantee snapshot"
                  value={
                    application.group.snapshots[0]?.snapshotNumber ??
                    "NOT CAPTURED"
                  }
                />
              </dl>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Submitted versions & decisions</h2>
              {application.termsSnapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="border-border mt-3 border-t pt-3 text-sm"
                >
                  <p className="font-bold">
                    Version {snapshot.version} · {snapshot.snapshotNumber}
                  </p>
                  <p className="text-muted">
                    {snapshot.decision
                      ? `${snapshot.decision.status} by ${snapshot.decision.decidedBy.name}`
                      : "Awaiting independent decision"}
                  </p>
                </div>
              ))}
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Private documents</h2>
              {application.applicationDocuments.length ? (
                application.applicationDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="border-border mt-3 border-t pt-3 text-sm"
                  >
                    <p className="font-bold">
                      {document.type.replaceAll("_", " ")}
                    </p>
                    <p className="text-muted">{document.reference}</p>
                    <Badge variant="success">{document.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted mt-3 text-sm">
                  No application documents attached.
                </p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-muted text-sm">{label}</p>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </Card>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
