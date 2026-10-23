import Link from "next/link";
import { db } from "@/lib/db";
import { formatAccraDateTime, formatGhsFromPesewas } from "@/lib/formatters";
import {
  branchScopeLabel,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../components/page-heading";
import { Badge, Card } from "../../components/ui/data-display";

export const instant = false;

export default async function CashCollectionsPage() {
  const session = await requireWorkspacePath("/workspace/cash-collections");
  const scope = await requireBranchScope(session);
  const receipts = await db.receipt.findMany({
    where: { branchId: { in: [...scope.branchIds] } },
    include: {
      borrower: true,
      loan: true,
      collector: true,
      handoverLinks: {
        include: { handover: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { receivedAt: "desc" },
  });
  const branch = branchScopeLabel(scope);
  const custody = receipts
    .filter((receipt) =>
      ["CAPTURED", "HANDED_OVER", "VERIFIED"].includes(receipt.status),
    )
    .reduce((sum, receipt) => sum + receipt.amountPesewas, 0);
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Cash collections"
          description="Receipt lifecycle, automatic allocation, custody, and correction trace."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Summary label="Numbered receipts" value={String(receipts.length)} />
          <Summary
            label="Collector custody"
            value={formatGhsFromPesewas(custody)}
            primary
          />
          <Summary
            label="Posted receipts"
            value={String(
              receipts.filter((receipt) => receipt.status === "POSTED").length,
            )}
          />
        </div>
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-4xl text-left text-sm">
              <thead className="bg-background text-muted text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Receipt</th>
                  <th className="px-5 py-3">Borrower / loan</th>
                  <th className="px-5 py-3">Collector</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3">Handover</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-5 py-4">
                      <Link
                        className="text-primary font-bold"
                        href={`/workspace/cash-collections/${receipt.receiptNumber}`}
                      >
                        {receipt.receiptNumber}
                      </Link>
                      <p className="text-muted text-xs">
                        {formatAccraDateTime(receipt.receivedAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold">{receipt.borrower.legalName}</p>
                      <p className="text-muted text-xs">
                        {receipt.loan.loanNumber}
                      </p>
                    </td>
                    <td className="px-5 py-4">{receipt.collector.name}</td>
                    <td className="px-5 py-4 text-right font-bold">
                      {formatGhsFromPesewas(receipt.amountPesewas)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          receipt.status === "POSTED"
                            ? "success"
                            : receipt.status === "REVERSED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {receipt.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {receipt.handoverLinks[0]?.handover.handoverNumber ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}
