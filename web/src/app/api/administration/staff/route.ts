import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import {
  recordAuditEvent,
  recordSensitiveAuditEvent,
} from "@/server/auth/audit";
import { hashPassword } from "@/server/auth/password";
import { getServerSession } from "@/server/auth/session";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

async function authorize(request: NextRequest) {
  const session = await getServerSession();
  const allowed = Boolean(
    session &&
    canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      "manage_users",
      session.user.featureGate,
      request.method !== "GET",
      session.user.role,
    ),
  );
  await recordAuditEvent({
    eventType: "PERMISSION_CHECK",
    outcome: allowed ? "SUCCESS" : "DENIED",
    actorUserId: session?.user.id,
    permission: "manage_users",
    resource: "/api/administration/staff",
    reason: allowed ? "granted" : "permission_not_granted",
  });
  return allowed
    ? { session, response: null }
    : {
        session: null,
        response: NextResponse.json(
          { error: "Access denied." },
          { status: 403 },
        ),
      };
}

function requestMetadata(request: NextRequest) {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

function validText(value: unknown, maximum: number) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maximum
  );
}

function parseUserPayload(value: unknown, creating: boolean) {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const roleId = typeof body.roleId === "string" ? body.roleId : "";
  const branchId = typeof body.branchId === "string" ? body.branchId : "";
  const status = body.status;
  const password = typeof body.password === "string" ? body.password : "";
  if (
    !validText(name, 150) ||
    !validText(email, 254) ||
    !emailPattern.test(email) ||
    !roleId ||
    !branchId ||
    !userStatuses.includes(status as (typeof userStatuses)[number]) ||
    (creating && (password.length < 8 || password.length > 128)) ||
    (!creating &&
      password.length > 0 &&
      (password.length < 8 || password.length > 128))
  ) {
    return null;
  }
  return {
    name,
    email,
    roleId,
    branchId,
    status: status as (typeof userStatuses)[number],
    password,
  };
}

async function preserveAnActiveSystemAdmin(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  targetUserId: string,
  targetCurrentlyAdmin: boolean,
  nextStatus: (typeof userStatuses)[number],
  nextRoleCode: string,
) {
  if (
    !targetCurrentlyAdmin ||
    (nextStatus === "ACTIVE" && nextRoleCode === "SYSTEM_ADMIN")
  )
    return;
  const otherActiveAdmins = await tx.user.count({
    where: {
      id: { not: targetUserId },
      status: "ACTIVE",
      roles: {
        some: {
          effectiveTo: null,
          role: { code: "SYSTEM_ADMIN", isActive: true },
        },
      },
    },
  });
  if (otherActiveAdmins === 0) {
    throw new Error("LAST_ACTIVE_SYSTEM_ADMIN");
  }
}

