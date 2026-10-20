import "server-only";

import { headers } from "next/headers";
import { db } from "@/lib/db";

export type AuditOutcome = "SUCCESS" | "DENIED" | "FAILURE";

export type AuditEventInput = {
  eventType: string;
  outcome: AuditOutcome;
  actorUserId?: string | null;
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

  await db.auditEvent.create({
    data: {
      eventType: event.eventType.slice(0, 80),
      outcome: event.outcome,
      actorUserId: event.actorUserId ?? null,
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
