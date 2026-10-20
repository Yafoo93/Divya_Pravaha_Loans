import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { staffRoles, type StaffRole } from "@/lib/workspace-navigation";
import {
  canAccessWorkspacePath,
  canPerformPermission,
  type WorkspacePath,
} from "@/lib/workspace-authorization";
import {
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "./session-token";
import {
  assertIndependentChecker,
  isMakerCheckerPermission,
} from "./maker-checker-policy";
import { recordAuditEvent } from "./audit";

export async function createServerSession(
  userId: string,
  metadata: { userAgent?: string; ipAddress?: string } = {},
) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt,
      userAgent: metadata.userAgent?.slice(0, 500),
      ipAddress: metadata.ipAddress?.slice(0, 64),
    },
  });
  await recordAuditEvent({
    eventType: "AUTH_LOGIN",
    outcome: "SUCCESS",
    actorUserId: userId,
    resource: "session",
    reason: "credentials_verified",
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
  });
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
}

export async function getServerSession() {
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const now = new Date();
  const session = await db.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: { gt: now },
      user: { status: "ACTIVE" },
    },
    include: {
      user: {
        include: {
          roles: {
            where: {
              effectiveFrom: { lte: now },
              OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
              role: { isActive: true },
            },
            include: { role: true },
          },
          branchAssignments: {
            where: {
              effectiveFrom: { lte: now },
              OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
              branch: { isActive: true },
            },
            include: { branch: true },
          },
        },
      },
    },
  });
  if (!session || session.user.roles.length !== 1) return null;
  const assignedRole = session.user.roles[0].role;
  if (!staffRoles.includes(assignedRole.code as StaffRole)) return null;
  return {
    id: session.id,
    expiresAt: session.expiresAt,
    user: {
      id: session.user.id,
      staffNumber: session.user.staffNumber,
      name: session.user.name,
      email: session.user.email,
      role: assignedRole.code as StaffRole,
      permissions: assignedRole.permissions,
      restrictions: assignedRole.restrictions,
      featureGate: assignedRole.featureGate,
      branches: session.user.branchAssignments.map(({ branch }) => ({
        id: branch.id,
        code: branch.code,
        name: branch.name,
      })),
    },
  };
}

export async function requireServerSession() {
  const session = await getServerSession();
  if (!session) {
    await recordAuditEvent({
      eventType: "AUTH_SESSION_CHECK",
      outcome: "DENIED",
      resource: "session",
      reason: "missing_expired_or_invalid_session",
    });
    redirect("/login?reason=session");
  }
  return session;
}

export async function requirePermission(
  permission: string,
  mutation = false,
  makerUserId?: string,
) {
  const session = await requireServerSession();
  let allowed = canPerformPermission(
    session.user.permissions,
    session.user.restrictions,
    permission,
    session.user.featureGate,
    mutation,
    session.user.role,
  );
  let reason = allowed ? "granted" : "permission_not_granted";
  if (allowed && isMakerCheckerPermission(permission)) {
    try {
      assertIndependentChecker(makerUserId ?? "", session.user.id);
    } catch {
      allowed = false;
      reason = "maker_checker_violation";
    }
  }
  await recordAuditEvent({
    eventType: "PERMISSION_CHECK",
    outcome: allowed ? "SUCCESS" : "DENIED",
    actorUserId: session.user.id,
    permission,
    reason,
    branchId:
      session.user.branches.length === 1 ? session.user.branches[0].id : null,
  });
  if (!allowed) {
    redirect(
      reason === "maker_checker_violation"
        ? "/workspace/denied?reason=maker-checker"
        : "/workspace/denied",
    );
  }
  return session;
}

export async function requireAnyPermission(
  permissions: readonly string[],
  mutation = false,
  makerUserId?: string,
) {
  const session = await requireServerSession();
  const hasPermission = permissions.some((permission) =>
    canPerformPermission(
      session.user.permissions,
      session.user.restrictions,
      permission,
      session.user.featureGate,
      mutation,
      session.user.role,
    ),
  );
  let reason = hasPermission ? "granted" : "permission_not_granted";
  if (hasPermission && mutation && permissions.some(isMakerCheckerPermission)) {
    try {
      assertIndependentChecker(makerUserId ?? "", session.user.id);
    } catch {
      reason = "maker_checker_violation";
    }
  }
  const allowed = reason === "granted";
  await recordAuditEvent({
    eventType: "PERMISSION_CHECK",
    outcome: allowed ? "SUCCESS" : "DENIED",
    actorUserId: session.user.id,
    permission: permissions.join(","),
    reason,
    branchId:
      session.user.branches.length === 1 ? session.user.branches[0].id : null,
  });
  if (!allowed) {
    redirect(
      reason === "maker_checker_violation"
        ? "/workspace/denied?reason=maker-checker"
        : "/workspace/denied",
    );
  }
  return session;
}

export async function requireWorkspacePath(path: WorkspacePath) {
  const session = await requireServerSession();
  const allowed = canAccessWorkspacePath(
    path,
    session.user.role,
    session.user.permissions,
    session.user.featureGate,
    session.user.restrictions,
  );
  await recordAuditEvent({
    eventType: "PERMISSION_PATH_CHECK",
    outcome: allowed ? "SUCCESS" : "DENIED",
    actorUserId: session.user.id,
    permission: "workspace_path_access",
    resource: path,
    reason: allowed ? "granted" : "permission_not_granted",
    branchId:
      session.user.branches.length === 1 ? session.user.branches[0].id : null,
  });
  if (!allowed) redirect("/workspace/denied");
  return session;
}

export async function revokeServerSession(
  eventType: "AUTH_LOGOUT" | "AUTH_SESSION_REPLACED" = "AUTH_LOGOUT",
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = hashSessionToken(token);
    const activeSession = await db.session.findFirst({
      where: { tokenHash, revokedAt: null },
      select: { userId: true },
    });
    const revoked = await db.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (activeSession && revoked.count > 0) {
      await recordAuditEvent({
        eventType,
        outcome: "SUCCESS",
        actorUserId: activeSession.userId,
        resource: "session",
        reason:
          eventType === "AUTH_LOGOUT" ? "user_logout" : "session_replaced",
      });
    }
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
