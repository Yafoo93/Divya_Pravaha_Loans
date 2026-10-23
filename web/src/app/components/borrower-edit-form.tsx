"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function BorrowerEditForm({
  borrowerId,
  initial,
}: {
  borrowerId: string;
  initial: {
    legalName: string;
    phone: string;
    residentialAddress: string;
    businessDetails: string;
  };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch(
      `/api/borrowers/${encodeURIComponent(borrowerId)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      },
    );
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok)
      return setError(result.error ?? "Unable to update borrower.");
    setEditing(false);
    router.refresh();
  }

  if (!editing)
    return (
      <button
        className="border-border rounded-lg border px-4 py-2 text-sm font-bold"
        onClick={() => setEditing(true)}
      >
        Edit borrower
      </button>
    );

  return (
    <form
      onSubmit={submit}
      className="border-border bg-background mt-5 rounded-lg border p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(["legalName", "phone", "residentialAddress"] as const).map(
          (field) => (
            <label key={field} className="text-sm font-bold">
              {field === "legalName"
                ? "Legal name"
                : field === "phone"
                  ? "Phone"
                  : "Residential address"}
              <input
                className="control mt-2"
                required
                value={values[field]}
                onChange={(e) =>
                  setValues({ ...values, [field]: e.target.value })
                }
              />
            </label>
          ),
        )}
        <label className="text-sm font-bold sm:col-span-2">
          Business details
          <textarea
            className="control mt-2"
            required
            rows={3}
            value={values.businessDetails}
            onChange={(e) =>
              setValues({ ...values, businessDetails: e.target.value })
            }
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          disabled={busy}
          className="bg-primary rounded-lg px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          {busy ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          className="border-border rounded-lg border px-4 py-2"
          onClick={() => {
            setValues(initial);
            setEditing(false);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
