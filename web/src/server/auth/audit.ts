import "server-only";

import { headers } from "next/headers";
import { db } from "@/lib/db";

export type AuditOutcome = "SUCCESS" | "DENIED" | "FAILURE";

export const sensitiveAuditEventTypes = {
  approval: "BUSINESS_APPROVAL",
  rejection: "BUSINESS_REJECTION",
  reversal: "FINANCIAL_REVERSAL",
  privateDocumentAccess: "PRIVATE_DOCUMENT_ACCESS",
  securityChange: "SECURITY_CONFIGURATION_CHANGE",
} as const;

export type SensitiveAuditAction = keyof typeof sensitiveAuditEventTypes;

export type AuditEventInput = {
  eventType: string;
  outcome: AuditOutcome;
  actorUserId?: string | null;
  actorName?: string;
  actorRole?: string;
  permission?: string;
  resource?: string;
  reason?: string;
  branchId?: string | null;
  ipAddress?: string;
  userAgent?: string;
};

export async function recordAuditEvent(event: AuditEventInput) {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  let actorName = event.actorName;
  let actorRole = event.actorRole;
  if (event.actorUserId && (!actorName || !actorRole)) {
    const now = new Date();
    const actor = await db.user.findUnique({
      where: { id: event.actorUserId },
      select: {
        name: true,
        roles: {
          where: {
            effectiveFrom: { lte: now },
            OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
          },
          take: 1,
          select: { role: { select: { code: true } } },
        },
      },
    });
    actorName ??= actor?.name;
    actorRole ??= actor?.roles[0]?.role.code;
  }

  await db.auditEvent.create({
    data: {
      eventType: event.eventType.slice(0, 80),
      outcome: event.outcome,
      actorUserId: event.actorUserId ?? null,
      actorName: actorName?.slice(0, 150),
      actorRole: actorRole?.slice(0, 50),
      permission: event.permission?.slice(0, 500),
      resource: event.resource?.slice(0, 180),
      reason: event.reason?.slice(0, 120),
      branchId: event.branchId ?? null,
      ipAddress: (event.ipAddress ?? forwardedFor)?.slice(0, 64),
      userAgent: (event.userAgent ?? requestHeaders.get("user-agent"))?.slice(
        0,
        500,
      ),
    },
  });
}

export function recordSensitiveAuditEvent(
  action: SensitiveAuditAction,
  event: Omit<AuditEventInput, "eventType">,
) {
  return recordAuditEvent({
    ...event,
    eventType: sensitiveAuditEventTypes[action],
  });
}
