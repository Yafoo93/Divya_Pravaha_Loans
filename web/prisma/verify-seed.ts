import "dotenv/config";
import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

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
  assert.ok(borrowers.length >= 6, "Expected at least six sample borrowers");
  assert.ok(
    borrowers.every((record) => record.isSampleData),
    "Every seeded borrower must be marked as sample data",
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
    "Seed verification passed: every seeded record is marked as sample data, required records exist, loan terms and receipt allocations are correct, and every journal balances.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
