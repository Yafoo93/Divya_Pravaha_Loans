import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/server/auth/password";
import { roleDefinitions } from "../src/lib/role-definitions";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const people = [
  ["CUS-0104", "Abena Boateng", "104", "Retail provisions"],
  ["CUS-0132", "Akuosa Addo", "132", "Wholesale groceries"],
  ["CUS-0129", "Efua Osei", "129", "Fabric and clothing"],
  ["CUS-0143", "Kweku Agyeman", "143", "Household supplies"],
  ["CUS-0190", "Akua Darko", "190", "Prepared foods"],
  ["CUS-0208", "Daniel Tetteh", "208", "Mobile accessories"],
] as const;

const staff = [
  [
    "STF-0001",
    "Abdul Latif Kassim",
    "abdul.kassim@divyapravaha.example",
    "MANAGER",
    "ACTIVE",
    "2026-10-18T14:42:00Z",
    true,
  ],
  [
    "STF-0002",
    "Tuahira Mahmud",
    "tuahira.mahmud@divyapravaha.example",
    "MANAGER",
    "ACTIVE",
    "2026-10-18T13:18:00Z",
    true,
  ],
  [
    "STF-0003",
    "Kwesi Aidoo",
    "kwesi.aidoo@divyapravaha.example",
    "SYSTEM_ADMIN",
    "ACTIVE",
    "2026-10-18T09:05:00Z",
    true,
  ],
  [
    "STF-0004",
    "Ama Mensah",
    "ama.mensah@divyapravaha.example",
    "LOAN_OFFICER",
    "ACTIVE",
    "2026-10-18T14:10:00Z",
    true,
  ],
  [
    "STF-0005",
    "Kofi Asante",
    "kofi.asante@divyapravaha.example",
    "FIELD_COLLECTOR",
    "ACTIVE",
    "2026-10-18T14:40:00Z",
    true,
  ],
  [
    "STF-0006",
    "Esi Quartey",
    "esi.quartey@divyapravaha.example",
    "CASHIER_ACCOUNTANT",
    "ACTIVE",
    "2026-10-18T14:30:00Z",
    true,
  ],
  [
    "STF-0007",
    "Adjoa Nyarko",
    "adjoa.nyarko@divyapravaha.example",
    "AUDITOR",
    "INACTIVE",
    "2026-10-12T16:20:00Z",
    false,
  ],
  [
    "STF-0008",
    "Nii Laryea",
    "nii.laryea@divyapravaha.example",
    "INVESTOR_PORTFOLIO_OFFICER",
    "SUSPENDED",
    "2026-09-30T11:15:00Z",
    true,
  ],
  [
    "USR-0009",
    "Kobina Mensimah",
    "kobina.mensimah@investor.divyapravaha.example",
    "INVESTOR_PORTAL_USER",
    "SUSPENDED",
    "2026-09-29T10:00:00Z",
    false,
  ],
] as const;

