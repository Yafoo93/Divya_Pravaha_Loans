import "dotenv/config";
import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { roleDefinitions } from "../src/lib/role-definitions";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const [
    branches,
    roles,
    borrowers,
    groups,
    loans,
    receipts,
    arrears,
    journals,
    accounts,
    users,
    userRoles,
    staffBranchAssignments,
    verifications,
    consentRecords,
    businessAssessments,
    documents,
    documentAccessEvents,
    restrictions,
    reactivationDecisions,
    loanProducts,
    termsSnapshots,
    guaranteeSnapshots,
    accountingPeriods,
  ] = await Promise.all([
    db.branch.count({ where: { code: "KASOA-MARKET", isSampleData: true } }),
    db.role.findMany(),
    db.borrower.findMany(),
    db.borrowerGroup.findMany({
      where: { isSampleData: true },
      include: { memberships: true },
    }),
    db.loan.findMany({ where: { isSampleData: true } }),
    db.receipt.findMany({ where: { isSampleData: true } }),
    db.arrear.findMany(),
    db.journalEntry.findMany({
      where: { isSampleData: true },
      include: { lines: true },
    }),
    db.ledgerAccount.findMany(),
    db.user.findMany({
      where: { isSampleData: true },
      include: { roles: { include: { role: true } } },
    }),
    db.userRole.findMany({ where: { isSampleData: true } }),
    db.staffBranchAssignment.findMany({
      where: { isSampleData: true },
      include: { user: true, branch: true },
    }),
    db.verification.findMany({ where: { isSampleData: true } }),
    db.consentRecord.findMany({ where: { isSampleData: true } }),
    db.businessAssessment.findMany({ where: { isSampleData: true } }),
    db.document.findMany({
      where: { isSampleData: true },
      include: { versions: true },
    }),
    db.documentAccessEvent.findMany(),
    db.borrowerRestriction.findMany({ where: { isSampleData: true } }),
    db.reactivationDecision.findMany({ where: { isSampleData: true } }),
    db.loanProduct.findMany({ where: { code: "GROUP_FLAT_20" } }),
    db.loanTermsSnapshot.findMany({ where: { isSampleData: true } }),
    db.loanGuaranteeSnapshot.findMany({ where: { isSampleData: true } }),
    db.accountingPeriod.findMany({ where: { isSampleData: true } }),
  ]);

  assert.equal(branches, 1, "Expected the Kasoa Market sample branch");
  assert.equal(
    roles.length,
    8,
    "Expected every one of the eight required roles",
  );
  assert.ok(
    roles.every((record) => record.isSampleData),
    "Every seeded role must be marked as sample data",
  );
  for (const definition of roleDefinitions) {
    const stored = roles.find((role) => role.code === definition.code);
    assert.ok(stored, `Missing required role ${definition.code}`);
    assert.deepEqual(stored.permissions, [...definition.permissions]);
    assert.deepEqual(stored.restrictions, [...definition.restrictions]);
    assert.equal(stored.featureGate, definition.featureGate);
  }
  assert.equal(
    users.length,
    9,
    "Expected one identity for every required role",
  );
  assert.ok(
    users.every(
      (user) =>
        user.isSampleData &&
        user.passwordHash?.startsWith("scrypt$131072$8$1$") &&
        user.roles.length === 1 &&
        user.roles[0].effectiveTo === null,
    ),
    "Every sample user must have a secure password hash and one current role",
  );
  assert.equal(userRoles.length, 9, "Expected one role assignment per user");
  assert.deepEqual(
    new Set(users.flatMap((user) => user.roles.map(({ role }) => role.code))),
    new Set(roleDefinitions.map(({ code }) => code)),
    "Expected every role to have a demonstration identity",
  );
  assert.ok(
    userRoles.every((assignment) => assignment.effectiveTo === null),
    "Every seeded user-role assignment must be current",
  );
  assert.equal(
    staffBranchAssignments.length,
    7,
    "Expected seven direct Kasoa Market staff assignments",
  );
  assert.ok(
    staffBranchAssignments.every(
      (assignment) =>
        assignment.isSampleData &&
        assignment.effectiveTo === null &&
        assignment.branch.code === "KASOA-MARKET" &&
        assignment.user.staffNumber !== "STF-0007",
    ),
    "Every branch assignment must be current, sample data, and target Kasoa Market",
  );
  assert.ok(borrowers.length >= 6, "Expected at least six sample borrowers");
  assert.ok(
    borrowers.every((record) => record.isSampleData),
    "Every seeded borrower must be marked as sample data",
  );
  assert.equal(
    verifications.length,
    6,
    "Expected one verification per borrower",
  );
  assert.equal(
    consentRecords.length,
    6,
    "Expected one consent record per borrower",
  );
  assert.equal(
    businessAssessments.length,
    6,
    "Expected one business assessment per borrower",
  );
  assert.equal(
    documents.length,
    12,
    "Expected two private documents per borrower",
  );
  assert.ok(
    documents.every(
      (document) =>
        document.isPrivate &&
        document.storageReference.startsWith("private://") &&
        document.versions.length >= 1,
    ),
    "Every sample document must be private and have a version record",
  );
  assert.ok(
    documentAccessEvents.length >= 1,
    "Expected at least one private-document access event",
  );
  assert.ok(restrictions.length >= 1, "Expected a sample restriction record");
  assert.ok(
    reactivationDecisions.some(
      (decision) =>
        decision.status === "APPROVED" &&
        decision.requestedByUserId !== decision.decidedByUserId,
    ),
    "Expected an independently approved sample reactivation decision",
  );
  assert.ok(
    groups.every(
      (record) =>
        record.isSampleData &&
        record.memberships.every((membership) => membership.isSampleData),
    ),
    "Every seeded group and membership must be marked as sample data",
  );
  assert.ok(
    groups.some((group) => group.memberships.length >= 5),
    "Expected a group with at least five members",
  );
  assert.ok(loans.length >= 2, "Expected sample loans");
  assert.ok(
    loanProducts.some(
      (product) =>
        product.version === 1 &&
        product.interestRatePercent === 20 &&
        product.maximumTermMonths === 6 &&
        product.supportedFrequencies.length === 3 &&
        product.isActive,
    ),
    "Expected active GROUP_FLAT_20 v1 product configuration",
  );
  assert.ok(
    termsSnapshots.some(
      (snapshot) =>
        snapshot.version === 1 &&
        snapshot.productCode === "GROUP_FLAT_20" &&
        snapshot.totalRepayablePesewas ===
          snapshot.principalPesewas + snapshot.contractualInterest,
    ),
    "Expected a reconciled frozen submitted-terms snapshot",
  );
  assert.ok(
    guaranteeSnapshots.some(
      (snapshot) =>
        snapshot.version === 1 &&
        snapshot.agreementVersion > 0 &&
        snapshot.guarantorBorrowerIds.length >= 4,
    ),
    "Expected frozen guarantors and agreement version",
  );
  assert.ok(
    loans.every((record) => record.isSampleData),
    "Every seeded loan must be marked as sample data",
  );
  assert.ok(
    loans.every(
      (loan) => loan.contractualInterest === loan.principalPesewas / 5,
    ),
    "Every sample loan must use 20% flat interest",
  );
  assert.ok(receipts.length >= 1, "Expected a sample receipt");
  assert.ok(
    receipts.every((record) => record.isSampleData),
    "Every seeded receipt must be marked as sample data",
  );
  assert.ok(
    receipts.every(
      (receipt) =>
        receipt.amountPesewas ===
        receipt.principalAllocatedPesewas + receipt.interestAllocatedPesewas,
    ),
    "Receipt allocations must equal cash received",
  );
  assert.ok(arrears.length >= 1, "Expected a sample arrears assessment");
  assert.ok(
    arrears.every((record) => record.isSampleData),
    "Every seeded arrears record must be marked as sample data",
  );
  assert.ok(journals.length >= 3, "Expected sample journals");
  assert.ok(
    [
      "1000",
      "1010",
      "1100",
      "1110",
      "1200",
      "2000",
      "2010",
      "3000",
      "4000",
      "5000",
    ].every((code) => accounts.some((account) => account.code === code)),
    "Expected the provisional chart of accounts",
  );
  assert.ok(
    accountingPeriods.some((period) => period.status === "OPEN") &&
      accountingPeriods.some((period) => period.status === "CLOSED"),
    "Expected open and closed accounting periods",
  );
  assert.ok(
    accounts.every((record) => record.isSampleData),
    "Every seeded ledger account must be marked as sample data",
  );
  for (const journal of journals) {
    assert.ok(
      journal.isSampleData && journal.lines.every((line) => line.isSampleData),
      `${journal.journalNumber} and its lines must be marked as sample data`,
    );
    const debit = journal.lines.reduce(
      (sum, line) => sum + line.debitPesewas,
      0,
    );
    const credit = journal.lines.reduce(
      (sum, line) => sum + line.creditPesewas,
      0,
    );
    assert.equal(debit, credit, `${journal.journalNumber} is not balanced`);
    assert.ok(
      journal.actorUserId &&
        journal.periodId &&
        journal.sourceEventType &&
        journal.sourceReference,
      `${journal.journalNumber} must link its actor, period, and source event`,
    );
    assert.ok(
      journal.lines.every(
        (line) =>
          Number.isSafeInteger(line.debitPesewas) &&
          Number.isSafeInteger(line.creditPesewas),
      ),
      `${journal.journalNumber} must store integer pesewas`,
    );
  }

  const protectedJournal = journals[0];
  let editBlocked = false;
  try {
    await db.journalEntry.update({
      where: { id: protectedJournal.id },
      data: { description: "Forbidden posted-journal edit" },
    });
  } catch {
    editBlocked = true;
  }
  assert.ok(editBlocked, "The database must block posted-journal editing");
  let deleteBlocked = false;
  try {
    await db.journalEntry.delete({ where: { id: protectedJournal.id } });
  } catch {
    deleteBlocked = true;
  }
  assert.ok(deleteBlocked, "The database must block posted-journal deletion");
  let unbalancedBlocked = false;
  try {
    await db.$transaction(async (tx) => {
      await tx.journalEntry.create({
        data: {
          journalNumber: "J-VERIFY-UNBALANCED",
          description: "This verification entry must be rejected",
          sourceEventType: "CONTROL_TEST",
          sourceReference: "VERIFY-UNBALANCED",
          entryDate: new Date("2026-10-16T12:00:00Z"),
          status: "POSTED",
          branchId: protectedJournal.branchId,
          periodId: protectedJournal.periodId,
          actorUserId: protectedJournal.actorUserId,
          lines: {
            create: [
              {
                accountId: accounts[0].id,
                debitPesewas: 100,
                creditPesewas: 0,
              },
              { accountId: accounts[1].id, debitPesewas: 0, creditPesewas: 99 },
            ],
          },
        },
      });
    });
  } catch {
    unbalancedBlocked = true;
  }
  assert.ok(unbalancedBlocked, "The database must reject unbalanced journals");
  let duplicateSourceBlocked = false;
  try {
    await db.journalEntry.create({
      data: {
        journalNumber: "J-VERIFY-DUPLICATE-SOURCE",
        description: "This duplicate source must be rejected",
        sourceEventType: "CONTROL_TEST",
        sourceReference: protectedJournal.sourceReference,
        entryDate: new Date("2026-10-16T12:00:00Z"),
        status: "POSTED",
        branchId: protectedJournal.branchId,
        periodId: accountingPeriods.find((period) => period.status === "OPEN")!
          .id,
        actorUserId: protectedJournal.actorUserId,
        lines: {
          create: [
            { accountId: accounts[0].id, debitPesewas: 100, creditPesewas: 0 },
            { accountId: accounts[1].id, debitPesewas: 0, creditPesewas: 100 },
          ],
        },
      },
    });
  } catch {
    duplicateSourceBlocked = true;
  }
  assert.ok(
    duplicateSourceBlocked,
    "The database must reject duplicate source-event posting",
  );

  const fundAccounts = await db.fundAccount.findMany({
    include: {
      lots: {
        include: { movements: true, reservations: true, allocations: true },
      },
    },
  });
  const ownerAccount = fundAccounts.find(
    (account) => account.sourceType === "OWNER_CAPITAL",
  );
  assert.ok(ownerAccount?.eligibleForFunding, "Owner capital must be eligible");
  assert.equal(
    ownerAccount.lots.length,
    3,
    "Three owner-capital lots expected",
  );
  assert.equal(
    ownerAccount.lots.reduce((sum, lot) => sum + lot.originalPesewas, 0),
    5_800_000,
    "Verified fictional owner capital must total GHS 58,000",
  );
  const excludedSources = fundAccounts.filter(
    (account) => !account.eligibleForFunding,
  );
  assert.deepEqual(
    new Set(excludedSources.map((account) => account.sourceType)),
    new Set([
      "EXCLUDED_CUSTODY",
      "EXCLUDED_RECEIVABLE",
      "EXCLUDED_SUSPENSE",
      "EXCLUDED_OVERPAYMENT",
      "INVESTOR_PRINCIPAL",
    ]),
    "Every prohibited source must remain excluded",
  );
  const recovery = ownerAccount.lots
    .flatMap((lot) => lot.movements)
    .find((movement) => movement.movementType === "RECOVERED");
  assert.ok(recovery, "A principal/interest recovery trace is required");
  assert.equal(recovery.principalAmountPesewas, 166_667);
  assert.equal(recovery.interestAmountPesewas, 33_333);

  let overAllocationBlocked = false;
  try {
    await db.fundLot.update({
      where: { id: ownerAccount.lots[0].id },
      data: { reservedPesewas: { increment: 10_000_000 } },
    });
  } catch {
    overAllocationBlocked = true;
  }
  assert.ok(
    overAllocationBlocked,
    "The database must prevent attribution above verified lot capital",
  );

  const controlledRelease = await db.loan.findUniqueOrThrow({
    where: { loanNumber: "APP-0268" },
    include: {
      borrower: true,
      applicationDocuments: true,
      decisions: true,
      fundingReservations: {
        include: { fundLot: { include: { fundAccount: true } } },
      },
      disbursement: { include: { voucher: true, journal: true } },
      repaymentInstalments: true,
    },
  });
  assert.ok(
    ["AWAITING_DISBURSEMENT", "ACTIVE"].includes(controlledRelease.status),
  );
  assert.ok(controlledRelease.borrower.ghanaCardVerified);
  assert.ok(
    controlledRelease.applicationDocuments.some(
      (document) =>
        document.type === "SIGNED_CONTRACT" && document.status === "VERIFIED",
    ),
    "Awaiting release must have a verified signed contract",
  );
  assert.ok(
    controlledRelease.decisions.some(
      (decision) => decision.status === "APPROVED",
    ),
    "Awaiting release must have Manager authorization",
  );
  const releaseReservation = controlledRelease.fundingReservations.find(
    (reservation) =>
      reservation.status ===
      (controlledRelease.disbursement ? "COMMITTED" : "RESERVED"),
  );
  assert.ok(
    releaseReservation,
    "Awaiting release must have an active reservation",
  );
  assert.equal(
    releaseReservation.amountPesewas,
    controlledRelease.principalPesewas,
  );
  assert.ok(releaseReservation.fundLot.verifiedAt);
  assert.ok(releaseReservation.fundLot.fundAccount.eligibleForFunding);
  if (controlledRelease.disbursement) {
    assert.equal(controlledRelease.status, "ACTIVE");
    assert.ok(controlledRelease.disbursedAt);
    assert.ok(controlledRelease.disbursement.voucher);
    assert.equal(controlledRelease.disbursement.journal.status, "POSTED");
    assert.ok(
      controlledRelease.repaymentInstalments.length > 0,
      "A released loan must have its anchored repayment schedule",
    );
  }

  const disbursementIndexes = await db.$queryRaw<
    { indexdef: string }[]
  >`SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'disbursements'`;
  const indexDefinitions = disbursementIndexes
    .map(({ indexdef }) => indexdef)
    .join(" ");
  assert.match(indexDefinitions, /UNIQUE.*\("idempotencyKey"\)/);
  assert.match(indexDefinitions, /UNIQUE.*\("loanId"\)/);
  assert.match(indexDefinitions, /UNIQUE.*\("reservationId"\)/);

  console.log(
    "Seed verification passed: operational records, accounting controls, capital traceability, and controlled cash-release prerequisites are valid.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