export async function GET(request: NextRequest) {
  const { response } = await authorize(request);
  if (response) return response;
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      staffNumber: true,
      name: true,
      email: true,
      status: true,
      lastActiveAt: true,
      isSampleData: true,
      roles: {
        where: { effectiveTo: null },
        select: { role: { select: { id: true, code: true, name: true } } },
      },
      branchAssignments: {
        where: { effectiveTo: null },
        select: { branch: { select: { id: true, code: true, name: true } } },
      },
    },
  });
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const { session, response } = await authorize(request);
  if (response) return response;
  if (!session)
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
  const values = parseUserPayload(body, true);
  if (!values) {
    return NextResponse.json(
      { error: "Check the required fields and password (8–128 characters)." },
      { status: 400 },
    );
  }
  const [role, branch, duplicate] = await Promise.all([
    db.role.findFirst({ where: { id: values.roleId, isActive: true } }),
    db.branch.findFirst({ where: { id: values.branchId, isActive: true } }),
    db.user.findFirst({
      where: { OR: [{ email: values.email }] },
      select: { id: true },
    }),
  ]);
  if (!role || !branch) {
    return NextResponse.json(
      { error: "Select an active role and branch." },
      { status: 400 },
    );
  }
  if (duplicate)
    return NextResponse.json(
      { error: "That email address is already in use." },
      { status: 409 },
    );

  const passwordHash = await hashPassword(values.password);
  const staffNumber = `STF-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
  const now = new Date();
  try {
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          staffNumber,
          name: values.name,
          email: values.email,
          passwordHash,
          status: values.status,
        },
      });
      await tx.userRole.create({
        data: {
          assignmentKey: `${staffNumber}:${role.code}:${randomUUID()}`,
          userId: created.id,
          roleId: role.id,
          effectiveFrom: now,
        },
      });
      await tx.staffBranchAssignment.create({
        data: {
          assignmentKey: `${staffNumber}:${branch.code}:${randomUUID()}`,
          userId: created.id,
          branchId: branch.id,
          effectiveFrom: now,
        },
      });
      return created;
    });
    await recordSensitiveAuditEvent("securityChange", {
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "manage_users",
      resource: `user:${user.id}`,
      reason: values.status.toLowerCase(),
      ...requestMetadata(request),
    });
    return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
  } catch (error) {
    await recordSensitiveAuditEvent("securityChange", {
      outcome: "FAILURE",
      actorUserId: session.user.id,
      permission: "manage_users",
      resource: `staff:${staffNumber}`,
      reason: "create_failed",
      ...requestMetadata(request),
    });
    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await authorize(request);
  if (response) return response;
  if (!session)
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
  const payload =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const userId = typeof payload.id === "string" ? payload.id : "";
  const values = parseUserPayload(payload, false);
  if (!userId || !values) {
    return NextResponse.json(
      { error: "Check the required fields." },
      { status: 400 },
    );
  }
  const [existing, role, branch] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        roles: { where: { effectiveTo: null }, include: { role: true } },
      },
    }),
    db.role.findFirst({ where: { id: values.roleId, isActive: true } }),
    db.branch.findFirst({ where: { id: values.branchId, isActive: true } }),
  ]);
  if (!existing)
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (!role || !branch)
    return NextResponse.json(
      { error: "Select an active role and branch." },
      { status: 400 },
    );
  const currentRoleCode = existing.roles[0]?.role.code ?? "";
  if (
    userId === session.user.id &&
    (values.status !== "ACTIVE" || role.code !== "SYSTEM_ADMIN")
  ) {
    return NextResponse.json(
      {
        error:
          "You cannot deactivate yourself or remove your System Admin role.",
      },
      { status: 409 },
    );
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      await preserveAnActiveSystemAdmin(
        tx,
        userId,
        currentRoleCode === "SYSTEM_ADMIN",
        values.status,
        role.code,
      );
      const passwordHash = values.password
        ? await hashPassword(values.password)
        : undefined;
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          name: values.name,
          email: values.email,
          status: values.status,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });
      if (currentRoleCode !== role.code) {
        await tx.userRole.updateMany({
          where: { userId, effectiveTo: null },
          data: { effectiveTo: new Date() },
        });
        const historicAssignment = await tx.userRole.findFirst({
          where: { userId, roleId: role.id },
          orderBy: { effectiveFrom: "desc" },
        });
        if (historicAssignment) {
          await tx.userRole.update({
            where: { id: historicAssignment.id },
            data: { effectiveFrom: new Date(), effectiveTo: null },
          });
        } else {
          await tx.userRole.create({
            data: {
              assignmentKey: `${existing.staffNumber}:${role.code}:${randomUUID()}`,
              userId,
              roleId: role.id,
              effectiveFrom: new Date(),
            },
          });
        }
      }
      const activeBranch = await tx.staffBranchAssignment.findFirst({
        where: { userId, effectiveTo: null, branchId: branch.id },
      });
      if (!activeBranch) {
        await tx.staffBranchAssignment.updateMany({
          where: { userId, effectiveTo: null },
          data: { effectiveTo: new Date() },
        });
        const historicBranch = await tx.staffBranchAssignment.findFirst({
          where: { userId, branchId: branch.id },
          orderBy: { effectiveFrom: "desc" },
        });
        if (historicBranch) {
          await tx.staffBranchAssignment.update({
            where: { id: historicBranch.id },
            data: { effectiveFrom: new Date(), effectiveTo: null },
          });
        } else {
          await tx.staffBranchAssignment.create({
            data: {
              assignmentKey: `${existing.staffNumber}:${branch.code}:${randomUUID()}`,
              userId,
              branchId: branch.id,
              effectiveFrom: new Date(),
            },
          });
        }
      }
      if (values.status !== "ACTIVE") {
        await tx.session.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } else if (passwordHash) {
        await tx.session.updateMany({
          where: { userId, revokedAt: null, id: { not: session.id } },
          data: { revokedAt: new Date() },
        });
      }
      return user;
    });
    const changes =
      [
        existing.name !== values.name ? "name" : "",
        existing.email !== values.email ? "email" : "",
        currentRoleCode !== role.code ? "role" : "",
        existing.status !== values.status ? "status" : "",
        values.password ? "password_reset" : "",
      ]
        .filter(Boolean)
        .join(",") || "no_effective_change";
    await recordSensitiveAuditEvent("securityChange", {
      outcome: "SUCCESS",
      actorUserId: session.user.id,
      permission: "manage_users",
      resource: `user:${updated.id}`,
      reason: changes,
      ...requestMetadata(request),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "LAST_ACTIVE_SYSTEM_ADMIN"
    ) {
      return NextResponse.json(
        { error: "At least one active System Admin must remain." },
        { status: 409 },
      );
    }
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That email address is already in use." },
        { status: 409 },
      );
    }
    await recordSensitiveAuditEvent("securityChange", {
      outcome: "FAILURE",
      actorUserId: session.user.id,
      permission: "manage_users",
      resource: `user:${userId}`,
      reason: "update_failed",
      ...requestMetadata(request),
    });
    throw error;
  }
}
