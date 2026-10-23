import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { toAccraDateInputValue } from "@/lib/formatters";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { requirePermission } from "@/server/auth/session";
import { MobileCashForm } from "../../../../components/mobile-cash-form";

export const instant = false;

export default async function CollectLoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("record_cash_receipts", true);
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const loan = await db.loan.findFirst({
    where: andBranchScope(scope, {
      OR: [{ id }, { loanNumber: id }],
      status: "ACTIVE",
    }),
    include: {
      borrower: true,
      group: true,
      receipts: true,
      repaymentInstalments: {
        where: { status: "AWAITING" },
        orderBy: { instalmentNumber: "asc" },
        take: 1,
      },
    },
  });
  if (!loan) notFound();
  const received = loan.receipts
    .filter((receipt) => receipt.status !== "REVERSED")
    .reduce((sum, receipt) => sum + receipt.amountPesewas, 0);
  const balance = Math.max(0, loan.totalRepayablePesewas - received);
  const due = Math.min(
    balance,
    loan.repaymentInstalments[0]?.totalPesewas ??
      Math.round(loan.totalRepayablePesewas / Math.max(loan.termMonths, 1)),
  );

  return (
    <main className="px-4 py-6">
      <p className="text-primary text-[10px] font-bold tracking-wider uppercase">
        Cash-only online collection
      </p>
      <h1 className="mt-2 text-2xl font-bold">Capture cash receipt</h1>
      <p className="text-muted mt-2 text-sm">
        Confirm the borrower and issue one numbered receipt.
      </p>
      <div className="mt-6">
        <MobileCashForm
          receivedDate={toAccraDateInputValue(new Date())}
          loan={{
            id: loan.id,
            number: loan.loanNumber,
            borrowerName: loan.borrower.legalName,
            customerId: loan.borrower.customerId,
            groupName: loan.group.name,
            duePesewas: due,
            balancePesewas: balance,
          }}
        />
      </div>
    </main>
  );
}
