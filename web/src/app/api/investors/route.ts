import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  parseGhsToPesewas,
  PRIVATE_CAPITAL_ANNUAL_RETURN_BPS,
} from "@/lib/private-capital";
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
      "manage_private_investors",
      session.user.featureGate,
      true,
      session.user.role,
    )
  )
    return NextResponse.json(
      { error: "Private-investor permission is required." },
      { status: 403 },
    );

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const branchId = typeof body.branchId === "string" ? body.branchId : "";
    const legalName =
      typeof body.legalName === "string" ? body.legalName.trim() : "";
    const evidenceReference =
      typeof body.evidenceReference === "string"
        ? body.evidenceReference.trim()
        : "";
    const startDate = new Date(
      typeof body.startDate === "string" ? body.startDate : "",
    );
    const maturityDate = new Date(
      typeof body.maturityDate === "string" ? body.maturityDate : "",
    );
    const principalPesewas = parseGhsToPesewas(body.principalGhs);
    if (
      !legalName ||
      !evidenceReference ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(maturityDate.getTime()) ||
      maturityDate <= startDate
    )
      throw new Error(
        "Name, cleared-funds evidence, and a maturity after the start date are required.",
      );
    const scope = await requireBranchScope(session);
    assertBranchAccess(branchId, scope);
    const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
    const result = await db.$transaction(async (tx) => {
      const branch = await tx.branch.findUniqueOrThrow({
        where: { id: branchId },
      });
      const contributor = await tx.capitalContributor.create({
        data: {
          contributorNumber: `PCI-${suffix}`,
          type: body.type === "OTHER_PRIVATE" ? "OTHER_PRIVATE" : "FAMILY",
          legalName,
          phone:
            typeof body.phone === "string" && body.phone.trim()
              ? body.phone.trim()
              : null,
          email:
            typeof body.email === "string" && body.email.trim()
              ? body.email.trim().toLowerCase()
              : null,
          identityReference:
            typeof body.identityReference === "string" &&
            body.identityReference.trim()
              ? body.identityReference.trim()
              : null,
          relationshipNote:
            typeof body.relationshipNote === "string" &&
            body.relationshipNote.trim()
              ? body.relationshipNote.trim()
              : null,
          branchId,
          createdByUserId: session.user.id,
        },
      });
      const fundAccount = await tx.fundAccount.upsert({
        where: { accountNumber: `PRIVATE-${branch.code}` },
        update: { isActive: true },
        create: {
          accountNumber: `PRIVATE-${branch.code}`,
          name: "Private family capital",
          sourceType: "INVESTOR_PRINCIPAL",
          eligibleForFunding: true,
          branchId,
        },
      });
      const lot = await tx.fundLot.create({
        data: {
          lotNumber: `INV-${suffix}`,
          description: `Private capital from ${legalName}`,
          evidenceReference,
          receivedAt: startDate,
          verifiedAt: new Date(),
          originalPesewas: principalPesewas,
          availablePesewas: principalPesewas,
          fundAccountId: fundAccount.id,
        },
      });
      await tx.fundMovement.create({
        data: {
          movementNumber: `MOV-INV-${suffix}`,
          movementType: "AVAILABLE",
          sourceReference: `PRIVATE-CAPITAL:${lot.lotNumber}`,
          amountPesewas: principalPesewas,
          principalAmountPesewas: principalPesewas,
          notes: `Cleared private capital received from ${legalName}`,
          occurredAt: startDate,
          fundLotId: lot.id,
          actorUserId: session.user.id,
        },
      });
      const investment = await tx.privateInvestment.create({
        data: {
          contractNumber: `PIC-${suffix}`,
          principalPesewas,
          annualReturnBps: PRIVATE_CAPITAL_ANNUAL_RETURN_BPS,
          dayBasis: 365,
          startDate,
          maturityDate,
          clearedAt: startDate,
          evidenceReference,
          branchId,
          contributorId: contributor.id,
          fundLotId: lot.id,
          createdByUserId: session.user.id,
        },
      });
      await postPrivateCapitalJournal(tx, {
        branchId,
        actorUserId: session.user.id,
        entryDate: startDate,
        sourceEventType: "PRIVATE_CAPITAL_RECEIVED",
        sourceReference: `INV-${suffix}`,
        description: `Private capital principal received from ${legalName}`,
        debitCode: "1000",
        creditCode: "2100",
        amountPesewas: principalPesewas,
      });
      return { contributor, investment };
    });
    await recordAuditEvent({
      eventType: "PRIVATE_CAPITAL_RECEIVED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "manage_private_investors",
      resource: `investment:${result.investment.contractNumber}`,
      reason: "cleared_private_funds",
      branchId,
    });
    return NextResponse.json(
      {
        id: result.contributor.id,
        contractNumber: result.investment.contractNumber,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Private capital could not be recorded.",
      },
      { status: 400 },
    );
  }
}
