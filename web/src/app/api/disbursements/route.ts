import { NextResponse, type NextRequest } from "next/server";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";
import { releaseLoanCash } from "@/server/disbursements/release";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const allowed = Boolean(
    session &&
    ["approve_disbursements", "post_reconciled_receipts"].some((permission) =>
      canPerformPermission(
        session.user.permissions,
        session.user.restrictions,
        permission,
        session.user.featureGate,
        true,
        session.user.role,
      ),
    ),
  );
  if (!session || !allowed)
    return NextResponse.json(
      { error: "Cash-release permission is required." },
      { status: 403 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const loanId = typeof body.loanId === "string" ? body.loanId : "";
  const loan = await db.loan.findUnique({ where: { id: loanId } });
  if (!loan)
    return NextResponse.json({ error: "Loan was not found." }, { status: 404 });
  const scope = await requireBranchScope(session);
  try {
    assertBranchAccess(loan.branchId, scope);
    const disbursement = await releaseLoanCash({
      loanId,
      reservationId:
        typeof body.reservationId === "string" ? body.reservationId : "",
      beneficiaryBorrowerId:
        typeof body.beneficiaryBorrowerId === "string"
          ? body.beneficiaryBorrowerId
          : "",
      identityConfirmed: body.identityConfirmed === true,
      voucherNumber:
        typeof body.voucherNumber === "string" ? body.voucherNumber : "",
      voucherDocumentReference:
        typeof body.voucherDocumentReference === "string"
          ? body.voucherDocumentReference
          : "",
      voucherSignedAt: new Date(String(body.voucherSignedAt ?? "")),
      actualCashOutAt: new Date(String(body.actualCashOutAt ?? "")),
      idempotencyKey:
        typeof body.idempotencyKey === "string" ? body.idempotencyKey : "",
      preparedByUserId: session.user.id,
    });
    await recordAuditEvent({
      eventType: "LOAN_CASH_DISBURSED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "approve_disbursements",
      resource: `disbursement:${disbursement.disbursementNumber}`,
      branchId: loan.branchId,
    });
    return NextResponse.json(
      {
        id: disbursement.id,
        disbursementNumber: disbursement.disbursementNumber,
        replayed: disbursement.idempotencyKey === body.idempotencyKey,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Cash release failed.",
      },
      { status: 409 },
    );
  }
}
