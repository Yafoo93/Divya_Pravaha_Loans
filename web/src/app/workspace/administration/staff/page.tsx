import { db } from "@/lib/db";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../../components/page-heading";
import { StaffDirectory } from "../../../components/staff-directory";
import { prototypeWorkspace } from "@/lib/workspace-context";

export default async function StaffAdministrationPage() {
  await requireWorkspacePath("/workspace/administration/staff");
  const [users, roles, branches] = await Promise.all([
    db.user.findMany({
      orderBy: [{ name: "asc" }],
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
          select: { role: { select: { code: true, name: true } } },
        },
        branchAssignments: {
          where: { effectiveTo: null },
          select: { branch: { select: { id: true, code: true, name: true } } },
        },
      },
    }),
    db.role.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    }),
    db.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Staff and account access"
          description="Manage staff identities, login credentials, roles, branch access, and activation."
          branchName={prototypeWorkspace.branch.name}
          date={prototypeWorkspace.displayDate}
          currency={prototypeWorkspace.currency}
        />
        <div className="mt-8">
          <StaffDirectory
            initialUsers={users.map((user) => ({
              id: user.id,
              staffNumber: user.staffNumber,
              name: user.name,
              email: user.email,
              status: user.status,
              lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
              isSampleData: user.isSampleData,
              roles: user.roles.map(({ role }) => role),
              branches: user.branchAssignments.map(({ branch }) => branch),
            }))}
            roles={roles}
            branches={branches}
          />
        </div>
      </div>
    </main>
  );
}
