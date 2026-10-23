import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (
    !session ||
    !canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "submit_cash_handovers",
      session.user.featureGate,
      true,
      session.user.role,
    )
  )
    return NextResponse.json(
      { error: "Handover submission permission is required." },
      { status: 403 },
    );

  const body = (await request.json()) as Record<string, unknown>;
  const receiptIds = Array.isArray(body.receiptIds)
    ? [
        ...new Set(
          body.receiptIds.filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
        ),
      ]
    : [];
  if (receiptIds.length === 0)
    return NextResponse.json(
      { error: "Select at least one captured receipt." },
      { status: 400 },
    );

  const scope = await requireBranchScope(session);
  try {
    const suffix = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    const handover = await db.$transaction(
      async (tx) => {
        const receipts = await tx.receipt.findMany({
          where: {
            id: { in: receiptIds },
            collectorUserId: session.user.id,
            status: "CAPTURED",
          },
          include: { handoverLinks: { where: { active: true } } },
        });
        if (receipts.length !== receiptIds.length)
          throw new Error(
            "Every selected receipt must be captured by this account and outside another active handover.",
          );
        if (receipts.some((receipt) => receipt.handoverLinks.length > 0))
          throw new Error(
            "A selected receipt already belongs to an active handover.",
          );
        const branchIds = new Set(receipts.map((receipt) => receipt.branchId));
        if (branchIds.size !== 1)
          throw new Error(
            "One handover cannot combine receipts from different branches.",
          );
        const branchId = receipts[0].branchId;
        assertBranchAccess(branchId, scope);
        const expectedPesewas = receipts.reduce(
          (sum, receipt) => sum + receipt.amountPesewas,
          0,
        );
        const created = await tx.handover.create({
          data: {
            handoverNumber: `HND-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${suffix}`,
            status: "SUBMITTED",
            expectedPesewas,
            submittedAt: new Date(),
            branchId,
            collectorUserId: session.user.id,
            receipts: {
              create: receipts.map((receipt) => ({ receiptId: receipt.id })),
            },
          },
        });
        await tx.receipt.updateMany({
          where: { id: { in: receiptIds }, status: "CAPTURED" },
          data: { status: "HANDED_OVER" },
        });
        return created;
      },
      { isolationLevel: "Serializable" },
    );
    await recordAuditEvent({
      eventType: "CASH_HANDOVER_SUBMITTED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "submit_cash_handovers",
      resource: `handover:${handover.handoverNumber}`,
      branchId: handover.branchId,
    });
    return NextResponse.json(
      { id: handover.id, number: handover.handoverNumber },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Handover submission failed.",
      },
      { status: 409 },
    );
  }
}
