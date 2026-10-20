"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  fieldNavigation,
  isFieldNavigationActive,
} from "@/lib/field-navigation";
import { formatAccraHeadingDate } from "@/lib/formatters";
import { CompanyLogo } from "./company-logo";

type FieldMobileChromeProps = {
  collector: { name: string; role: string };
  branch: string;
  online: boolean;
  displayDate: string;
};

export function FieldMobileChrome({
  collector,
  branch,
  online,
  displayDate,
}: FieldMobileChromeProps) {
  const pathname = usePathname();
  return (
    <>
      <header className="border-border bg-surface sticky top-0 z-30 border-b">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <CompanyLogo
              size={36}
              className="rounded-full bg-white p-0.5"
              decorative
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">DIVYA PRAVAHA</p>
              <p className="text-muted truncate text-xs">
                {collector.name} · {collector.role}
              </p>
            </div>
          </div>
          <div
            role="status"
            aria-label={online ? "Connection online" : "Connection offline"}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${online ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
          >
            <span
              className={`size-2 rounded-full ${online ? "bg-success" : "bg-danger"}`}
              aria-hidden="true"
            />
            {online ? "Online" : "Offline"}
          </div>
        </div>
        <div className="bg-background border-border flex items-center justify-between border-t px-4 py-2 text-[10px] font-bold tracking-wide uppercase">
          <span>
            {formatAccraHeadingDate(displayDate)} · {branch}
          </span>
          <span className="text-primary">Sample</span>
        </div>
      </header>

      <nav
        aria-label="Collector navigation"
        className="border-border bg-surface fixed right-0 bottom-0 left-0 z-40 mx-auto grid max-w-md grid-cols-4 border-t shadow-[0_-4px_16px_rgba(15,23,42,0.08)]"
      >
        {fieldNavigation.map((item) => {
          const active = isFieldNavigationActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold transition ${active ? "text-primary" : "text-muted hover:text-foreground"}`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-lg text-[9px] font-black ${active ? "bg-primary text-white" : "bg-background"}`}
                aria-hidden="true"
              >
                {item.shortLabel}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
