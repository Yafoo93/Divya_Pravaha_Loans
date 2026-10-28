import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  assertBorrowerMayApply,
  RestrictedBorrowerError,
} from "@/lib/borrower-controls";
import { db } from "@/lib/db";
import {
  calculateLoanTerms,
  PRODUCT_CODE,
  PRODUCT_VERSION,
  type LoanFrequency,
} from "@/lib/loan-application";
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
  if (!session || !allowed)
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const scope = await requireBranchScope(session);
  const body = (await request.json()) as Record<string, unknown>;
  const borrowerId = typeof body.borrowerId === "string" ? body.borrowerId : "";
  const groupId = typeof body.groupId === "string" ? body.groupId : "";
  const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
  const principalPesewas = Math.round(Number(body.principalGhs) * 100);
  const termMonths = Number(body.termMonths);
  const frequency =
    typeof body.frequency === "string"
      ? (body.frequency as LoanFrequency)
      : "MONTHLY";
  const submit = body.submit === true;
  const documents = Array.isArray(body.documents)
    ? body.documents.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
    : [];
  if (!borrowerId || !groupId || purpose.length < 10)
    return NextResponse.json(
      { error: "Borrower, group, and a clear business purpose are required." },
      { status: 400 },
    );
  let terms;
  try {
    terms = calculateLoanTerms(principalPesewas, termMonths, frequency);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid product terms.",
      },
      { status: 400 },
    );
  }
  const borrower = await db.borrower.findFirst({
    where: andBranchScope(scope, { id: borrowerId }),
    include: { memberships: { where: { groupId, status: "ACTIVE" }, take: 1 } },
  });
  if (!borrower)
    return NextResponse.json(
      { error: "Borrower not found in your assigned branch." },
      { status: 404 },
    );
  try {
    assertBorrowerMayApply(borrower.status);
  } catch (error) {
    if (error instanceof RestrictedBorrowerError)
      return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
  const group = await db.borrowerGroup.findFirst({
    where: { id: groupId, branchId: borrower.branchId, status: "ACTIVE" },
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
  });
  if (!group || borrower.memberships.length === 0)
    return NextResponse.json(
      {
        error:
          "Borrower must be an active member of the selected active group.",
      },
      { status: 409 },
    );
  const agreement = group.agreements[0];
  const verifiedConsentingMembers = group.memberships.filter(
    (membership) =>
      membership.hasConsented && membership.borrower.verifications.length > 0,
  );
  const selectedBorrowerIsEligible = group.memberships.some(
    (membership) =>
      membership.borrowerId === borrower.id &&
      membership.hasConsented &&
      membership.borrower.verifications.length > 0,
  );
  if (verifiedConsentingMembers.length < 5 || !agreement)
    return NextResponse.json(
      {
        error:
          "The group must have at least five active, verified, consenting members and a signed joint-liability agreement.",
      },
      { status: 409 },
    );
  if (!selectedBorrowerIsEligible)
    return NextResponse.json(
      {
        error:
          "The selected borrower must be verified and consenting in this group.",
      },
      { status: 409 },
    );
  const guarantorBorrowerIds = verifiedConsentingMembers
    .filter((membership) => membership.borrowerId !== borrower.id)
    .map((membership) => membership.borrowerId);
  const [activeLoan, openApplication, product] = await Promise.all([
    db.loan.findFirst({
      where: { borrowerId: borrower.id, status: "ACTIVE" },
      select: { loanNumber: true },
    }),
    db.loan.findFirst({
      where: {
        borrowerId: borrower.id,
        status: {
          in: [
            "DRAFT",
            "SUBMITTED",
            "UNDER_REVIEW",
            "APPROVED",
            "AWAITING_DISBURSEMENT",
          ],
        },
      },
      select: { loanNumber: true },
    }),
    db.loanProduct.findUnique({
      where: { code_version: { code: PRODUCT_CODE, version: PRODUCT_VERSION } },
    }),
  ]);
  if (activeLoan)
    return NextResponse.json(
      { error: `Borrower already has active loan ${activeLoan.loanNumber}.` },
      { status: 409 },
    );
  if (openApplication)
    return NextResponse.json(
      {
        error: `Borrower already has nonterminal application ${openApplication.loanNumber}.`,
      },
      { status: 409 },
    );
  if (!product || !product.isActive)
    return NextResponse.json(
      { error: "The GROUP_FLAT_20 product is not active." },
      { status: 409 },
    );
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  const applicationNumber = `APP-${suffix}`;
  const status = submit ? "SUBMITTED" : "DRAFT";
  const created = await db.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        loanNumber: applicationNumber,
        status,
        principalPesewas,
        contractualInterest: terms.interestPesewas,
        totalRepayablePesewas: terms.totalRepayablePesewas,
        termMonths,
        repaymentFrequency: frequency,
        businessPurpose: purpose,
        branchId: borrower.branchId,
        borrowerId: borrower.id,
        groupId: group.id,
        submittedByUserId: session.user.id,
        productId: product.id,
      },
    });
    await tx.loanApplicationEvent.create({
      data: {
        eventNumber: `LAE-${suffix}`,
        eventType: submit ? "APPLICATION_SUBMITTED" : "DRAFT_CREATED",
        fromStatus: null,
        toStatus: status,
        reason: submit
          ? "Submitted for independent manager review."
          : "Application draft created.",
        loanId: loan.id,
        actorUserId: session.user.id,
      },
    });
    if (submit) {
      const snapshot = await tx.loanTermsSnapshot.create({
        data: {
          snapshotNumber: `LTS-${suffix}-V1`,
          version: 1,
          principalPesewas,
          contractualInterest: terms.interestPesewas,
          totalRepayablePesewas: terms.totalRepayablePesewas,
          termMonths,
          repaymentFrequency: frequency,
          businessPurpose: purpose,
          productCode: product.code,
          productVersion: product.version,
          loanId: loan.id,
          createdByUserId: session.user.id,
        },
      });
      await tx.loanGuaranteeSnapshot.create({
        data: {
          snapshotNumber: `LGS-${suffix}-V1`,
          version: 1,
          guarantorBorrowerIds,
          agreementNumber: agreement.agreementNumber,
          agreementVersion: agreement.version,
          loanId: loan.id,
          termsSnapshotId: snapshot.id,
        },
      });
    }
    for (const [index, reference] of documents.entries())
      await tx.loanApplicationDocument.create({
        data: {
          documentNumber: `LAD-${suffix}-${index + 1}`,
          type: "SUPPORTING_EVIDENCE",
          reference: reference.trim(),
          status: "ATTACHED",
          loanId: loan.id,
        },
      });
    return loan;
  });
  await recordAuditEvent({
    eventType: submit
      ? "LOAN_APPLICATION_SUBMITTED"
      : "LOAN_APPLICATION_CREATED",
    outcome: "SUCCESS",
    actorUserId: session.user.id,
    permission: "submit_loan_applications",
    resource: `loan-application:${applicationNumber}`,
    reason: status.toLowerCase(),
    branchId: borrower.branchId,
  });
  return NextResponse.json(
    { id: created.id, applicationNumber },
    { status: 201 },
  );
}
