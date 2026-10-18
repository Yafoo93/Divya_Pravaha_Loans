import { Suspense, type ReactNode } from "react";
import { WorkspaceSidebar } from "../components/workspace-sidebar";
import { WorkspaceTopbar } from "../components/workspace-topbar";
import { prototypeWorkspace } from "@/lib/workspace-context";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-33px)]">
      <Suspense
        fallback={
          <div
            className="border-border bg-surface hidden w-64 shrink-0 border-r lg:block"
            aria-hidden="true"
          />
        }
      >
        <WorkspaceSidebar
          branch={prototypeWorkspace.branch}
          role={prototypeWorkspace.managers[0].role}
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
            users={prototypeWorkspace.managers}
            unreadNotifications={prototypeWorkspace.unreadNotifications}
          />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
