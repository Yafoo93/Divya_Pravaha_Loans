"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  filterBorrowerDirectory,
  type BorrowerDirectoryRecord,
} from "@/lib/borrower-directory";
import {
  Badge,
  Card,
  DataTable,
  Pagination,
  type TableRow,
} from "./ui/data-display";
import { EmptyState } from "./ui/states";

const PAGE_SIZE = 8;

const borrowerStatusVariant = {
  ACTIVE: "success",
  RESTRICTED: "danger",
} as const;

const loanStatusVariant = {
  ACTIVE: "success",
  CLOSED: "neutral",
  DRAFT: "primary",
  SUBMITTED: "warning",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  AWAITING_DISBURSEMENT: "warning",
  CANCELLED: "neutral",
} as const;

function readable(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function BorrowerDirectory({
  initialBorrowers,
  canCreate,
}: {
  initialBorrowers: readonly BorrowerDirectoryRecord[];
  canCreate: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [verification, setVerification] = useState("ALL");
  const [membership, setMembership] = useState("ALL");
  const [loan, setLoan] = useState("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      filterBorrowerDirectory(initialBorrowers, {
        query,
        status,
        verification,
        membership,
        loan,
      }),
    [initialBorrowers, query, status, verification, membership, loan],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const rows: TableRow[] = pageRecords.map((borrower) => ({
    id: borrower.id,
    cells: {
      borrower: (
        <div>
          <p className="font-bold">{borrower.legalName}</p>
          <p className="text-muted text-xs">
            {borrower.customerId} · {borrower.phone}
          </p>
          {borrower.isSampleData && (
            <span className="text-primary mt-1 inline-block text-[10px] font-bold uppercase">
              Sample data
            </span>
          )}
        </div>
      ),
      identity: (
        <div>
          <p className="font-mono text-xs">{borrower.maskedGhanaCard}</p>
          <Badge variant={borrower.ghanaCardVerified ? "success" : "warning"}>
            {borrower.ghanaCardVerified ? "VERIFIED" : "PENDING"}
          </Badge>
        </div>
      ),
      group: borrower.groupName ? (
        <div>
          <p className="font-semibold">{borrower.groupName}</p>
          <p className="text-muted text-xs">{borrower.groupNumber}</p>
        </div>
      ) : (
        <span className="text-muted">Not grouped</span>
      ),
      loan: borrower.loanNumber ? (
        <div>
          <p className="font-semibold">{borrower.loanNumber}</p>
          <Badge
            variant={
              loanStatusVariant[
                borrower.loanStatus as keyof typeof loanStatusVariant
              ] ?? "neutral"
            }
          >
            {readable(borrower.loanStatus ?? "")}
          </Badge>
        </div>
      ) : (
        <span className="text-muted">No loan</span>
      ),
      branch: borrower.branchName,
      status: (
        <Badge variant={borrowerStatusVariant[borrower.status]}>
          {borrower.status}
        </Badge>
      ),
      action: (
        <Link
          href={`/workspace/borrowers/${encodeURIComponent(borrower.customerId)}`}
          className="text-primary font-bold whitespace-nowrap hover:underline"
          aria-label={`View ${borrower.legalName}'s profile`}
        >
          View profile
        </Link>
      ),
    },
  }));

  const loanOptions = Array.from(
    new Set(
      initialBorrowers.map((borrower) => borrower.loanStatus).filter(Boolean),
    ),
  ) as string[];

  return (
    <>
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Borrower summary"
      >
        <Summary label="All borrowers" value={initialBorrowers.length} />
        <Summary
          label="Verified identity"
          value={
            initialBorrowers.filter((borrower) => borrower.ghanaCardVerified)
              .length
          }
        />
        <Summary
          label="Restricted"
          value={
            initialBorrowers.filter(
              (borrower) => borrower.status === "RESTRICTED",
            ).length
          }
          warning
        />
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="border-border flex flex-wrap items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-lg font-bold">Borrower directory</h2>
            <p className="text-muted mt-1 text-sm">
              Search assigned-branch borrowers and narrow the list by identity,
              membership, account, or loan state.
            </p>
          </div>
          {canCreate && (
            <Link
              href="/workspace/borrowers/new"
              className="bg-primary hover:bg-primary/90 inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-bold text-white transition"
            >
              New borrower
            </Link>
          )}
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-[minmax(16rem,1fr)_repeat(4,minmax(9rem,0.45fr))]">
          <label>
            <span className="sr-only">Search borrowers</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, customer ID, phone, group, or loan"
              className="border-border bg-surface focus:border-primary focus:ring-primary/20 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:ring-4"
            />
          </label>
          <DirectoryFilter
            label="Borrower status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={["ALL", "ACTIVE", "RESTRICTED"]}
          />
          <DirectoryFilter
            label="Identity verification"
            value={verification}
            onChange={(value) => {
              setVerification(value);
              setPage(1);
            }}
            options={["ALL", "VERIFIED", "PENDING"]}
          />
          <DirectoryFilter
            label="Group membership"
            value={membership}
            onChange={(value) => {
              setMembership(value);
              setPage(1);
            }}
            options={["ALL", "GROUPED", "UNGROUPED"]}
          />
          <DirectoryFilter
            label="Loan status"
            value={loan}
            onChange={(value) => {
              setLoan(value);
              setPage(1);
            }}
            options={["ALL", ...loanOptions, "NONE"]}
          />
        </div>

        <div className="border-border border-t">
          <DataTable
            columns={[
              { key: "borrower", label: "Borrower" },
              { key: "identity", label: "Ghana Card / KYC" },
              { key: "group", label: "Current group" },
              { key: "loan", label: "Latest loan" },
              { key: "branch", label: "Branch" },
              { key: "status", label: "Status" },
              { key: "action", label: "Action" },
            ]}
            rows={rows}
            emptyContent={
              <EmptyState
                title="No borrowers found"
                description="Change the search text or clear one or more filters."
              />
            }
          />
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setPage}
        />
      </Card>
      <p className="text-muted mt-4 text-xs">
        Ghana Card identifiers are masked in ordinary directory views. Results
        are limited to the signed-in staff member&apos;s assigned branches.
      </p>
    </>
  );
}

function Summary({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="text-muted text-sm">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold ${warning && value > 0 ? "text-danger" : ""}`}
      >
        {value}
      </p>
    </Card>
  );
}

function DirectoryFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="border-border bg-surface focus:border-primary focus:ring-primary/20 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:ring-4"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "ALL" ? `All ${label.toLowerCase()}` : readable(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
