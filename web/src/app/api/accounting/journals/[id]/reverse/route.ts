import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { recordSensitiveAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

/** Reversals are requested here and executed only from the independent approval queue. */
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
      "manage_ledger",
      session.user.featureGate,
      true,
      session.user.role,
    ),
  );
  if (!session || !allowed)
    return NextResponse.json(
      { error: "Controlled ledger permission is required." },
      { status: 403 },
    );
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const original = await db.journalEntry.findFirst({
    where: andBranchScope(scope, {
      OR: [{ id }, { journalNumber: id }],
      status: "POSTED",
    }),
  });
  if (!original)
    return NextResponse.json(
      { error: "Posted journal not found." },
      { status: 404 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 10)
    return NextResponse.json(
      { error: "A reversal reason of at least ten characters is required." },
      { status: 400 },
    );
  const existing = await db.reversalRequest.findFirst({
    where: { originalJournalId: original.id, status: "PENDING" },
  });
  if (existing)
    return NextResponse.json(
      { error: "A pending reversal request already exists." },
      { status: 409 },
    );
  const receipt = await db.receipt.findFirst({
    where: {
      OR: [
        { receiptNumber: original.sourceReference },
        { payment: { paymentNumber: original.sourceReference } },
      ],
    },
  });
  const created = await db.reversalRequest.create({
    data: {
      requestNumber: `RRQ-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
      reason,
      branchId: original.branchId,
      originalJournalId: original.id,
      receiptId: receipt?.id,
      requestedByUserId: session.user.id,
      replacementData:
        body.replacement && typeof body.replacement === "object"
          ? JSON.parse(JSON.stringify(body.replacement))
          : undefined,
    },
  });
  await recordSensitiveAuditEvent("reversal", {
    outcome: "SUCCESS",
    actorUserId: session.user.id,
    permission: "manage_ledger",
    resource: `reversal-request:${created.requestNumber}`,
    reason,
    branchId: original.branchId,
  });
  return NextResponse.json(
    { requestNumber: created.requestNumber, status: created.status },
    { status: 202 },
  );
}
