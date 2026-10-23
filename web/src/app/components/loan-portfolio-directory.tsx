"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatAccraDate, formatGhsFromPesewas } from "@/lib/formatters";
import {
  Badge,
  Card,
  DataTable,
  Pagination,
  SearchAndFilterBar,
  Tabs,
} from "./ui/data-display";

type PortfolioLoan = {
  id: string;
  number: string;
  borrower: string;
  customerId: string;
  group: string;
  status: string;
  principalPesewas: number;
  balancePesewas: number;
  nextDueDate: string | null;
};

const pageSize = 8;

export function LoanPortfolioDirectory({ loans }: { loans: PortfolioLoan[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [group, setGroup] = useState("ALL");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () =>
      loans.filter(
        (loan) =>
          (status === "ALL" || loan.status === status) &&
          (group === "ALL" || loan.group === group) &&
          `${loan.number} ${loan.borrower} ${loan.customerId} ${loan.group}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [group, loans, query, status],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const update = (callback: () => void) => {
    callback();
    setPage(1);
  };
  return (
    <Card className="mt-8 overflow-hidden">
      <Tabs
        label="Loan status"
        value={status}
        onValueChange={(value) => update(() => setStatus(value))}
        items={[
          "ALL",
          "ACTIVE",
          "CLOSED",
          "AWAITING_DISBURSEMENT",
          "APPROVED",
        ].map((value) => ({
          value,
          label: value.replaceAll("_", " "),
          count: loans.filter(
            (loan) => value === "ALL" || loan.status === value,
          ).length,
        }))}
      />
      <SearchAndFilterBar
        query={query}
        onQueryChange={(value) => update(() => setQuery(value))}
        searchLabel="Search loan, borrower, customer, or group"
        filterValue={group}
        onFilterChange={(value) => update(() => setGroup(value))}
        filterLabel="Filter by group"
        filterOptions={[
          { value: "ALL", label: "All groups" },
          ...Array.from(new Set(loans.map((loan) => loan.group))).map(
            (value) => ({ value, label: value }),
          ),
        ]}
      />
      <DataTable
        columns={[
          { key: "loan", label: "Loan / borrower" },
          { key: "group", label: "Group" },
          { key: "principal", label: "Original principal", align: "right" },
          { key: "balance", label: "Contract balance", align: "right" },
          { key: "due", label: "Next effective due" },
          { key: "status", label: "Status" },
        ]}
        rows={visible.map((loan) => ({
          id: loan.id,
          cells: {
            loan: (
              <div>
                <Link
                  href={`/workspace/loans/${loan.number}`}
                  className="text-primary font-bold"
                >
                  {loan.number}
                </Link>
                <p className="text-muted text-xs">
                  {loan.borrower} · {loan.customerId}
                </p>
              </div>
            ),
            group: loan.group,
            principal: formatGhsFromPesewas(loan.principalPesewas),
            balance: formatGhsFromPesewas(loan.balancePesewas),
            due: loan.nextDueDate ? formatAccraDate(loan.nextDueDate) : "—",
            status: (
              <Badge
                variant={
                  loan.status === "ACTIVE"
                    ? "success"
                    : loan.status === "CLOSED"
                      ? "neutral"
                      : "warning"
                }
              >
                {loan.status.replaceAll("_", " ")}
              </Badge>
            ),
          },
        }))}
        emptyMessage="No loans match the selected filters."
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </Card>
  );
}
