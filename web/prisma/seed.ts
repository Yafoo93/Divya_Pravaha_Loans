import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const roles = [
  [
    "SYSTEM_ADMIN",
    "System Administrator",
    "Manages users, roles, and security configuration.",
  ],
  [
    "MANAGER",
    "Manager",
    "Approves loans, disbursements, exceptions, and disputes.",
  ],
  [
    "LOAN_OFFICER",
    "Loan Officer",
    "Manages borrowers, groups, verification, and applications.",
  ],
  [
    "FIELD_COLLECTOR",
    "Field Collector",
    "Records cash receipts and submits cash handovers.",
  ],
  [
    "CASHIER_ACCOUNTANT",
    "Cashier / Accountant",
    "Reconciles cash and maintains the ledger.",
  ],
  [
    "INVESTOR_PORTFOLIO_OFFICER",
    "Investor Portfolio Officer",
    "Prepares gated investor records.",
  ],
  [
    "AUDITOR",
    "Auditor",
    "Reads financial history, audits, and exception reports.",
  ],
  [
    "INVESTOR_PORTAL_USER",
    "Investor Portal User",
    "Reads own gated investor records.",
  ],
] as const;

const people = [
  ["CUS-0104", "Abena Boateng", "104", "Retail provisions"],
  ["CUS-0132", "Akuosa Addo", "132", "Wholesale groceries"],
  ["CUS-0129", "Efua Osei", "129", "Fabric and clothing"],
  ["CUS-0143", "Kweku Agyeman", "143", "Household supplies"],
  ["CUS-0190", "Akua Darko", "190", "Prepared foods"],
  ["CUS-0208", "Daniel Tetteh", "208", "Mobile accessories"],
] as const;

async function main() {
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

    for (const [code, name, description] of roles) {
      await tx.role.upsert({
        where: { code },
        update: { name, description, isActive: true, isSampleData: true },
        create: { code, name, description, isActive: true, isSampleData: true },
      });
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
          branchId: branch.id,
          isSampleData: true,
        },
      });
      borrowers.set(customerId, borrower);
    }

    const group = await tx.borrowerGroup.upsert({
      where: { groupNumber: "GRP-0018" },
      update: {
        name: "Kasoa Market Circle",
        status: "ACTIVE",
        jointLiabilityReference: "JL-0018-v1",
        activatedAt: new Date("2026-04-15T09:00:00Z"),
        branchId: branch.id,
        isSampleData: true,
      },
      create: {
        groupNumber: "GRP-0018",
        name: "Kasoa Market Circle",
        status: "ACTIVE",
        jointLiabilityReference: "JL-0018-v1",
        activatedAt: new Date("2026-04-15T09:00:00Z"),
        branchId: branch.id,
        isSampleData: true,
      },
    });
    for (const [customerId] of people) {
      await tx.groupMembership.upsert({
        where: {
          groupId_borrowerId: {
            groupId: group.id,
            borrowerId: borrowers.get(customerId)!.id,
          },
        },
        update: { status: "ACTIVE", hasConsented: true, isSampleData: true },
        create: {
          groupId: group.id,
          borrowerId: borrowers.get(customerId)!.id,
          status: "ACTIVE",
          joinedAt: new Date("2026-04-15T09:00:00Z"),
          hasConsented: true,
          isSampleData: true,
        },
      });
    }

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
  ]);
  console.log(
    `Seed complete: ${counts[0]} branch, ${counts[1]} roles, ${counts[2]} borrowers, ${counts[3]} group, ${counts[4]} loans, ${counts[5]} receipt, ${counts[6]} arrear, ${counts[7]} journals.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
