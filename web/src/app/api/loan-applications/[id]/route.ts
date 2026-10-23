import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { calculateLoanTerms, type LoanFrequency } from "@/lib/loan-application";
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
      "submit_loan_applications",
      session.user.featureGate,
      true,
      session.user.role,
    ),
  );
  if (!session || !allowed)
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const application = await db.loan.findFirst({
    where: andBranchScope(scope, {
      OR: [{ id }, { loanNumber: id }],
      status: { in: ["DRAFT", "REJECTED"] },
    }),
    include: {
      product: true,
      termsSnapshots: { orderBy: { version: "desc" }, take: 1 },
      group: {
        include: {
          memberships: {
            where: { status: "ACTIVE", hasConsented: true },
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
        },
      },
    },
  });
  if (!application || !application.product)
    return NextResponse.json(
      { error: "Draft or rejected application not found." },
      { status: 404 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const principalPesewas = Math.round(Number(body.principalGhs) * 100);
  const termMonths = Number(body.termMonths);
  const frequency = (
    typeof body.frequency === "string"
      ? body.frequency
      : application.repaymentFrequency
  ) as LoanFrequency;
  const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (
    purpose.length < 10 ||
    (application.status === "REJECTED" && reason.length < 10)
  )
    return NextResponse.json(
      {
        error:
          "Purpose is required, and changed rejected terms require a reason of at least 10 characters.",
      },
      { status: 400 },
    );
  let terms;
  try {
    terms = calculateLoanTerms(principalPesewas, termMonths, frequency);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid terms." },
      { status: 400 },
    );
  }
  const agreement = application.group.agreements[0];
  const guarantorBorrowerIds = application.group.memberships
    .filter(
      (m) =>
        m.borrowerId !== application.borrowerId &&
        m.borrower.verifications.length > 0,
    )
    .map((m) => m.borrowerId);
  if (!agreement || guarantorBorrowerIds.length === 0)
    return NextResponse.json(
      { error: "Signed agreement and verified guarantors are required." },
      { status: 409 },
    );
  const previous = application.termsSnapshots[0];
  const changed =
    !previous ||
    previous.principalPesewas !== principalPesewas ||
    previous.termMonths !== termMonths ||
    previous.repaymentFrequency !== frequency ||
    previous.businessPurpose !== purpose;
  if (application.status === "REJECTED" && !changed)
    return NextResponse.json(
      {
        error:
          "Rejected terms must be changed before a new controlled decision.",
      },
      { status: 409 },
    );
  const version = (previous?.version ?? 0) + 1;
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
  await db.$transaction(async (tx) => {
    await tx.loan.update({
      where: { id: application.id },
      data: {
        status: "SUBMITTED",
        principalPesewas,
        contractualInterest: terms.interestPesewas,
        totalRepayablePesewas: terms.totalRepayablePesewas,
        termMonths,
        repaymentFrequency: frequency,
        businessPurpose: purpose,
        submittedByUserId: session.user.id,
      },
    });
    const snapshot = await tx.loanTermsSnapshot.create({
      data: {
        snapshotNumber: `LTS-${suffix}-V${version}`,
        version,
        principalPesewas,
        contractualInterest: terms.interestPesewas,
        totalRepayablePesewas: terms.totalRepayablePesewas,
        termMonths,
        repaymentFrequency: frequency,
        businessPurpose: purpose,
        productCode: application.product!.code,
        productVersion: application.product!.version,
        loanId: application.id,
        createdByUserId: session.user.id,
      },
    });
    await tx.loanGuaranteeSnapshot.create({
      data: {
        snapshotNumber: `LGS-${suffix}-V${version}`,
        version,
        guarantorBorrowerIds,
        agreementNumber: agreement.agreementNumber,
        agreementVersion: agreement.version,
        loanId: application.id,
        termsSnapshotId: snapshot.id,
      },
    });
    await tx.loanApplicationEvent.create({
      data: {
        eventNumber: `LAE-${suffix}`,
        eventType: previous ? "CHANGED_TERMS_RESUBMITTED" : "DRAFT_SUBMITTED",
        fromStatus: application.status,
        toStatus: "SUBMITTED",
        reason: previous
          ? reason
          : "Draft submitted for independent manager review.",
        loanId: application.id,
        actorUserId: session.user.id,
      },
    });
  });
  await recordAuditEvent({
    eventType: previous
      ? "LOAN_TERMS_RESUBMITTED"
      : "LOAN_APPLICATION_SUBMITTED",
    outcome: "SUCCESS",
    actorUserId: session.user.id,
    permission: "submit_loan_applications",
    resource: `loan-application:${application.loanNumber}:snapshot-v${version}`,
    reason: previous ? reason : "draft_submitted",
    branchId: application.branchId,
  });
  return NextResponse.json({ ok: true, version });
}
