"use client";

import { useState } from "react";
import type { PrototypeBranch } from "@/lib/prototype-branches";
import type { PrototypeStaff } from "@/lib/prototype-staff";
import { Alert, Button, ConfirmationDialog } from "./ui/actions";
import { Badge, Card, DataTable, type TableRow } from "./ui/data-display";
import { EmptyState } from "./ui/states";

function roleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function BranchDirectory({
  initialBranches,
  staff,
}: {
  initialBranches: readonly PrototypeBranch[];
  staff: readonly PrototypeStaff[];
}) {
  const [branches, setBranches] = useState(() =>
    initialBranches.map((branch) => ({
      ...branch,
      assignedStaffIds: [...branch.assignedStaffIds],
    })),
  );
  const [selectedBranchId, setSelectedBranchId] = useState(
    initialBranches[0]?.id ?? "",
  );
  const [staffToAdd, setStaffToAdd] = useState("");
  const [pending, setPending] = useState<{
    mode: "ASSIGN" | "UNASSIGN";
    staff: PrototypeStaff;
  } | null>(null);
  const branch =
    branches.find((record) => record.id === selectedBranchId) ?? branches[0];
  const assigned = staff.filter((record) =>
    branch?.assignedStaffIds.includes(record.id),
  );
  const available = staff.filter(
    (record) =>
      record.role !== "INVESTOR_PORTAL_USER" &&
      !branch?.assignedStaffIds.includes(record.id),
  );

  const branchRows: TableRow[] = branches.map((record) => ({
    id: record.id,
    cells: {
      branch: (
        <div>
          <p className="font-bold">{record.name}</p>
          <p className="text-muted text-xs">{record.code}</p>
        </div>
      ),
      state: (
        <Badge variant={record.state === "ACTIVE" ? "success" : "neutral"}>
          {record.state}
        </Badge>
      ),
      assigned: (
        <span className="font-bold">{record.assignedStaffIds.length}</span>
      ),
      action: (
        <Button
          variant="secondary"
          onClick={() => setSelectedBranchId(record.id)}
        >
          View assignments
        </Button>
      ),
    },
  }));

  const assignmentRows: TableRow[] = assigned.map((record) => ({
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
      activation: (
        <Badge
          variant={
            record.state === "ACTIVE"
              ? "success"
              : record.state === "SUSPENDED"
                ? "danger"
                : "neutral"
          }
        >
          {record.state}
        </Badge>
      ),
      action: (
        <Button
          variant="secondary"
          className="min-h-9 px-3 py-1.5"
          onClick={() => setPending({ mode: "UNASSIGN", staff: record })}
        >
          Unassign
        </Button>
      ),
    },
  }));

  function applyAssignment() {
    if (!pending || !branch) return;
    setBranches((current) =>
      current.map((record) => {
        if (record.id !== branch.id) return record;
        const assignedStaffIds =
          pending.mode === "ASSIGN"
            ? [...record.assignedStaffIds, pending.staff.id]
            : record.assignedStaffIds.filter((id) => id !== pending.staff.id);
        return { ...record, assignedStaffIds };
      }),
    );
    setStaffToAdd("");
    setPending(null);
  }

  return (
    <>
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Branch summary"
      >
        <Card className="p-5">
          <p className="text-muted text-sm">Total branches</p>
          <p className="mt-2 text-3xl font-bold">{branches.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-muted text-sm">Active branches</p>
          <p className="mt-2 text-3xl font-bold">
            {branches.filter((record) => record.state === "ACTIVE").length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-muted text-sm">Direct assignments</p>
          <p className="mt-2 text-3xl font-bold">
            {branches.reduce(
              (total, record) => total + record.assignedStaffIds.length,
              0,
            )}
          </p>
        </Card>
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="border-border border-b p-5">
          <h2 className="text-lg font-bold">Branches</h2>
          <p className="text-muted mt-1 text-sm">
            Operating branches and activation state.
          </p>
        </div>
        <DataTable
          columns={[
            { key: "branch", label: "Branch" },
            { key: "state", label: "State" },
            { key: "assigned", label: "Assigned staff", align: "right" },
            { key: "action", label: "Action", align: "right" },
          ]}
          rows={branchRows}
        />
      </Card>

      {branch && (
        <Card className="mt-6 overflow-hidden">
          <div className="border-border flex flex-wrap items-end justify-between gap-4 border-b p-5">
            <div>
              <h2 className="text-lg font-bold">{branch.name} assignments</h2>
              <p className="text-muted mt-1 text-sm">
                Direct staff access to {branch.code}.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm font-bold" htmlFor="available-staff">
                Available staff
                <select
                  id="available-staff"
                  value={staffToAdd}
                  onChange={(event) => setStaffToAdd(event.target.value)}
                  className="border-border bg-surface mt-1 block min-h-10 rounded-lg border px-3 text-sm font-normal"
                >
                  <option value="">Select staff</option>
                  {available.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                disabled={!staffToAdd}
                onClick={() => {
                  const selected = staff.find(
                    (record) => record.id === staffToAdd,
                  );
                  if (selected) setPending({ mode: "ASSIGN", staff: selected });
                }}
              >
                Assign staff
              </Button>
            </div>
          </div>
          {available.length === 0 && (
            <div className="p-4">
              <Alert title="All staff assigned" variant="info">
                Every staff identity is directly assigned to this branch.
              </Alert>
            </div>
          )}
          <DataTable
            columns={[
              { key: "staff", label: "Staff" },
              { key: "role", label: "Role" },
              { key: "activation", label: "Account state" },
              { key: "action", label: "Action", align: "right" },
            ]}
            rows={assignmentRows}
            emptyContent={
              <EmptyState
                title="No branch assignments"
                description="Assign an active staff identity to this branch."
              />
            }
          />
        </Card>
      )}

      <ConfirmationDialog
        open={Boolean(pending)}
        title={`${pending?.mode === "ASSIGN" ? "Assign" : "Unassign"} staff`}
        message={
          pending && branch
            ? `${pending.staff.name} will be ${pending.mode === "ASSIGN" ? "assigned to" : "removed from"} ${branch.name}. Confirm before continuing.`
            : ""
        }
        confirmLabel={
          pending?.mode === "ASSIGN" ? "Assign staff" : "Unassign staff"
        }
        destructive={pending?.mode === "UNASSIGN"}
        onCancel={() => setPending(null)}
        onConfirm={applyAssignment}
      />
    </>
  );
}
