import type { ReactNode } from "react";
import { formatAccraHeadingDate } from "@/lib/workspace-context";

type PageHeadingProps = {
  title: string;
  description?: string;
  branchName: string;
  date: Date;
  currency: string;
  actions?: ReactNode;
};

export function PageHeading({
  title,
  description,
  branchName,
  date,
  currency,
  actions,
}: PageHeadingProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-primary text-xs font-bold tracking-wider uppercase">
          {branchName} / {formatAccraHeadingDate(date)} / {currency}
        </p>
        <h1 className="mt-2 text-2xl leading-tight font-bold sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted mt-2 max-w-3xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
