"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LoanFrequency } from "@/lib/loan-application";

export function LoanTermsResubmission({
  applicationId,
  rejected,
  initial,
}: {
  applicationId: string;
  rejected: boolean;
  initial: {
    principalGhs: string;
    termMonths: number;
    frequency: LoanFrequency;
    purpose: string;
  };
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true);
    setError("");
    const response = await fetch(
      `/api/loan-applications/${encodeURIComponent(applicationId)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, reason }),
      },
    );
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok)
      return setError(result.error ?? "Unable to submit terms.");
    router.refresh();
  }
  return (
    <section className="border-border bg-surface rounded-xl border p-5">
      <h2 className="font-bold">
        {rejected ? "Change and resubmit terms" : "Submit draft terms"}
      </h2>
      <p className="text-muted mt-1 text-sm">
        Submission freezes a new version and requires a new independent Manager
        decision.
      </p>
      <label className="mt-4 block text-sm font-bold">
        Principal (GHS)
        <input
          type="number"
          min="1"
          step="0.01"
          className="control mt-2"
          value={values.principalGhs}
          onChange={(e) =>
            setValues({ ...values, principalGhs: e.target.value })
          }
        />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold">
          Term
          <select
            className="control mt-2"
            value={values.termMonths}
            onChange={(e) =>
              setValues({ ...values, termMonths: Number(e.target.value) })
            }
          >
            {[1, 2, 3, 4, 5, 6].map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Frequency
          <select
            className="control mt-2"
            value={values.frequency}
            onChange={(e) =>
              setValues({
                ...values,
                frequency: e.target.value as LoanFrequency,
              })
            }
          >
            <option value="WEEKLY">Weekly</option>
            <option value="FORTNIGHTLY">Fortnightly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm font-bold">
        Business purpose
        <textarea
          className="control mt-2"
          rows={3}
          value={values.purpose}
          onChange={(e) => setValues({ ...values, purpose: e.target.value })}
        />
      </label>
      {rejected && (
        <label className="mt-4 block text-sm font-bold">
          Change reason
          <textarea
            className="control mt-2"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
      )}
      {error && <p className="text-danger mt-3 text-sm">{error}</p>}
      <button
        onClick={() => void submit()}
        disabled={busy || (rejected && reason.trim().length < 10)}
        className="bg-primary mt-4 min-h-11 w-full rounded-lg px-4 py-3 font-bold text-white disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Submitting..." : "Freeze and submit new version"}
      </button>
    </section>
  );
}
