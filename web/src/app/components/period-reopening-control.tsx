"use client";

import { useState } from "react";

export function PeriodReopeningControl({
  periodId,
  requestId,
  action,
}: {
  periodId: string;
  requestId?: string;
  action: "REQUEST" | "APPROVE" | "REJECT";
}) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/accounting/periods/${periodId}/reopen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, requestId, reason }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) setMessage(result.error ?? "Period action failed.");
    else window.location.reload();
    setBusy(false);
  }
  return (
    <div className="mt-2 space-y-2">
      <input
        className="min-h-10 w-full rounded-lg border px-3 text-sm"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Controlled reason (minimum 10 characters)"
      />
      <button
        type="button"
        onClick={submit}
        disabled={busy || reason.trim().length < 10}
        className="min-h-10 rounded-lg border border-blue-700 px-3 text-sm font-semibold text-blue-700 disabled:opacity-50"
      >
        {busy
          ? "Working…"
          : action === "REQUEST"
            ? "Request reopening"
            : action === "APPROVE"
              ? "Approve reopening"
              : "Reject request"}
      </button>
      {message ? (
        <p role="alert" className="text-xs text-red-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
