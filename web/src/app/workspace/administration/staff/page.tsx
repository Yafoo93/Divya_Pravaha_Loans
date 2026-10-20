import { PageHeading } from "../../../components/page-heading";
import { StaffDirectory } from "../../../components/staff-directory";
import { prototypeStaff } from "@/lib/prototype-staff";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { Suspense } from "react";
import { WorkspacePermissionBoundary } from "../../../components/server-permission-boundary";

export default function StaffAdministrationPage() {
  return (
    <Suspense fallback={<div className="p-8">Checking staff access...</div>}>
      <WorkspacePermissionBoundary path="/workspace/administration/staff">
        <main className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <PageHeading
              title="Staff and activation"
              description="Review prototype staff identities, roles, branch assignments, and activation state."
              branchName={prototypeWorkspace.branch.name}
              date={prototypeWorkspace.displayDate}
              currency={prototypeWorkspace.currency}
            />
            <div className="mt-8">
              <StaffDirectory initialStaff={prototypeStaff} />
            </div>
          </div>
        </main>
      </WorkspacePermissionBoundary>
    </Suspense>
  );
}
