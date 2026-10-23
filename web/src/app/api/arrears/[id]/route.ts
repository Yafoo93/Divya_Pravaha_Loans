import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { allocateJointLiability } from "@/lib/arrears-rules";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : "";
  const controlled = ["APPROVE", "REJECT", "RESOLVE_DISPUTE"].includes(action);
  const permission = controlled
    ? "approve_exceptions"
    : action === "COLLECT"
      ? "record_cash_receipts"
      : "resolve_operational_disputes";
  const allowed = canPerformPermission(
    session.user.permissions,
    session.user.restrictions,
    permission,
    session.user.featureGate,
    true,
    session.user.role,
  );
  if (!allowed || (controlled && session.user.role !== "MANAGER"))
    return NextResponse.json(
      { error: "Required arrears permission is missing." },
      { status: 403 },
    );

  const { id } = await params;
  const arrear = await db.arrear.findFirst({
    where: { OR: [{ id }, { assessmentNumber: id }] },
    include: {
      guaranteeSnapshot: true,
      loan: {
        include: {
          repaymentInstalments: { orderBy: { effectiveCollectionDate: "asc" } },
        },
      },
      contributions: true,
      notices: true,
      disputes: true,
    },
  });
  if (!arrear)
    return NextResponse.json(
      { error: "Arrears assessment not found." },
      { status: 404 },
    );
  const scope = await requireBranchScope(session);
  try {
    assertBranchAccess(arrear.loan.branchId, scope);
    const suffix = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    if (action === "APPROVE" || action === "REJECT") {
      if (arrear.status !== "PENDING_ASSESSMENT")
        throw new Error("Only a pending assessment can be decided.");
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (reason.length < 10)
        throw new Error(
          "A decision reason of at least ten characters is required.",
        );
      const snapshot = arrear.guaranteeSnapshot;
      if (!snapshot)
        throw new Error("The frozen loan guarantee snapshot is missing.");
      const eligibleIds = snapshot.guarantorBorrowerIds.filter(
        (borrowerId) => borrowerId !== arrear.borrowerId,
      );
      const shares = allocateJointLiability(
        arrear.unpaidAmountPesewas,
        eligibleIds,
      );
      await db.$transaction(async (tx) => {
        if (action === "APPROVE" && arrear.contributions.length === 0)
          await tx.arrearContribution.createMany({
            data: shares.map((share) => ({
              ...share,
              contributionNumber: `JLC-${arrear.assessmentNumber}-${String(share.sequence).padStart(2, "0")}`,
              arrearId: arrear.id,
              status: "APPROVED",
            })),
          });
        if (arrear.notices.length === 0)
          await tx.arrearNotice.create({
            data: {
              noticeNumber: `NTC-${suffix}`,
              noticeType: "JOINT_LIABILITY_ASSESSMENT",
              documentReference: `private://arrears/${arrear.assessmentNumber}/notice.pdf`,
              servedAt: new Date(),
              arrearId: arrear.id,
            },
          });
        await tx.arrearDecision.create({
          data: {
            decisionNumber: `ARD-${suffix}`,
            status: action === "APPROVE" ? "APPROVED" : "REJECTED",
            reason,
            arrearId: arrear.id,
            decidedByUserId: session.user.id,
          },
        });
        await tx.arrear.update({
          where: { id: arrear.id },
          data: {
            status: action === "APPROVE" ? "APPROVED" : "REJECTED",
            guaranteeSnapshotId: snapshot.id,
            contributionPesewas:
              action === "APPROVE" ? (shares[0]?.assessedPesewas ?? 0) : 0,
          },
        });
      });
    } else if (action === "DISPUTE") {
      const complaint =
        typeof body.complaint === "string" ? body.complaint.trim() : "";
      if (complaint.length < 10)
        throw new Error("Describe the dispute in at least ten characters.");
      await db.arrearDispute.create({
        data: {
          disputeNumber: `DSP-${suffix}`,
          complaint,
          arrearId: arrear.id,
          recordedByUserId: session.user.id,
        },
      });
    } else if (action === "RESOLVE_DISPUTE") {
      const disputeId =
        typeof body.disputeId === "string" ? body.disputeId : "";
      const resolution =
        typeof body.resolution === "string" ? body.resolution.trim() : "";
      if (resolution.length < 10)
        throw new Error("A resolution of at least ten characters is required.");
      const resolved = await db.arrearDispute.updateMany({
        where: { id: disputeId, arrearId: arrear.id, status: "OPEN" },
        data: {
          status: "RESOLVED",
          resolution,
          resolvedAt: new Date(),
          resolvedByUserId: session.user.id,
        },
      });
      if (resolved.count !== 1)
        throw new Error("An open dispute was not found.");
    } else if (action === "COLLECT") {
      if (arrear.status !== "APPROVED")
        throw new Error("Manager approval is required before collection.");
      const contributionId =
        typeof body.contributionId === "string" ? body.contributionId : "";
      const contribution = arrear.contributions.find(
        (item) => item.id === contributionId,
      );
      if (!contribution || contribution.status !== "APPROVED")
        throw new Error("An approved uncollected contribution is required.");
      const instalment =
        arrear.loan.repaymentInstalments.find(
          (item) => item.id === arrear.instalmentId,
        ) ??
        arrear.loan.repaymentInstalments.find((item) => item.status !== "PAID");
      if (!instalment)
        throw new Error("The original borrower instalment was not found.");
      const principalDue =
        instalment.principalPesewas - instalment.principalPaidPesewas;
      const interestDue =
        instalment.interestPesewas - instalment.interestPaidPesewas;
      const totalDue = principalDue + interestDue;
      if (contribution.assessedPesewas > totalDue)
        throw new Error(
          "Contribution exceeds the original borrower receivable.",
        );
      const principal =
        contribution.assessedPesewas === totalDue
          ? principalDue
          : Math.min(
              principalDue,
              Math.round(
                (contribution.assessedPesewas * principalDue) / totalDue,
              ),
            );
      const interest = contribution.assessedPesewas - principal;
      const now = new Date();
      await db.$transaction(
        async (tx) => {
          const claimed = await tx.arrearContribution.updateMany({
            where: { id: contribution.id, status: "APPROVED" },
            data: { status: "COLLECTED" },
          });
          if (claimed.count !== 1)
            throw new Error("This contribution was already collected.");
          const period = await tx.accountingPeriod.findFirst({
            where: {
              branchId: arrear.loan.branchId,
              status: "OPEN",
              startsAt: { lte: now },
              endsAt: { gte: now },
            },
          });
          const accounts = await tx.ledgerAccount.findMany({
            where: { code: { in: ["1010", "1100", "1110"] }, isActive: true },
          });
          const ids = new Map(
            accounts.map((account) => [account.code, account.id]),
          );
          if (!period || ids.size !== 3)
            throw new Error(
              "Open period and receivable accounts are required.",
            );
          const journal = await tx.journalEntry.create({
            data: {
              journalNumber: `J-JLC-${suffix}`,
              description: `Joint-liability contribution for ${arrear.assessmentNumber}`,
              sourceEventType: "JOINT_LIABILITY_CONTRIBUTION",
              sourceReference: contribution.contributionNumber,
              entryDate: now,
              branchId: arrear.loan.branchId,
              periodId: period.id,
              actorUserId: session.user.id,
              lines: {
                create: [
                  {
                    accountId: ids.get("1010")!,
                    debitPesewas: contribution.assessedPesewas,
                  },
                  ...(principal > 0
                    ? [
                        {
                          accountId: ids.get("1100")!,
                          creditPesewas: principal,
                        },
                      ]
                    : []),
                  ...(interest > 0
                    ? [{ accountId: ids.get("1110")!, creditPesewas: interest }]
                    : []),
                ],
              },
            },
          });
          const custody = await tx.custodyMovement.aggregate({
            where: { collectorUserId: session.user.id },
            _sum: { amountPesewas: true },
          });
          await tx.repaymentInstalment.update({
            where: { id: instalment.id },
            data: {
              principalPaidPesewas: { increment: principal },
              interestPaidPesewas: { increment: interest },
              status:
                contribution.assessedPesewas === totalDue
                  ? "PAID"
                  : "PART_PAID",
            },
          });
          await tx.arrearContribution.update({
            where: { id: contribution.id },
            data: {
              collectedPesewas: contribution.assessedPesewas,
              collectedAt: now,
              collectedByUserId: session.user.id,
              journalId: journal.id,
            },
          });
          await tx.custodyMovement.create({
            data: {
              movementNumber: `CST-JLC-${suffix}`,
              type: "CASH_RECEIVED",
              amountPesewas: contribution.assessedPesewas,
              balanceAfterPesewas:
                (custody._sum.amountPesewas ?? 0) +
                contribution.assessedPesewas,
              occurredAt: now,
              branchId: arrear.loan.branchId,
              collectorUserId: session.user.id,
            },
          });
          const remainingContributions = await tx.arrearContribution.count({
            where: { arrearId: arrear.id, status: { not: "COLLECTED" } },
          });
          if (remainingContributions === 0)
            await tx.arrear.update({
              where: { id: arrear.id },
              data: { status: "RESOLVED" },
            });
          const schedules = await tx.repaymentInstalment.findMany({
            where: { loanId: arrear.loanId },
            select: {
              principalPesewas: true,
              principalPaidPesewas: true,
              interestPesewas: true,
              interestPaidPesewas: true,
            },
          });
          const repaid =
            schedules.length > 0 &&
            schedules.every(
              (schedule) =>
                schedule.principalPaidPesewas >= schedule.principalPesewas &&
                schedule.interestPaidPesewas >= schedule.interestPesewas,
            );
          if (repaid)
            await tx.loan.update({
              where: { id: arrear.loanId },
              data: { status: "CLOSED" },
            });
        },
        { isolationLevel: "Serializable" },
      );
    } else
      return NextResponse.json(
        { error: "Unsupported arrears action." },
        { status: 400 },
      );
    await recordAuditEvent({
      eventType: `ARREARS_${action}`,
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission,
      resource: `arrear:${arrear.assessmentNumber}`,
      branchId: arrear.loan.branchId,
    });
    return NextResponse.json({ id: arrear.id, action });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Arrears action failed.",
      },
      { status: 409 },
    );
  }
}
