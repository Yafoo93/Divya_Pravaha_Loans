import Link from "next/link";
import { db } from "@/lib/db";
import { formatAccraDateTime, formatGhsFromPesewas } from "@/lib/formatters";
import { requirePermission } from "@/server/auth/session";
import { requireBranchScope } from "@/server/auth/branch-scope";

export const instant = false;

export default async function FieldReceiptsPage() {
  const session = await requirePermission("view_assignments");
  const scope = await requireBranchScope(session);
  const receipts = await db.receipt.findMany({
    where: {
      branchId: { in: [...scope.branchIds] },
      ...(session.user.role === "MANAGER"
        ? {}
        : { collectorUserId: session.user.id }),
    },
    include: { borrower: true, loan: true },
    orderBy: { receivedAt: "desc" },
  });
  const total = receipts.reduce(
    (sum, receipt) => sum + receipt.amountPesewas,
    0,
  );
  return (
    <main className="px-4 py-6">
      <p className="text-primary text-[10px] font-bold tracking-wider uppercase">
        Collector receipt register
      </p>
      <h1 className="mt-2 text-2xl font-bold">Receipt history</h1>
      <p className="text-muted mt-2 text-sm">
        {receipts.length} numbered receipts · {formatGhsFromPesewas(total)}
      </p>
      <div className="mt-6 space-y-3">
        {receipts.map((receipt) => (
          <Link
            key={receipt.id}
            href={`/field/receipts/${receipt.id}`}
            className="border-border bg-surface block rounded-2xl border p-4 shadow-sm"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-bold">{receipt.receiptNumber}</p>
                <p className="text-muted mt-1 text-xs">
                  {receipt.borrower.legalName} · {receipt.loan.loanNumber}
                </p>
                <p className="text-muted mt-1 text-xs">
                  {formatAccraDateTime(receipt.receivedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  {formatGhsFromPesewas(receipt.amountPesewas)}
                </p>
                <span className="bg-primary/10 text-primary mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold">
                  {receipt.status}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {receipts.length === 0 && (
          <div className="border-border bg-surface text-muted rounded-2xl border p-8 text-center">
            No receipts issued by this account.
          </div>
        )}
      </div>
    </main>
  );
}
