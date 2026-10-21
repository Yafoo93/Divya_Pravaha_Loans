import { NextResponse, type NextRequest } from "next/server";
import {
  assertBorrowerMayApply,
  RestrictedBorrowerError,
} from "@/lib/borrower-controls";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const allowed = Boolean(
    session &&
    canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "submit_loan_applications",
      session.user.featureGate,
      true,
      session.user.role,
    ),
  );
  if (!session || !allowed) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
  const borrowerId =
    body && typeof body === "object" && "borrowerId" in body
      ? String(body.borrowerId)
      : "";
  if (!borrowerId) {
    return NextResponse.json(
      { error: "Borrower is required." },
      { status: 400 },
    );
  }

  const scope = await requireBranchScope(session);
  const borrower = await db.borrower.findFirst({
    where: andBranchScope(scope, {
      OR: [{ id: borrowerId }, { customerId: borrowerId }],
    }),
    select: { id: true, customerId: true, status: true, branchId: true },
  });
  if (!borrower) {
    return NextResponse.json({ error: "Borrower not found." }, { status: 404 });
  }

  try {
    assertBorrowerMayApply(borrower.status);
  } catch (error) {
    if (error instanceof RestrictedBorrowerError) {
      await recordAuditEvent({
        eventType: "LOAN_APPLICATION_ELIGIBILITY",
        outcome: "DENIED",
        actorUserId: session.user.id,
        permission: "submit_loan_applications",
        resource: `borrower:${borrower.customerId}`,
        reason: "borrower_restricted",
        branchId: borrower.branchId,
      });
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  await recordAuditEvent({
    eventType: "LOAN_APPLICATION_ELIGIBILITY",
    outcome: "SUCCESS",
    actorUserId: session.user.id,
    permission: "submit_loan_applications",
    resource: `borrower:${borrower.customerId}`,
    reason: "borrower_active",
    branchId: borrower.branchId,
  });
  return NextResponse.json({ eligible: true, borrowerId: borrower.id });
}
