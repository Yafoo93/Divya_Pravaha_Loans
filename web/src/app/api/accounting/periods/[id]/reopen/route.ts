import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assertIndependentPeriodChecker } from "@/lib/accounting-period-rules";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordSensitiveAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

export async function POST(
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
  const action = typeof body.action === "string" ? body.action : "REQUEST";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 10)
    return NextResponse.json(
      { error: "A reason of at least ten characters is required." },
      { status: 400 },
    );
  const permission =
    action === "REQUEST" ? "prepare_period_close" : "approve_exceptions";
  const allowed = canPerformPermission(
    session.user.permissions,
    session.user.restrictions,
    permission,
    session.user.featureGate,
    true,
    session.user.role,
  );
  if (!allowed || (action !== "REQUEST" && session.user.role !== "MANAGER"))
    return NextResponse.json(
      { error: "Period control permission is required." },
      { status: 403 },
    );
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const period = await db.accountingPeriod.findUnique({ where: { id } });
  if (!period)
    return NextResponse.json(
      { error: "Accounting period not found." },
      { status: 404 },
    );
  try {
    assertBranchAccess(period.branchId, scope);
    if (action === "REQUEST") {
      if (period.status !== "CLOSED")
        throw new Error("Only a closed period can be reopened.");
      const existing = await db.periodReopeningRequest.findFirst({
        where: { periodId: period.id, status: "PENDING" },
      });
      if (existing)
        throw new Error("A pending reopening request already exists.");
      const created = await db.periodReopeningRequest.create({
        data: {
          requestNumber: `PRQ-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
          reason,
          periodId: period.id,
          branchId: period.branchId,
          requestedByUserId: session.user.id,
        },
      });
      return NextResponse.json(
        { requestNumber: created.requestNumber, status: created.status },
        { status: 202 },
      );
    }
    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    const pending = await db.periodReopeningRequest.findUnique({
      where: { id: requestId },
    });
    if (
      !pending ||
      pending.periodId !== period.id ||
      pending.status !== "PENDING"
    )
      throw new Error("A pending reopening request is required.");
    assertIndependentPeriodChecker(pending.requestedByUserId, session.user.id);
    const approved = action === "APPROVE";
    await db.$transaction([
      db.periodReopeningRequest.update({
        where: { id: pending.id },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          decisionReason: reason,
          decidedAt: new Date(),
          decidedByUserId: session.user.id,
        },
      }),
      ...(approved
        ? [
            db.accountingPeriod.update({
              where: { id: period.id },
              data: { status: "OPEN", closedAt: null },
            }),
          ]
        : []),
    ]);
    await recordSensitiveAuditEvent(approved ? "approval" : "rejection", {
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission,
      resource: `period:${period.periodKey}`,
      reason,
      branchId: period.branchId,
    });
    return NextResponse.json({ status: approved ? "OPEN" : "CLOSED" });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Period action failed.",
      },
      { status: 409 },
    );
  }
}
