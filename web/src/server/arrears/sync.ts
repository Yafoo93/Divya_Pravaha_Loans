import "server-only";

import { db } from "@/lib/db";
import { daysPastDue } from "@/lib/arrears-rules";
import { toAccraDateInputValue } from "@/lib/formatters";
import type { BranchScope } from "@/server/auth/branch-scope";

/**
 * Idempotently materialize arrears for every unpaid instalment whose effective
 * collection date is before today's Accra business date. There is no grace day.
 */
export async function syncOverdueArrears(
  scope: BranchScope,
  asOf = new Date(),
) {
  const accraToday = new Date(`${toAccraDateInputValue(asOf)}T00:00:00.000Z`);
  const instalments = await db.repaymentInstalment.findMany({
    where: {
      loan: {
        branchId: { in: [...scope.branchIds] },
        status: "ACTIVE",
      },
      effectiveCollectionDate: { lt: accraToday },
      status: { not: "PAID" },
    },
    include: {
      loan: {
        include: {
          guaranteeSnapshots: {
            orderBy: { capturedAt: "desc" },
            take: 1,
          },
        },
      },
      arrear: true,
    },
    orderBy: [{ effectiveCollectionDate: "asc" }, { instalmentNumber: "asc" }],
  });

  for (const instalment of instalments) {
    const unpaidAmountPesewas =
      instalment.principalPesewas -
      instalment.principalPaidPesewas +
      instalment.interestPesewas -
      instalment.interestPaidPesewas;
    if (unpaidAmountPesewas <= 0) continue;
    const dpd = daysPastDue(instalment.effectiveCollectionDate, asOf);
    if (instalment.arrear) {
      if (instalment.arrear.status === "PENDING_ASSESSMENT")
        await db.arrear.update({
          where: { id: instalment.arrear.id },
          data: {
            daysPastDue: dpd,
            unpaidAmountPesewas,
            // Records derived from a demonstration loan remain demonstration
            // data throughout their lifecycle.
            isSampleData:
              instalment.loan.isSampleData || instalment.arrear.isSampleData,
          },
        });
      continue;
    }
    const snapshot = instalment.loan.guaranteeSnapshots[0];
    // Joint-liability may only be assessed from evidence frozen for this loan.
    // Do not silently substitute current group membership when that evidence is absent.
    if (!snapshot) continue;
    await db.arrear.create({
      data: {
        assessmentNumber: `ARR-${instalment.loan.loanNumber}-${instalment.instalmentNumber}`,
        effectiveDueDate: instalment.effectiveCollectionDate,
        daysPastDue: dpd,
        unpaidAmountPesewas,
        contributionPesewas: 0,
        status: "PENDING_ASSESSMENT",
        loanId: instalment.loanId,
        borrowerId: instalment.loan.borrowerId,
        instalmentId: instalment.id,
        guaranteeSnapshotId: snapshot.id,
        isSampleData: instalment.loan.isSampleData,
      },
    });
  }
}
