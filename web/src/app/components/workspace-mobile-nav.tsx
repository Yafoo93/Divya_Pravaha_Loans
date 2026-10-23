"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CompanyLogo } from "./company-logo";
import {
  isNavigationItemActive,
  navigationForRole,
  type StaffRole,
} from "@/lib/workspace-navigation";
import { canAccessWorkspacePath } from "@/lib/workspace-authorization";

type WorkspaceMobileNavProps = {
  branch: { code: string; name: string };
  role: StaffRole;
  permissions: readonly string[];
  featureGate: string | null;
  restrictions: readonly string[];
};

export function WorkspaceMobileNav(props: WorkspaceMobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = navigationForRole(props.role).filter((item) =>
    canAccessWorkspacePath(
      item.href,
      props.role,
      props.permissions,
      props.featureGate,
      props.restrictions,
    ),
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="border-border hover:bg-background flex size-11 shrink-0 items-center justify-center rounded-xl border lg:hidden"
        aria-label="Open workspace navigation"
        aria-expanded={open}
        aria-controls="mobile-workspace-navigation"
        onClick={() => setOpen(true)}
      >
        <span className="space-y-1" aria-hidden="true">
          <span className="bg-foreground block h-0.5 w-5" />
          <span className="bg-foreground block h-0.5 w-5" />
          <span className="bg-foreground block h-0.5 w-5" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Close workspace navigation"
            onClick={() => setOpen(false)}
          />
          <aside
            id="mobile-workspace-navigation"
            className="bg-surface relative flex h-full w-[min(88vw,22rem)] flex-col shadow-2xl"
            aria-label="Mobile workspace navigation"
          >
            <div className="border-border flex min-h-20 items-center gap-3 border-b px-5">
              <CompanyLogo
                size={40}
                className="rounded-full bg-white p-0.5"
                decorative
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold tracking-wide">
                  DIVYA PRAVAHA
                </p>
                <p className="text-muted text-[10px] tracking-wider uppercase">
                  Loan management
                </p>
              </div>
              <button
                type="button"
                className="hover:bg-background flex size-11 items-center justify-center rounded-xl text-2xl"
                aria-label="Close workspace navigation"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="px-4 py-4">
              <div className="border-border bg-background rounded-xl border p-3">
                <p className="text-muted text-[10px] font-bold tracking-wider uppercase">
                  Current branch
                </p>
                <p className="truncate text-sm font-bold">
                  {props.branch.name}
                </p>
                <p className="text-muted mt-0.5 text-xs">{props.branch.code}</p>
              </div>
            </div>

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-5">
              {items.map((item) => {
                const active = isNavigationItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-foreground"}`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${active ? "bg-primary text-white" : "bg-background border-border border"}`}
                      aria-hidden="true"
                    >
                      {item.shortLabel}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
