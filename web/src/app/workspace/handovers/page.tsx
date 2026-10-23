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

export default async function HandoversPage() {
  const session = await requireWorkspacePath("/workspace/handovers");
  const scope = await requireBranchScope(session);
  const handovers = await db.handover.findMany({
    where: { branchId: { in: [...scope.branchIds] } },
    include: {
      collector: true,
      checker: true,
      reconciliation: true,
      exceptions: true,
      _count: { select: { receipts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const branch = branchScopeLabel(scope);
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Cash handovers"
          description="Independent physical count, discrepancy control, and custody transfer."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
        />
        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <p className="text-muted text-sm">
            {handovers.length} controlled batches
          </p>
          {session.user.permissions.includes("submit_cash_handovers") && (
            <Link
              href="/field/handovers/new"
              className="bg-primary rounded-lg px-4 py-2 text-sm font-bold text-white"
            >
              Prepare handover
            </Link>
          )}
        </div>
        <Card className="mt-5 overflow-hidden">
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-4xl text-left text-sm">
              <thead className="bg-background text-muted text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Handover</th>
                  <th className="px-5 py-3">Collector / checker</th>
                  <th className="px-5 py-3">Receipts</th>
                  <th className="px-5 py-3 text-right">Expected / variance</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3">Exceptions</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {handovers.map((handover) => (
                  <tr key={handover.id}>
                    <td className="px-5 py-4">
                      <Link
                        className="text-primary font-bold"
                        href={`/workspace/handovers/${handover.handoverNumber}`}
                      >
                        {handover.handoverNumber}
                      </Link>
                      <p className="text-muted text-xs">
                        {formatAccraDateTime(
                          handover.submittedAt ?? handover.createdAt,
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{handover.collector.name}</p>
                      <p className="text-muted text-xs">
                        {handover.checker?.name ?? "Awaiting checker"}
                      </p>
                    </td>
                    <td className="px-5 py-4">{handover._count.receipts}</td>
                    <td className="px-5 py-4 text-right">
                      <p className="font-bold">
                        {formatGhsFromPesewas(handover.expectedPesewas)}
                      </p>
                      <p className="text-muted text-xs">
                        Variance{" "}
                        {formatGhsFromPesewas(handover.variancePesewas ?? 0)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
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
                    </td>
                    <td className="px-5 py-4">
                      {handover.exceptions
                        .map((item) => item.type.replaceAll("_", " "))
                        .join(", ") || "—"}
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
