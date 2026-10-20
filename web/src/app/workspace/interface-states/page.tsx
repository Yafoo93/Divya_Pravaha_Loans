import { PageHeading } from "../../components/page-heading";
import { StateShowcase } from "../../components/state-showcase";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { Suspense } from "react";
import { WorkspacePermissionBoundary } from "../../components/server-permission-boundary";

export default function InterfaceStatesPage() {
  return (
    <Suspense
      fallback={<div className="p-8">Checking interface access...</div>}
    >
      <WorkspacePermissionBoundary path="/workspace/interface-states">
        <main className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <PageHeading
              title="Interface states"
              description="Preview loading, empty, error, denied, and not-found experiences."
              branchName={prototypeWorkspace.branch.name}
              date={prototypeWorkspace.displayDate}
              currency={prototypeWorkspace.currency}
            />
            <div className="mt-8">
              <StateShowcase />
            </div>
          </div>
        </main>
      </WorkspacePermissionBoundary>
    </Suspense>
  );
}
