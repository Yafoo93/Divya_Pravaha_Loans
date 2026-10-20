"use client";

import { useState } from "react";
import { formatAccraDateTime } from "@/lib/formatters";
import {
  filterPrototypeStaff,
  type PrototypeStaff,
  type StaffActivationState,
} from "@/lib/prototype-staff";
import { Button, ConfirmationDialog } from "./ui/actions";
import {
  Badge,
  Card,
  DataTable,
  SearchAndFilterBar,
  type TableRow,
} from "./ui/data-display";
import { EmptyState } from "./ui/states";

const stateVariant = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  SUSPENDED: "danger",
} as const;

function roleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function StaffDirectory({
  initialStaff,
}: {
  initialStaff: readonly PrototypeStaff[];
}) {
  const [staff, setStaff] = useState(() => [...initialStaff]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [state, setState] = useState("ALL");
  const [pending, setPending] = useState<{
    staff: PrototypeStaff;
    nextState: StaffActivationState;
  } | null>(null);
  const filtered = filterPrototypeStaff(staff, query, role, state);

  const rows: TableRow[] = filtered.map((record) => ({
    id: record.id,
    cells: {
      staff: (
        <div>
          <p className="font-bold">{record.name}</p>
          <p className="text-muted text-xs">
            {record.id} · {record.email}
          </p>
        </div>
      ),
      role: roleLabel(record.role),
      branch: record.branch,
      state: <Badge variant={stateVariant[record.state]}>{record.state}</Badge>,
      lastActive: (
        <span className="text-sm tabular-nums">
          {formatAccraDateTime(record.lastActive)}
        </span>
      ),
      action: (
        <Button
          variant="secondary"
          className="min-h-9 px-3 py-1.5"
          onClick={() =>
            setPending({
              staff: record,
              nextState: record.state === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            })
          }
        >
          {record.state === "ACTIVE" ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  }));

  function confirmStateChange() {
    if (!pending) return;
    setStaff((current) =>
      current.map((record) =>
        record.id === pending.staff.id
          ? { ...record, state: pending.nextState }
          : record,
      ),
    );
    setPending(null);
  }

  return (
    <>
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Staff activation summary"
      >
        {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((value) => (
          <Card key={value} className="p-5">
            <p className="text-muted text-sm capitalize">
              {value.toLowerCase()}
            </p>
            <p className="mt-2 text-3xl font-bold">
              {staff.filter((record) => record.state === value).length}
            </p>
          </Card>
        ))}
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="border-border border-b p-5">
          <h2 className="text-lg font-bold">Staff directory</h2>
          <p className="text-muted mt-1 text-sm">
            Fictional prototype identities and current activation state.
          </p>
        </div>
        <SearchAndFilterBar
          query={query}
          onQueryChange={setQuery}
          searchLabel="Search name, email, or staff ID"
          filterValue={state}
          onFilterChange={setState}
          filterLabel="Filter by activation state"
          filterOptions={[
            { value: "ALL", label: "All activation states" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "SUSPENDED", label: "Suspended" },
          ]}
        />
        <div className="border-border border-t p-4">
          <label className="text-sm font-bold" htmlFor="staff-role-filter">
            Role
          </label>
          <select
            id="staff-role-filter"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="border-border bg-surface ml-3 min-h-10 rounded-lg border px-3 text-sm"
          >
            <option value="ALL">All roles</option>
            {Array.from(new Set(staff.map((record) => record.role))).map(
              (value) => (
                <option key={value} value={value}>
                  {roleLabel(value)}
                </option>
              ),
            )}
          </select>
        </div>
        <DataTable
          columns={[
            { key: "staff", label: "Staff" },
            { key: "role", label: "Role" },
            { key: "branch", label: "Branch" },
            { key: "state", label: "Activation" },
            { key: "lastActive", label: "Last active" },
            { key: "action", label: "Action", align: "right" },
          ]}
          rows={rows}
          emptyContent={
            <EmptyState
              title="No staff found"
              description="Change the search, role, or activation filters."
            />
          }
        />
      </Card>

      <ConfirmationDialog
        open={Boolean(pending)}
        title={`${pending?.nextState === "ACTIVE" ? "Activate" : "Deactivate"} staff account`}
        message={
          pending
            ? `${pending.staff.name} will be marked ${pending.nextState.toLowerCase()} in this prototype view. This does not change the database yet.`
            : ""
        }
        confirmLabel={
          pending?.nextState === "ACTIVE"
            ? "Activate account"
            : "Deactivate account"
        }
        destructive={pending?.nextState !== "ACTIVE"}
        onCancel={() => setPending(null)}
        onConfirm={confirmStateChange}
      />
    </>
  );
}
