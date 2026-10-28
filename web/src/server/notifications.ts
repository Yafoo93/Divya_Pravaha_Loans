import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import type { AttentionNotification } from "@/lib/notifications";
import type { StaffRole } from "@/lib/workspace-navigation";

type NotificationContext = {
  userId: string;
  role: StaffRole;
  branchIds: readonly string[];
};

async function buildAttentionNotifications({
  userId,
  role,
  branchIds,
}: NotificationContext): Promise<AttentionNotification[]> {
  const notifications: AttentionNotification[] = [];
  const branchIdFilter = { in: [...branchIds] };
  const add = (notification: AttentionNotification) => {
    if (notification.count > 0) notifications.push(notification);
  };

  if (role === "MANAGER") {
    const [
      loanReviews,
      disbursements,
      handovers,
      arrears,
      exceptions,
      payouts,
    ] = await Promise.all([
      db.loan.count({
        where: {
          branchId: branchIdFilter,
          status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        },
      }),
      db.loan.count({
        where: {
          branchId: branchIdFilter,
          status: "AWAITING_DISBURSEMENT",
        },
      }),
      db.handover.count({
        where: {
          branchId: branchIdFilter,
          collectorUserId: { not: userId },
          status: "SUBMITTED",
        },
      }),
      db.arrear.count({
        where: {
          loan: { branchId: branchIdFilter },
          status: "PENDING_ASSESSMENT",
        },
      }),
      db.cashException.count({
        where: {
          handover: { branchId: branchIdFilter },
          status: "OPEN",
        },
      }),
      db.investorPayout.count({
        where: { branchId: branchIdFilter, status: "PENDING" },
      }),
    ]);
    add({
      id: "loan-reviews",
      title: "Loan applications awaiting review",
      description: "Submitted applications require an independent decision.",
      count: loanReviews,
      href: "/workspace/loan-applications?status=SUBMITTED",
      severity: "warning",
    });
    add({
      id: "disbursements",
      title: "Approved loans awaiting cash release",
      description: "Verify funding, beneficiary and release controls.",
      count: disbursements,
      href: "/workspace/disbursements",
      severity: "warning",
    });
    add({
      id: "handovers",
      title: "Cash handovers awaiting verification",
      description: "A checker must count and reconcile submitted cash.",
      count: handovers,
      href: "/workspace/handovers",
      severity: "warning",
    });
    add({
      id: "arrears",
      title: "Arrears assessments requiring a decision",
      description: "Review notices, disputes and guarantee evidence.",
      count: arrears,
      href: "/workspace/arrears",
      severity: "danger",
    });
    add({
      id: "cash-exceptions",
      title: "Open cash exceptions",
      description: "Shortages, excesses or unidentified cash need resolution.",
      count: exceptions,
      href: "/workspace/handovers",
      severity: "danger",
    });
    add({
      id: "investor-payouts",
      title: "Private-capital payouts awaiting approval",
      description: "A different Manager must verify and approve each request.",
      count: payouts,
      href: "/workspace/investors",
      severity: "warning",
    });
  }

  if (role === "LOAN_OFFICER") {
    const [drafts, draftGroups] = await Promise.all([
      db.loan.count({ where: { branchId: branchIdFilter, status: "DRAFT" } }),
      db.borrowerGroup.count({
        where: { branchId: branchIdFilter, status: "DRAFT" },
      }),
    ]);
    add({
      id: "draft-applications",
      title: "Draft loan applications",
      description:
        "Complete the borrower, group, evidence and terms before submission.",
      count: drafts,
      href: "/workspace/loan-applications?status=DRAFT",
      severity: "info",
    });
    add({
      id: "draft-groups",
      title: "Groups not yet active",
      description:
        "Complete membership, consent, verification and agreement readiness.",
      count: draftGroups,
      href: "/workspace/groups?status=DRAFT",
      severity: "warning",
    });
  }

  if (role === "FIELD_COLLECTOR") {
    const today = new Date();
    const dayStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const [assignments, custodyReceipts] = await Promise.all([
      db.assignment.count({
        where: {
          branchId: branchIdFilter,
          collectorUserId: userId,
          collectionDate: { gte: dayStart, lt: dayEnd },
          status: "ASSIGNED",
        },
      }),
      db.receipt.count({
        where: {
          branchId: branchIdFilter,
          collectorUserId: userId,
          status: "CAPTURED",
        },
      }),
    ]);
    add({
      id: "today-assignments",
      title: "Today’s collection assignments",
      description: "Stops remain on your assigned collection route.",
      count: assignments,
      href: "/field/assignments",
      severity: "warning",
    });
    add({
      id: "collector-custody",
      title: "Receipts awaiting handover",
      description:
        "Prepare collected cash for independent cashier verification.",
      count: custodyReceipts,
      href: "/field/handovers/new",
      severity: "danger",
    });
  }

  if (role === "CASHIER_ACCOUNTANT") {
    const [handovers, exceptions, reversals] = await Promise.all([
      db.handover.count({
        where: { branchId: branchIdFilter, status: "SUBMITTED" },
      }),
      db.cashException.count({
        where: { handover: { branchId: branchIdFilter }, status: "OPEN" },
      }),
      db.reversalRequest.count({
        where: { branchId: branchIdFilter, status: "PENDING" },
      }),
    ]);
    add({
      id: "cashier-handovers",
      title: "Submitted cash handovers",
      description: "Count, reconcile and verify collector cash.",
      count: handovers,
      href: "/workspace/handovers",
      severity: "warning",
    });
    add({
      id: "accounting-exceptions",
      title: "Open reconciliation exceptions",
      description: "Resolve cash differences before period close.",
      count: exceptions,
      href: "/workspace/accounting?report=exceptions",
      severity: "danger",
    });
    add({
      id: "reversal-requests",
      title: "Pending reversal requests",
      description: "Review correction evidence and linked replacement details.",
      count: reversals,
      href: "/workspace/accounting?report=reversals",
      severity: "warning",
    });
  }

  if (role === "INVESTOR_PORTFOLIO_OFFICER") {
    const thirtyDays = new Date(Date.now() + 30 * 86_400_000);
    const [maturities, payouts] = await Promise.all([
      db.privateInvestment.count({
        where: {
          branchId: branchIdFilter,
          status: { in: ["ACTIVE", "MATURED"] },
          maturityDate: { lte: thirtyDays },
        },
      }),
      db.investorPayout.count({
        where: { branchId: branchIdFilter, status: "PENDING" },
      }),
    ]);
    add({
      id: "private-capital-maturities",
      title: "Private-capital contracts nearing maturity",
      description: "Review accrued returns and repayment readiness.",
      count: maturities,
      href: "/workspace/investors",
      severity: "warning",
    });
    add({
      id: "prepared-payouts",
      title: "Payout requests awaiting Manager approval",
      description: "Requests remain unpaid until independently approved.",
      count: payouts,
      href: "/workspace/investors",
      severity: "info",
    });
  }

  if (role === "AUDITOR") {
    const [exceptions, reversals, deniedEvents] = await Promise.all([
      db.cashException.count({
        where: { handover: { branchId: branchIdFilter }, status: "OPEN" },
      }),
      db.reversalRequest.count({
        where: { branchId: branchIdFilter, status: "PENDING" },
      }),
      db.auditEvent.count({
        where: {
          branchId: branchIdFilter,
          outcome: { in: ["DENIED", "FAILURE"] },
          createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
        },
      }),
    ]);
    add({
      id: "audit-exceptions",
      title: "Open financial exceptions",
      description: "Trace unresolved operational and accounting differences.",
      count: exceptions,
      href: "/workspace/accounting?report=exceptions",
      severity: "danger",
    });
    add({
      id: "audit-reversals",
      title: "Pending reversal controls",
      description: "Review maker/checker status and source evidence.",
      count: reversals,
      href: "/workspace/accounting?report=reversals",
      severity: "warning",
    });
    add({
      id: "security-denials",
      title: "Recent denied or failed events",
      description:
        "Authentication and permission failures recorded in the last seven days.",
      count: deniedEvents,
      href: "/workspace/administration#audit",
      severity: "warning",
    });
  }

  if (role === "SYSTEM_ADMIN") {
    const [inactiveUsers, suspendedUsers] = await Promise.all([
      db.user.count({ where: { status: "INACTIVE" } }),
      db.user.count({ where: { status: "SUSPENDED" } }),
    ]);
    add({
      id: "inactive-users",
      title: "Inactive staff accounts",
      description: "Review accounts awaiting activation or no longer required.",
      count: inactiveUsers,
      href: "/workspace/administration/staff?status=INACTIVE",
      severity: "info",
    });
    add({
      id: "suspended-users",
      title: "Suspended staff accounts",
      description: "Review security or access issues requiring attention.",
      count: suspendedUsers,
      href: "/workspace/administration/staff?status=SUSPENDED",
      severity: "danger",
    });
  }

  return notifications.sort((left, right) => {
    const priority = { danger: 0, warning: 1, info: 2 };
    return priority[left.severity] - priority[right.severity];
  });
}

const getCachedAttentionNotifications = cache(
  async (userId: string, role: StaffRole, branchIdsKey: string) =>
    buildAttentionNotifications({
      userId,
      role,
      branchIds: branchIdsKey ? branchIdsKey.split(",") : [],
    }),
);

export async function getAttentionNotifications({
  userId,
  role,
  branchIds,
}: NotificationContext) {
  return getCachedAttentionNotifications(
    userId,
    role,
    [...branchIds].sort().join(","),
  );
}
