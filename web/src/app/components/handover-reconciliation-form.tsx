"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supportedDenominationsPesewas } from "@/lib/handover-rules";
import { formatGhsFromPesewas } from "@/lib/formatters";
import { Alert, Button } from "./ui/actions";
import { InputField, SelectField, TextareaField } from "./ui/forms";

export function HandoverReconciliationForm({
  handoverId,
  expectedPesewas,
}: {
  handoverId: string;
  expectedPesewas: number;
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [note, setNote] = useState(
    "Receipt references matched and physical cash counted independently.",
  );
  const [positiveVarianceType, setPositiveVarianceType] = useState("EXCESS");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const counted = supportedDenominationsPesewas.reduce(
    (sum, denomination) => sum + denomination * (quantities[denomination] ?? 0),
    0,
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    const response = await fetch(`/api/handovers/${handoverId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "VERIFY",
        denominations: supportedDenominationsPesewas.map(
          (denominationPesewas) => ({
            denominationPesewas,
            quantity: quantities[denominationPesewas] ?? 0,
          }),
        ),
        note,
        positiveVarianceType,
      }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Verification failed.");
      setWorking(false);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {supportedDenominationsPesewas.map((denomination) => (
          <InputField
            key={denomination}
            id={`denomination-${denomination}`}
            label={`${formatGhsFromPesewas(denomination)} notes`}
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={quantities[denomination] ?? 0}
            onChange={(event) =>
              setQuantities((current) => ({
                ...current,
                [denomination]: Math.max(
                  0,
                  Number.parseInt(event.target.value || "0", 10),
                ),
              }))
            }
          />
        ))}
      </div>
      <div className="bg-background rounded-xl p-4 text-sm">
        <div className="flex justify-between">
          <span>Expected</span>
          <strong>{formatGhsFromPesewas(expectedPesewas)}</strong>
        </div>
        <div className="mt-2 flex justify-between">
          <span>Counted</span>
          <strong>{formatGhsFromPesewas(counted)}</strong>
        </div>
        <div className="border-border mt-2 flex justify-between border-t pt-2">
          <span>Variance</span>
          <strong>{formatGhsFromPesewas(counted - expectedPesewas)}</strong>
        </div>
      </div>
      <SelectField
        id="positive-variance"
        label="Positive variance classification"
        value={positiveVarianceType}
        onChange={(event) => setPositiveVarianceType(event.target.value)}
        help="Used only when counted cash exceeds receipt total."
      >
        <option value="EXCESS">Identified excess</option>
        <option value="UNIDENTIFIED_CASH">Unidentified cash</option>
      </SelectField>
      <TextareaField
        id="reconciliation-note"
        label="Reconciliation note"
        required
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      {error && (
        <Alert title="Verification not recorded" variant="danger">
          {error}
        </Alert>
      )}
      <Button type="submit" disabled={working} className="min-h-12 w-full">
        {working ? "Recording count..." : "Verify physical count"}
      </Button>
    </form>
  );
}

export function PostHandoverButton({ handoverId }: { handoverId: string }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  async function post() {
    setWorking(true);
    setError("");
    const response = await fetch(`/api/handovers/${handoverId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "POST" }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Posting failed.");
      setWorking(false);
      return;
    }
    router.refresh();
  }
  return (
    <div className="space-y-3">
      {error && (
        <Alert title="Handover not posted" variant="danger">
          {error}
        </Alert>
      )}
      <Button
        type="button"
        onClick={post}
        disabled={working}
        className="min-h-12 w-full"
      >
        {working ? "Posting custody transfer..." : "Post verified handover"}
      </Button>
    </div>
  );
}
