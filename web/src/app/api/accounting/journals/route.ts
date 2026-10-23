import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { JournalLineInput } from "@/lib/journal-rules";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  assertBranchAccess,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { recordAuditEvent } from "@/server/auth/audit";
import { getServerSession } from "@/server/auth/session";
import { postBalancedJournal } from "@/server/accounting/journal";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const allowed = Boolean(
    session &&
    canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "manage_ledger",
      session.user.featureGate,
      true,
      session.user.role,
    ),
  );
  if (!session || !allowed)
    return NextResponse.json(
      { error: "Ledger posting permission is required." },
      { status: 403 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const branchId = typeof body.branchId === "string" ? body.branchId : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const sourceEventType =
    typeof body.sourceEventType === "string" ? body.sourceEventType.trim() : "";
  const sourceReference =
    typeof body.sourceReference === "string" ? body.sourceReference.trim() : "";
  const entryDate = new Date(
    typeof body.entryDate === "string" ? body.entryDate : "",
  );
  const lines = Array.isArray(body.lines)
    ? (body.lines as JournalLineInput[])
    : [];
  const scope = await requireBranchScope(session);
  try {
    assertBranchAccess(branchId, scope);
  } catch {
    return NextResponse.json(
      { error: "Branch is outside your assignment." },
      { status: 403 },
    );
  }
  if (
    description.length < 5 ||
    !sourceEventType ||
    !sourceReference ||
    Number.isNaN(entryDate.getTime())
  )
    return NextResponse.json(
      {
        error:
          "Description, source event, source reference, and entry date are required.",
      },
      { status: 400 },
    );
  try {
    const journal = await postBalancedJournal({
      journalNumber: `J-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
      description,
      sourceEventType,
      sourceReference,
      entryDate,
      branchId,
      actorUserId: session.user.id,
      lines,
    });
    await recordAuditEvent({
      eventType: "JOURNAL_POSTED",
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "manage_ledger",
      resource: `journal:${journal.journalNumber}`,
      reason: sourceEventType,
      branchId,
    });
    return NextResponse.json(
      { journalNumber: journal.journalNumber },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Journal posting failed.",
      },
      { status: 409 },
    );
  }
}
