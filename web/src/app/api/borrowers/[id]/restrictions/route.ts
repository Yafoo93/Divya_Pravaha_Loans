import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  canRequestReactivation,
  isRestrictionAction,
  validateRestrictionReason,
} from "@/lib/borrower-restriction";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import {
  recordAuditEvent,
  recordSensitiveAuditEvent,
} from "@/server/auth/audit";
import { assertIndependentChecker } from "@/server/auth/maker-checker-policy";
import { getServerSession } from "@/server/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in is required." },
      { status: 401 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
  const body =
    rawBody && typeof rawBody === "object"
      ? (rawBody as Record<string, unknown>)
      : null;
  const action = body?.action;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!isRestrictionAction(action)) {
    return NextResponse.json(
      { error: "Unknown workflow action." },
      { status: 400 },
    );
  }
  const reasonError = validateRestrictionReason(reason);
  if (reasonError) {
    return NextResponse.json({ error: reasonError }, { status: 400 });
  }

  const approvalAction =
    action === "APPROVE_REACTIVATION" || action === "REJECT_REACTIVATION";
  const permission = approvalAction
    ? "approve_exceptions"
    : "manage_borrower_drafts";
  const allowed = canPerformPermission(
    session.user.permissions,
    session.user.restrictions,
    permission,
    session.user.featureGate,
    true,
    session.user.role,
  );
  await recordAuditEvent({
    eventType: "PERMISSION_CHECK",
    outcome: allowed ? "SUCCESS" : "DENIED",
    actorUserId: session.user.id,
    permission,
    resource: "/api/borrowers/[id]/restrictions",
    reason: allowed ? "granted" : "permission_not_granted",
  });
  if (!allowed) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const { id } = await params;
  const scope = await requireBranchScope(session);
  const borrower = await db.borrower.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { customerId: id }] }),
    select: {
      id: true,
      customerId: true,
      status: true,
      branchId: true,
      restrictions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          decisions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!borrower) {
    return NextResponse.json({ error: "Borrower not found." }, { status: 404 });
  }
  const current = borrower.restrictions[0];
  const currentDecision = current?.decisions[0];

  try {
    if (action === "RESTRICT") {
      if (borrower.status === "RESTRICTED") {
        return NextResponse.json(
          { error: "The borrower is already restricted." },
          { status: 409 },
        );
      }
      const restrictionNumber = `RST-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
      await db.$transaction(async (tx) => {
        const updated = await tx.borrower.updateMany({
          where: { id: borrower.id, status: "ACTIVE" },
          data: { status: "RESTRICTED" },
        });
        if (updated.count !== 1) throw new Error("WORKFLOW_STATE_CHANGED");
        await tx.borrowerRestriction.create({
          data: {
            restrictionNumber,
            reason,
            borrowerId: borrower.id,
            branchId: borrower.branchId,
            restrictedByUserId: session.user.id,
          },
        });
      });
      await recordAuditEvent({
        eventType: "BORROWER_RESTRICTED",
        outcome: "SUCCESS",
        actorUserId: session.user.id,
        permission,
        resource: `borrower:${borrower.customerId}`,
        reason: "restriction_recorded",
        branchId: borrower.branchId,
      });
    } else if (action === "REQUEST_REACTIVATION") {
      if (
        borrower.status !== "RESTRICTED" ||
        !current ||
        !canRequestReactivation(current.status)
      ) {
        return NextResponse.json(
          { error: "This restriction cannot accept a reactivation request." },
          { status: 409 },
        );
      }
      const decisionNumber = `REA-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
      await db.$transaction(async (tx) => {
        const updated = await tx.borrowerRestriction.updateMany({
          where: {
            id: current.id,
            status: { in: ["ACTIVE", "REACTIVATION_REJECTED"] },
          },
          data: { status: "REACTIVATION_PENDING" },
        });
        if (updated.count !== 1) throw new Error("WORKFLOW_STATE_CHANGED");
        await tx.reactivationDecision.create({
          data: {
            decisionNumber,
            requestReason: reason,
            restrictionId: current.id,
            requestedByUserId: session.user.id,
          },
        });
      });
      await recordAuditEvent({
        eventType: "BORROWER_REACTIVATION_REQUESTED",
        outcome: "SUCCESS",
        actorUserId: session.user.id,
        permission,
        resource: `restriction:${current.restrictionNumber}`,
        reason: "manager_review_required",
        branchId: borrower.branchId,
      });
    } else {
      if (
        !current ||
        current.status !== "REACTIVATION_PENDING" ||
        !currentDecision ||
        currentDecision.status !== "PENDING"
      ) {
        return NextResponse.json(
          { error: "There is no pending reactivation request." },
          { status: 409 },
        );
      }
      const makerUserId = currentDecision.requestedByUserId;
      try {
        assertIndependentChecker(makerUserId, session.user.id);
      } catch {
        await recordAuditEvent({
          eventType: "BORROWER_REACTIVATION_DECISION",
          outcome: "DENIED",
          actorUserId: session.user.id,
          permission,
          resource: `restriction:${current.restrictionNumber}`,
          reason: "maker_checker_violation",
          branchId: borrower.branchId,
        });
        return NextResponse.json(
          {
            error: "The requester cannot approve or reject their own request.",
          },
          { status: 409 },
        );
      }

      const approved = action === "APPROVE_REACTIVATION";
      await db.$transaction(async (tx) => {
        const updated = await tx.reactivationDecision.updateMany({
          where: { id: currentDecision.id, status: "PENDING" },
          data: {
            status: approved ? "APPROVED" : "REJECTED",
            decisionReason: reason,
            decidedByUserId: session.user.id,
            decidedAt: new Date(),
          },
        });
        if (updated.count !== 1) throw new Error("WORKFLOW_STATE_CHANGED");
        await tx.borrowerRestriction.update({
          where: { id: current.id },
          data: {
            status: approved ? "REACTIVATED" : "REACTIVATION_REJECTED",
          },
        });
        if (approved) {
          await tx.borrower.update({
            where: { id: borrower.id },
            data: { status: "ACTIVE" },
          });
        }
      });
      await recordSensitiveAuditEvent(approved ? "approval" : "rejection", {
        outcome: "SUCCESS",
        actorUserId: session.user.id,
        permission,
        resource: `restriction:${current.restrictionNumber}`,
        reason: approved
          ? "borrower_reactivation_approved"
          : "borrower_reactivation_rejected",
        branchId: borrower.branchId,
      });
    }

    return NextResponse.json({ ok: true, action });
  } catch (error) {
    if (error instanceof Error && error.message === "WORKFLOW_STATE_CHANGED") {
      return NextResponse.json(
        { error: "The workflow changed. Refresh and try again." },
        { status: 409 },
      );
    }
    await recordAuditEvent({
      eventType: "BORROWER_RESTRICTION_WORKFLOW",
      outcome: "FAILURE",
      actorUserId: session.user.id,
      permission,
      resource: `borrower:${borrower.customerId}`,
      reason: "database_operation_failed",
      branchId: borrower.branchId,
    });
    throw error;
  }
}
