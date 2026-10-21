import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { captureGroupSnapshot } from "@/lib/group-policy";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const allowed = Boolean(
    session &&
    canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "manage_groups",
      session.user.featureGate,
      true,
      session.user.role,
    ),
  );
  if (!session || !allowed)
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const body = (await request.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const branchId = typeof body.branchId === "string" ? body.branchId : "";
  const agreement =
    typeof body.agreement === "string" ? body.agreement.trim() : "";
  const memberIds = Array.isArray(body.memberIds)
    ? body.memberIds.filter((id): id is string => typeof id === "string")
    : [];
  if (name.length < 3 || agreement.length < 3 || memberIds.length < 1)
    return NextResponse.json(
      { error: "Provide group details, agreement, and at least one member." },
      { status: 400 },
    );
  const scope = await requireBranchScope(session);
  try {
    assertBranchAccess(branchId, scope);
  } catch {
    return NextResponse.json(
      { error: "Branch is outside your assignment." },
      { status: 403 },
    );
  }
  const borrowers = await db.borrower.findMany({
    where: { id: { in: memberIds }, branchId, status: "ACTIVE" },
    select: { id: true },
  });
  if (borrowers.length !== new Set(memberIds).size)
    return NextResponse.json(
      {
        error: "Every member must be active and belong to the selected branch.",
      },
      { status: 400 },
    );
  const token = `${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 5).toUpperCase()}`;
  const groupNumber = `GRP-${token}`;
  const group = await db.$transaction(async (tx) => {
    const created = await tx.borrowerGroup.create({
      data: {
        groupNumber,
        name,
        status: "DRAFT",
        jointLiabilityReference: agreement,
        branchId,
        officerId: session.user.id,
        createdByUserId: session.user.id,
      },
    });
    const now = new Date();
    await tx.groupAgreement.create({
      data: {
        agreementNumber: agreement,
        version: 1,
        status: "SIGNED",
        documentReference: `private://groups/${created.id}/agreement/v1`,
        signedAt: now,
        groupId: created.id,
      },
    });
    await tx.groupStatusEvent.create({
      data: {
        eventNumber: `GSE-${randomUUID().slice(0, 12).toUpperCase()}`,
        fromStatus: null,
        toStatus: "DRAFT",
        effectiveAt: now,
        reason: "Group created",
        groupId: created.id,
        recordedByUserId: session.user.id,
      },
    });
    await tx.groupVisit.create({
      data: {
        visitNumber: `GV-${randomUUID().slice(0, 12).toUpperCase()}`,
        visitedAt: now,
        purpose: "Initial group formation and member verification",
        outcome: "Draft group recorded with initial consenting members.",
        groupId: created.id,
        officerId: session.user.id,
      },
    });
    for (const borrower of borrowers) {
      await tx.groupMembership.create({
        data: {
          groupId: created.id,
          borrowerId: borrower.id,
          status: "ACTIVE",
          joinedAt: now,
          hasConsented: true,
        },
      });
      await tx.groupMembershipChange.create({
        data: {
          eventNumber: `GME-${randomUUID().slice(0, 12).toUpperCase()}`,
          action: "JOINED",
          effectiveDate: now,
          reason: "Initial group formation",
          borrowerId: borrower.id,
          recordedByUserId: session.user.id,
          groupId: created.id,
        },
      });
    }
    await tx.groupSnapshot.create({
      data: {
        snapshotNumber: `GS-${token}`,
        reason: "INITIAL_MEMBERSHIP",
        memberIds: captureGroupSnapshot(borrowers.map(({ id }) => id)),
        groupId: created.id,
      },
    });
    await tx.groupDocument.create({
      data: {
        documentNumber: `GDOC-${token}`,
        type: "JOINT_LIABILITY_AGREEMENT",
        reference: `private://groups/${created.id}/agreement/v1`,
        version: 1,
        status: "RECORDED",
        groupId: created.id,
      },
    });
    return created;
  });
  await recordAuditEvent({
    eventType: "GROUP_CREATED",
    outcome: "SUCCESS",
    actorUserId: session.user.id,
    permission: "manage_groups",
    resource: `group:${group.groupNumber}`,
    reason: "draft_with_initial_members",
    branchId,
  });
  return NextResponse.json(
    { id: group.id, groupNumber: group.groupNumber },
    { status: 201 },
  );
}
