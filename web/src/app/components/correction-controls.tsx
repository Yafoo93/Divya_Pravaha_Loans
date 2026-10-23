"use client";

import { useState } from "react";

type Action =
  | "REQUEST_REVERSAL"
  | "APPROVE_REVERSAL"
  | "REJECT_REVERSAL"
  | "RESOLVE_SUSPENSE"
  | "REQUEST_REFUND"
  | "APPROVE_REFUND"
  | "REJECT_REFUND";

export function CorrectionAction({
  action,
  idName,
  id,
  label,
  manager = false,
  amount = false,
  payerVerification = false,
}: {
  action: Action;
  idName: "journalId" | "requestId" | "itemId" | "liabilityId";
  id: string;
  label: string;
  manager?: boolean;
  amount?: boolean;
  payerVerification?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [amountGhs, setAmountGhs] = useState("");
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/accounting/corrections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        [idName]: id,
        reason,
        ...(amount
          ? { amountPesewas: Math.round(Number(amountGhs) * 100) }
          : {}),
        ...(payerVerification ? { payerVerified: verified } : {}),
      }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) setMessage(result.error ?? "Action failed.");
    else window.location.reload();
    setBusy(false);
  }
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
      {amount ? (
        <input
          className="min-h-11 w-full rounded-lg border px-3"
          inputMode="decimal"
          placeholder="Refund amount (GHS)"
          value={amountGhs}
          onChange={(event) => setAmountGhs(event.target.value)}
        />
      ) : null}
      {payerVerification ? (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={verified}
            onChange={(event) => setVerified(event.target.checked)}
          />{" "}
          Payer identity and reference verified
        </label>
      ) : null}
      <textarea
        className="min-h-20 w-full rounded-lg border px-3 py-2"
        placeholder={`${manager ? "Independent decision" : "Request"} reason (minimum 10 characters)`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <button
        className="min-h-11 rounded-lg bg-blue-700 px-4 font-semibold text-white disabled:opacity-50"
        disabled={
          busy || reason.trim().length < 10 || (payerVerification && !verified)
        }
        onClick={submit}
      >
        {busy ? "Working…" : label}
      </button>
      {message ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
