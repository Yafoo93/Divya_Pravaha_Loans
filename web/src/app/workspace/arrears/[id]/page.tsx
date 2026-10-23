import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { allocateJointLiability, daysPastDue } from "@/lib/arrears-rules";
import {
  formatAccraDate,
  formatAccraDateTime,
  formatGhsFromPesewas,
} from "@/lib/formatters";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import {
  ArrearsDecisionForm,
  CollectContributionButton,
  DisputeForm,
} from "../../../components/arrears-controls";
import { PageHeading } from "../../../components/page-heading";
import { Badge, Card } from "../../../components/ui/data-display";

export const instant = false;
export default async function ArrearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/arrears");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const arrear = await db.arrear.findFirst({
    where: {
      AND: [
        { OR: [{ id }, { assessmentNumber: id }] },
        { loan: { branchId: { in: [...scope.branchIds] } } },
      ],
    },
    include: {
      borrower: true,
      instalment: true,
      guaranteeSnapshot: true,
      notices: { orderBy: { servedAt: "desc" } },
      contributions: {
        include: { guarantor: true, journal: true },
        orderBy: { sequence: "asc" },
      },
      disputes: {
        include: { recordedBy: true, resolvedBy: true },
        orderBy: { recordedAt: "desc" },
      },
      decisions: {
        include: { decidedBy: true },
        orderBy: { decidedAt: "desc" },
      },
      loan: {
        include: {
          branch: true,
          group: true,
        },
      },
    },
  });
  if (!arrear) notFound();
  const snapshot = arrear.guaranteeSnapshot;
  const eligibleIds =
    snapshot?.guarantorBorrowerIds.filter(
      (borrowerId) => borrowerId !== arrear.borrowerId,
    ) ?? [];
  const guarantors = await db.borrower.findMany({
    where: { id: { in: eligibleIds } },
    orderBy: { id: "asc" },
  });
  const preview = eligibleIds.length
    ? allocateJointLiability(arrear.unpaidAmountPesewas, eligibleIds)
    : [];
  const contributionRows = arrear.contributions.length
    ? arrear.contributions.map((item) => ({
        id: item.id,
        guarantor: item.guarantor,
        assessedPesewas: item.assessedPesewas,
        status: item.status,
        journal: item.journal,
      }))
    : preview.map((item) => ({
        id: item.guarantorBorrowerId,
        guarantor: guarantors.find((g) => g.id === item.guarantorBorrowerId)!,
        assessedPesewas: item.assessedPesewas,
        status: "PENDING_APPROVAL",
        journal: null,
      }));
  const canDecide =
    session.user.role === "MANAGER" &&
    session.user.permissions.includes("approve_exceptions") &&
    arrear.status === "PENDING_ASSESSMENT";
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title={`${arrear.assessmentNumber} · ${arrear.borrower.legalName}`}
          description={`${arrear.loan.loanNumber} · ${arrear.loan.group.name} · zero grace`}
          branchName={arrear.loan.branch.name}
          date={new Date()}
          currency="GHS"
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric
            label="Eligible unpaid amount"
            value={formatGhsFromPesewas(arrear.unpaidAmountPesewas)}
          />
          <Metric
            label="Days past due"
            value={String(daysPastDue(arrear.effectiveDueDate, new Date()))}
            primary
          />
          <Metric
            label="Eligible frozen guarantors"
            value={String(eligibleIds.length)}
          />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_23rem]">
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    Frozen assessment calculation
                  </h2>
                  <p className="text-muted text-sm">
                    Snapshot {snapshot?.snapshotNumber ?? "Missing"} · agreement{" "}
                    {snapshot?.agreementNumber ?? "—"}
                  </p>
                </div>
                <Badge
                  variant={
                    arrear.status === "APPROVED"
                      ? "warning"
                      : arrear.status === "RESOLVED"
                        ? "success"
                        : "danger"
                  }
                >
                  {arrear.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="bg-primary/10 text-primary mt-4 rounded-lg p-3 text-sm">
                Equal shares; remainder pesewas go deterministically to
                ascending frozen member IDs. Later membership changes do not
                alter this snapshot.
              </p>
              <div className="mt-4 space-y-3">
                {contributionRows.map((item) => (
                  <div
                    key={item.id}
                    className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  >
                    <div>
                      <p className="font-bold">
                        {item.guarantor?.legalName ?? "Frozen member"}
                      </p>
                      <p className="text-muted text-xs">
                        {item.guarantor?.customerId} ·{" "}
                        {item.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatGhsFromPesewas(item.assessedPesewas)}
                      </p>
                      {arrear.status === "APPROVED" &&
                        item.status === "APPROVED" && (
                          <CollectContributionButton
                            arrearId={arrear.id}
                            contributionId={item.id}
                          />
                        )}
                      {item.journal && (
                        <p className="text-success text-xs">
                          {item.journal.journalNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Notice & dispute record</h2>
              <div className="mt-4 space-y-3">
                {arrear.notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="bg-background rounded-lg p-3 text-sm"
                  >
                    <p className="font-bold">
                      {notice.noticeNumber} ·{" "}
                      {notice.noticeType.replaceAll("_", " ")}
                    </p>
                    <p className="text-muted text-xs">
                      Served {formatAccraDateTime(notice.servedAt)} ·{" "}
                      {notice.documentReference}
                    </p>
                  </div>
                ))}
                {arrear.disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    className="border-danger/20 border-l-2 pl-3 text-sm"
                  >
                    <p className="font-bold">
                      {dispute.disputeNumber} · {dispute.status}
                    </p>
                    <p>{dispute.complaint}</p>
                    {dispute.resolution && (
                      <p className="text-success mt-1">
                        Resolution: {dispute.resolution}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Manager decisions</h2>
              <div className="mt-3 space-y-3">
                {arrear.decisions.map((decision) => (
                  <div key={decision.id} className="text-sm">
                    <p className="font-bold">
                      {decision.status} · {decision.decidedBy.name}
                    </p>
                    <p className="text-muted text-xs">
                      {formatAccraDateTime(decision.decidedAt)} ·{" "}
                      {decision.reason}
                    </p>
                  </div>
                ))}
                {arrear.decisions.length === 0 && (
                  <p className="text-muted text-sm">No decision recorded.</p>
                )}
              </div>
            </Card>
          </div>
          <aside className="space-y-5">
            {canDecide && (
              <Card className="p-5">
                <h2 className="mb-4 font-bold">Manager authorization</h2>
                <ArrearsDecisionForm id={arrear.id} />
              </Card>
            )}
            <Card className="p-5">
              <h2 className="mb-4 font-bold">Record a dispute</h2>
              <DisputeForm id={arrear.id} />
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Accounting boundary</h2>
              <p className="text-muted mt-2 text-sm">
                Collected contributions credit the original borrower’s principal
                and interest receivables. They create no new income, loan, or
                reimbursement claim for a guarantor.
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Effective due date</h2>
              <p className="mt-2 font-bold">
                {formatAccraDate(arrear.effectiveDueDate)}
              </p>
              <p className="text-muted mt-1 text-xs">
                Arrears began the following calendar day. Grace period: 0 days.
              </p>
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
