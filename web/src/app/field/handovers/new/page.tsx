import { db } from "@/lib/db";
import { formatGhsFromPesewas } from "@/lib/formatters";
import { requirePermission } from "@/server/auth/session";
import { HandoverBatchForm } from "../../../components/handover-batch-form";

export const instant = false;

export default async function NewHandoverPage() {
  const session = await requirePermission("submit_cash_handovers", true);
  const receipts = await db.receipt.findMany({
    where: {
      collectorUserId: session.user.id,
      status: "CAPTURED",
      handoverLinks: { none: { active: true } },
    },
    include: { borrower: true },
    orderBy: { receivedAt: "asc" },
  });
  return (
    <main className="px-4 py-6">
      <p className="text-primary text-[10px] font-bold tracking-wider uppercase">
        Collector custody · cash only
      </p>
      <h1 className="mt-2 text-2xl font-bold">Prepare cash handover</h1>
      <p className="text-muted mt-2 text-sm">
        Select captured receipts for independent counting. Available:{" "}
        {formatGhsFromPesewas(
          receipts.reduce((sum, receipt) => sum + receipt.amountPesewas, 0),
        )}
        .
      </p>
      <div className="mt-6">
        {receipts.length > 0 ? (
          <HandoverBatchForm
            receipts={receipts.map((receipt) => ({
              id: receipt.id,
              number: receipt.receiptNumber,
              borrower: receipt.borrower.legalName,
              amountPesewas: receipt.amountPesewas,
            }))}
          />
        ) : (
          <div className="border-border bg-surface text-muted rounded-2xl border p-8 text-center">
            No captured receipts are available for handover.
          </div>
        )}
      </div>
    </main>
  );
}
