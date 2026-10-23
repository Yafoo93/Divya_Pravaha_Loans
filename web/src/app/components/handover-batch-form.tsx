"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatGhsFromPesewas } from "@/lib/formatters";
import { Alert, Button } from "./ui/actions";

type ReceiptOption = {
  id: string;
  number: string;
  borrower: string;
  amountPesewas: number;
};

export function HandoverBatchForm({ receipts }: { receipts: ReceiptOption[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(
    () => new Set(receipts.map((receipt) => receipt.id)),
  );
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const total = receipts
    .filter((receipt) => selected.has(receipt.id))
    .reduce((sum, receipt) => sum + receipt.amountPesewas, 0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!navigator.onLine) return setError("An online connection is required.");
    setWorking(true);
    setError("");
    const response = await fetch("/api/handovers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptIds: [...selected] }),
    });
    const result = (await response.json()) as { id?: string; error?: string };
    if (!response.ok || !result.id) {
      setError(result.error ?? "Handover submission failed.");
      setWorking(false);
      return;
    }
    router.push(`/workspace/handovers/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-3">
        {receipts.map((receipt) => (
          <label
            key={receipt.id}
            className="border-border bg-surface flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-3"
          >
            <input
              type="checkbox"
              checked={selected.has(receipt.id)}
              onChange={(event) => {
                const next = new Set(selected);
                if (event.target.checked) next.add(receipt.id);
                else next.delete(receipt.id);
                setSelected(next);
              }}
              className="size-5"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{receipt.number}</span>
              <span className="text-muted block truncate text-xs">
                {receipt.borrower}
              </span>
            </span>
            <span className="font-bold">
              {formatGhsFromPesewas(receipt.amountPesewas)}
            </span>
          </label>
        ))}
      </div>
      <div className="bg-primary/10 rounded-xl p-4">
        <p className="text-muted text-xs font-bold uppercase">Batch total</p>
        <p className="text-primary mt-1 text-2xl font-bold">
          {formatGhsFromPesewas(total)}
        </p>
      </div>
      {error && (
        <Alert title="Handover not submitted" variant="danger">
          {error}
        </Alert>
      )}
      <Button
        type="submit"
        disabled={working || selected.size === 0}
        className="min-h-14 w-full"
      >
        {working ? "Submitting batch..." : "Submit selected receipts"}
      </Button>
    </form>
  );
}
