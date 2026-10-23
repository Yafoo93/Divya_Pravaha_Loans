import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatAccraDateTime, formatGhsFromPesewas } from "@/lib/formatters";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../../components/page-heading";
import { Badge, Card } from "../../../components/ui/data-display";

export const instant = false;

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/cash-collections");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const receipt = await db.receipt.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { receiptNumber: id }] }),
    include: {
      borrower: true,
      loan: true,
      collector: true,
      payment: {
        include: {
          allocations: {
            include: { instalment: true },
            orderBy: { sequence: "asc" },
          },
          custodyMovement: true,
        },
      },
      handoverLinks: {
        include: { handover: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!receipt) notFound();
  const received = await db.receipt.aggregate({
    where: { loanId: receipt.loanId, status: { not: "REVERSED" } },
    _sum: { amountPesewas: true },
  });
  const balance = Math.max(
    0,
    receipt.loan.totalRepayablePesewas - (received._sum.amountPesewas ?? 0),
  );
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <PageHeading
          title={`Receipt ${receipt.receiptNumber}`}
          description="Immutable payment allocation and cash-custody trace."
          branchName={scope.branches.map((branch) => branch.name).join(", ")}
          date={receipt.receivedAt}
          currency="GHS"
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Card className="p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-muted text-sm">Borrower / loan</p>
                <p className="font-bold">
                  {receipt.borrower.legalName} · {receipt.loan.loanNumber}
                </p>
              </div>
              <Badge
                variant={receipt.status === "POSTED" ? "success" : "warning"}
              >
                {receipt.status}
              </Badge>
            </div>
            <dl className="border-border mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
              <Item
                label="Amount"
                value={formatGhsFromPesewas(receipt.amountPesewas)}
              />
              <Item
                label="Principal"
                value={formatGhsFromPesewas(receipt.principalAllocatedPesewas)}
              />
              <Item
                label="Interest"
                value={formatGhsFromPesewas(receipt.interestAllocatedPesewas)}
              />
              <Item
                label="Remaining balance"
                value={formatGhsFromPesewas(balance)}
              />
              <Item label="Collector" value={receipt.collector.name} />
              <Item
                label="Received"
                value={formatAccraDateTime(receipt.receivedAt)}
              />
            </dl>
            <h2 className="mt-7 font-bold">Schedule allocation</h2>
            <div className="mt-3 space-y-2">
              {receipt.payment?.allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="bg-background flex justify-between rounded-lg p-3 text-sm"
                >
                  <span>
                    Instalment {allocation.instalment.instalmentNumber}
                  </span>
                  <span className="font-bold">
                    {formatGhsFromPesewas(allocation.amountPesewas)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="font-bold">Custody</h2>
              <p className="text-muted mt-2 text-sm">
                {receipt.payment?.custodyMovement
                  ? `${formatGhsFromPesewas(receipt.payment.custodyMovement.amountPesewas)} entered collector custody.`
                  : "No custody movement linked."}
              </p>
              {receipt.handoverLinks[0] && (
                <Link
                  className="text-primary mt-4 inline-block font-bold"
                  href={`/workspace/handovers/${receipt.handoverLinks[0].handover.id}`}
                >
                  View {receipt.handoverLinks[0].handover.handoverNumber} →
                </Link>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Correction controls</h2>
              <p className="text-muted mt-2 text-sm">
                Posted receipts cannot be edited. Corrections use an authorized
                linked reversal.
              </p>
              <Link
                className="text-primary mt-4 inline-block font-bold"
                href="/workspace/accounting"
              >
                Open reversals & exceptions →
              </Link>
            </Card>
          </div>
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