async function main() {
  const samplePasswordHash = await hashPassword("DemoLoan!2026");
  await db.$transaction(async (tx) => {
    const branch = await tx.branch.upsert({
      where: { code: "KASOA-MARKET" },
      update: { name: "Kasoa Market", isActive: true, isSampleData: true },
      create: {
        code: "KASOA-MARKET",
        name: "Kasoa Market",
        isActive: true,
        isSampleData: true,
      },
    });

    for (const role of roleDefinitions) {
      await tx.role.upsert({
        where: { code: role.code },
        update: {
          name: role.name,
          description: role.description,
          permissions: [...role.permissions],
          restrictions: [...role.restrictions],
          featureGate: role.featureGate,
          isActive: true,
          isSampleData: true,
        },
        create: {
          code: role.code,
          name: role.name,
          description: role.description,
          permissions: [...role.permissions],
          restrictions: [...role.restrictions],
          featureGate: role.featureGate,
          isActive: true,
          isSampleData: true,
        },
      });
    }

    const roleRecords = await tx.role.findMany();
    const roleIds = new Map(roleRecords.map((role) => [role.code, role.id]));
    const accessEffectiveFrom = new Date("2026-10-01T00:00:00Z");
    for (const [
      staffNumber,
      name,
      email,
      roleCode,
      status,
      lastActiveAt,
      assignToBranch,
    ] of staff) {
      const user = await tx.user.upsert({
        where: { staffNumber },
        update: {
          name,
          email,
          passwordHash: samplePasswordHash,
          status,
          lastActiveAt: new Date(lastActiveAt),
          isSampleData: true,
        },
        create: {
          staffNumber,
          name,
          email,
          passwordHash: samplePasswordHash,
          status,
          lastActiveAt: new Date(lastActiveAt),
          isSampleData: true,
        },
      });
      const roleId = roleIds.get(roleCode);
      if (!roleId) throw new Error(`Seed role not found: ${roleCode}`);
      await tx.userRole.upsert({
        where: { assignmentKey: `${staffNumber}:${roleCode}` },
        update: {
          userId: user.id,
          roleId,
          effectiveFrom: accessEffectiveFrom,
          effectiveTo: null,
          isSampleData: true,
        },
        create: {
          assignmentKey: `${staffNumber}:${roleCode}`,
          userId: user.id,
          roleId,
          effectiveFrom: accessEffectiveFrom,
          isSampleData: true,
        },
      });
      if (assignToBranch) {
        await tx.staffBranchAssignment.upsert({
          where: { assignmentKey: `${staffNumber}:${branch.code}` },
          update: {
            userId: user.id,
            branchId: branch.id,
            effectiveFrom: accessEffectiveFrom,
            effectiveTo: null,
            isSampleData: true,
          },
          create: {
            assignmentKey: `${staffNumber}:${branch.code}`,
            userId: user.id,
            branchId: branch.id,
            effectiveFrom: accessEffectiveFrom,
            isSampleData: true,
          },
        });
      }
    }

    const borrowers = new Map<string, { id: string }>();
    for (const [customerId, legalName, suffix, businessDetails] of people) {
      const borrower = await tx.borrower.upsert({
        where: { customerId },
        update: {
          legalName,
          phone: `+23324555${suffix.padStart(4, "0")}`,
          residentialAddress: "Kasoa Market, Central Region",
          businessDetails,
          ghanaCardNumber: `GHA-100000${suffix}-1`,
          ghanaCardVerified: true,
          consentReference: `CONS-${suffix.padStart(4, "0")}`,
          status: "ACTIVE",
          branchId: branch.id,
          isSampleData: true,
        },
        create: {
          customerId,
          legalName,
          phone: `+23324555${suffix.padStart(4, "0")}`,
          residentialAddress: "Kasoa Market, Central Region",
          businessDetails,
          ghanaCardNumber: `GHA-100000${suffix}-1`,
          ghanaCardVerified: true,
          consentReference: `CONS-${suffix.padStart(4, "0")}`,
          status: "ACTIVE",
          branchId: branch.id,
          isSampleData: true,
        },
      });
      borrowers.set(customerId, borrower);
      await tx.verification.upsert({
        where: { verificationNumber: `VER-${customerId}` },
        update: {
          type: "GHANA_CARD",
          status: "VERIFIED",
          evidenceReference: `KYC-${customerId}`,
          verifiedAt: new Date("2026-10-01T09:00:00Z"),
          borrowerId: borrower.id,
          isSampleData: true,
        },
        create: {
          verificationNumber: `VER-${customerId}`,
          type: "GHANA_CARD",
          status: "VERIFIED",
          evidenceReference: `KYC-${customerId}`,
          verifiedAt: new Date("2026-10-01T09:00:00Z"),
          borrowerId: borrower.id,
          isSampleData: true,
        },
      });
      await tx.consentRecord.upsert({
        where: { consentNumber: `CONS-${suffix.padStart(4, "0")}` },
        update: {
          consentType: "BORROWER_DATA_AND_CREDIT",
          version: "v1",
          status: "RECORDED",
          borrowerId: borrower.id,
          isSampleData: true,
        },
        create: {
          consentNumber: `CONS-${suffix.padStart(4, "0")}`,
          consentType: "BORROWER_DATA_AND_CREDIT",
          version: "v1",
          status: "RECORDED",
          recordedAt: new Date("2026-10-01T09:00:00Z"),
          borrowerId: borrower.id,
          isSampleData: true,
        },
      });
      await tx.businessAssessment.upsert({
        where: { assessmentNumber: `BUS-${customerId}` },
        update: {
          summary: businessDetails,
          status: "COMPLETED",
          assessedAt: new Date("2026-10-01T09:00:00Z"),
          borrowerId: borrower.id,
          isSampleData: true,
        },
        create: {
          assessmentNumber: `BUS-${customerId}`,
          summary: businessDetails,
          status: "COMPLETED",
          assessedAt: new Date("2026-10-01T09:00:00Z"),
          borrowerId: borrower.id,
          isSampleData: true,
        },
      });
      for (const [documentNumber, type, storageReference] of [
        [
          `DOC-KYC-${customerId}`,
          "GHANA_CARD",
          `private://borrowers/${borrower.id}/ghana-card`,
        ],
        [
          `DOC-CONS-${customerId}`,
          "BORROWER_CONSENT",
          `private://borrowers/${borrower.id}/consent`,
        ],
      ] as const) {
        const document = await tx.document.upsert({
          where: { documentNumber },
          update: {
            type,
            storageReference,
            status: "VERIFIED",
            borrowerId: borrower.id,
            isSampleData: true,
          },
          create: {
            documentNumber,
            type,
            storageReference,
            status: "VERIFIED",
            borrowerId: borrower.id,
            isSampleData: true,
          },
        });
        await tx.documentVersion.upsert({
          where: {
            documentId_version: { documentId: document.id, version: 1 },
          },
          update: { storageReference },
          create: {
            documentId: document.id,
            version: 1,
            storageReference,
          },
        });
      }
    }

    const loanOfficer = await tx.user.findUniqueOrThrow({
      where: { staffNumber: "STF-0004" },
    });
    const manager = await tx.user.findUniqueOrThrow({
      where: { staffNumber: "STF-0001" },
    });
    const cashier = await tx.user.findUniqueOrThrow({
      where: { staffNumber: "STF-0006" },
    });
    const accessedDocument = await tx.document.findUniqueOrThrow({
      where: { documentNumber: "DOC-KYC-CUS-0132" },
      include: { versions: { where: { version: 1 }, take: 1 } },
    });
    const existingDocumentAccess = await tx.documentAccessEvent.findFirst({
      where: {
        documentId: accessedDocument.id,
        accessedByUserId: manager.id,
        reason: "sample_authorized_review",
      },
    });
    if (!existingDocumentAccess) {
      await tx.documentAccessEvent.create({
        data: {
          action: "VIEW_METADATA",
          outcome: "SUCCESS",
          reason: "sample_authorized_review",
          accessedAt: new Date("2026-10-16T14:12:00Z"),
          documentId: accessedDocument.id,
          versionId: accessedDocument.versions[0]?.id ?? null,
          accessedByUserId: manager.id,
        },
      });
    }
    const sampleRestriction = await tx.borrowerRestriction.upsert({
      where: { restrictionNumber: "RST-SAMPLE-0190" },
      update: {
        reason:
          "Historical identity clarification was required before lending.",
        status: "REACTIVATED",
        restrictedAt: new Date("2026-09-20T10:00:00Z"),
        borrowerId: borrowers.get("CUS-0190")!.id,
        branchId: branch.id,
        restrictedByUserId: loanOfficer.id,
        isSampleData: true,
      },
      create: {
        restrictionNumber: "RST-SAMPLE-0190",
        reason:
          "Historical identity clarification was required before lending.",
        status: "REACTIVATED",
        restrictedAt: new Date("2026-09-20T10:00:00Z"),
        borrowerId: borrowers.get("CUS-0190")!.id,
        branchId: branch.id,
        restrictedByUserId: loanOfficer.id,
        isSampleData: true,
      },
    });
    await tx.reactivationDecision.upsert({
      where: { decisionNumber: "REA-SAMPLE-0190" },
      update: {
        requestReason:
          "Fresh identity evidence was supplied and independently checked.",
        status: "APPROVED",
        requestedAt: new Date("2026-09-25T09:00:00Z"),
        decisionReason:
          "Evidence is complete; normal eligibility checks may resume.",
        decidedAt: new Date("2026-09-26T11:00:00Z"),
        restrictionId: sampleRestriction.id,
        requestedByUserId: loanOfficer.id,
        decidedByUserId: manager.id,
        isSampleData: true,
      },
      create: {
        decisionNumber: "REA-SAMPLE-0190",
        requestReason:
          "Fresh identity evidence was supplied and independently checked.",
        status: "APPROVED",
        requestedAt: new Date("2026-09-25T09:00:00Z"),
        decisionReason:
          "Evidence is complete; normal eligibility checks may resume.",
        decidedAt: new Date("2026-09-26T11:00:00Z"),
        restrictionId: sampleRestriction.id,
        requestedByUserId: loanOfficer.id,
        decidedByUserId: manager.id,
        isSampleData: true,
      },
    });

    const group = await tx.borrowerGroup.upsert({
      where: { groupNumber: "GRP-0018" },
      update: {
        name: "Kasoa Market Circle",
        status: "ACTIVE",
        jointLiabilityReference: "JL-0018-v1",
        activatedAt: new Date("2026-04-15T09:00:00Z"),
        branchId: branch.id,
        officerId: loanOfficer.id,
        createdByUserId: loanOfficer.id,
        isSampleData: true,
      },
      create: {
        groupNumber: "GRP-0018",
        name: "Kasoa Market Circle",
        status: "ACTIVE",
        jointLiabilityReference: "JL-0018-v1",
        activatedAt: new Date("2026-04-15T09:00:00Z"),
        branchId: branch.id,
        officerId: loanOfficer.id,
        createdByUserId: loanOfficer.id,
        isSampleData: true,
      },
    });
    for (const [customerId] of people) {
      const seededMembership = await tx.groupMembership.findFirst({
        where: {
          groupId: group.id,
          borrowerId: borrowers.get(customerId)!.id,
          status: "ACTIVE",
        },
      });
      if (seededMembership) {
        await tx.groupMembership.update({
          where: { id: seededMembership.id },
          data: { hasConsented: true, isSampleData: true },
        });
      } else {
        await tx.groupMembership.create({
          data: {
            groupId: group.id,
            borrowerId: borrowers.get(customerId)!.id,
            status: "ACTIVE",
            joinedAt: new Date("2026-04-15T09:00:00Z"),
            hasConsented: true,
            isSampleData: true,
          },
        });
      }
      await tx.groupMembershipChange.upsert({
        where: { eventNumber: `GME-SEED-${customerId}` },
        update: {
          action: "JOINED",
          effectiveDate: new Date("2026-04-15T09:00:00Z"),
          reason: "Initial sample membership",
          borrowerId: borrowers.get(customerId)!.id,
          recordedByUserId: loanOfficer.id,
          groupId: group.id,
        },
        create: {
          eventNumber: `GME-SEED-${customerId}`,
          action: "JOINED",
          effectiveDate: new Date("2026-04-15T09:00:00Z"),
          reason: "Initial sample membership",
          borrowerId: borrowers.get(customerId)!.id,
          recordedByUserId: loanOfficer.id,
          groupId: group.id,
        },
      });
    }
    await tx.groupSnapshot.upsert({
      where: { snapshotNumber: "GS-SEED-0018" },
      update: { memberIds: people.map(([id]) => borrowers.get(id)!.id) },
      create: {
        snapshotNumber: "GS-SEED-0018",
        reason: "ACTIVATION",
        memberIds: people.map(([id]) => borrowers.get(id)!.id),
        capturedAt: new Date("2026-04-15T09:00:00Z"),
        groupId: group.id,
        isSampleData: true,
      },
    });
    await tx.groupDocument.upsert({
      where: { documentNumber: "GDOC-JL-0018" },
      update: {
        reference: `private://groups/${group.id}/agreement/v1`,
        groupId: group.id,
      },
      create: {
        documentNumber: "GDOC-JL-0018",
        type: "JOINT_LIABILITY_AGREEMENT",
        reference: `private://groups/${group.id}/agreement/v1`,
        version: 1,
        status: "VERIFIED",
        groupId: group.id,
        isSampleData: true,
      },
    });
    await tx.groupActivationReview.upsert({
      where: { reviewNumber: "GAR-SEED-0018" },
      update: {
        groupId: group.id,
        requestedByUserId: loanOfficer.id,
        decidedByUserId: manager.id,
      },
      create: {
        reviewNumber: "GAR-SEED-0018",
        status: "APPROVED",
        requestReason:
          "Six verified and consenting members with signed agreement.",
        requestedAt: new Date("2026-04-14T09:00:00Z"),
        decisionReason:
          "Independent review completed; activation requirements met.",
        decidedAt: new Date("2026-04-15T09:00:00Z"),
        groupId: group.id,
        requestedByUserId: loanOfficer.id,
        decidedByUserId: manager.id,
        isSampleData: true,
      },
    });
    await tx.groupAgreement.upsert({
      where: { agreementNumber: "JL-0018-v1" },
      update: {
        status: "SIGNED",
        signedAt: new Date("2026-04-15T09:00:00Z"),
        groupId: group.id,
      },
      create: {
        agreementNumber: "JL-0018-v1",
        version: 1,
        status: "SIGNED",
        documentReference: `private://groups/${group.id}/agreement/v1`,
        signedAt: new Date("2026-04-15T09:00:00Z"),
        groupId: group.id,
        isSampleData: true,
      },
    });
    await tx.groupVisit.upsert({
      where: { visitNumber: "GV-SEED-0018" },
      update: { groupId: group.id, officerId: loanOfficer.id },
      create: {
        visitNumber: "GV-SEED-0018",
        visitedAt: new Date("2026-04-14T10:00:00Z"),
        purpose: "Group formation and business verification",
        outcome:
          "Six verified members consented and signed the joint-liability agreement.",
        groupId: group.id,
        officerId: loanOfficer.id,
        isSampleData: true,
      },
    });
    await tx.groupStatusEvent.upsert({
      where: { eventNumber: "GSE-SEED-0018" },
      update: {
        toStatus: "ACTIVE",
        groupId: group.id,
        recordedByUserId: manager.id,
      },
      create: {
        eventNumber: "GSE-SEED-0018",
        fromStatus: "DRAFT",
        toStatus: "ACTIVE",
        effectiveAt: new Date("2026-04-15T09:00:00Z"),
        reason: "Independent activation review approved.",
        groupId: group.id,
        recordedByUserId: manager.id,
        isSampleData: true,
      },
    });

    const loanProduct = await tx.loanProduct.upsert({
      where: { code_version: { code: "GROUP_FLAT_20", version: 1 } },
      update: {
        name: "Group Flat 20%",
        interestRatePercent: 20,
        maximumTermMonths: 6,
        supportedFrequencies: ["WEEKLY", "FORTNIGHTLY", "MONTHLY"],
        effectiveFrom: new Date("2026-01-01T00:00:00Z"),
        effectiveTo: null,
        isActive: true,
        isSampleData: true,
      },
      create: {
        code: "GROUP_FLAT_20",
        version: 1,
        name: "Group Flat 20%",
        interestRatePercent: 20,
        maximumTermMonths: 6,
        supportedFrequencies: ["WEEKLY", "FORTNIGHTLY", "MONTHLY"],
        effectiveFrom: new Date("2026-01-01T00:00:00Z"),
        isActive: true,
        isSampleData: true,
      },
    });

    const loan = await tx.loan.upsert({
      where: { loanNumber: "LN-0204" },
      update: {
        status: "ACTIVE",
        principalPesewas: 1_000_000,
        contractualInterest: 200_000,
        totalRepayablePesewas: 1_200_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        disbursedAt: new Date("2026-04-30T10:00:00Z"),
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0104")!.id,
        groupId: group.id,
        productId: loanProduct.id,
        isSampleData: true,
      },
      create: {
        loanNumber: "LN-0204",
        status: "ACTIVE",
        principalPesewas: 1_000_000,
        contractualInterest: 200_000,
        totalRepayablePesewas: 1_200_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        disbursedAt: new Date("2026-04-30T10:00:00Z"),
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0104")!.id,
        groupId: group.id,
        productId: loanProduct.id,
        isSampleData: true,
      },
    });
    const activeLoanTerms = await tx.loanTermsSnapshot.upsert({
      where: { snapshotNumber: "LTS-LN-0204-V1" },
      update: {
        version: 1,
        principalPesewas: 1_000_000,
        contractualInterest: 200_000,
        totalRepayablePesewas: 1_200_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        businessPurpose: "Working capital for market trading.",
        productCode: "GROUP_FLAT_20",
        productVersion: 1,
        submittedAt: new Date("2026-04-29T10:00:00Z"),
        loanId: loan.id,
        createdByUserId: loanOfficer.id,
        isSampleData: true,
      },
      create: {
        snapshotNumber: "LTS-LN-0204-V1",
        version: 1,
        principalPesewas: 1_000_000,
        contractualInterest: 200_000,
        totalRepayablePesewas: 1_200_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        businessPurpose: "Working capital for market trading.",
        productCode: "GROUP_FLAT_20",
        productVersion: 1,
        submittedAt: new Date("2026-04-29T10:00:00Z"),
        loanId: loan.id,
        createdByUserId: loanOfficer.id,
        isSampleData: true,
      },
    });
    const activeLoanGuarantee = await tx.loanGuaranteeSnapshot.upsert({
      where: { snapshotNumber: "LGS-LN-0204-V1" },
      update: {
        version: 1,
        guarantorBorrowerIds: people
          .map(([customerId]) => borrowers.get(customerId)!.id)
          .filter((id) => id !== borrowers.get("CUS-0104")!.id),
        agreementNumber: "GA-GRP-0018-V2",
        agreementVersion: 2,
        loanId: loan.id,
        termsSnapshotId: activeLoanTerms.id,
        isSampleData: true,
      },
      create: {
        snapshotNumber: "LGS-LN-0204-V1",
        version: 1,
        guarantorBorrowerIds: people
          .map(([customerId]) => borrowers.get(customerId)!.id)
          .filter((id) => id !== borrowers.get("CUS-0104")!.id),
        agreementNumber: "GA-GRP-0018-V2",
        agreementVersion: 2,
        loanId: loan.id,
        termsSnapshotId: activeLoanTerms.id,
        isSampleData: true,
      },
    });
    await tx.loan.upsert({
      where: { loanNumber: "LN-0246" },
      update: {
        status: "ACTIVE",
        principalPesewas: 300_000,
        contractualInterest: 60_000,
        totalRepayablePesewas: 360_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        disbursedAt: new Date("2026-09-16T10:00:00Z"),
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0129")!.id,
        groupId: group.id,
        productId: loanProduct.id,
        isSampleData: true,
      },
      create: {
        loanNumber: "LN-0246",
        status: "ACTIVE",
        principalPesewas: 300_000,
        contractualInterest: 60_000,
        totalRepayablePesewas: 360_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        disbursedAt: new Date("2026-09-16T10:00:00Z"),
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0129")!.id,
        groupId: group.id,
        productId: loanProduct.id,
        isSampleData: true,
      },
    });

    const existingSampleRelease = await tx.disbursement.findFirst({
      where: { loan: { loanNumber: "APP-0268" } },
    });
    const sampleApplication = await tx.loan.upsert({
      where: { loanNumber: "APP-0268" },
      update: {
        status: existingSampleRelease ? "ACTIVE" : "AWAITING_DISBURSEMENT",
        principalPesewas: 1_000_000,
        contractualInterest: 200_000,
        totalRepayablePesewas: 1_200_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        businessPurpose: "Expand grocery stock for the festive season.",
        disbursedAt: existingSampleRelease?.actualCashOutAt ?? null,
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0132")!.id,
        groupId: group.id,
        productId: loanProduct.id,
        submittedByUserId: loanOfficer.id,
        isSampleData: true,
      },
      create: {
        loanNumber: "APP-0268",
        status: "AWAITING_DISBURSEMENT",
        principalPesewas: 1_000_000,
        contractualInterest: 200_000,
        totalRepayablePesewas: 1_200_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        businessPurpose: "Expand grocery stock for the festive season.",
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0132")!.id,
        groupId: group.id,
        productId: loanProduct.id,
        submittedByUserId: loanOfficer.id,
        isSampleData: true,
      },
    });
    const submittedTerms = await tx.loanTermsSnapshot.upsert({
      where: { snapshotNumber: "LTS-APP-0268-V1" },
      update: {
        version: 1,
        principalPesewas: 1_000_000,
        contractualInterest: 200_000,
        totalRepayablePesewas: 1_200_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        businessPurpose: "Expand grocery stock for the festive season.",
        productCode: "GROUP_FLAT_20",
        productVersion: 1,
        submittedAt: new Date("2026-10-16T14:02:00Z"),
        loanId: sampleApplication.id,
        createdByUserId: loanOfficer.id,
        isSampleData: true,
      },
      create: {
        snapshotNumber: "LTS-APP-0268-V1",
        version: 1,
        principalPesewas: 1_000_000,
        contractualInterest: 200_000,
        totalRepayablePesewas: 1_200_000,
        termMonths: 6,
        repaymentFrequency: "MONTHLY",
        businessPurpose: "Expand grocery stock for the festive season.",
        productCode: "GROUP_FLAT_20",
        productVersion: 1,
        submittedAt: new Date("2026-10-16T14:02:00Z"),
        loanId: sampleApplication.id,
        createdByUserId: loanOfficer.id,
        isSampleData: true,
      },
    });
    await tx.loanGuaranteeSnapshot.upsert({
      where: { snapshotNumber: "LGS-APP-0268-V1" },
      update: {
        version: 1,
        guarantorBorrowerIds: people
          .map(([customerId]) => borrowers.get(customerId)!.id)
          .filter((id) => id !== borrowers.get("CUS-0132")!.id),
        agreementNumber: "GA-GRP-0018-V2",
        agreementVersion: 2,
        loanId: sampleApplication.id,
        termsSnapshotId: submittedTerms.id,
        isSampleData: true,
      },
      create: {
        snapshotNumber: "LGS-APP-0268-V1",
        version: 1,
        guarantorBorrowerIds: people
          .map(([customerId]) => borrowers.get(customerId)!.id)
          .filter((id) => id !== borrowers.get("CUS-0132")!.id),
        agreementNumber: "GA-GRP-0018-V2",
        agreementVersion: 2,
        loanId: sampleApplication.id,
        termsSnapshotId: submittedTerms.id,
        isSampleData: true,
      },
    });
    await tx.loanApplicationEvent.upsert({
      where: { eventNumber: "LAE-APP-0268-SUBMITTED" },
      update: {
        eventType: "APPLICATION_SUBMITTED",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        reason:
          "Complete application submitted for independent manager review.",
        occurredAt: new Date("2026-10-16T14:02:00Z"),
        loanId: sampleApplication.id,
        actorUserId: loanOfficer.id,
        isSampleData: true,
      },
      create: {
        eventNumber: "LAE-APP-0268-SUBMITTED",
        eventType: "APPLICATION_SUBMITTED",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        reason:
          "Complete application submitted for independent manager review.",
        occurredAt: new Date("2026-10-16T14:02:00Z"),
        loanId: sampleApplication.id,
        actorUserId: loanOfficer.id,
        isSampleData: true,
      },
    });
    for (const [documentNumber, type] of [
      ["LAD-APP-0268-KYC", "IDENTITY_VERIFICATION"],
      ["LAD-APP-0268-BUS", "BUSINESS_ASSESSMENT"],
      ["LAD-APP-0268-CONS", "BORROWER_CONSENT"],
    ] as const) {
      await tx.loanApplicationDocument.upsert({
        where: { documentNumber },
        update: { status: "ATTACHED", loanId: sampleApplication.id },
        create: {
          documentNumber,
          type,
          reference: `private://loan-applications/APP-0268/${documentNumber}`,
          status: "ATTACHED",
          loanId: sampleApplication.id,
          isSampleData: true,
        },
      });
    }
    await tx.loanApplicationDocument.upsert({
      where: { documentNumber: "LAD-APP-0268-CONTRACT" },
      update: {
        type: "SIGNED_CONTRACT",
        reference:
          "private://loan-applications/APP-0268/signed-contract-v1.pdf",
        status: "VERIFIED",
        loanId: sampleApplication.id,
        isSampleData: true,
      },
      create: {
        documentNumber: "LAD-APP-0268-CONTRACT",
        type: "SIGNED_CONTRACT",
        reference:
          "private://loan-applications/APP-0268/signed-contract-v1.pdf",
        status: "VERIFIED",
        loanId: sampleApplication.id,
        isSampleData: true,
      },
    });
    await tx.loanDecision.upsert({
      where: { decisionNumber: "DEC-APP-0268-V1" },
      update: {
        status: "APPROVED",
        reason:
          "Verified business need, complete KYC, signed group guarantee, and product-compliant terms.",
        decidedAt: new Date("2026-10-16T14:20:00Z"),
        loanId: sampleApplication.id,
        termsSnapshotId: submittedTerms.id,
        decidedByUserId: manager.id,
        isSampleData: true,
      },
      create: {
        decisionNumber: "DEC-APP-0268-V1",
        status: "APPROVED",
        reason:
          "Verified business need, complete KYC, signed group guarantee, and product-compliant terms.",
        decidedAt: new Date("2026-10-16T14:20:00Z"),
        loanId: sampleApplication.id,
        termsSnapshotId: submittedTerms.id,
        decidedByUserId: manager.id,
        isSampleData: true,
      },
    });
    await tx.loanApplicationEvent.upsert({
      where: { eventNumber: "LAE-APP-0268-APPROVED" },
      update: {
        eventType: "APPLICATION_APPROVED",
        fromStatus: "UNDER_REVIEW",
        toStatus: "AWAITING_DISBURSEMENT",
        reason: "Independent manager approval issued.",
        occurredAt: new Date("2026-10-16T14:20:00Z"),
        loanId: sampleApplication.id,
        actorUserId: manager.id,
        isSampleData: true,
      },
      create: {
        eventNumber: "LAE-APP-0268-APPROVED",
        eventType: "APPLICATION_APPROVED",
        fromStatus: "UNDER_REVIEW",
        toStatus: "AWAITING_DISBURSEMENT",
        reason: "Independent manager approval issued.",
        occurredAt: new Date("2026-10-16T14:20:00Z"),
        loanId: sampleApplication.id,
        actorUserId: manager.id,
        isSampleData: true,
      },
    });

    const receipt = await tx.receipt.upsert({
      where: { receiptNumber: "RCT-20261016-0057" },
      update: {
        amountPesewas: 30_000,
        principalAllocatedPesewas: 25_000,
        interestAllocatedPesewas: 5_000,
        status: "CAPTURED",
        receivedAt: new Date("2026-10-16T14:40:00Z"),
        idempotencyKey: "SEED-RCT-20261016-0057",
        collectionNote: "Part payment received at the borrower market stall.",
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0104")!.id,
        loanId: loan.id,
        collectorUserId: (
          await tx.user.findUniqueOrThrow({
            where: { staffNumber: "STF-0005" },
          })
        ).id,
        isSampleData: true,
      },
      create: {
        receiptNumber: "RCT-20261016-0057",
        amountPesewas: 30_000,
        principalAllocatedPesewas: 25_000,
        interestAllocatedPesewas: 5_000,
        status: "CAPTURED",
        receivedAt: new Date("2026-10-16T14:40:00Z"),
        idempotencyKey: "SEED-RCT-20261016-0057",
        collectionNote: "Part payment received at the borrower market stall.",
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0104")!.id,
        loanId: loan.id,
        collectorUserId: (
          await tx.user.findUniqueOrThrow({
            where: { staffNumber: "STF-0005" },
          })
        ).id,
        isSampleData: true,
      },
    });
    await tx.arrear.upsert({
      where: { assessmentNumber: "ARR-20261016-0017" },
      update: {
        effectiveDueDate: new Date("2026-10-09T23:59:59Z"),
        daysPastDue: 7,
        unpaidAmountPesewas: 10_000,
        contributionPesewas: 2_000,
        status: "PENDING_ASSESSMENT",
        loanId: loan.id,
        borrowerId: borrowers.get("CUS-0104")!.id,
        guarantorBorrowerId: borrowers.get("CUS-0132")!.id,
        guaranteeSnapshotId: activeLoanGuarantee.id,
        isSampleData: true,
      },
      create: {
        assessmentNumber: "ARR-20261016-0017",
        effectiveDueDate: new Date("2026-10-09T23:59:59Z"),
        daysPastDue: 7,
        unpaidAmountPesewas: 10_000,
        contributionPesewas: 2_000,
        status: "PENDING_ASSESSMENT",
        loanId: loan.id,
        borrowerId: borrowers.get("CUS-0104")!.id,
        guarantorBorrowerId: borrowers.get("CUS-0132")!.id,
        guaranteeSnapshotId: activeLoanGuarantee.id,
        isSampleData: true,
      },
    });

    // Older development databases may contain arrears that were generated
    // from sample loans before sample-data propagation was enforced.
    await tx.arrear.updateMany({
      where: { loan: { isSampleData: true }, isSampleData: false },
      data: { isSampleData: true },
    });

    const accountData = [
      ["1000", "Cash on Hand", "ASSET"],
      ["1010", "Collector Cash Custody", "ASSET"],
      ["1100", "Loan Principal Receivable", "ASSET"],
      ["1110", "Interest Receivable", "ASSET"],
      ["1200", "Credit-loss Allowance", "CONTRA_ASSET"],
      ["2000", "Unidentified Receipts Suspense", "LIABILITY"],
      ["2010", "Customer Overpayments Refundable", "LIABILITY"],
      ["3000", "Owner Capital", "EQUITY"],
      ["4000", "Loan Interest Income", "INCOME"],
      ["5000", "Credit-loss Expense", "EXPENSE"],
    ] as const;
    const accounts = new Map<string, { id: string }>();
    for (const [code, name, type] of accountData)
      accounts.set(
        code,
        await tx.ledgerAccount.upsert({
          where: { code },
          update: { name, type, isSampleData: true },
          create: { code, name, type, isSampleData: true },
        }),
      );

    const periodDefinitions = [
      [
        "2026-04",
        "April 2026",
        "2026-04-01T00:00:00Z",
        "2026-04-30T23:59:59.999Z",
        "CLOSED",
      ],
      [
        "2026-09",
        "September 2026",
        "2026-09-01T00:00:00Z",
        "2026-09-30T23:59:59.999Z",
        "CLOSED",
      ],
      [
        "2026-10",
        "October 2026",
        "2026-10-01T00:00:00Z",
        "2026-10-31T23:59:59.999Z",
        "OPEN",
      ],
    ] as const;
    const periods = new Map<string, { id: string }>();
    for (const [month, name, startsAt, endsAt, status] of periodDefinitions) {
      const period = await tx.accountingPeriod.upsert({
        where: { periodKey: `${month}-${branch.code}` },
        update: {},
        create: {
          periodKey: `${month}-${branch.code}`,
          name,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          status,
          closedAt: status === "CLOSED" ? new Date(endsAt) : null,
          branchId: branch.id,
          isSampleData: true,
        },
      });
      periods.set(month, period);
    }

    const journals = [
      [
        "J-0800",
        "OWNER_CAPITAL_RECEIVED",
        "SAMPLE-CAPITAL-001",
        "Sample owner capital introduced",
        new Date("2026-04-01T09:00:00Z"),
        [
          ["1000", 1_000_000, 0],
          ["3000", 0, 1_000_000],
        ],
      ],
      [
        "J-0810",
        "LOAN_DISBURSED_CASH",
        loan.loanNumber,
        "Sample cash loan disbursement",
        new Date("2026-04-30T10:00:00Z"),
        [
          ["1100", 1_000_000, 0],
          ["1000", 0, 1_000_000],
        ],
      ],
      [
        "J-0812",
        "BORROWER_CASH_RECEIVED_BY_COLLECTOR",
        receipt.receiptNumber,
        "Sample borrower cash receipt",
        receipt.receivedAt,
        [
          ["1010", 30_000, 0],
          ["1100", 0, 25_000],
          ["1110", 0, 5_000],
        ],
      ],
    ] as const;
    for (const [
      journalNumber,
      sourceEventType,
      sourceReference,
      description,
      entryDate,
      lines,
    ] of journals) {
      const existingJournal = await tx.journalEntry.findUnique({
        where: { journalNumber },
      });
      if (!existingJournal) {
        const periodKey = entryDate.toISOString().slice(0, 7);
        const journal = await tx.journalEntry.create({
          data: {
            journalNumber,
            description,
            sourceEventType,
            sourceReference,
            entryDate,
            branchId: branch.id,
            periodId: periods.get(periodKey)!.id,
            actorUserId: cashier.id,
            isSampleData: true,
          },
        });
        await tx.journalLine.createMany({
          data: lines.map(([code, debitPesewas, creditPesewas]) => ({
            journalId: journal.id,
            accountId: accounts.get(code)!.id,
            debitPesewas,
            creditPesewas,
            isSampleData: true,
          })),
        });
      }
    }

    async function seedExceptionJournal(
      journalNumber: string,
      sourceEventType: string,
      sourceReference: string,
      description: string,
      debitCode: string,
      creditCode: string,
      amountPesewas: number,
    ) {
      const existing = await tx.journalEntry.findUnique({
        where: { journalNumber },
      });
      if (existing) return existing;
      return tx.journalEntry.create({
        data: {
          journalNumber,
          sourceEventType,
          sourceReference,
          description,
          entryDate: new Date("2026-10-16T15:00:00Z"),
          branchId: branch.id,
          periodId: periods.get("2026-10")!.id,
          actorUserId: cashier.id,
          isSampleData: true,
          lines: {
            create: [
              {
                accountId: accounts.get(debitCode)!.id,
                debitPesewas: amountPesewas,
                isSampleData: true,
              },
              {
                accountId: accounts.get(creditCode)!.id,
                creditPesewas: amountPesewas,
                isSampleData: true,
              },
            ],
          },
        },
      });
    }
    const suspenseJournal = await seedExceptionJournal(
      "J-SUS-0012",
      "UNIDENTIFIED_CASH",
      "UNIDENTIFIED-0012",
      "Unidentified cash held in suspense",
      "1000",
      "2000",
      5_000,
    );
    await tx.suspenseItem.upsert({
      where: { suspenseNumber: "SUS-0012" },
      update: {},
      create: {
        suspenseNumber: "SUS-0012",
        sourceReference: "UNIDENTIFIED-0012",
        amountPesewas: 5_000,
        status: "PENDING",
        branchId: branch.id,
        originJournalId: suspenseJournal.id,
        isSampleData: true,
      },
    });
    const overpaymentJournal = await seedExceptionJournal(
      "J-OVP-0007",
      "CUSTOMER_OVERPAYMENT",
      "OVERPAYMENT-0007",
      "Verified customer overpayment liability",
      "1000",
      "2010",
      12_500,
    );
    await tx.overpaymentLiability.upsert({
      where: { liabilityNumber: "OVP-0007" },
      update: {},
      create: {
        liabilityNumber: "OVP-0007",
        payerName: "Abena Boateng",
        payerReference: "GHA-VERIFIED-421",
        amountPesewas: 12_500,
        branchId: branch.id,
        originJournalId: overpaymentJournal.id,
        isSampleData: true,
      },
    });

    const ownerFundAccount = await tx.fundAccount.upsert({
      where: { accountNumber: "FUND-OWNER-KASOA" },
      update: {
        name: "Verified owner capital",
        eligibleForFunding: true,
        exclusionReason: null,
        isSampleData: true,
      },
      create: {
        accountNumber: "FUND-OWNER-KASOA",
        name: "Verified owner capital",
        sourceType: "OWNER_CAPITAL",
        eligibleForFunding: true,
        branchId: branch.id,
        isSampleData: true,
      },
    });

    const excludedFundAccounts = [
      [
        "FUND-CUSTODY-KASOA",
        "Collector cash custody",
        "EXCLUDED_CUSTODY",
        "Cash remains under collector custody until verified handover",
      ],
      [
        "FUND-RECEIVABLE-KASOA",
        "Outstanding receivables",
        "EXCLUDED_RECEIVABLE",
        "Receivables are not verified cash",
      ],
      [
        "FUND-SUSPENSE-KASOA",
        "Unidentified cash",
        "EXCLUDED_SUSPENSE",
        "Restricted until ownership is identified",
      ],
      [
        "FUND-OVERPAY-KASOA",
        "Customer overpayments",
        "EXCLUDED_OVERPAYMENT",
        "Refundable customer liability",
      ],
      [
        "FUND-INVESTOR-KASOA",
        "Investor principal",
        "INVESTOR_PRINCIPAL",
        "Locked pending legal and accounting activation",
      ],
    ] as const;
    for (const [
      accountNumber,
      name,
      sourceType,
      exclusionReason,
    ] of excludedFundAccounts) {
      await tx.fundAccount.upsert({
        where: { accountNumber },
        update: {
          name,
          sourceType,
          exclusionReason,
          eligibleForFunding: false,
          isSampleData: true,
        },
        create: {
          accountNumber,
          name,
          sourceType,
          exclusionReason,
          eligibleForFunding: false,
          branchId: branch.id,
          isSampleData: true,
        },
      });
    }

    const lotDefinitions = [
      [
        "CAP-001",
        "Owner capital lot 1",
        "CAP-EVIDENCE-001",
        3_000_000,
        2_000_000,
        1_000_000,
      ],
      [
        "CAP-002",
        "Owner capital lot 2",
        "CAP-EVIDENCE-002",
        1_800_000,
        1_800_000,
        0,
      ],
      [
        "CAP-003",
        "Owner capital lot 3",
        "CAP-EVIDENCE-003",
        1_000_000,
        1_000_000,
        0,
      ],
    ] as const;
    const capitalLots = new Map<string, { id: string }>();
    for (const [
      lotNumber,
      description,
      evidenceReference,
      originalPesewas,
      availablePesewas,
      reservedPesewas,
    ] of lotDefinitions) {
      const lot = await tx.fundLot.upsert({
        where: { lotNumber },
        update: {},
        create: {
          lotNumber,
          description,
          evidenceReference,
          receivedAt: new Date("2026-04-01T09:00:00Z"),
          verifiedAt: new Date("2026-04-01T10:00:00Z"),
          originalPesewas,
          availablePesewas,
          reservedPesewas,
          status: reservedPesewas > 0 ? "RESERVED" : "AVAILABLE",
          fundAccountId: ownerFundAccount.id,
          isSampleData: true,
        },
      });
      capitalLots.set(lotNumber, lot);
      await tx.fundMovement.upsert({
        where: { sourceReference: `VERIFY-${lotNumber}` },
        update: {},
        create: {
          movementNumber: `MOV-VERIFY-${lotNumber}`,
          movementType: "AVAILABLE",
          sourceReference: `VERIFY-${lotNumber}`,
          amountPesewas: originalPesewas,
          notes: "Owner capital evidence verified and made available",
          occurredAt: new Date("2026-04-01T10:00:00Z"),
          fundLotId: lot.id,
          actorUserId: cashier.id,
          isSampleData: true,
        },
      });
    }

    const reservation = await tx.fundingReservation.upsert({
      where: { reservationNumber: "RES-0268" },
      update: {
        amountPesewas: 1_000_000,
        status: existingSampleRelease ? "COMMITTED" : "RESERVED",
        reservedAt: new Date("2026-10-16T14:25:00Z"),
        committedAt: existingSampleRelease?.actualCashOutAt ?? null,
        cancelledAt: null,
        fundLotId: capitalLots.get("CAP-001")!.id,
        loanId: sampleApplication.id,
        isSampleData: true,
      },
      create: {
        reservationNumber: "RES-0268",
        amountPesewas: 1_000_000,
        status: "RESERVED",
        reservedAt: new Date("2026-10-16T14:25:00Z"),
        fundLotId: capitalLots.get("CAP-001")!.id,
        loanId: sampleApplication.id,
        isSampleData: true,
      },
    });
    await tx.fundMovement.upsert({
      where: { sourceReference: reservation.reservationNumber },
      update: {},
      create: {
        movementNumber: "MOV-RES-0268",
        movementType: "RESERVED",
        sourceReference: reservation.reservationNumber,
        amountPesewas: reservation.amountPesewas,
        notes: "Verified owner capital reserved for approved loan",
        occurredAt: reservation.reservedAt,
        fundLotId: capitalLots.get("CAP-001")!.id,
        actorUserId: cashier.id,
        isSampleData: true,
      },
    });

    const allocation = await tx.fundAllocation.upsert({
      where: { allocationNumber: "ALLOC-LN-0204" },
      update: {
        amountPesewas: 1_000_000,
        recoveredPrincipalPesewas: 166_667,
        recoveredInterestPesewas: 33_333,
        status: "RECOVERED",
        allocatedAt: new Date("2026-04-29T14:00:00Z"),
        disbursedAt: new Date("2026-04-30T10:00:00Z"),
        recoveredAt: new Date("2026-09-30T14:40:00Z"),
        fundLotId: capitalLots.get("CAP-002")!.id,
        loanId: loan.id,
        isSampleData: true,
      },
      create: {
        allocationNumber: "ALLOC-LN-0204",
        amountPesewas: 1_000_000,
        recoveredPrincipalPesewas: 166_667,
        recoveredInterestPesewas: 33_333,
        status: "RECOVERED",
        allocatedAt: new Date("2026-04-29T14:00:00Z"),
        disbursedAt: new Date("2026-04-30T10:00:00Z"),
        recoveredAt: new Date("2026-09-30T14:40:00Z"),
        fundLotId: capitalLots.get("CAP-002")!.id,
        loanId: loan.id,
        isSampleData: true,
      },
    });
    await tx.fundMovement.upsert({
      where: { sourceReference: "RCT-RECOVERY-CAP-002" },
      update: {
        movementType: "RECOVERED",
        amountPesewas: 200_000,
        principalAmountPesewas: allocation.recoveredPrincipalPesewas,
        interestAmountPesewas: allocation.recoveredInterestPesewas,
        notes:
          "Principal recovery attributed to original lot; interest retained separately",
        occurredAt: new Date("2026-09-30T14:40:00Z"),
        fundLotId: capitalLots.get("CAP-002")!.id,
        actorUserId: cashier.id,
        isSampleData: true,
      },
      create: {
        movementNumber: "MOV-RECOVERY-CAP-002",
        movementType: "RECOVERED",
        sourceReference: "RCT-RECOVERY-CAP-002",
        amountPesewas: 200_000,
        principalAmountPesewas: allocation.recoveredPrincipalPesewas,
        interestAmountPesewas: allocation.recoveredInterestPesewas,
        notes:
          "Principal recovery attributed to original lot; interest retained separately",
        occurredAt: new Date("2026-09-30T14:40:00Z"),
        fundLotId: capitalLots.get("CAP-002")!.id,
        actorUserId: cashier.id,
        isSampleData: true,
      },
    });
    await tx.fundLot.update({
      where: { lotNumber: "CAP-002" },
      data: {
        // GHS 10,000.00 was deployed. The first GHS 1,666.67 principal
        // repayment becomes available again; GHS 333.33 interest does not.
        availablePesewas: 966_667,
        disbursedPesewas: 833_333,
        recoveredPesewas: 166_667,
        status: "RECOVERED",
        isSampleData: true,
      },
    });

    const auditActors = await tx.user.findMany({
      where: {
        staffNumber: {
          in: ["STF-0001", "STF-0002", "STF-0003", "STF-0006"],
        },
      },
      select: { id: true, staffNumber: true, name: true },
    });
    const auditActor = (staffNumber: string, role: string) => {
      const user = auditActors.find(
        (candidate) => candidate.staffNumber === staffNumber,
      );
      if (!user) throw new Error(`Seed audit actor not found: ${staffNumber}`);
      return { actorUserId: user.id, actorName: user.name, actorRole: role };
    };
    await tx.auditEvent.createMany({
      skipDuplicates: true,
      data: [
        {
          id: "AUD-DEMO-APPROVAL-001",
          eventType: "BUSINESS_APPROVAL",
          outcome: "SUCCESS",
          permission: "approve_or_reject_loans",
          resource: `loan_application:${loan.loanNumber}`,
          reason: "manager_approved",
          branchId: branch.id,
          createdAt: new Date("2026-10-16T14:20:00Z"),
          ...auditActor("STF-0001", "MANAGER"),
        },
        {
          id: "AUD-DEMO-REJECTION-001",
          eventType: "BUSINESS_REJECTION",
          outcome: "SUCCESS",
          permission: "approve_or_reject_loans",
          resource: "loan_application:APP-0269",
          reason: "documented_credit_decision",
          branchId: branch.id,
          createdAt: new Date("2026-10-16T14:24:00Z"),
          ...auditActor("STF-0002", "MANAGER"),
        },
        {
          id: "AUD-DEMO-REVERSAL-001",
          eventType: "FINANCIAL_REVERSAL",
          outcome: "SUCCESS",
          permission: "reverse_posted_receipts",
          resource: `receipt:${receipt.receiptNumber}`,
          reason: "authorized_linked_reversal",
          branchId: branch.id,
          createdAt: new Date("2026-10-16T14:26:00Z"),
          ...auditActor("STF-0006", "CASHIER_ACCOUNTANT"),
        },
        {
          id: "AUD-DEMO-DOCUMENT-001",
          eventType: "PRIVATE_DOCUMENT_ACCESS",
          outcome: "SUCCESS",
          permission: "record_verification",
          resource: "private_document:KYC-0132.pdf",
          reason: "authorized_review",
          branchId: branch.id,
          createdAt: new Date("2026-10-16T14:28:00Z"),
          ...auditActor("STF-0001", "MANAGER"),
        },
        {
          id: "AUD-DEMO-SECURITY-001",
          eventType: "SECURITY_CONFIGURATION_CHANGE",
          outcome: "SUCCESS",
          permission: "manage_users",
          resource: "user:STF-0007",
          reason: "account_deactivated",
          branchId: branch.id,
          createdAt: new Date("2026-10-16T14:30:00Z"),
          ...auditActor("STF-0003", "SYSTEM_ADMIN"),
        },
      ],
    });
  });

  const counts = await Promise.all([
    db.branch.count({ where: { isSampleData: true } }),
    db.role.count({ where: { isSampleData: true } }),
    db.borrower.count({ where: { isSampleData: true } }),
    db.borrowerGroup.count({ where: { isSampleData: true } }),
    db.loan.count({ where: { isSampleData: true } }),
    db.receipt.count({ where: { isSampleData: true } }),
    db.arrear.count({ where: { isSampleData: true } }),
    db.journalEntry.count({ where: { isSampleData: true } }),
    db.user.count({ where: { isSampleData: true } }),
    db.userRole.count({ where: { isSampleData: true } }),
    db.staffBranchAssignment.count({ where: { isSampleData: true } }),
  ]);
  console.log(
    `Seed complete: ${counts[0]} branch, ${counts[1]} roles, ${counts[2]} borrowers, ${counts[3]} group, ${counts[4]} loans, ${counts[5]} receipt, ${counts[6]} arrear, ${counts[7]} journals, ${counts[8]} users, ${counts[9]} user-role assignments, ${counts[10]} staff-branch assignments.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
