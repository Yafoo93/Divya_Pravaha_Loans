import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatAccraDateTime, formatGhsFromPesewas } from "@/lib/formatters";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { requirePermission } from "@/server/auth/session";
import { LoanReviewDecision } from "../../../../components/loan-review-decision";
import { PageHeading } from "../../../../components/page-heading";
import { Badge, Card, DataTable } from "../../../../components/ui/data-display";

export default async function LoanReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("approve_or_reject_loans", true);
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const application = await db.loan.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { loanNumber: id }] }),
    include: {
      branch: true,
      borrower: {
        include: {
          verifications: { orderBy: { createdAt: "desc" } },
          consentRecords: { orderBy: { recordedAt: "desc" } },
        },
      },
      group: true,
      applicationDocuments: true,
      termsSnapshots: {
        orderBy: { version: "desc" },
        include: {
          createdBy: true,
          guaranteeSnapshot: true,
          decision: { include: { decidedBy: true } },
        },
      },
    },
  });
  if (!application) notFound();
  const snapshot = application.termsSnapshots[0];
  if (!snapshot) notFound();
  const guarantee = snapshot.guaranteeSnapshot;
  const guarantors = guarantee
    ? await db.borrower.findMany({
        where: { id: { in: guarantee.guarantorBorrowerIds } },
        orderBy: { legalName: "asc" },
      })
    : [];
  const reviewable =
    ["SUBMITTED", "UNDER_REVIEW"].includes(application.status) &&
    !snapshot.decision;
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title={`Review ${application.loanNumber}`}
          description="Independent review of frozen borrower evidence, submitted terms, guarantors, and agreement version."
          branchName={application.branch.name}
          date={new Date()}
          currency="GHS"
          actions={
            <Link
              href="/workspace/loan-applications"
              className="border-border rounded-lg border px-4 py-3 text-sm font-bold"
            >
              Back to approval queue
            </Link>
          }
        />
        <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Frozen submitted terms</h2>
                <Badge variant="primary">VERSION {snapshot.version}</Badge>
              </div>
              <p className="text-muted mt-1 text-sm">
                {snapshot.snapshotNumber} · submitted{" "}
                {formatAccraDateTime(snapshot.submittedAt)} by{" "}
                {snapshot.createdBy.name}
              </p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail
                  label="Borrower"
                  value={`${application.borrower.legalName} · ${application.borrower.customerId}`}
                />
                <Detail
                  label="Group"
                  value={`${application.group.name} · ${application.group.groupNumber}`}
                />
                <Detail
                  label="Product"
                  value={`${snapshot.productCode} v${snapshot.productVersion}`}
                />
                <Detail
                  label="Frequency / term"
                  value={`${snapshot.repaymentFrequency} · ${snapshot.termMonths} months`}
                />
                <Detail
                  label="Principal"
                  value={formatGhsFromPesewas(snapshot.principalPesewas)}
                />
                <Detail
                  label="Contractual interest"
                  value={formatGhsFromPesewas(snapshot.contractualInterest)}
                />
                <Detail
                  label="Total repayment"
                  value={formatGhsFromPesewas(snapshot.totalRepayablePesewas)}
                />
                <div className="sm:col-span-2">
                  <Detail
                    label="Business purpose"
                    value={snapshot.businessPurpose}
                  />
                </div>
              </dl>
            </Card>
            <Card className="overflow-hidden">
              <div className="p-5">
                <h2 className="text-lg font-bold">
                  Frozen verified guarantors
                </h2>
                <p className="text-muted text-sm">
                  Agreement {guarantee?.agreementNumber ?? "Missing"} · version{" "}
                  {guarantee?.agreementVersion ?? "—"}
                </p>
              </div>
              <DataTable
                columns={[
                  { key: "name", label: "Guarantor" },
                  { key: "customer", label: "Customer ID" },
                  { key: "status", label: "Frozen eligibility" },
                ]}
                rows={guarantors.map((g) => ({
                  id: g.id,
                  cells: {
                    name: g.legalName,
                    customer: g.customerId,
                    status: (
                      <Badge variant="success">VERIFIED & CONSENTING</Badge>
                    ),
                  },
                }))}
                emptyMessage="No frozen guarantors."
              />
            </Card>
            <Card className="overflow-hidden">
              <div className="p-5">
                <h2 className="text-lg font-bold">Evidence pack</h2>
              </div>
              <DataTable
                columns={[
                  { key: "document", label: "Document" },
                  { key: "reference", label: "Private reference" },
                  { key: "status", label: "Status" },
                ]}
                rows={application.applicationDocuments.map((d) => ({
                  id: d.id,
                  cells: {
                    document: d.type.replaceAll("_", " "),
                    reference: d.reference,
                    status: d.status,
                  },
                }))}
                emptyMessage="No application evidence attached."
              />
            </Card>
          </div>
          <aside className="space-y-6">
            <Card className="p-5">
              <h2 className="font-bold">Borrower checks</h2>
              <Detail
                label="Borrower status"
                value={application.borrower.status}
              />
              <Detail
                label="Latest identity"
                value={
                  application.borrower.verifications[0]?.status ?? "MISSING"
                }
              />
              <Detail
                label="Latest consent"
                value={
                  application.borrower.consentRecords[0]?.status ?? "MISSING"
                }
              />
              <Detail label="Application stage" value={application.status} />
            </Card>
            {reviewable ? (
              <LoanReviewDecision
                applicationId={application.loanNumber}
                ownWork={snapshot.createdByUserId === session.user.id}
              />
            ) : (
              <Card className="p-5">
                <h2 className="font-bold">Decision recorded</h2>
                {snapshot.decision ? (
                  <>
                    <Badge
                      variant={
                        snapshot.decision.status === "APPROVED"
                          ? "success"
                          : "danger"
                      }
                    >
                      {snapshot.decision.status}
                    </Badge>
                    <p className="mt-3 text-sm">{snapshot.decision.reason}</p>
                    <p className="text-muted mt-2 text-xs">
                      {snapshot.decision.decidedBy.name} ·{" "}
                      {formatAccraDateTime(snapshot.decision.decidedAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-muted mt-3 text-sm">
                    This application is not currently reviewable.
                  </p>
                )}
              </Card>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border border-b py-3">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
