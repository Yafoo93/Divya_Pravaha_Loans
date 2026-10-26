"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button } from "./ui/actions";
import { InputField, SelectField, TextareaField } from "./ui/forms";

export function CapitalSourceForm({
  branches,
}: {
  branches: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/capital/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const result = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok)
      return setError(result.error ?? "Capital could not be recorded.");
    router.push("/workspace/capital");
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <Alert variant="danger" title="Could not record capital">
          {error}
        </Alert>
      )}
      <SelectField id="branchId" name="branchId" label="Branch" required>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="sourceType"
        name="sourceType"
        label="Source classification"
        required
      >
        <option value="OWNER_CAPITAL">Owner capital</option>
        <option value="OTHER_INCOME">Other verified income</option>
      </SelectField>
      <InputField
        id="sourceName"
        name="sourceName"
        label="Source name"
        required
        placeholder="Owner name or income source"
      />
      <InputField
        id="amountGhs"
        name="amountGhs"
        label="Amount received (GHS)"
        required
        inputMode="decimal"
        placeholder="10000.00"
      />
      <InputField
        id="receivedAt"
        name="receivedAt"
        label="Cleared date"
        required
        type="date"
      />
      <InputField
        id="evidenceReference"
        name="evidenceReference"
        label="Bank receipt or evidence reference"
        required
      />
      <TextareaField
        id="notes"
        name="notes"
        label="Notes"
        help="Describe where the money came from. Never classify borrowed or custody cash as owner capital."
      />
      <Button type="submit" loading={loading}>
        Record verified capital
      </Button>
    </form>
  );
}
