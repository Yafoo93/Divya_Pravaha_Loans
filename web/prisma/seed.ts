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
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0104")!.id,
        loanId: loan.id,
        isSampleData: true,
      },
      create: {
        receiptNumber: "RCT-20261016-0057",
        amountPesewas: 30_000,
        principalAllocatedPesewas: 25_000,
        interestAllocatedPesewas: 5_000,
        status: "CAPTURED",
        receivedAt: new Date("2026-10-16T14:40:00Z"),
        branchId: branch.id,
        borrowerId: borrowers.get("CUS-0104")!.id,
        loanId: loan.id,
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
        isSampleData: true,
      },
    });

    const accountData = [
      ["1000", "Cash on Hand", "ASSET"],
      ["1010", "Collector Cash Custody", "ASSET"],
      ["1100", "Loan Principal Receivable", "ASSET"],
      ["1110", "Interest Receivable", "ASSET"],
      ["3000", "Owner Capital", "EQUITY"],
      ["4000", "Loan Interest Income", "INCOME"],
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
      const journal = await tx.journalEntry.upsert({
        where: { journalNumber },
        update: {
          description,
          sourceEventType,
          sourceReference,
          entryDate,
          branchId: branch.id,
          isSampleData: true,
        },
        create: {
          journalNumber,
          description,
          sourceEventType,
          sourceReference,
          entryDate,
          branchId: branch.id,
          isSampleData: true,
        },
      });
      await tx.journalLine.deleteMany({ where: { journalId: journal.id } });
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
