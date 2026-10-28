"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { breadcrumbsForPath, type StaffRole } from "@/lib/workspace-navigation";
import type { AttentionNotification } from "@/lib/notifications";
import type { PrototypeStaffAccount } from "@/lib/workspace-context";
import { WorkspaceMobileNav } from "./workspace-mobile-nav";

type WorkspaceTopbarProps = {
  user: PrototypeStaffAccount;
  notifications: readonly AttentionNotification[];
  branch: { code: string; name: string };
  permissions: readonly string[];
  featureGate: string | null;
  restrictions: readonly string[];
};

function displayRole(role: StaffRole) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function WorkspaceTopbar({
  user,
  notifications,
  branch,
  permissions,
  featureGate,
  restrictions,
}: WorkspaceTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = breadcrumbsForPath(pathname);
  const attentionCount = notifications.reduce(
    (total, notification) => total + notification.count,
    0,
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-border bg-surface sticky top-0 z-40 flex min-h-16 items-center justify-between gap-2 border-b px-3 sm:min-h-20 sm:gap-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <WorkspaceMobileNav
          branch={branch}
          role={user.role}
          permissions={permissions}
          featureGate={featureGate}
          restrictions={restrictions}
        />
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                className="flex min-w-0 items-center gap-2"
              >
                {index > 0 && (
                  <span className="text-muted" aria-hidden="true">
                    /
                  </span>
                )}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-muted hover:text-primary truncate transition"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-foreground truncate font-semibold"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <details className="relative">
          <summary
            aria-label={`${attentionCount} items need attention`}
            className="border-border text-muted hover:bg-background hover:text-foreground relative flex size-10 cursor-pointer list-none items-center justify-center rounded-full border transition [&::-webkit-details-marker]:hidden"
          >
            <span aria-hidden="true" className="text-lg">
              !
            </span>
            {attentionCount > 0 && (
              <span
                className="bg-danger absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                aria-hidden="true"
              >
                {attentionCount > 9 ? "9+" : attentionCount}
              </span>
            )}
          </summary>
          <div className="border-border bg-surface absolute top-12 right-0 z-30 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border p-2 shadow-xl">
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <p className="font-bold">Needs attention</p>
              <span className="text-muted text-xs">{attentionCount} items</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 4).map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href}
                  className="hover:bg-background block rounded-lg px-3 py-3 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {notification.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${notification.severity === "danger" ? "bg-danger/10 text-danger" : notification.severity === "warning" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"}`}
                    >
                      {notification.count}
                    </span>
                  </div>
                  <p className="text-muted mt-1 text-xs">
                    {notification.description}
                  </p>
                </Link>
              ))}
              {notifications.length === 0 && (
                <p className="text-muted px-3 py-6 text-center text-sm">
                  Nothing currently needs your attention.
                </p>
              )}
            </div>
            <Link
              href="/workspace/notifications"
              className="text-primary hover:bg-primary/5 mt-1 block rounded-lg px-3 py-2 text-center text-sm font-bold"
            >
              View all notifications
            </Link>
          </div>
        </details>

        <details className="relative">
          <summary className="hover:bg-background flex cursor-pointer list-none items-center gap-3 rounded-lg p-1 transition [&::-webkit-details-marker]:hidden">
            <span
              className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full text-sm font-extrabold"
              aria-hidden="true"
            >
              {user.initials}
            </span>
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block max-w-40 truncate text-sm font-bold">
                {user.name}
              </span>
              <span className="text-muted block max-w-40 truncate text-xs">
                {displayRole(user.role)}
              </span>
            </span>
            <span
              className="text-muted hidden text-xs sm:block"
              aria-hidden="true"
            >
              v
            </span>
          </summary>
          <div className="border-border bg-surface absolute top-12 right-0 z-20 w-64 rounded-xl border p-2 shadow-lg">
            <p className="text-muted px-3 py-2 text-[10px] font-bold tracking-wider uppercase">
              Authenticated staff account
            </p>
            <div className="px-3 py-2">
              <p className="text-sm font-semibold">{user.email}</p>
              <p className="text-muted mt-1 text-xs">
                Session expires after 12 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-danger hover:bg-danger/10 mt-1 min-h-10 w-full rounded-lg px-3 text-left text-sm font-bold"
            >
              Sign out
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
