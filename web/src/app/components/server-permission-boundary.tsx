import type { ReactNode } from "react";
import type { WorkspacePath } from "@/lib/workspace-authorization";
import {
  requireAnyPermission,
  requireWorkspacePath,
} from "@/server/auth/session";

export async function WorkspacePermissionBoundary({
  path,
  children,
}: {
  path: WorkspacePath;
  children: ReactNode;
}) {
  await requireWorkspacePath(path);
  return children;
}

export async function PermissionBoundary({
  permissions,
  children,
}: {
  permissions: readonly string[];
  children: ReactNode;
}) {
  await requireAnyPermission(permissions);
  return children;
}
