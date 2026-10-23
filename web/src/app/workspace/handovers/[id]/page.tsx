import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatAccraDateTime, formatGhsFromPesewas } from "@/lib/formatters";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../../components/page-heading";
import {
  HandoverReconciliationForm,
  PostHandoverButton,
} from "../../../components/handover-reconciliation-form";
import { Badge, Card } from "../../../components/ui/data-display";

export const instant = false;

export default async function HandoverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/handovers");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const handover = await db.handover.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { handoverNumber: id }] }),
    include: {
      branch: true,
      collector: true,
      checker: true,
      reconciliation: true,
      denominationCounts: { orderBy: { denominationPesewas: "desc" } },
      exceptions: true,
      journal: true,
      receipts: {
        where: { active: true },
        include: { receipt: { include: { borrower: true, loan: true } } },
      },
    },
  });
  if (!handover) notFound();
  const independent = session.user.id !== handover.collectorUserId;
  const canVerify =
    independent &&
    session.user.permissions.includes("verify_cash_handovers") &&
    handover.status === "SUBMITTED";
  const canPost =
    independent &&
    session.user.permissions.includes("post_reconciled_receipts") &&
    handover.status === "VERIFIED" &&
    handover.reconciliation?.status === "BALANCED";
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title={handover.handoverNumber}
          description="Receipt custody, physical count, independent verification, and posting evidence."
          branchName={handover.branch.name}
          date={handover.submittedAt ?? handover.createdAt}
          currency="GHS"
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_23rem]">
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-muted text-sm">Submitted by</p>
                  <p className="font-bold">{handover.collector.name}</p>
                </div>
                <Badge
                  variant={
                    handover.status === "POSTED"
                      ? "success"
                      : handover.reconciliation?.status === "EXCEPTION"
                        ? "danger"
                        : "warning"
                  }
                >
                  {handover.status}
                </Badge>
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <Item
                  label="Expected"
                  value={formatGhsFromPesewas(handover.expectedPesewas)}
                />
                <Item
                  label="Counted"
                  value={
                    handover.countedPesewas == null
                      ? "Not counted"
                      : formatGhsFromPesewas(handover.countedPesewas)
                  }
                />
                <Item
                  label="Variance"
                  value={formatGhsFromPesewas(handover.variancePesewas ?? 0)}
                />
              </dl>
            </Card>
            <Card className="overflow-hidden">
              <div className="border-border border-b p-5">
                <h2 className="font-bold">Receipt batch</h2>
              </div>
              <div className="divide-border divide-y">
                {handover.receipts.map(({ receipt }) => (
                  <div
                    key={receipt.id}
                    className="flex justify-between gap-4 p-4 text-sm"
                  >
                    <div>
                      <p className="font-bold">{receipt.receiptNumber}</p>
                      <p className="text-muted text-xs">
                        {receipt.borrower.legalName} · {receipt.loan.loanNumber}
                      </p>
                    </div>
                    <p className="font-bold">
                      {formatGhsFromPesewas(receipt.amountPesewas)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
            {handover.reconciliation && (
              <Card className="p-5">
                <h2 className="font-bold">Reconciliation evidence</h2>
                <p className="text-muted mt-2 text-sm">
                  {handover.reconciliation.note}
                </p>
                <p className="mt-3 text-sm">
                  Checked by <strong>{handover.checker?.name}</strong> ·{" "}
                  {formatAccraDateTime(handover.reconciliation.checkedAt)}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {handover.denominationCounts.map((count) => (
                    <div
                      key={count.id}
                      className="bg-background rounded-lg p-3 text-sm"
                    >
                      <span>
                        {formatGhsFromPesewas(count.denominationPesewas)} ×{" "}
                        {count.quantity}
                      </span>
                      <strong className="float-right">
                        {formatGhsFromPesewas(count.countedPesewas)}
                      </strong>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
          <aside className="space-y-5">
            {!independent && (
              <Card className="bg-warning/10 p-5">
                <h2 className="text-warning font-bold">
                  Independent checker required
                </h2>
                <p className="text-muted mt-2 text-sm">
                  The collector who submitted this batch cannot verify or post
                  it.
                </p>
              </Card>
            )}
            {canVerify && (
              <Card className="p-5">
                <h2 className="mb-4 font-bold">Independent physical count</h2>
                <HandoverReconciliationForm
                  handoverId={handover.id}
                  expectedPesewas={handover.expectedPesewas}
                />
              </Card>
            )}
            {handover.exceptions.length > 0 && (
              <Card className="border-danger/30 bg-danger/5 p-5">
                <h2 className="text-danger font-bold">Open discrepancy</h2>
                {handover.exceptions.map((item) => (
                  <div key={item.id} className="mt-3 text-sm">
                    <p className="font-bold">
                      {item.type.replaceAll("_", " ")} ·{" "}
                      {formatGhsFromPesewas(item.amountPesewas)}
                    </p>
                    <p className="text-muted mt-1">{item.notes}</p>
                  </div>
                ))}
                <p className="text-muted mt-4 text-xs">
                  Posting remains blocked until a separately controlled
                  resolution is recorded.
                </p>
              </Card>
            )}
            {canPost && (
              <Card className="p-5">
                <h2 className="font-bold">Post custody transfer</h2>
                <p className="text-muted my-3 text-sm">
                  Moves verified cash from collector custody to company cash.
                  Borrower debt is not changed again.
                </p>
                <PostHandoverButton handoverId={handover.id} />
              </Card>
            )}
            {handover.journal && (
              <Card className="p-5">
                <h2 className="font-bold">Posted evidence</h2>
                <p className="text-success mt-2 text-sm font-bold">
                  {handover.journal.journalNumber}
                </p>
                <p className="text-muted mt-2 text-xs">
                  Debit 1000 Cash on Hand · Credit 1010 Collector Cash Custody
                </p>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-bold uppercase">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
