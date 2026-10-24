import "dotenv/config";
import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString)
  throw new Error("DIRECT_URL or DATABASE_URL must be configured");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const expected = [
  { staffNumber: "DVP55351", role: "SYSTEM_ADMIN" },
  { staffNumber: "DVP00001", role: "MANAGER" },
] as const;

async function main() {
  for (const account of expected) {
    const user = await db.user.findUnique({
      where: { staffNumber: account.staffNumber },
      include: {
        roles: { include: { role: true } },
        branchAssignments: { include: { branch: true } },
      },
    });
    assert.ok(user, `Missing user ${account.staffNumber}`);
    assert.equal(user.status, "ACTIVE", `${account.staffNumber} is not active`);
    assert.equal(
      user.isSampleData,
      false,
      `${account.staffNumber} is sample data`,
    );
    assert.ok(user.passwordHash, `${account.staffNumber} has no password hash`);
    assert.ok(
      user.roles.some(
        (assignment) =>
          assignment.role.code === account.role &&
          assignment.role.isActive &&
          assignment.effectiveTo === null,
      ),
      `${account.staffNumber} is missing active role ${account.role}`,
    );
    assert.ok(
      user.branchAssignments.some(
        (assignment) =>
          assignment.branch.code === "KASOA" &&
          assignment.branch.isActive &&
          assignment.effectiveTo === null,
      ),
      `${account.staffNumber} is missing an active KASOA assignment`,
    );
  }

  console.log(
    "Initial-user verification passed: both accounts are active, non-sample, correctly role-assigned, and assigned to KASOA.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
