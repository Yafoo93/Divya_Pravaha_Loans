import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parseGhsToPesewas } from "@/lib/private-capital";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";
import { postPrivateCapitalJournal } from "@/server/accounting/private-capital-journal";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (
    !session ||
    !canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "manage_capital_sources",
      session.user.featureGate,
      true,
      session.user.role,
    )
  )
    return NextResponse.json(
      { error: "Capital-source permission is required." },
      { status: 403 },
    );

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const branchId = typeof body.branchId === "string" ? body.branchId : "";
    const sourceType =
      body.sourceType === "OTHER_INCOME" ? "OTHER_INCOME" : "OWNER_CAPITAL";
    const sourceName =
      typeof body.sourceName === "string" ? body.sourceName.trim() : "";
    const evidenceReference =
      typeof body.evidenceReference === "string"
        ? body.evidenceReference.trim()
        : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";
    const amountPesewas = parseGhsToPesewas(body.amountGhs);
    const receivedAt = new Date(
      typeof body.receivedAt === "string" ? body.receivedAt : "",
    );
    if (!sourceName || !evidenceReference || Number.isNaN(receivedAt.getTime()))
      throw new Error(
        "Source name, cleared date, and evidence reference are required.",
      );
    const scope = await requireBranchScope(session);
    assertBranchAccess(branchId, scope);
    const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();

    const result = await db.$transaction(async (tx) => {
      const branch = await tx.branch.findUniqueOrThrow({
        where: { id: branchId },
      });
      const accountNumber = `${sourceType === "OWNER_CAPITAL" ? "OWNER" : "INCOME"}-${branch.code}`;
      const fundAccount = await tx.fundAccount.upsert({
        where: { accountNumber },
        update: { isActive: true },
        create: {
          accountNumber,
          name:
            sourceType === "OWNER_CAPITAL"
              ? "Owner capital"
              : "Other verified income",
          sourceType,
          eligibleForFunding: true,
          branchId,
        },
      });
      const lot = await tx.fundLot.create({
        data: {
          lotNumber: `CAP-${suffix}`,
          description: `${sourceName}${notes ? ` - ${notes}` : ""}`,
          evidenceReference,
          receivedAt,
          verifiedAt: new Date(),
          originalPesewas: amountPesewas,
          availablePesewas: amountPesewas,
          fundAccountId: fundAccount.id,
        },
      });
      await tx.fundMovement.create({
        data: {
          movementNumber: `MOV-${suffix}`,
          movementType: "AVAILABLE",
          sourceReference: `CAPITAL:${lot.lotNumber}`,
          amountPesewas,
          principalAmountPesewas: amountPesewas,
          notes: `Cleared ${sourceType.toLowerCase().replaceAll("_", " ")} received from ${sourceName}`,
          occurredAt: receivedAt,
          fundLotId: lot.id,
          actorUserId: session.user.id,
        },
      });
      await postPrivateCapitalJournal(tx, {
        branchId,
        actorUserId: session.user.id,
        entryDate: receivedAt,
        sourceEventType:
          sourceType === "OWNER_CAPITAL"
            ? "OWNER_CAPITAL_RECEIVED"
            : "OTHER_INCOME_RECEIVED",
        sourceReference: `CAP-${suffix}`,
        description: `${sourceType === "OWNER_CAPITAL" ? "Owner capital" : "Other income"} received from ${sourceName}`,
        debitCode: "1000",
        creditCode: sourceType === "OWNER_CAPITAL" ? "3000" : "4100",
        amountPesewas,
      });
      return lot;
    });
    await recordAuditEvent({
      eventType: "CAPITAL_SOURCE_RECEIVED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "manage_capital_sources",
      resource: `fund-lot:${result.lotNumber}`,
      reason: sourceType,
      branchId,
    });
    return NextResponse.json(
      { id: result.id, lotNumber: result.lotNumber },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Capital source could not be recorded.",
      },
      { status: 400 },
    );
  }
}
