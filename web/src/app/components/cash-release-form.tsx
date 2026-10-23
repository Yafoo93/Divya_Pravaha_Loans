"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CashReleaseForm({
  loanId,
  reservationId,
  borrowerId,
  voucherNumber,
}: {
  loanId: string;
  reservationId: string;
  borrowerId: string;
  voucherNumber: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const today = new Date().toISOString().slice(0, 16);

  async function submit(formData: FormData) {
    setWorking(true);
    setError("");
    const response = await fetch("/api/disbursements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanId,
        reservationId,
        beneficiaryBorrowerId: borrowerId,
        identityConfirmed: formData.get("identityConfirmed") === "on",
        voucherNumber,
        voucherDocumentReference: formData.get("voucherReference"),
        voucherSignedAt: formData.get("voucherSignedAt"),
        actualCashOutAt: formData.get("actualCashOutAt"),
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Cash release failed.");
      setWorking(false);
      return;
    }
    router.refresh();
  }

  return (
    <form action={submit} className="space-y-4">
      <label className="block text-sm font-semibold">
        Signed voucher reference
        <input
          name="voucherReference"
          required
          defaultValue={`${voucherNumber}.pdf`}
          className="border-border mt-1 h-11 w-full rounded-lg border px-3"
        />
      </label>
      <label className="block text-sm font-semibold">
        Voucher signed at
        <input
          name="voucherSignedAt"
          type="datetime-local"
          required
          defaultValue={today}
          className="border-border mt-1 h-11 w-full rounded-lg border px-3"
        />
      </label>
      <label className="block text-sm font-semibold">
        Actual physical cash-out
        <input
          name="actualCashOutAt"
          type="datetime-local"
          required
          defaultValue={today}
          className="border-border mt-1 h-11 w-full rounded-lg border px-3"
        />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input
          name="identityConfirmed"
          type="checkbox"
          required
          className="size-5"
        />
        Borrower identity and beneficiary confirmed
      </label>
      {error && (
        <p
          role="alert"
          className="bg-danger/10 text-danger rounded-lg p-3 text-sm"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={working}
        className="bg-primary min-h-11 w-full rounded-lg px-4 font-bold text-white disabled:opacity-50"
      >
        {working ? "Recording cash release…" : "Record cash disbursement"}
      </button>
    </form>
  );
}
