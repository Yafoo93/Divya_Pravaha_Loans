"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoanReviewDecision({
  applicationId,
  ownWork,
}: {
  applicationId: string;
  ownWork: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(action: "APPROVE" | "REJECT") {
    setBusy(true);
    setError("");
    const response = await fetch(
      `/api/loan-applications/${encodeURIComponent(applicationId)}/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason }),
      },
    );
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) return setError(result.error ?? "Decision failed.");
    router.push(`/workspace/loan-applications/${applicationId}`);
    router.refresh();
  }
  return (
    <section className="border-border bg-surface rounded-xl border p-5">
      <h2 className="text-lg font-bold">Manager decision</h2>
      {ownWork ? (
        <p className="text-danger mt-3 text-sm">
          You prepared this submitted version. A different Manager must make the
          decision.
        </p>
      ) : (
        <>
          <label className="mt-4 block text-sm font-bold">
            Decision reason
            <textarea
              className="control mt-2"
              rows={4}
              minLength={10}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Record the evidence and policy basis for this decision."
            />
          </label>
          {error && <p className="text-danger mt-3 text-sm">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button
              disabled={busy || reason.trim().length < 10}
              onClick={() => void decide("APPROVE")}
              className="bg-primary rounded-lg px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              Approve application
            </button>
            <button
              disabled={busy || reason.trim().length < 10}
              onClick={() => void decide("REJECT")}
              className="bg-danger rounded-lg px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              Reject with reason
            </button>
          </div>
        </>
      )}
    </section>
  );
}
