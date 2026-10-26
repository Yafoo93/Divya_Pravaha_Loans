"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button } from "./ui/actions";
import { CheckboxField, InputField, TextareaField } from "./ui/forms";

export function AccrueReturnControl({
  investmentId,
}: {
  investmentId: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/investments/${investmentId}/accrue`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const result = (await response.json()) as {
      accrualNumber?: string;
      error?: string;
    };
    setLoading(false);
    if (!response.ok) return setError(result.error ?? "Accrual failed.");
    setMessage(`Posted ${result.accrualNumber}.`);
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <Alert variant="danger" title="Accrual failed">
          {error}
        </Alert>
      )}
      {message && (
        <Alert variant="success" title="Return accrued">
          {message}
        </Alert>
      )}
      <InputField
        id="throughDate"
        name="throughDate"
        type="date"
        label="Accrue through"
        required
      />
      <Button loading={loading} type="submit">
        Accrue and post return
      </Button>
    </form>
  );
}

export function PayoutRequestForm({ investmentId }: { investmentId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    const response = await fetch("/api/investor-payouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        investmentId,
        payeeVerified: form.get("payeeVerified") === "on",
      }),
    });
    const result = (await response.json()) as {
      payoutNumber?: string;
      error?: string;
    };
    setLoading(false);
    if (!response.ok) return setError(result.error ?? "Request failed.");
    setMessage(
      `Created ${result.payoutNumber}; another Manager must approve it.`,
    );
    (event.currentTarget as HTMLFormElement).reset();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <Alert variant="danger" title="Request failed">
          {error}
        </Alert>
      )}
      {message && (
        <Alert variant="success" title="Payout requested">
          {message}
        </Alert>
      )}
      <InputField
        id="returnAmountGhs"
        name="returnAmountGhs"
        label="Return amount (GHS)"
        inputMode="decimal"
        placeholder="0.00"
      />
      <InputField
        id="principalAmountGhs"
        name="principalAmountGhs"
        label="Principal amount (GHS)"
        inputMode="decimal"
        placeholder="0.00"
      />
      <TextareaField id="reason" name="reason" label="Reason" required />
      <CheckboxField
        id="payeeVerified"
        name="payeeVerified"
        label="I verified the payee identity and destination"
        required
      />
      <Button loading={loading} type="submit">
        Submit payout request
      </Button>
    </form>
  );
}

export function PayoutDecision({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function decide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/investor-payouts/${payoutId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const result = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) return setError(result.error ?? "Decision failed.");
    router.refresh();
  }
  return (
    <form onSubmit={decide} className="mt-3 grid gap-3 sm:grid-cols-2">
      {error && (
        <div className="sm:col-span-2">
          <Alert variant="danger" title="Decision failed">
            {error}
          </Alert>
        </div>
      )}
      <InputField
        id={`decision-${payoutId}`}
        name="decisionReason"
        label="Decision reason"
        required
      />
      <InputField
        id={`payment-${payoutId}`}
        name="paymentReference"
        label="Payment reference"
      />
      <Button name="action" value="APPROVE" loading={loading}>
        Approve and pay
      </Button>
      <Button
        name="action"
        value="REJECT"
        variant="secondary"
        disabled={loading}
      >
        Reject
      </Button>
    </form>
  );
}
