import { Suspense, type ReactNode } from "react";
import { FieldMobileChrome } from "../components/field-mobile-chrome";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { requirePermission } from "@/server/auth/session";
import {
  branchScopeLabel,
  requireBranchScope,
} from "@/server/auth/branch-scope";

export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="bg-surface mx-auto min-h-screen max-w-md p-8">
          <p className="text-muted">Checking collector access...</p>
        </div>
      }
    >
      <AuthorizedFieldLayout>{children}</AuthorizedFieldLayout>
    </Suspense>
  );
}

async function AuthorizedFieldLayout({ children }: { children: ReactNode }) {
  const session = await requirePermission("view_assignments");
  const scope = await requireBranchScope(session);
  const branch = branchScopeLabel(scope);
  return (
    <div className="bg-background border-border mx-auto min-h-[calc(100vh-33px)] max-w-md border-x shadow-xl">
      <Suspense
        fallback={
          <div
            className="bg-surface border-border h-24 border-b"
            aria-hidden="true"
          />
        }
      >
        <FieldMobileChrome
          collector={{ name: session.user.name, role: "Field Collector" }}
          branch={branch.name}
          online
          displayDate={prototypeWorkspace.displayDate.toISOString()}
        />
      </Suspense>
      <div className="pb-20">{children}</div>
    </div>
  );
}
