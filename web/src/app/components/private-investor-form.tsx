"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button } from "./ui/actions";
import { InputField, SelectField, TextareaField } from "./ui/forms";

export function PrivateInvestorForm({
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
    const response = await fetch("/api/investors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const result = (await response.json()) as { id?: string; error?: string };
    setLoading(false);
    if (!response.ok)
      return setError(result.error ?? "Private capital could not be recorded.");
    router.push(`/workspace/investors/${result.id}`);
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <Alert variant="danger" title="Could not create contract">
          {error}
        </Alert>
      )}
      <Alert variant="warning" title="Private funding only">
        This register is for individually documented owner, family, and other
        private business-support funds. It is not for public solicitation.
      </Alert>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField id="branchId" name="branchId" label="Branch" required>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </SelectField>
        <SelectField id="type" name="type" label="Contributor type" required>
          <option value="FAMILY">Family member</option>
          <option value="OTHER_PRIVATE">Other private source</option>
        </SelectField>
        <InputField
          id="legalName"
          name="legalName"
          label="Full legal name"
          required
        />
        <InputField id="phone" name="phone" label="Phone" />
        <InputField id="email" name="email" label="Email" type="email" />
        <InputField
          id="identityReference"
          name="identityReference"
          label="Identity reference"
          help="Store only an approved masked or internal verification reference."
        />
        <InputField
          id="principalGhs"
          name="principalGhs"
          label="Cleared principal (GHS)"
          inputMode="decimal"
          required
        />
        <InputField
          id="evidenceReference"
          name="evidenceReference"
          label="Cleared-funds evidence"
          required
        />
        <InputField
          id="startDate"
          name="startDate"
          label="Contract start date"
          type="date"
          required
        />
        <InputField
          id="maturityDate"
          name="maturityDate"
          label="Maturity date"
          type="date"
          required
        />
      </div>
      <TextareaField
        id="relationshipNote"
        name="relationshipNote"
        label="Relationship and source note"
        required
      />
      <div className="bg-primary/5 border-primary/15 rounded-xl border p-4 text-sm">
        <strong>Return basis:</strong> 60.00% per annum, daily simple interest,
        no compounding. Principal is repayable only at maturity until an
        early-exit policy is approved.
      </div>
      <Button type="submit" loading={loading}>
        Record funds and activate contract
      </Button>
    </form>
  );
}
