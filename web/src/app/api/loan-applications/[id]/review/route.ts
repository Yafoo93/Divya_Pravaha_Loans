import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { recordSensitiveAuditEvent } from "@/server/auth/audit";
import { assertIndependentChecker } from "@/server/auth/maker-checker-policy";
import { getServerSession } from "@/server/auth/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  const allowed = Boolean(
    session &&
    canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "approve_or_reject_loans",
      session.user.featureGate,
      true,
      session.user.role,
    ),
  );
  if (!session || !allowed)
    return NextResponse.json(
      { error: "Manager approval permission is required." },
      { status: 403 },
    );
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const application = await db.loan.findFirst({
    where: andBranchScope(scope, {
      OR: [{ id }, { loanNumber: id }],
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    }),
    include: {
      termsSnapshots: {
        orderBy: { version: "desc" },
        take: 1,
        include: { decision: true },
      },
    },
  });
  if (!application)
    return NextResponse.json(
      { error: "Reviewable application not found." },
      { status: 404 },
    );
  const snapshot = application.termsSnapshots[0];
  if (!snapshot || snapshot.decision)
    return NextResponse.json(
      { error: "The latest submitted terms have already been decided." },
      { status: 409 },
    );
  try {
    assertIndependentChecker(snapshot.createdByUserId, session.user.id);
  } catch {
    return NextResponse.json(
      { error: "The maker cannot decide their own application." },
      { status: 409 },
    );
  }
  const body = (await request.json()) as Record<string, unknown>;
  const action =
    body.action === "APPROVE"
      ? "APPROVE"
      : body.action === "REJECT"
        ? "REJECT"
        : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!action || reason.length < 10)
    return NextResponse.json(
      {
        error:
          "Select approve or reject and provide a reason of at least 10 characters.",
      },
      { status: 400 },
    );
  const approved = action === "APPROVE";
  const now = new Date();
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
  await db.$transaction([
    db.loanDecision.create({
      data: {
        decisionNumber: `LD-${suffix}`,
        status: approved ? "APPROVED" : "REJECTED",
        reason,
        decidedAt: now,
        loanId: application.id,
        termsSnapshotId: snapshot.id,
        decidedByUserId: session.user.id,
      },
    }),
    db.loan.update({
      where: { id: application.id },
      data: { status: approved ? "AWAITING_DISBURSEMENT" : "REJECTED" },
    }),
    db.loanApplicationEvent.create({
      data: {
        eventNumber: `LAE-${suffix}`,
        eventType: approved ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED",
        fromStatus: application.status,
        toStatus: approved ? "AWAITING_DISBURSEMENT" : "REJECTED",
        reason,
        occurredAt: now,
        loanId: application.id,
        actorUserId: session.user.id,
      },
    }),
  ]);
  await recordSensitiveAuditEvent(approved ? "approval" : "rejection", {
    outcome: "SUCCESS",
    actorUserId: session.user.id,
    permission: "approve_or_reject_loans",
    resource: `loan-application:${application.loanNumber}:snapshot-v${snapshot.version}`,
    reason,
    branchId: application.branchId,
  });
  return NextResponse.json({
    ok: true,
    status: approved ? "AWAITING_DISBURSEMENT" : "REJECTED",
  });
}
