"use client";
import Link from "next/link";
import { useState } from "react";
import { formatAccraDate, formatGhsFromPesewas } from "@/lib/formatters";
import {
  Badge,
  Card,
  DataTable,
  SearchAndFilterBar,
  Tabs,
} from "./ui/data-display";

type Application = {
  id: string;
  number: string;
  borrower: string;
  group: string;
  amount: number;
  status: string;
  createdAt: string;
};
const stages = [
  "ALL",
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "AWAITING_DISBURSEMENT",
  "REJECTED",
];
export function LoanApplicationQueue({
  applications,
  canCreate,
  canReview,
}: {
  applications: readonly Application[];
  canCreate: boolean;
  canReview: boolean;
}) {
  const [stage, setStage] = useState("ALL");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");
  const visible = applications.filter(
    (a) =>
      (stage === "ALL" || a.status === stage) &&
      (group === "ALL" || a.group === group) &&
      `${a.number} ${a.borrower} ${a.group}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <Card className="mt-8 overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-lg font-bold">Application lifecycle queue</h2>
          <p className="text-muted text-sm">
            Drafts, submitted work, manager review, and final decisions.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/workspace/loan-applications/new"
            className="bg-primary rounded-lg px-4 py-3 text-sm font-bold text-white"
          >
            New application
          </Link>
        )}
      </div>
      <Tabs
        label="Application lifecycle"
        value={stage}
        onValueChange={setStage}
        items={stages.map((value) => ({
          value,
          label: value.replaceAll("_", " "),
          count: applications.filter(
            (a) => value === "ALL" || a.status === value,
          ).length,
        }))}
      />
      <SearchAndFilterBar
        query={query}
        onQueryChange={setQuery}
        searchLabel="Search application, borrower, or group"
        filterValue={group}
        onFilterChange={setGroup}
        filterLabel="Filter by group"
        filterOptions={[
          { value: "ALL", label: "All groups" },
          ...Array.from(new Set(applications.map((a) => a.group))).map(
            (value) => ({ value, label: value }),
          ),
        ]}
      />
      <DataTable
        columns={[
          { key: "application", label: "Application / borrower" },
          { key: "group", label: "Group" },
          { key: "amount", label: "Principal" },
          { key: "created", label: "Created" },
          { key: "status", label: "Stage" },
          { key: "action", label: "Action" },
        ]}
        rows={visible.map((a) => ({
          id: a.id,
          cells: {
            application: (
              <div>
                <p className="font-bold">{a.number}</p>
                <p className="text-muted text-xs">{a.borrower}</p>
              </div>
            ),
            group: a.group,
            amount: formatGhsFromPesewas(a.amount),
            created: formatAccraDate(new Date(a.createdAt)),
            status: (
              <Badge
                variant={
                  a.status === "AWAITING_DISBURSEMENT"
                    ? "success"
                    : a.status === "REJECTED"
                      ? "danger"
                      : a.status === "DRAFT"
                        ? "neutral"
                        : "warning"
                }
              >
                {a.status.replaceAll("_", " ")}
              </Badge>
            ),
            action:
              canReview && ["SUBMITTED", "UNDER_REVIEW"].includes(a.status) ? (
                <Link
                  className="text-primary font-bold"
                  href={`/workspace/loan-applications/${a.number}/review`}
                >
                  Review
                </Link>
              ) : (
                <Link
                  className="text-primary font-bold"
                  href={`/workspace/loan-applications/${a.number}`}
                >
                  Open
                </Link>
              ),
          },
        }))}
        emptyMessage="No applications match this queue."
      />
    </Card>
  );
}
