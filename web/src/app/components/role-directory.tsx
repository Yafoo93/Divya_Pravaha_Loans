"use client";

import { useMemo, useState } from "react";
import type { PrototypeRole } from "@/lib/prototype-roles";
import { countStaffByRole, filterPrototypeRoles } from "@/lib/prototype-roles";
import type { PrototypeStaff } from "@/lib/prototype-staff";
import { Alert } from "./ui/actions";
import {
  Badge,
  Card,
  DataTable,
  SearchAndFilterBar,
  type TableRow,
} from "./ui/data-display";
import { EmptyState } from "./ui/states";

export function RoleDirectory({
  roles,
  staff,
}: {
  roles: readonly PrototypeRole[];
  staff: readonly PrototypeStaff[];
}) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("ALL");
  const [selectedCode, setSelectedCode] = useState(roles[0]?.code ?? "");
  const filtered = useMemo(
    () => filterPrototypeRoles(roles, query, state),
    [roles, query, state],
  );
  const selected = roles.find((role) => role.code === selectedCode) ?? roles[0];

  const rows: TableRow[] = filtered.map((role) => ({
    id: role.code,
    cells: {
      role: (
        <div>
          <p className="font-bold">{role.name}</p>
          <p className="text-muted text-xs">{role.code}</p>
        </div>
      ),
      permissions: `${role.permissions.length} permissions`,
      staff: countStaffByRole(staff, role.code),
      state: (
        <Badge variant={role.state === "ACTIVE" ? "success" : "warning"}>
          {role.state}
        </Badge>
      ),
      action: (
        <button
          type="button"
          onClick={() => setSelectedCode(role.code)}
          className="text-primary min-h-10 rounded-lg px-3 text-sm font-bold hover:underline"
          aria-label={`View ${role.name} permissions`}
        >
          View matrix
        </button>
      ),
    },
  }));

  return (
    <>
      <Alert title="Approved prototype access matrix" variant="info">
        Role permissions follow System Requirements v1.1. Server-side
        enforcement and effective-dated permission changes are separate
        checklist tasks.
      </Alert>

      <section
        className="mt-6 grid gap-4 sm:grid-cols-3"
        aria-label="Role summary"
      >
        <Card className="p-5">
          <p className="text-muted text-sm">Defined roles</p>
          <p className="mt-2 text-3xl font-bold">{roles.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-muted text-sm">Active roles</p>
          <p className="mt-2 text-3xl font-bold">
            {roles.filter((role) => role.state === "ACTIVE").length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-muted text-sm">Legally gated roles</p>
          <p className="mt-2 text-3xl font-bold">
            {roles.filter((role) => role.featureGate).length}
          </p>
        </Card>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]">
        <Card className="overflow-hidden">
          <div className="border-border border-b p-5">
            <h2 className="text-lg font-bold">Roles</h2>
            <p className="text-muted mt-1 text-sm">
              Search by role, permission, or restriction.
            </p>
          </div>
          <SearchAndFilterBar
            query={query}
            onQueryChange={setQuery}
            searchLabel="Search roles or permissions"
            filterValue={state}
            onFilterChange={setState}
            filterLabel="Filter by role state"
            filterOptions={[
              { value: "ALL", label: "All states" },
              { value: "ACTIVE", label: "Active" },
              { value: "LOCKED", label: "Locked" },
            ]}
          />
          <DataTable
            columns={[
              { key: "role", label: "Role" },
              { key: "permissions", label: "Access" },
              { key: "staff", label: "Staff", align: "right" },
              { key: "state", label: "State" },
              { key: "action", label: "Action", align: "right" },
            ]}
            rows={rows}
            emptyContent={
              <EmptyState
                title="No roles found"
                description="Change the search or state filter."
              />
            }
          />
        </Card>

        {selected && (
          <Card className="h-fit overflow-hidden" aria-live="polite">
            <div className="border-border border-b p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{selected.name}</h2>
                  <p className="text-muted mt-1 text-xs">{selected.code}</p>
                </div>
                <Badge
                  variant={selected.state === "ACTIVE" ? "success" : "warning"}
                >
                  {selected.state}
                </Badge>
              </div>
              <p className="text-muted mt-3 text-sm">{selected.description}</p>
            </div>
            <div className="space-y-6 p-5">
              <section>
                <h3 className="text-sm font-bold">Granted permissions</h3>
                <ul className="mt-3 space-y-2">
                  {selected.permissions.map((permission) => (
                    <li key={permission} className="flex gap-2 text-sm">
                      <span
                        className="text-success font-bold"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      {permission}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="text-sm font-bold">Restrictions</h3>
                <ul className="mt-3 space-y-2">
                  {selected.restrictions.map((restriction) => (
                    <li key={restriction} className="flex gap-2 text-sm">
                      <span
                        className="text-danger font-bold"
                        aria-hidden="true"
                      >
                        —
                      </span>
                      {restriction}
                    </li>
                  ))}
                </ul>
              </section>
              {selected.featureGate && (
                <Alert title="Feature gate locked" variant="warning">
                  {selected.featureGate} must be completed before this role can
                  operate its module.
                </Alert>
              )}
              <div className="border-border border-t pt-4 text-sm">
                <span className="text-muted">Assigned prototype staff</span>
                <span className="float-right font-bold">
                  {countStaffByRole(staff, selected.code)}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
