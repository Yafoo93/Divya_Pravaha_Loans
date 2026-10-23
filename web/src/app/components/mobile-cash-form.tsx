"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  allocateCashPayment,
  validateCashCollection,
  type CashCollectionValues,
} from "@/lib/cash-collection";
import { formatGhsFromPesewas } from "@/lib/formatters";
import { Alert, Button } from "./ui/actions";
import { CheckboxField, InputField, TextareaField } from "./ui/forms";

export function MobileCashForm({
  loan,
  receivedDate,
}: {
  loan: {
    id: string;
    number: string;
    borrowerName: string;
    customerId: string;
    groupName: string;
    duePesewas: number;
    balancePesewas: number;
  };
  receivedDate: string;
}) {
  const router = useRouter();
  const requestKey = useRef(crypto.randomUUID());
  const [values, setValues] = useState<CashCollectionValues>({
    amount: "",
    receivedDate,
    borrowerConfirmed: false,
  });
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<
    ReturnType<typeof validateCashCollection>
  >({});
  const [working, setWorking] = useState(false);
  const [serverError, setServerError] = useState("");
  const allocation = allocateCashPayment(Number(values.amount) || 0);

  function update<K extends keyof CashCollectionValues>(
    field: K,
    value: CashCollectionValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCashCollection(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!navigator.onLine) {
      setServerError("An online connection is required to issue a receipt.");
      return;
    }
    setWorking(true);
    setServerError("");
    const response = await fetch("/api/field/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanId: loan.id,
        amount: values.amount,
        receivedDate: values.receivedDate,
        borrowerConfirmed: values.borrowerConfirmed,
        collectionNote: note,
        idempotencyKey: requestKey.current,
        paymentMethod: "CASH",
        submissionMode: "ONLINE",
      }),
    });
    const result = (await response.json()) as { id?: string; error?: string };
    if (!response.ok || !result.id) {
      setServerError(result.error ?? "Receipt capture failed.");
      setWorking(false);
      return;
    }
    router.push(`/field/receipts/${result.id}`);
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      <section className="border-border bg-surface rounded-2xl border p-4 shadow-sm">
        <span className="bg-success/10 text-success inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase">
          Borrower and loan confirmed
        </span>
        <h2 className="mt-3 text-xl font-bold">{loan.borrowerName}</h2>
        <p className="text-muted mt-1 text-xs">
          {loan.customerId} · {loan.number} · {loan.groupName}
        </p>
        <dl className="border-border mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted text-xs">Due today</dt>
            <dd className="mt-1 font-bold">
              {formatGhsFromPesewas(loan.duePesewas)}
            </dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Contract balance</dt>
            <dd className="mt-1 text-right font-bold">
              {formatGhsFromPesewas(loan.balancePesewas)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="border-border bg-surface space-y-5 rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Cash received</h2>
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[10px] font-bold">
            CASH ONLY
          </span>
        </div>
        <InputField
          id="cash-amount"
          label="Amount received (GHS)"
          required
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          value={values.amount}
          onChange={(event) => update("amount", event.target.value)}
          error={errors.amount}
          help="Enter only cash physically received."
          placeholder="0.00"
          className="min-h-14 text-lg font-bold"
        />
        <div className="grid grid-cols-3 gap-2" aria-label="Quick cash amounts">
          {[100, 300, 600].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => update("amount", String(amount))}
              className="border-border hover:border-primary hover:text-primary min-h-12 rounded-xl border text-sm font-bold"
            >
              GHS {amount}
            </button>
          ))}
        </div>
        <InputField
          id="received-date"
          label="Actual cash-received date"
          required
          type="date"
          value={values.receivedDate}
          onChange={(event) => update("receivedDate", event.target.value)}
          error={errors.receivedDate}
          help="The system records entry time separately."
          className="min-h-14 text-base"
        />
        <TextareaField
          id="collection-note"
          label="Collection note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          help="Add a short location or payment note."
          placeholder="Cash received at market stall..."
          className="min-h-28 text-base"
        />
        <div className="border-border bg-background rounded-xl border p-4">
          <p className="text-muted text-xs font-bold uppercase">
            Automatic allocation preview
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Principal · 5/6</dt>
              <dd className="font-bold">
                {formatGhsFromPesewas(allocation.principalPesewas)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Interest · 1/6</dt>
              <dd className="font-bold">
                {formatGhsFromPesewas(allocation.interestPesewas)}
              </dd>
            </div>
            <div className="border-border flex justify-between border-t pt-2">
              <dt className="font-bold">Total</dt>
              <dd className="font-bold">
                {formatGhsFromPesewas(allocation.totalPesewas)}
              </dd>
            </div>
          </dl>
          <p className="text-muted mt-3 text-xs">
            Oldest due first. Manual allocation override is not allowed.
          </p>
        </div>
        <div className="min-h-14 rounded-xl p-2">
          <CheckboxField
            id="borrower-confirmed"
            label="I confirmed the borrower and correct loan"
            required
            checked={values.borrowerConfirmed}
            onChange={(event) =>
              update("borrowerConfirmed", event.target.checked)
            }
            error={errors.borrowerConfirmed}
          />
        </div>
      </section>

      {Object.keys(errors).length > 0 && (
        <Alert title="Check the cash form" variant="danger">
          Correct the highlighted fields before continuing.
        </Alert>
      )}
      {serverError && (
        <Alert title="Receipt not issued" variant="danger">
          {serverError}
        </Alert>
      )}
      <Button
        type="submit"
        disabled={working}
        className="min-h-14 w-full text-base"
      >
        {working ? "Issuing numbered receipt..." : "Issue numbered receipt"}
      </Button>
    </form>
  );
}
