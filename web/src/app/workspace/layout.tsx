import { Suspense, type ReactNode } from "react";
import { WorkspaceSidebar } from "../components/workspace-sidebar";
import { WorkspaceTopbar } from "../components/workspace-topbar";
import { requireServerSession } from "@/server/auth/session";
import { getAttentionNotifications } from "@/server/notifications";
import {
  requireBranchScope,
  branchScopeLabel,
} from "@/server/auth/branch-scope";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-33px)] items-center justify-center">
          <p className="text-muted text-sm font-semibold">
            Verifying secure session...
          </p>
        </div>
      }
    >
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}

async function AuthenticatedWorkspace({ children }: { children: ReactNode }) {
  const session = await requireServerSession();
  const scope = await requireBranchScope(session);
  const branch = branchScopeLabel(scope);
  const initials = session.user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  const authenticatedUser = { ...session.user, initials };
  const notifications = await getAttentionNotifications({
    userId: session.user.id,
    role: session.user.role,
    branchIds: scope.branchIds,
  });
  return (
    <div className="workspace-shell flex min-h-[calc(100vh-33px)]">
      <Suspense
        fallback={
          <div
            className="border-border bg-surface hidden w-64 shrink-0 border-r lg:block"
            aria-hidden="true"
          />
        }
      >
        <WorkspaceSidebar
          branch={branch}
          role={session.user.role}
          permissions={session.user.permissions}
          featureGate={session.user.featureGate}
          restrictions={session.user.restrictions}
        />
      </Suspense>
      <div className="min-w-0 flex-1">
        <Suspense
          fallback={
            <div
              className="border-border bg-surface h-20 border-b"
              aria-hidden="true"
            />
          }
        >
          <WorkspaceTopbar
            user={authenticatedUser}
            notifications={notifications}
            branch={branch}
            permissions={session.user.permissions}
            featureGate={session.user.featureGate}
            restrictions={session.user.restrictions}
          />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
