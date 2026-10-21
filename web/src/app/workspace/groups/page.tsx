import Link from "next/link";
import { db } from "@/lib/db";
import {
  branchScopeWhere,
  requireBranchScope,
  branchScopeLabel,
} from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../components/page-heading";
import { Badge, Card, DataTable } from "../../components/ui/data-display";

export default async function GroupsPage() {
  const session = await requireWorkspacePath("/workspace/groups");
  const scope = await requireBranchScope(session);
  const groups = await db.borrowerGroup.findMany({
    where: branchScopeWhere(scope),
    orderBy: { name: "asc" },
    include: {
      officer: true,
      memberships: { where: { status: "ACTIVE" } },
      activationReviews: { orderBy: { requestedAt: "desc" }, take: 1 },
    },
  });
  const branch = branchScopeLabel(scope);
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Groups"
          description="Branch groups, assigned officers, membership status, and activation readiness."
          branchName={branch.name}
          date={new Date()}
          currency="GHS"
          actions={
            session.user.permissions.includes("manage_groups") ? (
              <Link
                href="/workspace/groups/new"
                className="bg-primary rounded-lg px-4 py-3 text-sm font-bold text-white"
              >
                New group
              </Link>
            ) : null
          }
        />
        <Card className="mt-8 overflow-hidden">
          <div className="border-border border-b p-5">
            <h2 className="text-lg font-bold">Group directory</h2>
            <p className="text-muted mt-1 text-sm">
              All groups within your assigned branch scope.
            </p>
          </div>
          <DataTable
            columns={[
              { key: "group", label: "Group" },
              { key: "status", label: "Status" },
              { key: "officer", label: "Officer" },
              { key: "members", label: "Members" },
              { key: "readiness", label: "Readiness" },
              { key: "action", label: "Action" },
            ]}
            rows={groups.map((group) => {
              const ready =
                group.memberships.length >= 5 &&
                group.memberships.every((m) => m.hasConsented);
              return {
                id: group.id,
                cells: {
                  group: (
                    <div>
                      <p className="font-bold">{group.name}</p>
                      <p className="text-muted text-xs">{group.groupNumber}</p>
                    </div>
                  ),
                  status: (
                    <Badge
                      variant={
                        group.status === "ACTIVE"
                          ? "success"
                          : group.status === "SUSPENDED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {group.status}
                    </Badge>
                  ),
                  officer: group.officer?.name ?? "Unassigned",
                  members: String(group.memberships.length),
                  readiness: (
                    <Badge variant={ready ? "success" : "warning"}>
                      {ready ? "READY" : "NOT READY"}
                    </Badge>
                  ),
                  action: (
                    <Link
                      href={`/workspace/groups/${group.groupNumber}`}
                      className="text-primary font-bold hover:underline"
                    >
                      View group
                    </Link>
                  ),
                },
              };
            })}
            emptyMessage="No groups found."
          />
        </Card>
      </div>
    </main>
  );
}
