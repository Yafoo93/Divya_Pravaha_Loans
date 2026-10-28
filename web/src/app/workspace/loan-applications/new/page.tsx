import { db } from "@/lib/db";
import {
  requireBranchScope,
  branchScopeLabel,
} from "@/server/auth/branch-scope";
import { requirePermission } from "@/server/auth/session";
import { LoanApplicationForm } from "../../../components/loan-application-form";
import { PageHeading } from "../../../components/page-heading";

export default async function NewLoanApplicationPage() {
  const session = await requirePermission("submit_loan_applications", true);
  const scope = await requireBranchScope(session);
  const branch = branchScopeLabel(scope);
  const memberships = await db.groupMembership.findMany({
    where: {
      status: "ACTIVE",
      borrower: {
        status: "ACTIVE",
        branchId: { in: [...scope.branchIds] },
        loans: {
          none: {
            status: {
              in: [
                "ACTIVE",
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "APPROVED",
                "AWAITING_DISBURSEMENT",
              ],
            },
          },
        },
      },
      group: { branchId: { in: [...scope.branchIds] } },
    },
    include: {
      borrower: {
        include: {
          verifications: { where: { status: "VERIFIED" }, take: 1 },
        },
      },
      group: {
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: {
              borrower: {
                include: {
                  verifications: {
                    where: { status: "VERIFIED" },
                    take: 1,
                  },
                },
              },
            },
          },
          agreements: {
            where: { status: "SIGNED", signedAt: { not: null } },
            take: 1,
          },
        },
      },
    },
    orderBy: { borrower: { legalName: "asc" } },
  });
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <PageHeading
          title="New loan application"
          description="Capture confirmed eligibility, fixed terms, private evidence, and an exact schedule preview."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
        />
        <LoanApplicationForm
          memberships={memberships.map((m) => ({
            id: m.borrower.id,
            customerId: m.borrower.customerId,
            legalName: m.borrower.legalName,
            groupId: m.group.id,
            groupName: m.group.name,
            groupNumber: m.group.groupNumber,
            groupStatus: m.group.status,
            activeMemberCount: m.group.memberships.length,
            verifiedConsentingMemberCount: m.group.memberships.filter(
              (member) =>
                member.hasConsented && member.borrower.verifications.length > 0,
            ).length,
            borrowerVerifiedAndConsenting:
              m.hasConsented && m.borrower.verifications.length > 0,
            hasSignedAgreement: m.group.agreements.length > 0,
          }))}
        />
      </div>
    </main>
  );
}
