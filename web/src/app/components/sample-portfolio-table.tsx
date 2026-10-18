"use client";

import { useState } from "react";
import { paginate } from "@/lib/pagination";
import {
  Badge,
  Card,
  DataTable,
  Pagination,
  SearchAndFilterBar,
  Tabs,
  type TableRow,
} from "./ui/data-display";
import { EmptyState } from "./ui/states";

const records = [
  {
    id: "LN-0204",
    borrower: "Abena Boateng",
    group: "Kasoa Market Circle",
    balance: "GHS 2,000.00",
    status: "ACTIVE",
  },
  {
    id: "LN-0246",
    borrower: "Efua Osei",
    group: "Kasoa Market Circle",
    balance: "GHS 3,300.00",
    status: "ACTIVE",
  },
  {
    id: "LN-0211",
    borrower: "Kwame Ansah",
    group: "Nima Unity",
    balance: "GHS 100.00",
    status: "OVERDUE",
  },
  {
    id: "LN-0195",
    borrower: "Akua Mensima",
    group: "Madina Traders",
    balance: "GHS 600.00",
    status: "OVERDUE",
  },
  {
    id: "LN-0187",
    borrower: "Eric Ofori",
    group: "Adabraka Circle",
    balance: "GHS 900.00",
    status: "OVERDUE",
  },
  {
    id: "LN-0172",
    borrower: "Adwoa Sarpong",
    group: "Kasoa Market Circle",
    balance: "GHS 0.00",
    status: "CLOSED",
  },
] as const;

const columns = [
  { key: "loan", label: "Loan / borrower" },
  { key: "group", label: "Group" },
  { key: "balance", label: "Balance", align: "right" as const },
  { key: "status", label: "Status" },
] as const;

const statusBadge = {
  ACTIVE: "success",
  OVERDUE: "danger",
  CLOSED: "neutral",
} as const;

export function SamplePortfolioTable() {
  const [tab, setTab] = useState("ALL");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");
  const [page, setPage] = useState(1);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = records.filter((record) => {
    const matchesTab = tab === "ALL" || record.status === tab;
    const matchesGroup = group === "ALL" || record.group === group;
    const matchesQuery = `${record.id} ${record.borrower} ${record.group}`
      .toLowerCase()
      .includes(normalizedQuery);
    return matchesTab && matchesGroup && matchesQuery;
  });
  const result = paginate(filtered, page, 3);
  const rows: TableRow[] = result.items.map((record) => ({
    id: record.id,
    cells: {
      loan: (
        <div>
          <p className="font-bold">{record.borrower}</p>
          <p className="text-muted text-xs">{record.id}</p>
        </div>
      ),
      group: record.group,
      balance: (
        <span className="font-semibold tabular-nums">{record.balance}</span>
      ),
      status: (
        <Badge variant={statusBadge[record.status]}>{record.status}</Badge>
      ),
    },
  }));

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="px-5 pt-5">
        <h2 className="text-lg font-bold">Sample loan portfolio</h2>
        <p className="text-muted mt-1 text-sm">
          Reusable tabs, search, filters, table, badges, and pagination.
        </p>
      </div>
      <Tabs
        label="Portfolio status"
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setPage(1);
        }}
        items={[
          { value: "ALL", label: "All", count: records.length },
          {
            value: "ACTIVE",
            label: "Active",
            count: records.filter((record) => record.status === "ACTIVE")
              .length,
          },
          {
            value: "OVERDUE",
            label: "Overdue",
            count: records.filter((record) => record.status === "OVERDUE")
              .length,
          },
          {
            value: "CLOSED",
            label: "Closed",
            count: records.filter((record) => record.status === "CLOSED")
              .length,
          },
        ]}
      />
      <SearchAndFilterBar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        searchLabel="Search borrower, loan, or group"
        filterValue={group}
        onFilterChange={(value) => {
          setGroup(value);
          setPage(1);
        }}
        filterLabel="Filter by group"
        filterOptions={[
          { value: "ALL", label: "All groups" },
          ...Array.from(new Set(records.map((record) => record.group))).map(
            (name) => ({ value: name, label: name }),
          ),
        ]}
      />
      <DataTable
        columns={columns}
        rows={rows}
        emptyContent={
          <EmptyState
            title="No sample loans found"
            description="Try changing the status tab, search, or group filter."
          />
        }
      />
      <Pagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        totalItems={result.totalItems}
        onPageChange={setPage}
      />
    </Card>
  );
}
