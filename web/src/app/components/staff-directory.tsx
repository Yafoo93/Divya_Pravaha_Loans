"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatAccraDateTime } from "@/lib/formatters";
import { Button, Alert } from "./ui/actions";
import {
  Badge,
  Card,
  DataTable,
  SearchAndFilterBar,
  type TableRow,
} from "./ui/data-display";
import { EmptyState } from "./ui/states";

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type StaffUser = {
  id: string;
  staffNumber: string;
  name: string;
  email: string;
  status: UserStatus;
  lastActiveAt: string | null;
  isSampleData: boolean;
  roles: { code: string; name: string }[];
  branches: { id: string; code: string; name: string }[];
};
type Option = { id: string; code: string; name: string };
type FormValues = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  branchId: string;
  status: UserStatus;
};

const blankForm: FormValues = {
  name: "",
  email: "",
  password: "",
  roleId: "",
  branchId: "",
  status: "ACTIVE",
};
const stateVariant = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  SUSPENDED: "danger",
} as const;

export function StaffDirectory({
  initialUsers,
  roles,
  branches,
}: {
  initialUsers: readonly StaffUser[];
  roles: readonly Option[];
  branches: readonly Option[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState([...initialUsers]);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState<FormValues>(blankForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = `${user.staffNumber} ${user.name} ${user.email}`
        .toLowerCase()
        .includes(normalized);
      const matchesState = stateFilter === "ALL" || user.status === stateFilter;
      const matchesRole =
        roleFilter === "ALL" ||
        user.roles.some((role) => role.code === roleFilter);
      return matchesSearch && matchesState && matchesRole;
    });
  }, [users, query, stateFilter, roleFilter]);

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setValues({
      ...blankForm,
      roleId: roles[0]?.id ?? "",
      branchId: branches[0]?.id ?? "",
    });
    setError("");
  }

  function startEdit(user: StaffUser) {
    setCreating(false);
    setEditing(user);
    setValues({
      name: user.name,
      email: user.email,
      password: "",
      roleId:
        roles.find((role) => role.code === user.roles[0]?.code)?.id ??
        roles[0]?.id ??
        "",
      branchId: user.branches[0]?.id ?? branches[0]?.id ?? "",
      status: user.status,
    });
    setError("");
  }

  async function refreshUsers() {
    const response = await fetch("/api/administration/staff", {
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(
        "Saved, but the refreshed directory could not be loaded. Reload this page.",
      );
    const result = (await response.json()) as { users: StaffUser[] };
    setUsers(
      result.users.map((user) => ({
        ...user,
        lastActiveAt: user.lastActiveAt
          ? new Date(user.lastActiveAt).toISOString()
          : null,
      })),
    );
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/administration/staff", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, id: editing?.id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error ?? "Could not save staff account.");
      await refreshUsers();
      setCreating(false);
      setEditing(null);
      setValues(blankForm);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save staff account.",
      );
    } finally {
      setLoading(false);
    }
  }

  function startStatusChange(user: StaffUser) {
    startEdit(user);
    setValues((current) => ({
      ...current,
      status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
    }));
  }

  const rows: TableRow[] = filtered.map((user) => ({
    id: user.id,
    cells: {
      staff: (
        <div>
          <p className="font-bold">{user.name}</p>
          <p className="text-muted text-xs">
            {user.staffNumber} · {user.email}
            {user.isSampleData ? " · Sample data" : ""}
          </p>
        </div>
      ),
      role: user.roles.map((role) => role.name).join(", ") || "No active role",
      branch:
        user.branches.map((branch) => branch.name).join(", ") ||
        "No active branch",
      state: <Badge variant={stateVariant[user.status]}>{user.status}</Badge>,
      lastActive: (
        <span className="text-sm tabular-nums">
          {user.lastActiveAt ? formatAccraDateTime(user.lastActiveAt) : "Never"}
        </span>
      ),
      action: (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            className="min-h-9 px-3 py-1.5"
            onClick={() => startEdit(user)}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            className="min-h-9 px-3 py-1.5"
            onClick={() => startStatusChange(user)}
          >
            {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  }));

  return (
    <>
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Staff account summary"
      >
        {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((status) => (
          <Card key={status} className="p-5">
            <p className="text-muted text-sm capitalize">
              {status.toLowerCase()}
            </p>
            <p className="mt-2 text-3xl font-bold">
              {users.filter((user) => user.status === status).length}
            </p>
          </Card>
        ))}
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="text-lg font-bold">Staff directory</h2>
            <p className="text-muted mt-1 text-sm">
              Real staff accounts and their current access. Passwords are never
              displayed.
            </p>
          </div>
          <Button onClick={startCreate}>Add staff user</Button>
        </div>
        <SearchAndFilterBar
          query={query}
          onQueryChange={setQuery}
          searchLabel="Search name, email, or staff ID"
          filterValue={stateFilter}
          onFilterChange={setStateFilter}
          filterLabel="Filter by activation state"
          filterOptions={[
            { value: "ALL", label: "All activation states" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "SUSPENDED", label: "Suspended" },
          ]}
        />
        <div className="border-border flex items-center gap-3 border-t p-4">
          <label className="text-sm font-bold" htmlFor="staff-role-filter">
            Role
          </label>
          <select
            id="staff-role-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="border-border bg-surface min-h-10 rounded-lg border px-3 text-sm"
          >
            <option value="ALL">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.code}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <DataTable
          columns={[
            { key: "staff", label: "Staff" },
            { key: "role", label: "Role" },
            { key: "branch", label: "Branch" },
            { key: "state", label: "Activation" },
            { key: "lastActive", label: "Last active" },
            { key: "action", label: "Actions", align: "right" },
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

      {(creating || editing) && (
        <Card className="mt-6 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">
                {editing ? `Update ${editing.name}` : "Create staff account"}
              </h2>
              <p className="text-muted mt-1 text-sm">
                Assign one role and one branch. Passwords are securely hashed.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setCreating(false);
                setEditing(null);
                setError("");
              }}
            >
              Cancel
            </Button>
          </div>
          {error && (
            <div className="mt-4">
              <Alert title="Could not save account" variant="danger">
                {error}
              </Alert>
            </div>
          )}
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <Field
              label="Full name"
              value={values.name}
              onChange={(name) =>
                setValues((current) => ({ ...current, name }))
              }
              required
              maxLength={150}
            />
            <Field
              label="Staff email"
              type="email"
              value={values.email}
              onChange={(email) =>
                setValues((current) => ({ ...current, email }))
              }
              required
              maxLength={254}
            />
            <Field
              label={editing ? "New password (optional)" : "Initial password"}
              type="password"
              value={values.password}
              onChange={(password) =>
                setValues((current) => ({ ...current, password }))
              }
              required={!editing}
              minLength={8}
              maxLength={128}
              help={
                editing
                  ? "Leave blank to keep the current password; enter 8–128 characters to reset it."
                  : "Use at least 8 characters. Share it securely and ask the user to change it."
              }
            />
            <label className="grid gap-1.5 text-sm font-semibold">
              Role
              <select
                required
                value={values.roleId}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    roleId: event.target.value,
                  }))
                }
                className="border-border bg-surface min-h-11 rounded-lg border px-3"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Branch
              <select
                required
                value={values.branchId}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    branchId: event.target.value,
                  }))
                }
                className="border-border bg-surface min-h-11 rounded-lg border px-3"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Account status
              <select
                required
                value={values.status}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    status: event.target.value as UserStatus,
                  }))
                }
                className="border-border bg-surface min-h-11 rounded-lg border px-3"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
              <Button type="submit" loading={loading}>
                {editing ? "Save changes" : "Create account"}
              </Button>
            </div>
          </form>
        </Card>
      )}
      <p className="text-muted mt-4 text-xs">
        Deactivating an account revokes its active sessions. At least one active
        System Admin must remain.
      </p>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
  maxLength,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  help?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={type === "password" ? "new-password" : undefined}
        className="border-border bg-surface min-h-11 rounded-lg border px-3 font-normal"
      />
      {help && <span className="text-muted text-xs font-normal">{help}</span>}
    </label>
  );
}
