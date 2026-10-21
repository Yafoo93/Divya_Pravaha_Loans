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
  }

  console.log(
    "Seed verification passed: borrower domain, identity and access records exist, reactivation uses independent staff, loan terms and receipt allocations are correct, and every journal balances.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
