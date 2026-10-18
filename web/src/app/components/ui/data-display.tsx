"use client";

import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border-border bg-surface rounded-xl border shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

const badgeStyles = {
  neutral: "bg-background text-muted border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
} as const;

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: keyof typeof badgeStyles;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${badgeStyles[variant]}`}
    >
      {children}
    </span>
  );
}

export type TabItem = { value: string; label: string; count?: number };

export function Tabs({
  items,
  value,
  onValueChange,
  label,
}: {
  items: readonly TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
}) {
  return (
    <div
      className="border-border flex gap-1 overflow-x-auto border-b"
      role="tablist"
      aria-label={label}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onValueChange(item.value)}
            className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition ${selected ? "text-primary" : "text-muted hover:text-foreground"}`}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 text-xs">{item.count}</span>
            )}
            {selected && (
              <span className="bg-primary absolute right-3 bottom-0 left-3 h-0.5 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export type TableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};
export type TableRow = { id: string; cells: Record<string, ReactNode> };

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found.",
  emptyContent,
}: {
  columns: readonly TableColumn[];
  rows: readonly TableRow[];
  emptyMessage?: string;
  emptyContent?: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-2xl border-collapse text-left text-sm">
        <thead className="bg-background text-muted">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 text-xs font-bold tracking-wide uppercase ${column.align === "right" ? "text-right" : "text-left"}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-background/60 transition">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 ${column.align === "right" ? "text-right" : "text-left"}`}
                >
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="text-muted p-4 text-center"
              >
                {emptyContent ?? <div className="py-8">{emptyMessage}</div>}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export type FilterOption = { value: string; label: string };

export function SearchAndFilterBar({
  query,
  onQueryChange,
  searchLabel,
  filterValue,
  onFilterChange,
  filterLabel,
  filterOptions,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  searchLabel: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterLabel: string;
  filterOptions: readonly FilterOption[];
}) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
      <label className="relative">
        <span className="sr-only">{searchLabel}</span>
        <span
          className="text-muted absolute top-1/2 left-3 -translate-y-1/2"
          aria-hidden="true"
        >
          ⌕
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchLabel}
          className="border-border bg-surface focus:border-primary focus:ring-primary/20 h-11 w-full rounded-lg border pr-3 pl-10 text-sm outline-none focus:ring-4"
        />
      </label>
      <label>
        <span className="sr-only">{filterLabel}</span>
        <select
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          className="border-border bg-surface focus:border-primary focus:ring-primary/20 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:ring-4"
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Table pagination"
      className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"
    >
      <p className="text-muted text-sm">
        {totalItems} {totalItems === 1 ? "record" : "records"}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-border hover:bg-background rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <button
              key={page}
              type="button"
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
              className={`size-9 rounded-lg text-sm font-semibold ${page === currentPage ? "bg-primary text-white" : "hover:bg-background"}`}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-border hover:bg-background rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
