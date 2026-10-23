import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { maskGhanaCard } from "@/lib/borrower-directory";
import { db } from "@/lib/db";
import {
  formatAccraDate,
  formatAccraDateTime,
  formatGhsFromPesewas,
} from "@/lib/formatters";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../../components/page-heading";
import { BorrowerRestrictionWorkflow } from "../../../components/borrower-restriction-workflow";
import { BorrowerEditForm } from "../../../components/borrower-edit-form";
import { PrivateDocumentAccess } from "../../../components/private-document-access";
import {
  Badge,
  Card,
  DataTable,
  type TableRow,
} from "../../../components/ui/data-display";

function readable(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const loanVariant = {
  DRAFT: "primary",
  SUBMITTED: "warning",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  AWAITING_DISBURSEMENT: "warning",
  ACTIVE: "success",
  CLOSED: "neutral",
  CANCELLED: "neutral",
} as const;

export default async function BorrowerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/borrowers");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const borrower = await db.borrower.findFirst({
    where: andBranchScope(scope, {
      OR: [{ id }, { customerId: id }],
    }),
    include: {
      branch: true,
      memberships: {
        orderBy: { joinedAt: "desc" },
        include: { group: true },
      },
      loans: {
        orderBy: { createdAt: "desc" },
        include: { group: true },
      },
      receipts: {
        orderBy: { receivedAt: "desc" },
        include: { loan: { select: { loanNumber: true } } },
      },
      arrears: {
        orderBy: { effectiveDueDate: "desc" },
        include: { loan: { select: { loanNumber: true } } },
      },
      restrictions: {
        orderBy: { createdAt: "desc" },
        include: {
          restrictedBy: { select: { name: true } },
          decisions: {
            orderBy: { createdAt: "desc" },
            include: {
              requestedBy: { select: { name: true } },
              decidedBy: { select: { name: true } },
            },
          },
        },
      },
      verifications: {
        orderBy: { createdAt: "desc" },
        include: { verifiedBy: { select: { name: true } } },
      },
      consentRecords: { orderBy: { recordedAt: "desc" } },
      businessAssessments: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!borrower) notFound();

  const totalReceived = borrower.receipts.reduce(
    (total, receipt) => total + receipt.amountPesewas,
    0,
  );
  const unresolvedArrears = borrower.arrears.filter(
    (arrear) => arrear.status !== "RESOLVED",
  );
  const unpaidAmount = unresolvedArrears.reduce(
    (total, arrear) => total + arrear.unpaidAmountPesewas,
    0,
  );
  const canManageBorrower = canPerformPermission(
    session.user.permissions,
    session.user.restrictions,
    "manage_borrower_drafts",
    session.user.featureGate,
    true,
    session.user.role,
  );

  const history = [
    {
      id: `borrower-${borrower.id}`,
      date: borrower.createdAt,
      event: "Borrower record created",
      reference: borrower.customerId,
      detail: `Profile opened at ${borrower.branch.name}.`,
    },
    ...borrower.memberships.flatMap((membership) => [
      {
        id: `membership-${membership.id}`,
        date: membership.joinedAt,
        event: "Group membership started",
        reference: membership.group.groupNumber,
        detail: `${membership.group.name} - ${readable(membership.status)} membership.`,
      },
      ...(membership.exitedAt
        ? [
            {
              id: `membership-exit-${membership.id}`,
              date: membership.exitedAt,
              event: "Group membership ended",
              reference: membership.group.groupNumber,
              detail: `${membership.group.name} membership exited.`,
            },
          ]
        : []),
    ]),
    ...borrower.loans.map((loan) => ({
      id: `loan-${loan.id}`,
      date: loan.disbursedAt ?? loan.createdAt,
      event: loan.disbursedAt ? "Loan disbursed" : "Loan created",
      reference: loan.loanNumber,
      detail: `${formatGhsFromPesewas(loan.principalPesewas)} - ${readable(loan.status)}.`,
    })),
    ...borrower.receipts.map((receipt) => ({
      id: `receipt-${receipt.id}`,
      date: receipt.receivedAt,
      event: "Cash receipt recorded",
      reference: receipt.receiptNumber,
      detail: `${formatGhsFromPesewas(receipt.amountPesewas)} for ${receipt.loan.loanNumber} - ${readable(receipt.status)}.`,
    })),
    ...borrower.arrears.map((arrear) => ({
      id: `arrear-${arrear.id}`,
      date: arrear.effectiveDueDate,
      event: "Arrears assessment",
      reference: arrear.assessmentNumber,
      detail: `${arrear.daysPastDue} days past due on ${arrear.loan.loanNumber} - ${readable(arrear.status)}.`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const membershipRows: TableRow[] = borrower.memberships.map((membership) => ({
    id: membership.id,
    cells: {
      group: (
        <div>
          <p className="font-bold">{membership.group.name}</p>
          <p className="text-muted text-xs">{membership.group.groupNumber}</p>
        </div>
      ),
      status: (
        <Badge variant={membership.status === "ACTIVE" ? "success" : "neutral"}>
          {membership.status}
        </Badge>
      ),
      period: (
        <span>
          {formatAccraDate(membership.joinedAt)} -{" "}
          {membership.exitedAt
            ? formatAccraDate(membership.exitedAt)
            : "Current"}
        </span>
      ),
      consent: membership.hasConsented ? "Recorded" : "Missing",
      agreement: membership.group.jointLiabilityReference,
    },
  }));

  const loanRows: TableRow[] = borrower.loans.map((loan) => ({
    id: loan.id,
    cells: {
      loan: (
        <div>
          <p className="font-bold">{loan.loanNumber}</p>
          <p className="text-muted text-xs">{loan.group.name}</p>
        </div>
      ),
      principal: formatGhsFromPesewas(loan.principalPesewas),
      repayment: (
        <span>
          {formatGhsFromPesewas(loan.totalRepayablePesewas)}
          <span className="text-muted block text-xs">
            {loan.termMonths} months / {readable(loan.repaymentFrequency)}
          </span>
        </span>
      ),
      disbursed: loan.disbursedAt
        ? formatAccraDate(loan.disbursedAt)
        : "Not disbursed",
      status: (
        <Badge variant={loanVariant[loan.status]}>
          {readable(loan.status)}
        </Badge>
      ),
    },
  }));

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title={borrower.legalName}
          description={`${borrower.customerId} - Borrower profile, evidence references, obligations, and activity history.`}
          branchName={borrower.branch.name}
          date={new Date()}
          currency="GHS"
          actions={
            <Link
              href="/workspace/borrowers"
              className="border-border bg-surface hover:bg-background inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-bold"
            >
              Back to borrowers
            </Link>
          }
        />

        <section
          className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Borrower summary"
        >
          <SummaryCard label="Borrower status">
            <Badge
              variant={borrower.status === "ACTIVE" ? "success" : "danger"}
            >
              {borrower.status}
            </Badge>
          </SummaryCard>
          <SummaryCard label="Identity">
            <p className="text-xl font-bold">
              {borrower.verifications[0]
                ? readable(borrower.verifications[0].status)
                : "Not recorded"}
            </p>
          </SummaryCard>
          <SummaryCard label="Loans">
            <p className="text-xl font-bold">{borrower.loans.length}</p>
          </SummaryCard>
          <SummaryCard label="Receipts issued">
            <p className="text-xl font-bold">
              {formatGhsFromPesewas(totalReceived)}
            </p>
          </SummaryCard>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.85fr)]">
          <div className="space-y-6">
            <Card className="p-5">
              <SectionHeading
                title="Borrower profile"
                description="Identity, contact, business, and branch information."
              />
              <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Detail label="Legal name" value={borrower.legalName} />
                <Detail label="Customer ID" value={borrower.customerId} />
                <Detail label="Phone" value={borrower.phone} />
                <Detail
                  label="Ghana Card"
                  value={maskGhanaCard(borrower.ghanaCardNumber)}
                  mono
                />
                <Detail
                  label="Residential address"
                  value={borrower.residentialAddress}
                />
                <Detail
                  label="Branch"
                  value={`${borrower.branch.name} (${borrower.branch.code})`}
                />
                <div className="sm:col-span-2">
                  <Detail
                    label="Business details"
                    value={borrower.businessDetails}
                  />
                </div>
                <Detail
                  label="Latest business assessment"
                  value={
                    borrower.businessAssessments[0]
                      ? `${borrower.businessAssessments[0].assessmentNumber} - ${readable(borrower.businessAssessments[0].status)}`
                      : "Not assessed"
                  }
                />
                <Detail
                  label="Consent record"
                  value={
                    borrower.consentRecords[0]
                      ? `${borrower.consentRecords[0].consentNumber} - ${readable(borrower.consentRecords[0].status)}`
                      : "Not recorded"
                  }
                />
              </dl>
              {canManageBorrower && (
                <BorrowerEditForm
                  borrowerId={borrower.customerId}
                  initial={{
                    legalName: borrower.legalName,
                    phone: borrower.phone,
                    residentialAddress: borrower.residentialAddress,
                    businessDetails: borrower.businessDetails,
                  }}
                />
              )}
            </Card>

            <TableCard
              title="Group membership"
              description="Current and historical memberships are retained."
              columns={[
                { key: "group", label: "Group" },
                { key: "status", label: "Status" },
                { key: "period", label: "Effective period" },
                { key: "consent", label: "Consent" },
                { key: "agreement", label: "Joint-liability reference" },
              ]}
              rows={membershipRows}
              emptyMessage="No group memberships recorded."
            />

            <TableCard
              title="Loans"
              description="The borrower's complete loan record in this branch."
              columns={[
                { key: "loan", label: "Loan / group" },
                { key: "principal", label: "Principal" },
                { key: "repayment", label: "Contract repayment" },
                { key: "disbursed", label: "Disbursed" },
                { key: "status", label: "Status" },
              ]}
              rows={loanRows}
              emptyMessage="No loans recorded."
            />

            <TableCard
              title="Activity history"
              description="Chronological events derived from immutable operational records."
              columns={[
                { key: "date", label: "Date" },
                { key: "event", label: "Event" },
                { key: "reference", label: "Reference" },
                { key: "detail", label: "Details" },
              ]}
              rows={history.map((item) => ({
                id: item.id,
                cells: {
                  date: formatAccraDateTime(item.date),
                  event: <span className="font-semibold">{item.event}</span>,
                  reference: (
                    <span className="font-mono text-xs">{item.reference}</span>
                  ),
                  detail: item.detail,
                },
              }))}
              emptyMessage="No activity recorded."
            />
          </div>

          <aside className="space-y-6">
            <BorrowerRestrictionWorkflow
              borrowerId={borrower.customerId}
              borrowerStatus={borrower.status}
              canManage={canManageBorrower}
              canApprove={canPerformPermission(
                session.user.permissions,
                session.user.restrictions,
                "approve_exceptions",
                session.user.featureGate,
                true,
                session.user.role,
              )}
              currentUserId={session.user.id}
              records={borrower.restrictions.map((restriction) => ({
                id: restriction.id,
                restrictionNumber: restriction.restrictionNumber,
                reason: restriction.reason,
                status: restriction.status,
                restrictedAt: restriction.restrictedAt.toISOString(),
                restrictedBy: restriction.restrictedBy.name,
                decisions: restriction.decisions.map((decision) => ({
                  id: decision.id,
                  decisionNumber: decision.decisionNumber,
                  requestReason: decision.requestReason,
                  status: decision.status,
                  requestedAt: decision.requestedAt.toISOString(),
                  requestedBy: decision.requestedBy.name,
                  requestedByUserId: decision.requestedByUserId,
                  decisionReason: decision.decisionReason,
                  decidedAt: decision.decidedAt?.toISOString() ?? null,
                  decidedBy: decision.decidedBy?.name ?? null,
                })),
              }))}
            />

            <Card className="p-5">
              <SectionHeading
                title="Private documents"
                description="Evidence references only; identifiers remain masked."
              />
              <div className="divide-border mt-4 divide-y">
                {borrower.verifications.map((verification) => (
                  <DocumentRow
                    key={verification.id}
                    title={`${readable(verification.type)} verification`}
                    reference={verification.verificationNumber}
                    status={verification.status}
                    verified={verification.status === "VERIFIED"}
                  />
                ))}
                {borrower.documents.map((document) => (
                  <DocumentRow
                    key={document.id}
                    title={readable(document.type)}
                    reference={document.documentNumber}
                    status={document.status}
                    verified={document.status === "VERIFIED"}
                    documentId={document.id}
                  />
                ))}
                {borrower.verifications.length === 0 &&
                  borrower.documents.length === 0 && (
                    <p className="text-muted py-4 text-sm">
                      No evidence records found.
                    </p>
                  )}
              </div>
              <p className="text-muted mt-4 text-xs">
                This screen shows evidence references, not public document URLs.
              </p>
            </Card>

            <Card className="p-5">
              <SectionHeading
                title="Restrictions & arrears"
                description="Controls that affect new lending and collections."
              />
              <div
                className={`mt-4 rounded-lg border p-4 ${borrower.status === "RESTRICTED" ? "border-danger/30 bg-danger/5" : "border-success/30 bg-success/5"}`}
              >
                <Badge
                  variant={
                    borrower.status === "RESTRICTED" ? "danger" : "success"
                  }
                >
                  {borrower.status === "RESTRICTED"
                    ? "RESTRICTED"
                    : "NO ACTIVE RESTRICTION"}
                </Badge>
                <p className="mt-3 text-sm">
                  {borrower.status === "RESTRICTED"
                    ? "New memberships and loan applications are blocked until an authorized manager resolves the restriction."
                    : "The borrower is currently eligible for normal workflow checks."}
                </p>
              </div>
              <dl className="divide-border mt-4 divide-y">
                <InlineDetail
                  label="Unresolved assessments"
                  value={String(unresolvedArrears.length)}
                />
                <InlineDetail
                  label="Unpaid exposure"
                  value={formatGhsFromPesewas(unpaidAmount)}
                />
              </dl>
              {unresolvedArrears.length > 0 && (
                <div className="mt-4 space-y-3">
                  {unresolvedArrears.map((arrear) => (
                    <div
                      key={arrear.id}
                      className="border-border rounded-lg border p-3 text-sm"
                    >
                      <p className="font-bold">{arrear.assessmentNumber}</p>
                      <p className="text-muted mt-1">
                        {arrear.loan.loanNumber} - {arrear.daysPastDue} days
                        past due
                      </p>
                      <p className="mt-2 font-semibold">
                        {formatGhsFromPesewas(arrear.unpaidAmountPesewas)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <SectionHeading
                title="Record information"
                description="System provenance for this profile."
              />
              <dl className="divide-border mt-4 divide-y">
                <InlineDetail
                  label="Created"
                  value={formatAccraDateTime(borrower.createdAt)}
                />
                <InlineDetail
                  label="Last updated"
                  value={formatAccraDateTime(borrower.updatedAt)}
                />
                <InlineDetail
                  label="Data classification"
                  value={
                    borrower.isSampleData ? "Sample data" : "Operational data"
                  }
                />
              </dl>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <p className="text-muted mb-2 text-sm">{label}</p>
      {children}
    </Card>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-muted mt-1 text-sm">{description}</p>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted text-xs font-bold tracking-wide uppercase">
        {label}
      </dt>
      <dd className={`mt-1 text-sm font-semibold ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function InlineDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function DocumentRow({
  title,
  reference,
  status,
  verified,
  documentId,
}: {
  title: string;
  reference: string;
  status: string;
  verified: boolean;
  documentId?: string;
}) {
  return (
    <div className="py-4 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <Badge variant={verified ? "success" : "warning"}>{status}</Badge>
      </div>
      <p className="text-muted mt-2 font-mono text-xs break-all">{reference}</p>
      {documentId && <PrivateDocumentAccess documentId={documentId} />}
    </div>
  );
}

function TableCard({
  title,
  description,
  columns,
  rows,
  emptyMessage,
}: {
  title: string;
  description: string;
  columns: { key: string; label: string }[];
  rows: TableRow[];
  emptyMessage: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-border border-b p-5">
        <SectionHeading title={title} description={description} />
      </div>
      <DataTable columns={columns} rows={rows} emptyMessage={emptyMessage} />
    </Card>
  );
}
