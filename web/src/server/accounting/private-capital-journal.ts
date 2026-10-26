import type { Prisma } from "@/generated/prisma/client";

const accountDefinitions = {
  "1000": { name: "Cash on Hand", type: "ASSET" },
  "2100": { name: "Private Capital Principal Liability", type: "LIABILITY" },
  "2110": { name: "Private Capital Returns Payable", type: "LIABILITY" },
  "3000": { name: "Owner Capital", type: "EQUITY" },
  "4100": { name: "Other Income", type: "INCOME" },
  "5000": { name: "Private Capital Return Expense", type: "EXPENSE" },
} as const;

type AccountCode = keyof typeof accountDefinitions;

export async function postPrivateCapitalJournal(
  tx: Prisma.TransactionClient,
  input: {
    branchId: string;
    actorUserId: string;
    entryDate: Date;
    sourceEventType: string;
    sourceReference: string;
    description: string;
    debitCode: AccountCode;
    creditCode: AccountCode;
    amountPesewas: number;
  },
) {
  const startsAt = new Date(
    Date.UTC(
      input.entryDate.getUTCFullYear(),
      input.entryDate.getUTCMonth(),
      1,
    ),
  );
  const endsAt = new Date(
    Date.UTC(
      input.entryDate.getUTCFullYear(),
      input.entryDate.getUTCMonth() + 1,
      1,
    ) - 1,
  );
  const periodKey = `${input.branchId.slice(-8)}-${startsAt.toISOString().slice(0, 7)}`;
  const existingPeriod = await tx.accountingPeriod.findUnique({
    where: { branchId_startsAt: { branchId: input.branchId, startsAt } },
  });
  const period =
    existingPeriod ??
    (await tx.accountingPeriod.create({
      data: {
        periodKey,
        name: startsAt.toLocaleString("en-GH", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }),
        startsAt,
        endsAt,
        status: "OPEN",
        branchId: input.branchId,
      },
    }));
  if (period.status !== "OPEN")
    throw new Error("The accounting period is closed.");
  const codes = [input.debitCode, input.creditCode] as const;
  const accounts = await Promise.all(
    codes.map((code) =>
      tx.ledgerAccount.upsert({
        where: { code },
        update: { isActive: true },
        create: { code, ...accountDefinitions[code] },
      }),
    ),
  );
  return tx.journalEntry.create({
    data: {
      journalNumber: `J-${input.sourceReference}`.slice(0, 40),
      description: input.description,
      sourceEventType: input.sourceEventType,
      sourceReference: input.sourceReference,
      entryDate: input.entryDate,
      branchId: input.branchId,
      periodId: period.id,
      actorUserId: input.actorUserId,
      lines: {
        create: [
          { accountId: accounts[0].id, debitPesewas: input.amountPesewas },
          { accountId: accounts[1].id, creditPesewas: input.amountPesewas },
        ],
      },
    },
  });
}
