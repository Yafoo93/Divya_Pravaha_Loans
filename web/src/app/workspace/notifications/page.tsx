import Link from "next/link";
import {
  branchScopeLabel,
  requireBranchScope,
} from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { getAttentionNotifications } from "@/server/notifications";
import { PageHeading } from "../../components/page-heading";
import { Badge, Card } from "../../components/ui/data-display";

export const instant = false;

const variant = {
  danger: "danger",
  warning: "warning",
  info: "primary",
} as const;

export default async function NotificationsPage() {
  const session = await requireWorkspacePath("/workspace/notifications");
  const scope = await requireBranchScope(session);
  const notifications = await getAttentionNotifications({
    userId: session.user.id,
    role: session.user.role,
    branchIds: scope.branchIds,
  });
  const total = notifications.reduce(
    (sum, notification) => sum + notification.count,
    0,
  );

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <PageHeading
          title="Notifications"
          description="Live work queues and exceptions that need your role’s attention. Counts update from current records."
          branchName={branchScopeLabel(scope).name}
          date={new Date()}
          currency="GHS"
        />

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-muted text-sm">
            {total === 1
              ? "1 item needs attention"
              : `${total} items need attention`}
          </p>
          <Badge variant={total > 0 ? "warning" : "success"}>
            {total > 0 ? "ACTION REQUIRED" : "ALL CLEAR"}
          </Badge>
        </div>

        <section className="mt-4 space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold">{notification.title}</h2>
                    <Badge variant={variant[notification.severity]}>
                      {notification.count}
                    </Badge>
                  </div>
                  <p className="text-muted mt-2 text-sm">
                    {notification.description}
                  </p>
                </div>
                <Link
                  href={notification.href}
                  className="border-primary text-primary hover:bg-primary/5 inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold"
                >
                  Open queue
                </Link>
              </div>
            </Card>
          ))}

          {notifications.length === 0 && (
            <Card className="p-8 text-center sm:p-12">
              <div
                className="bg-success/10 text-success mx-auto flex size-12 items-center justify-center rounded-full text-xl font-bold"
                aria-hidden="true"
              >
                ✓
              </div>
              <h2 className="mt-4 text-xl font-bold">
                Nothing needs attention
              </h2>
              <p className="text-muted mt-2 text-sm">
                There are no pending items or open exceptions assigned to your
                role and branch.
              </p>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
