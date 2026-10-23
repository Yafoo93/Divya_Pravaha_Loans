import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatAccraDateTime, formatGhsFromPesewas } from "@/lib/formatters";
import { requirePermission } from "@/server/auth/session";
import { requireBranchScope } from "@/server/auth/branch-scope";

export const instant = false;

export default async function FieldReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("view_assignments");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const receipt = await db.receipt.findFirst({
    where: {
      branchId: { in: [...scope.branchIds] },
      ...(session.user.role === "MANAGER"
        ? {}
        : { collectorUserId: session.user.id }),
      OR: [{ id }, { receiptNumber: id }],
    },
    include: { borrower: true, loan: true, collector: true },
  });
  if (!receipt) notFound();
  const otherReceipts = await db.receipt.aggregate({
    where: {
      loanId: receipt.loanId,
      status: { not: "REVERSED" },
      id: { not: receipt.id },
    },
    _sum: { amountPesewas: true },
  });
  const remaining = Math.max(
    0,
    receipt.loan.totalRepayablePesewas -
      (otherReceipts._sum.amountPesewas ?? 0) -
      receipt.amountPesewas,
  );
  return (
    <main className="px-4 py-6">
      <section className="border-success/30 bg-success/10 rounded-2xl border p-5">
        <p className="text-success text-sm font-bold">✓ Receipt issued</p>
        <p className="mt-3 font-mono text-sm font-bold">
          {receipt.receiptNumber}
        </p>
        <p className="mt-2 text-3xl font-bold">
          {formatGhsFromPesewas(receipt.amountPesewas)}
        </p>
        <dl className="border-success/20 mt-5 space-y-3 border-t pt-4 text-sm">
          <Row
            label="Borrower / loan"
            value={`${receipt.borrower.legalName} / ${receipt.loan.loanNumber}`}
          />
          <Row
            label="Actual received"
            value={formatAccraDateTime(receipt.receivedAt)}
          />
          <Row label="Issued by" value={receipt.collector.name} />
          <Row
            label="Principal allocated"
            value={formatGhsFromPesewas(receipt.principalAllocatedPesewas)}
          />
          <Row
            label="Interest allocated"
            value={formatGhsFromPesewas(receipt.interestAllocatedPesewas)}
          />
          <Row
            label="Remaining contract balance"
            value={formatGhsFromPesewas(remaining)}
          />
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[10px] font-bold">
            CAPTURED
          </span>
          <span className="bg-warning/10 text-warning rounded-full px-2.5 py-1 text-[10px] font-bold">
            COLLECTOR CUSTODY
          </span>
        </div>
      </section>
      <div className="bg-warning/10 text-warning mt-4 rounded-xl p-4 text-sm">
        This cash is not yet spendable company cash. Submit it through an
        independently verified handover.
      </div>
      <Link
        href="/field/assignments"
        className="border-border bg-surface mt-5 flex min-h-12 items-center justify-center rounded-xl border px-4 font-bold"
      >
        Back to assignments
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
