import { NextResponse, type NextRequest } from "next/server";
import { generateCustomerId } from "@/lib/borrower-controls";
import { db } from "@/lib/db";
import {
  normalizeGhanaCard,
  validateBorrowerOnboarding,
  type BorrowerOnboardingValues,
} from "@/lib/borrower-onboarding";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";

function parseBody(value: unknown): BorrowerOnboardingValues | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  return {
    legalName: typeof body.legalName === "string" ? body.legalName : "",
    phone: typeof body.phone === "string" ? body.phone : "",
    residentialAddress:
      typeof body.residentialAddress === "string"
        ? body.residentialAddress
        : "",
    businessDetails:
      typeof body.businessDetails === "string" ? body.businessDetails : "",
    ghanaCardNumber:
      typeof body.ghanaCardNumber === "string" ? body.ghanaCardNumber : "",
    ghanaCardVerified: body.ghanaCardVerified === true,
    branchId: typeof body.branchId === "string" ? body.branchId : "",
    groupId: typeof body.groupId === "string" ? body.groupId : "",
    consentReference:
      typeof body.consentReference === "string" ? body.consentReference : "",
    consentConfirmed: body.consentConfirmed === true,
  };
}

export async function POST(request: NextRequest) {
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
  await recordAuditEvent({
    eventType: "PERMISSION_CHECK",
    outcome: allowed ? "SUCCESS" : "DENIED",
    actorUserId: session?.user.id,
    permission: "manage_borrower_drafts",
    resource: "/api/borrowers",
    reason: allowed ? "granted" : "permission_not_granted",
  });
  if (!session || !allowed) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
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
  const values = parseBody(rawBody);
  if (!values) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
  const errors = validateBorrowerOnboarding(values);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Check the highlighted borrower details.", errors },
      { status: 400 },
    );
  }

  const scope = await requireBranchScope(session);
  try {
    assertBranchAccess(values.branchId, scope);
  } catch {
    return NextResponse.json(
      { error: "The selected branch is outside your assignment." },
      { status: 403 },
    );
  }
  const group = values.groupId
    ? await db.borrowerGroup.findFirst({
        where: {
          id: values.groupId,
          branchId: values.branchId,
          status: { in: ["DRAFT", "ACTIVE"] },
        },
        select: { id: true },
      })
    : null;
  if (values.groupId && !group) {
    return NextResponse.json(
      { error: "Select an available group from the borrower’s branch." },
      { status: 400 },
    );
  }

  const ghanaCardNumber = normalizeGhanaCard(values.ghanaCardNumber);
  const duplicate = await db.borrower.findUnique({
    where: { ghanaCardNumber },
    select: { customerId: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: `This Ghana Card already belongs to ${duplicate.customerId}.` },
      { status: 409 },
    );
  }

  const customerId = generateCustomerId();
  try {
    const borrower = await db.$transaction(async (tx) => {
      const created = await tx.borrower.create({
        data: {
          customerId,
          legalName: values.legalName.trim(),
          phone: values.phone.trim(),
          residentialAddress: values.residentialAddress.trim(),
          businessDetails: values.businessDetails.trim(),
          ghanaCardNumber,
          ghanaCardVerified: values.ghanaCardVerified,
          consentReference: values.consentReference.trim(),
          status: "ACTIVE",
          branchId: values.branchId,
        },
      });
      if (group) {
        await tx.groupMembership.create({
          data: {
            groupId: group.id,
            borrowerId: created.id,
            status: "ACTIVE",
            joinedAt: new Date(),
            hasConsented: true,
          },
        });
      }
      await tx.verification.create({
        data: {
          verificationNumber: `VER-${customerId}`,
          type: "GHANA_CARD",
          status: values.ghanaCardVerified ? "VERIFIED" : "PENDING",
          evidenceReference: `KYC-${customerId}`,
          verifiedAt: values.ghanaCardVerified ? new Date() : null,
          verifiedByUserId: values.ghanaCardVerified ? session.user.id : null,
          borrowerId: created.id,
        },
      });
      await tx.consentRecord.create({
        data: {
          consentNumber: values.consentReference.trim(),
          consentType: "BORROWER_DATA_AND_CREDIT",
          version: "v1",
          status: "RECORDED",
          recordedByUserId: session.user.id,
          borrowerId: created.id,
        },
      });
      await tx.businessAssessment.create({
        data: {
          assessmentNumber: `BUS-${customerId}`,
          summary: values.businessDetails.trim(),
          status: "COMPLETED",
          assessedAt: new Date(),
          assessedByUserId: session.user.id,
          borrowerId: created.id,
        },
      });
      for (const [documentNumber, type, storageReference, status] of [
        [
          `DOC-KYC-${customerId}`,
          "GHANA_CARD",
          `private://borrowers/${created.id}/ghana-card`,
          values.ghanaCardVerified ? "VERIFIED" : "PENDING",
        ],
        [
          `DOC-CONS-${customerId}`,
          "BORROWER_CONSENT",
          `private://borrowers/${created.id}/consent`,
          "VERIFIED",
        ],
      ] as const) {
        await tx.document.create({
          data: {
            documentNumber,
            type,
            storageReference,
            status,
            borrowerId: created.id,
            uploadedByUserId: session.user.id,
            versions: {
              create: {
                version: 1,
                storageReference,
                uploadedByUserId: session.user.id,
              },
            },
          },
        });
      }
      return created;
    });
    await recordAuditEvent({
      eventType: "BORROWER_CREATED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "manage_borrower_drafts",
      resource: `borrower:${borrower.customerId}`,
      reason: group ? "created_with_group_membership" : "created_without_group",
      branchId: values.branchId,
    });
    return NextResponse.json(
      { id: borrower.id, customerId: borrower.customerId },
      { status: 201 },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "The Ghana Card or generated customer ID already exists." },
        { status: 409 },
      );
    }
    await recordAuditEvent({
      eventType: "BORROWER_CREATED",
      outcome: "FAILURE",
      actorUserId: session.user.id,
      permission: "manage_borrower_drafts",
      resource: `borrower:${customerId}`,
      reason: "database_create_failed",
      branchId: values.branchId,
    });
    throw error;
  }
}
