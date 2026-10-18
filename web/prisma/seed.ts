import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

async function main() {
  const branch = await db.branch.upsert({
    where: { code: "KASOA-MARKET" },
    update: {
      name: "Kasoa Market",
      isActive: true,
    },
    create: {
      code: "KASOA-MARKET",
      name: "Kasoa Market",
      isActive: true,
    },
  });

  console.log(`Seeded branch: ${branch.code} — ${branch.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
