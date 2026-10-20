import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { validateLogin } from "@/lib/login-validation";
import { verifyPassword } from "@/server/auth/password";
import { recordAuditEvent } from "@/server/auth/audit";
import {
  createServerSession,
  revokeServerSession,
} from "@/server/auth/session";

const INVALID_LOGIN = "Email or password is incorrect.";
const dummyPasswordHash = hashPasswordForTiming();

async function recordFailedLogin(
  request: NextRequest,
  reason: string,
  actorUserId?: string,
) {
  await recordAuditEvent({
    eventType: "AUTH_LOGIN",
    outcome: "FAILURE",
    actorUserId,
    resource: "session",
    reason,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
}

async function hashPasswordForTiming() {
  const { hashPassword } = await import("@/server/auth/password");
  return hashPassword("NonAccountTimingPassword!2026");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    await recordFailedLogin(request, "malformed_request");
    return NextResponse.json({ error: INVALID_LOGIN }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    await recordFailedLogin(request, "malformed_request");
    return NextResponse.json({ error: INVALID_LOGIN }, { status: 400 });
  }
  const values = {
    email:
      typeof Reflect.get(body, "email") === "string"
        ? Reflect.get(body, "email")
        : "",
    password:
      typeof Reflect.get(body, "password") === "string"
        ? Reflect.get(body, "password")
        : "",
  } as { email: string; password: string };
  if (Object.keys(validateLogin(values)).length > 0) {
    await recordFailedLogin(request, "invalid_credentials_format");
    return NextResponse.json({ error: INVALID_LOGIN }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email: values.email.trim().toLowerCase() },
  });
  const passwordMatches = await verifyPassword(
    values.password,
    user?.passwordHash ?? (await dummyPasswordHash),
  );
  const valid = Boolean(
    user?.passwordHash && user.status === "ACTIVE" && passwordMatches,
  );
  if (!user || !valid) {
    await recordFailedLogin(request, "invalid_credentials", user?.id);
    return NextResponse.json({ error: INVALID_LOGIN }, { status: 401 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  await revokeServerSession("AUTH_SESSION_REPLACED");
  await createServerSession(user.id, {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ipAddress: forwardedFor?.trim(),
  });
  return NextResponse.json({ ok: true });
}
