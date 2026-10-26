import { BranchDirectory } from "../../../components/branch-directory";
import { PageHeading } from "../../../components/page-heading";
import { prototypeBranches } from "@/lib/prototype-branches";
import { prototypeStaff } from "@/lib/prototype-staff";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { Suspense } from "react";
import { WorkspacePermissionBoundary } from "../../../components/server-permission-boundary";

export default function BranchAdministrationPage() {
  return (
    <Suspense fallback={<div className="p-8">Checking branch access...</div>}>
      <WorkspacePermissionBoundary path="/workspace/administration/branches">
        <main className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <PageHeading
              title="Branches and assignments"
              description="Review operating branches and control staff access by branch."
              branchName={prototypeWorkspace.branch.name}
              date={prototypeWorkspace.displayDate}
              currency={prototypeWorkspace.currency}
            />
            <div className="mt-8">
              <BranchDirectory
                initialBranches={prototypeBranches}
                staff={prototypeStaff}
              />
            </div>
          </div>
        </main>
      </WorkspacePermissionBoundary>
    </Suspense>
  );
}
