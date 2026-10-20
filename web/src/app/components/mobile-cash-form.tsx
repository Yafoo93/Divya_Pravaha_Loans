"use client";

import { useState, type FormEvent } from "react";
import {
  allocateCashPayment,
  validateCashCollection,
  type CashCollectionValues,
} from "@/lib/cash-collection";
import { formatGhsFromPesewas, toAccraDateInputValue } from "@/lib/formatters";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { Alert, Button } from "./ui/actions";
import { CheckboxField, InputField, TextareaField } from "./ui/forms";

const initialValues: CashCollectionValues = {
  amount: "",
  receivedDate: toAccraDateInputValue(prototypeWorkspace.displayDate),
  borrowerConfirmed: false,
};

export function MobileCashForm() {
  const [values, setValues] = useState(initialValues);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<
    ReturnType<typeof validateCashCollection>
  >({});
  const [validated, setValidated] = useState(false);
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
    setValidated(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCashCollection(values);
    setErrors(nextErrors);
    setValidated(Object.keys(nextErrors).length === 0);
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      <section className="border-border bg-surface rounded-2xl border p-4 shadow-sm">
        <span className="bg-success/10 text-success inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase">
          Borrower and loan confirmed
        </span>
        <h2 className="mt-3 text-xl font-bold">Efua Osei</h2>
        <p className="text-muted mt-1 text-xs">
          CUS-0129 · LN-0246 · Kasoa Market Circle
        </p>
        <dl className="border-border mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted text-xs">Due today</dt>
            <dd className="mt-1 font-bold">GHS 600.00</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Contract balance</dt>
            <dd className="mt-1 text-right font-bold">GHS 3,600.00</dd>
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
      {validated && (
        <Alert title="Cash form validated" variant="success">
          The sample is ready for online receipt issuance. No payment was
          recorded.
        </Alert>
      )}
      <Button type="submit" className="min-h-14 w-full text-base">
        Validate and preview receipt
      </Button>
    </form>
  );
}
