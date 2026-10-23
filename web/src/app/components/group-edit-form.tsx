"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function GroupEditForm({
  groupId,
  name,
  officerId,
  officers,
  status,
}: {
  groupId: string;
  name: string;
  officerId: string;
  officers: readonly { id: string; name: string }[];
  status: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [groupName, setGroupName] = useState(name);
  const [assignedOfficer, setAssignedOfficer] = useState(officerId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function send(action: "UPDATE" | "SUSPEND") {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        name: groupName,
        officerId: assignedOfficer,
      }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok)
      return setError(result.error ?? "Unable to update group.");
    setEditing(false);
    router.refresh();
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    void send("UPDATE");
  }
  if (!editing)
    return (
      <div className="flex flex-wrap gap-2">
        <button
          className="border-border rounded-lg border px-4 py-2 text-sm font-bold"
          onClick={() => setEditing(true)}
        >
          Edit group
        </button>
        {status !== "SUSPENDED" && (
          <button
            className="border-danger text-danger rounded-lg border px-4 py-2 text-sm font-bold"
            onClick={() =>
              window.confirm(
                "Suspend this group? Historical records will remain available.",
              ) && void send("SUSPEND")
            }
          >
            Suspend group
          </button>
        )}
      </div>
    );
  return (
    <form
      onSubmit={submit}
      className="border-border bg-background mt-4 rounded-lg border p-4"
    >
      <label className="text-sm font-bold">
        Group name
        <input
          required
          minLength={3}
          className="control mt-2"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </label>
      <label className="mt-4 block text-sm font-bold">
        Assigned officer
        <select
          className="control mt-2"
          value={assignedOfficer}
          onChange={(e) => setAssignedOfficer(e.target.value)}
        >
          {officers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="text-danger mt-3 text-sm">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          disabled={busy}
          className="bg-primary rounded-lg px-4 py-2 font-bold text-white"
        >
          {busy ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          className="border-border rounded-lg border px-4 py-2"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
