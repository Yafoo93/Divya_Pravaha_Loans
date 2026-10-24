import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/server/auth/password";
import { roleDefinition } from "../src/lib/role-definitions";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString)
  throw new Error("DIRECT_URL or DATABASE_URL must be configured");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const accounts = [
  {
    staffNumber: "DVP55351",
    name: "Kassim Mutawakil",
    email: "kassim.mutawakil@gmail.com",
    roleCode: "SYSTEM_ADMIN",
    password: process.env.INIT_ADMIN_PASSWORD,
  },
  {
    staffNumber: "DVP00001",
    name: "Abdul Latif Kassim",
    email: "kassim.abdul_latif@gmail.com",
    roleCode: "MANAGER",
    password: process.env.INIT_MANAGER_PASSWORD,
  },
] as const;

async function main() {
  for (const account of accounts) {
    if (
      !account.password ||
      account.password.length < 12 ||
      account.password.length > 128
    )
      throw new Error(
        `Set a unique password of 12-128 characters for ${account.staffNumber} using the appropriate INIT_*_PASSWORD environment variable.`,
      );
  }
  if (accounts[0].password === accounts[1].password)
    throw new Error("Use different passwords for the two accounts.");

  const passwordHashes = await Promise.all(
    accounts.map((account) => hashPassword(account.password!)),
  );

  await db.$transaction(
    async (tx) => {
      const branch = await tx.branch.upsert({
        where: { code: "KASOA" },
        create: {
          code: "KASOA",
          name: "Kasoa",
          isActive: true,
          isSampleData: false,
        },
        update: { name: "Kasoa", isActive: true, isSampleData: false },
      });

      for (let index = 0; index < accounts.length; index++) {
        const account = accounts[index];
        const definition = roleDefinition(account.roleCode);
        if (!definition)
          throw new Error(`Missing role definition: ${account.roleCode}`);

        const role = await tx.role.upsert({
          where: { code: definition.code },
          create: {
            code: definition.code,
            name: definition.name,
            description: definition.description,
            permissions: [...definition.permissions],
            restrictions: [...definition.restrictions],
            featureGate: definition.featureGate,
            isActive: true,
            isSampleData: false,
          },
          update: {
            name: definition.name,
            description: definition.description,
            permissions: [...definition.permissions],
            restrictions: [...definition.restrictions],
            featureGate: definition.featureGate,
            isActive: true,
            isSampleData: false,
          },
        });

        const email = account.email.toLowerCase();
        const conflictingEmail = await tx.user.findUnique({ where: { email } });
        if (
          conflictingEmail &&
          conflictingEmail.staffNumber !== account.staffNumber
        )
          throw new Error(
            `${email} belongs to a different staff account. No accounts were changed.`,
          );

        const user = await tx.user.upsert({
          where: { staffNumber: account.staffNumber },
          create: {
            staffNumber: account.staffNumber,
            name: account.name,
            email,
            passwordHash: passwordHashes[index],
            status: "ACTIVE",
            isSampleData: false,
          },
          update: {
            name: account.name,
            email,
            passwordHash: passwordHashes[index],
            status: "ACTIVE",
            isSampleData: false,
          },
        });

        const effectiveFrom = new Date();
        await tx.userRole.upsert({
          where: {
            assignmentKey: `${account.staffNumber}:${account.roleCode}`,
          },
          create: {
            assignmentKey: `${account.staffNumber}:${account.roleCode}`,
            userId: user.id,
            roleId: role.id,
            effectiveFrom,
            isSampleData: false,
          },
          update: {
            userId: user.id,
            roleId: role.id,
            effectiveTo: null,
            isSampleData: false,
          },
        });
        await tx.staffBranchAssignment.upsert({
          where: { assignmentKey: `${account.staffNumber}:${branch.code}` },
          create: {
            assignmentKey: `${account.staffNumber}:${branch.code}`,
            userId: user.id,
            branchId: branch.id,
            effectiveFrom,
            isSampleData: false,
          },
          update: {
            userId: user.id,
            branchId: branch.id,
            effectiveTo: null,
            isSampleData: false,
          },
        });
      }
    },
    { maxWait: 30_000, timeout: 60_000 },
  );

  console.log(
    "Two active staff users, roles, and Kasoa assignments are ready. No borrower or financial sample data was added.",
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
