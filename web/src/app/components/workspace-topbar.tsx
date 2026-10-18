"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { breadcrumbsForPath, type StaffRole } from "@/lib/workspace-navigation";
import type { PrototypeStaffAccount } from "@/lib/workspace-context";

type WorkspaceTopbarProps = {
  users: readonly PrototypeStaffAccount[];
  unreadNotifications: number;
};

function displayRole(role: StaffRole) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function WorkspaceTopbar({
  users,
  unreadNotifications,
}: WorkspaceTopbarProps) {
  const pathname = usePathname();
  const breadcrumbs = breadcrumbsForPath(pathname);
  const [activeUserId, setActiveUserId] = useState(users[0].id);
  const user =
    users.find((candidate) => candidate.id === activeUserId) ?? users[0];

  return (
    <header className="border-border bg-surface flex min-h-20 items-center justify-between gap-4 border-b px-4 sm:px-6 lg:px-8">
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

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          aria-label={
            unreadNotifications === 1
              ? "1 unread notification"
              : `${unreadNotifications} unread notifications`
          }
          className="border-border text-muted hover:bg-background hover:text-foreground relative flex size-10 items-center justify-center rounded-full border transition"
        >
          <span aria-hidden="true" className="text-lg">
            !
          </span>
          {unreadNotifications > 0 && (
            <span
              className="bg-danger absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
              aria-hidden="true"
            >
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </button>

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
              Prototype manager accounts
            </p>
            {users.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setActiveUserId(candidate.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${candidate.id === user.id ? "bg-primary/10 text-primary" : "hover:bg-background"}`}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-current/10 text-xs font-extrabold">
                  {candidate.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {candidate.name}
                  </span>
                  <span className="text-muted block text-xs">
                    {displayRole(candidate.role)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
