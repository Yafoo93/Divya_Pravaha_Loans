import Link from "next/link";
import { db } from "@/lib/db";
import { daysPastDue } from "@/lib/arrears-rules";
import { formatAccraDate, formatGhsFromPesewas } from "@/lib/formatters";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { syncOverdueArrears } from "@/server/arrears/sync";
import { PageHeading } from "../../components/page-heading";
import { Badge, Card } from "../../components/ui/data-display";

export const instant = false;
export default async function ArrearsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; band?: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/arrears");
  const scope = await requireBranchScope(session);
  const filters = await searchParams;
  await syncOverdueArrears(scope);
  const arrears = await db.arrear.findMany({
    where: { loan: { branchId: { in: [...scope.branchIds] } } },
    include: {
      borrower: true,
      loan: { include: { group: true } },
      disputes: { where: { status: "OPEN" } },
      _count: { select: { contributions: true } },
    },
    orderBy: { effectiveDueDate: "asc" },
  });
  const now = new Date();
  const visible = arrears.filter((item) => {
    const dpd = daysPastDue(item.effectiveDueDate, now);
    const query = (filters.q ?? "").toLowerCase();
    const matchesQuery =
      `${item.assessmentNumber} ${item.borrower.legalName} ${item.loan.loanNumber} ${item.loan.group.name}`
        .toLowerCase()
        .includes(query);
    const matchesBand =
      !filters.band ||
      filters.band === "ALL" ||
      (filters.band === "1-7" && dpd <= 7) ||
      (filters.band === "8-30" && dpd >= 8 && dpd <= 30) ||
      (filters.band === "31+" && dpd >= 31);
    return matchesQuery && matchesBand;
  });
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Arrears & joint liability"
          description="Zero-grace aging, frozen guarantors, notices, disputes, and controlled contributions."
          branchName={scope.branches.map((branch) => branch.name).join(", ")}
          date={now}
          currency="GHS"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric
            label="Past-due exposure"
            value={formatGhsFromPesewas(
              arrears
                .filter((item) => item.status !== "RESOLVED")
                .reduce((sum, item) => sum + item.unpaidAmountPesewas, 0),
            )}
          />
          <Metric
            label="Pending Manager decision"
            value={String(
              arrears.filter((item) => item.status === "PENDING_ASSESSMENT")
                .length,
            )}
            primary
          />
          <Metric
            label="Open disputes"
            value={String(
              arrears.reduce((sum, item) => sum + item.disputes.length, 0),
            )}
          />
        </div>
        <Card className="mt-6 overflow-hidden">
          <form className="grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]">
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Search borrower, loan, group, or assessment"
              className="border-border h-11 rounded-lg border px-3"
            />
            <select
              name="band"
              defaultValue={filters.band ?? "ALL"}
              className="border-border h-11 rounded-lg border px-3"
            >
              <option value="ALL">All aging bands</option>
              <option value="1-7">1–7 days</option>
              <option value="8-30">8–30 days</option>
              <option value="31+">31+ days</option>
            </select>
            <button className="bg-primary h-11 rounded-lg px-4 font-bold text-white">
              Apply filters
            </button>
          </form>
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-4xl text-left text-sm">
              <thead className="bg-background text-muted text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Assessment / borrower</th>
                  <th className="px-5 py-3">Group</th>
                  <th className="px-5 py-3">Effective due</th>
                  <th className="px-5 py-3">DPD</th>
                  <th className="px-5 py-3 text-right">Unpaid</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <Link
                        className="text-primary font-bold"
                        href={`/workspace/arrears/${item.assessmentNumber}`}
                      >
                        {item.assessmentNumber}
                      </Link>
                      <p className="text-muted text-xs">
                        {item.borrower.legalName} · {item.loan.loanNumber}
                      </p>
                    </td>
                    <td className="px-5 py-4">{item.loan.group.name}</td>
                    <td className="px-5 py-4">
                      {formatAccraDate(item.effectiveDueDate)}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {daysPastDue(item.effectiveDueDate, now)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      {formatGhsFromPesewas(item.unpaidAmountPesewas)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          item.status === "APPROVED"
                            ? "warning"
                            : item.status === "RESOLVED"
                              ? "success"
                              : "danger"
                        }
                      >
                        {item.status.replaceAll("_", " ")}
                      </Badge>
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
