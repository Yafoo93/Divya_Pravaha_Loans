import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  reversedLines,
  validateBalancedJournal,
  type JournalLineInput,
} from "@/lib/journal-rules";
import { assertIndependentChecker } from "@/server/auth/maker-checker-policy";

type PostInput = {
  journalNumber: string;
  description: string;
  sourceEventType: string;
  sourceReference: string;
  entryDate: Date;
  branchId: string;
  actorUserId: string;
  lines: readonly JournalLineInput[];
};

export async function postBalancedJournal(input: PostInput) {
  validateBalancedJournal(input.lines);
  return db.$transaction(async (tx) => {
    const period = await tx.accountingPeriod.findFirst({
      where: {
        branchId: input.branchId,
        status: "OPEN",
        startsAt: { lte: input.entryDate },
        endsAt: { gte: input.entryDate },
      },
    });
    if (!period)
      throw new Error("No open accounting period covers this entry date.");
    const accounts = await tx.ledgerAccount.findMany({
      where: {
        code: { in: input.lines.map((line) => line.accountCode) },
        isActive: true,
      },
    });
    const accountIds = new Map(
      accounts.map((account) => [account.code, account.id]),
    );
    if (
      accountIds.size !==
      new Set(input.lines.map((line) => line.accountCode)).size
    )
      throw new Error("Every journal account must be active and valid.");
    return tx.journalEntry.create({
      data: {
        journalNumber: input.journalNumber,
        description: input.description,
        sourceEventType: input.sourceEventType,
        sourceReference: input.sourceReference,
        entryDate: input.entryDate,
        status: "POSTED",
        branchId: input.branchId,
        periodId: period.id,
        actorUserId: input.actorUserId,
        lines: {
          create: input.lines.map((line) => ({
            accountId: accountIds.get(line.accountCode)!,
            debitPesewas: line.debitPesewas,
            creditPesewas: line.creditPesewas,
          })),
        },
      },
      include: { lines: true },
    });
  });
}

export async function reversePostedJournal(
  originalId: string,
  actorUserId: string,
  reason: string,
  replacement?: Omit<PostInput, "actorUserId" | "branchId">,
  receiptId?: string,
) {
  if (reason.trim().length < 10)
    throw new Error("A reversal reason of at least 10 characters is required.");
  return db.$transaction(async (tx) => {
    const original = await tx.journalEntry.findUnique({
      where: { id: originalId },
      include: {
        lines: { include: { account: true } },
        originalReversal: true,
      },
    });
    if (!original || original.status !== "POSTED" || original.originalReversal)
      throw new Error("A reversible posted journal was not found.");
    assertIndependentChecker(original.actorUserId, actorUserId);
    const suffix = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    const createJournal = async (
      input: Omit<PostInput, "actorUserId" | "branchId">,
    ) => {
      validateBalancedJournal(input.lines);
      const period = await tx.accountingPeriod.findFirst({
        where: {
          branchId: original.branchId,
          status: "OPEN",
          startsAt: { lte: input.entryDate },
          endsAt: { gte: input.entryDate },
        },
      });
      if (!period)
        throw new Error("No open accounting period covers this entry date.");
      const accounts = await tx.ledgerAccount.findMany({
        where: {
          code: { in: input.lines.map((line) => line.accountCode) },
          isActive: true,
        },
      });
      const accountIds = new Map(
        accounts.map((account) => [account.code, account.id]),
      );
      if (
        accountIds.size !==
        new Set(input.lines.map((line) => line.accountCode)).size
      )
        throw new Error("Every journal account must be active and valid.");
      return tx.journalEntry.create({
        data: {
          journalNumber: input.journalNumber,
          description: input.description,
          sourceEventType: input.sourceEventType,
          sourceReference: input.sourceReference,
          entryDate: input.entryDate,
          status: "POSTED",
          branchId: original.branchId,
          periodId: period.id,
          actorUserId,
          lines: {
            create: input.lines.map((line) => ({
              accountId: accountIds.get(line.accountCode)!,
              debitPesewas: line.debitPesewas,
              creditPesewas: line.creditPesewas,
            })),
          },
        },
      });
    };
    const sourceLines = original.lines.map((line) => ({
      accountCode: line.account.code,
      debitPesewas: line.debitPesewas,
      creditPesewas: line.creditPesewas,
    }));
    const reversing = await createJournal({
      journalNumber: `J-REV-${suffix}`,
      description: `Reversal of ${original.journalNumber}: ${reason.trim()}`,
      sourceEventType: "JOURNAL_REVERSAL",
      sourceReference: `REV-${original.sourceReference}-${suffix}`,
      entryDate: new Date(),
      lines: reversedLines(sourceLines),
    });
    const replacementJournal = replacement
      ? await createJournal(replacement)
      : null;
    await tx.journalEntry.update({
      where: { id: original.id },
      data: { status: "REVERSED" },
    });
    if (receiptId) {
      const receipt = await tx.receipt.findUnique({
        where: { id: receiptId },
        include: {
          payment: {
            include: { allocations: true, custodyMovement: true },
          },
        },
      });
      if (!receipt || !receipt.payment)
        throw new Error("The linked receipt payment was not found.");
      if (receipt.status === "REVERSED")
        throw new Error("The linked receipt is already reversed.");
      for (const allocation of receipt.payment.allocations) {
        await tx.repaymentInstalment.update({
          where: { id: allocation.instalmentId },
          data: {
            principalPaidPesewas: {
              decrement: allocation.principalAllocatedPesewas,
            },
            interestPaidPesewas: {
              decrement: allocation.interestAllocatedPesewas,
            },
            status: "PART_PAID",
          },
        });
      }
      const custody = await tx.custodyMovement.aggregate({
        where: { collectorUserId: receipt.collectorUserId },
        _sum: { amountPesewas: true },
      });
      await tx.custodyMovement.create({
        data: {
          movementNumber: `CST-REV-${suffix}`,
          type: "REVERSAL",
          amountPesewas: -receipt.amountPesewas,
          balanceAfterPesewas:
            (custody._sum.amountPesewas ?? 0) - receipt.amountPesewas,
          occurredAt: new Date(),
          branchId: receipt.branchId,
          collectorUserId: receipt.collectorUserId,
        },
      });
      await tx.payment.update({
        where: { id: receipt.payment.id },
        data: { status: "REVERSED" },
      });
      await tx.receipt.update({
        where: { id: receipt.id },
        data: { status: "REVERSED" },
      });
    }
    return tx.reversal.create({
      data: {
        reversalNumber: `RVR-${suffix}`,
        reason: reason.trim(),
        originalJournalId: original.id,
        reversingJournalId: reversing.id,
        replacementJournalId: replacementJournal?.id,
        authorizedByUserId: actorUserId,
      },
      include: {
        originalJournal: true,
        reversingJournal: true,
        replacementJournal: true,
      },
    });
  });
}
