import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { recordSensitiveAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  const permissions = [
    "manage_borrower_drafts",
    "record_verification",
    "approve_or_reject_loans",
    "read_financial_history",
  ];
  const allowed = Boolean(
    session &&
    permissions.some((permission) =>
      canPerformPermission(
        session.user.permissions,
        session.user.restrictions,
        permission,
        session.user.featureGate,
        false,
        session.user.role,
      ),
    ),
  );
  if (!session || !allowed) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const scope = await requireBranchScope(session);
  const { id } = await params;
  const document = await db.document.findFirst({
    where: {
      id,
      isPrivate: true,
      borrower: { branchId: { in: [...scope.branchIds] } },
    },
    include: {
      borrower: { select: { customerId: true, branchId: true } },
      versions: { orderBy: { version: "desc" } },
    },
  });
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  const version =
    document.versions.find(
      (candidate) => candidate.version === document.currentVersion,
    ) ?? document.versions[0];

  await db.documentAccessEvent.create({
    data: {
      action: "VIEW_METADATA",
      outcome: "SUCCESS",
      reason: "authorized_private_document_access",
      documentId: document.id,
      versionId: version?.id ?? null,
      accessedByUserId: session.user.id,
    },
  });
  await recordSensitiveAuditEvent("privateDocumentAccess", {
    outcome: "SUCCESS",
    actorUserId: session.user.id,
    permission: permissions.join(","),
    resource: `private_document:${document.documentNumber}:v${version?.version ?? document.currentVersion}`,
    reason: "authorized_metadata_view",
    branchId: document.borrower.branchId,
  });

  return NextResponse.json({
    documentNumber: document.documentNumber,
    type: document.type,
    status: document.status,
    borrower: document.borrower.customerId,
    currentVersion: document.currentVersion,
    versions: document.versions.map((item) => ({
      version: item.version,
      fileName: item.fileName,
      uploadedAt: item.uploadedAt,
      checksumRecorded: Boolean(item.checksum),
    })),
  });
}
