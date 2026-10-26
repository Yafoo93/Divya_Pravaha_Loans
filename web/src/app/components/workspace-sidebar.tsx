"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompanyLogo } from "./company-logo";
import {
  isNavigationItemActive,
  navigationForRole,
  type StaffRole,
} from "@/lib/workspace-navigation";
import { canAccessWorkspacePath } from "@/lib/workspace-authorization";

type WorkspaceSidebarProps = {
  branch: { code: string; name: string };
  role: StaffRole;
  permissions: readonly string[];
  featureGate: string | null;
  restrictions: readonly string[];
};

export function WorkspaceSidebar({
  branch,
  role,
  permissions,
  featureGate,
  restrictions,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const items = navigationForRole(role).filter((item) => {
    return canAccessWorkspacePath(
      item.href,
      role,
      permissions,
      featureGate,
      restrictions,
    );
  });

  return (
    <aside
      className="border-border bg-surface hidden min-h-[calc(100vh-33px)] w-64 shrink-0 border-r lg:flex lg:flex-col"
      aria-label="Workspace navigation"
    >
      <div className="border-border flex h-20 items-center gap-3 border-b px-5">
        <CompanyLogo
          size={40}
          className="rounded-full bg-white p-0.5"
          decorative
        />
        <div>
          <p className="text-sm font-extrabold tracking-wide">DIVYA PRAVAHA</p>
          <p className="text-muted text-[10px] tracking-wider uppercase">
            Loan management
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        <div
          className="border-border bg-background rounded-xl border p-3"
          aria-label="Current branch"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted text-[10px] font-bold tracking-wider uppercase">
                Current branch
              </p>
              <p className="truncate text-sm font-bold">{branch.name}</p>
              <p className="text-muted mt-0.5 text-xs">{branch.code}</p>
            </div>
            <span className="text-muted" aria-hidden="true">
              ⌄
            </span>
          </div>
        </div>
      </div>

      <nav
        className="flex-1 space-y-1 px-3"
        aria-label={`${branch.name} sections`}
      >
        {items.map((item) => {
          const active = isNavigationItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-foreground"}`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-md text-[10px] font-extrabold ${active ? "bg-primary text-white" : "bg-background border-border border"}`}
                aria-hidden="true"
              >
                {item.shortLabel}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-border m-4 rounded-xl border p-3">
        <p className="text-primary text-[10px] font-extrabold tracking-wider uppercase">
          Access controls
        </p>
        <p className="mt-1 text-sm font-semibold">
          {role.replaceAll("_", " ")}
        </p>
        <p className="text-muted mt-1 text-xs">
          Navigation is filtered by role.
        </p>
      </div>
    </aside>
  );
}
