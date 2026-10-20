import { RoleDirectory } from "../../../components/role-directory";
import { PageHeading } from "../../../components/page-heading";
import { prototypeRoles } from "@/lib/prototype-roles";
import { prototypeStaff } from "@/lib/prototype-staff";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { Suspense } from "react";
import { WorkspacePermissionBoundary } from "../../../components/server-permission-boundary";

export default function RoleAdministrationPage() {
  return (
    <Suspense fallback={<div className="p-8">Checking role access...</div>}>
      <WorkspacePermissionBoundary path="/workspace/administration/roles">
        <main className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <PageHeading
              title="Roles and permissions"
              description="Review the approved role-based access matrix, restrictions, and gated capabilities."
              branchName={prototypeWorkspace.branch.name}
              date={prototypeWorkspace.displayDate}
              currency={prototypeWorkspace.currency}
            />
            <div className="mt-8">
              <RoleDirectory roles={prototypeRoles} staff={prototypeStaff} />
            </div>
          </div>
        </main>
      </WorkspacePermissionBoundary>
    </Suspense>
  );
}
