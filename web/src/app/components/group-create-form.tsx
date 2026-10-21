"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export function GroupCreateForm({
  branches,
  borrowers,
}: {
  branches: readonly { id: string; name: string }[];
  borrowers: readonly {
    id: string;
    name: string;
    customerId: string;
    branchId: string;
  }[];
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [name, setName] = useState("");
  const [agreement, setAgreement] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ branchId, name, agreement, memberIds: members }),
    });
    const result = (await response.json()) as {
      error?: string;
      groupNumber?: string;
    };
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to create group.");
      return;
    }
    router.push(`/workspace/groups/${result.groupNumber}`);
  }
  return (
    <form
      onSubmit={submit}
      className="border-border bg-surface mt-8 rounded-xl border p-6 shadow-sm"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Group name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            className="control"
          />
        </Field>
        <Field label="Branch">
          <select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setMembers([]);
            }}
            className="control"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Joint-liability agreement reference">
            <input
              value={agreement}
              onChange={(e) => setAgreement(e.target.value)}
              required
              className="control"
              placeholder="JL-REFERENCE-v1"
            />
          </Field>
        </div>
      </div>
      <fieldset className="border-border mt-6 rounded-lg border p-4">
        <legend className="px-2 font-bold">Initial members</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {borrowers
            .filter((b) => b.branchId === branchId)
            .map((b) => (
              <label key={b.id} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={members.includes(b.id)}
                  onChange={(e) =>
                    setMembers(
                      e.target.checked
                        ? [...members, b.id]
                        : members.filter((id) => id !== b.id),
                    )
                  }
                />
                <span>
                  {b.name}{" "}
                  <span className="text-muted text-xs">{b.customerId}</span>
                </span>
              </label>
            ))}
        </div>
        <p className="text-muted mt-3 text-xs">
          Select at least one now; five consenting members are required before
          activation.
        </p>
      </fieldset>
      {error && (
        <p role="alert" className="text-danger mt-4">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="bg-primary mt-6 min-h-11 rounded-lg px-5 font-bold text-white disabled:opacity-50"
      >
        {busy ? "Creating..." : "Create draft group"}
      </button>
    </form>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}
