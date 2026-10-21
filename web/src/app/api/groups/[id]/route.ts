import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  captureGroupSnapshot,
  isGroupActivationReady,
} from "@/lib/group-policy";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import {
  recordAuditEvent,
  recordSensitiveAuditEvent,
} from "@/server/auth/audit";
import { assertIndependentChecker } from "@/server/auth/maker-checker-policy";
import { getServerSession } from "@/server/auth/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : "";
  const decision =
    action === "APPROVE_ACTIVATION" || action === "REJECT_ACTIVATION";
  const permission = decision ? "approve_exceptions" : "manage_groups";
  const allowed = canPerformPermission(
    session.user.permissions,
    session.user.restrictions,
    permission,
    session.user.featureGate,
    true,
    session.user.role,
  );
  if (!allowed)
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const group = await db.borrowerGroup.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { groupNumber: id }] }),
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          borrower: {
            include: {
              verifications: { where: { status: "VERIFIED" }, take: 1 },
            },
          },
        },
      },
      agreements: {
        where: { status: "SIGNED", signedAt: { not: null } },
        orderBy: { version: "desc" },
        take: 1,
      },
      activationReviews: { orderBy: { requestedAt: "desc" }, take: 1 },
    },
  });
  if (!group)
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 10)
    return NextResponse.json(
      { error: "Provide a reason of at least 10 characters." },
      { status: 400 },
    );
  const now = new Date();
  if (action === "ADD_MEMBER" || action === "EXIT_MEMBER") {
    const borrowerId =
      typeof body.borrowerId === "string" ? body.borrowerId : "";
    const effectiveDate = new Date(
      typeof body.effectiveDate === "string" ? body.effectiveDate : "",
    );
    if (!borrowerId || Number.isNaN(effectiveDate.getTime()))
      return NextResponse.json(
        { error: "Borrower and effective date are required." },
        { status: 400 },
      );
    const borrower = await db.borrower.findFirst({
      where: { id: borrowerId, branchId: group.branchId, status: "ACTIVE" },
    });
    if (!borrower)
      return NextResponse.json(
        { error: "Eligible borrower not found." },
        { status: 400 },
      );
    await db.$transaction(async (tx) => {
      if (action === "ADD_MEMBER") {
        const existing = await tx.groupMembership.count({
          where: { groupId: group.id, borrowerId, status: "ACTIVE" },
        });
        if (existing) throw new Error("MEMBER_ALREADY_ACTIVE");
        await tx.groupMembership.create({
          data: {
            groupId: group.id,
            borrowerId,
            status: "ACTIVE",
            joinedAt: effectiveDate,
            hasConsented: true,
          },
        });
      } else {
        const changed = await tx.groupMembership.updateMany({
          where: { groupId: group.id, borrowerId, status: "ACTIVE" },
          data: { status: "EXITED", exitedAt: effectiveDate },
        });
        if (changed.count !== 1) throw new Error("MEMBER_NOT_ACTIVE");
      }
      await tx.groupMembershipChange.create({
        data: {
          eventNumber: `GME-${randomUUID().slice(0, 12).toUpperCase()}`,
          action: action === "ADD_MEMBER" ? "JOINED" : "EXITED",
          effectiveDate,
          reason,
          borrowerId,
          recordedByUserId: session.user.id,
          groupId: group.id,
        },
      });
      const active = await tx.groupMembership.findMany({
        where: { groupId: group.id, status: "ACTIVE" },
        select: { borrowerId: true },
      });
      await tx.groupSnapshot.create({
        data: {
          snapshotNumber: `GS-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`,
          reason: action,
          memberIds: captureGroupSnapshot(
            active.map(({ borrowerId }) => borrowerId),
          ),
          groupId: group.id,
        },
      });
    });
  } else if (action === "REQUEST_ACTIVATION") {
    if (
      group.status !== "DRAFT" ||
      !isGroupActivationReady(
        group.memberships.map((member) => ({
          hasConsented: member.hasConsented,
          verified: member.borrower.verifications.length > 0,
        })),
        group.agreements.length > 0,
      )
    )
      return NextResponse.json(
        {
          error:
            "Activation requires a draft group with at least five consenting members.",
        },
        { status: 409 },
      );
    await db.groupActivationReview.create({
      data: {
        reviewNumber: `GAR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 5).toUpperCase()}`,
        requestReason: reason,
        groupId: group.id,
        requestedByUserId: session.user.id,
      },
    });
  } else if (decision) {
    const review = group.activationReviews[0];
    if (!review || review.status !== "PENDING")
      return NextResponse.json(
        { error: "No pending activation review." },
        { status: 409 },
      );
    try {
      assertIndependentChecker(review.requestedByUserId, session.user.id);
    } catch {
      return NextResponse.json(
        { error: "The requester cannot review their own activation." },
        { status: 409 },
      );
    }
    const approved = action === "APPROVE_ACTIVATION";
    await db.$transaction([
      db.groupActivationReview.update({
        where: { id: review.id },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          decisionReason: reason,
          decidedAt: now,
          decidedByUserId: session.user.id,
        },
      }),
      ...(approved
        ? [
            db.borrowerGroup.update({
              where: { id: group.id },
              data: { status: "ACTIVE", activatedAt: now },
            }),
            db.groupStatusEvent.create({
              data: {
                eventNumber: `GSE-${randomUUID().slice(0, 12).toUpperCase()}`,
                fromStatus: group.status,
                toStatus: "ACTIVE",
                effectiveAt: now,
                reason,
                groupId: group.id,
                recordedByUserId: session.user.id,
              },
            }),
          ]
        : []),
    ]);
    await recordSensitiveAuditEvent(approved ? "approval" : "rejection", {
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission,
      resource: `group:${group.groupNumber}`,
      reason: approved
        ? "group_activation_approved"
        : "group_activation_rejected",
      branchId: group.branchId,
    });
  } else
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  await recordAuditEvent({
    eventType: "GROUP_WORKFLOW",
    outcome: "SUCCESS",
    actorUserId: session.user.id,
    permission,
    resource: `group:${group.groupNumber}`,
    reason: action.toLowerCase(),
    branchId: group.branchId,
  });
  return NextResponse.json({ ok: true });
}
