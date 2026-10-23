import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  const allowed = Boolean(
    session &&
    canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "manage_borrower_drafts",
      session.user.featureGate,
      true,
      session.user.role,
    ),
  );
  if (!session || !allowed)
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const borrower = await db.borrower.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { customerId: id }] }),
  });
  if (!borrower)
    return NextResponse.json({ error: "Borrower not found." }, { status: 404 });
  const body = (await request.json()) as Record<string, unknown>;
  const data = {
    legalName: typeof body.legalName === "string" ? body.legalName.trim() : "",
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    residentialAddress:
      typeof body.residentialAddress === "string"
        ? body.residentialAddress.trim()
        : "",
    businessDetails:
      typeof body.businessDetails === "string"
        ? body.businessDetails.trim()
        : "",
  };
  if (Object.values(data).some((value) => !value))
    return NextResponse.json(
      { error: "All borrower fields are required." },
      { status: 400 },
    );
  await db.borrower.update({ where: { id: borrower.id }, data });
  await recordAuditEvent({
    eventType: "BORROWER_UPDATED",
    outcome: "SUCCESS",
    actorUserId: session.user.id,
    permission: "manage_borrower_drafts",
    resource: `borrower:${borrower.customerId}`,
    reason: "profile_details_updated",
    branchId: borrower.branchId,
  });
  return NextResponse.json({ ok: true });
}
