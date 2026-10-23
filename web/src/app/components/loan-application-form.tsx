"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateLoanTerms, type LoanFrequency } from "@/lib/loan-application";
import { formatGhsFromPesewas } from "@/lib/formatters";

type Borrower = {
  id: string;
  customerId: string;
  legalName: string;
  groupId: string;
  groupName: string;
};
export function LoanApplicationForm({
  borrowers,
}: {
  borrowers: readonly Borrower[];
}) {
  const router = useRouter();
  const [borrowerId, setBorrowerId] = useState(borrowers[0]?.id ?? "");
  const selected = borrowers.find((b) => b.id === borrowerId);
  const [purpose, setPurpose] = useState("");
  const [principal, setPrincipal] = useState("10000");
  const [term, setTerm] = useState("6");
  const [frequency, setFrequency] = useState<LoanFrequency>("MONTHLY");
  const [documents, setDocuments] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = useMemo(() => {
    try {
      return calculateLoanTerms(
        Math.round(Number(principal) * 100),
        Number(term),
        frequency,
      );
    } catch {
      return null;
    }
  }, [principal, term, frequency]);
  async function submit(submitForReview: boolean) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/loan-applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        borrowerId,
        groupId: selected?.groupId,
        purpose,
        principalGhs: principal,
        termMonths: term,
        frequency,
        documents: documents.split("\n"),
        submit: submitForReview,
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      applicationNumber?: string;
    };
    setBusy(false);
    if (!response.ok)
      return setError(result.error ?? "Unable to create application.");
    router.push(`/workspace/loan-applications/${result.applicationNumber}`);
  }
  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
    >
      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="text-lg font-bold">Borrower & guarantee group</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Borrower
            <select
              className="control mt-2"
              value={borrowerId}
              onChange={(e) => setBorrowerId(e.target.value)}
            >
              {borrowers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.legalName} · {b.customerId}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Guaranteeing group
            <input
              className="control mt-2"
              disabled
              value={selected?.groupName ?? "No active membership"}
            />
          </label>
        </div>
      </section>
      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="text-lg font-bold">Purpose & GROUP_FLAT_20 v1 terms</h2>
        <label className="mt-4 block text-sm font-bold">
          Business purpose
          <textarea
            required
            minLength={10}
            rows={3}
            className="control mt-2"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-bold">
            Principal (GHS)
            <input
              required
              min="1"
              step="0.01"
              type="number"
              className="control mt-2"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
          </label>
          <label className="text-sm font-bold">
            Term
            <select
              className="control mt-2"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6].map((m) => (
                <option key={m} value={m}>
                  {m} month{m > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Frequency
            <select
              className="control mt-2"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as LoanFrequency)}
            >
              <option value="WEEKLY">Weekly</option>
              <option value="FORTNIGHTLY">Fortnightly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>
        </div>
        <p className="text-primary bg-primary/5 mt-4 rounded-lg p-3 text-sm">
          20% flat interest on original principal. Actual cash-out anchors the
          final contract schedule; weekend dues move to the next business day.
        </p>
      </section>
      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="text-lg font-bold">Private supporting documents</h2>
        <label className="mt-4 block text-sm font-bold">
          Evidence references, one per line
          <textarea
            rows={3}
            className="control mt-2"
            placeholder="BUS-CUS-0132.pdf&#10;CONS-CUS-0132.pdf"
            value={documents}
            onChange={(e) => setDocuments(e.target.value)}
          />
        </label>
      </section>
      {preview && (
        <section className="border-border bg-surface rounded-xl border p-6">
          <h2 className="text-lg font-bold">Repayment schedule preview</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric
              label="Principal"
              value={formatGhsFromPesewas(Math.round(Number(principal) * 100))}
            />
            <Metric
              label="Interest"
              value={formatGhsFromPesewas(preview.interestPesewas)}
            />
            <Metric
              label="Total repayment"
              value={formatGhsFromPesewas(preview.totalRepayablePesewas)}
            />
          </div>
          <ol
            className="mt-4 divide-y overflow-x-auto"
            aria-label="Repayment schedule"
          >
            {preview.schedule.map((item) => (
              <li
                className="grid min-w-[34rem] grid-cols-4 gap-2 py-2 text-sm"
                key={item.number}
              >
                <span>#{item.number}</span>
                <span>P {formatGhsFromPesewas(item.principalPesewas)}</span>
                <span>I {formatGhsFromPesewas(item.interestPesewas)}</span>
                <strong>{formatGhsFromPesewas(item.totalPesewas)}</strong>
              </li>
            ))}
          </ol>
          <p className="text-muted mt-3 text-xs">
            Amounts are rounded to pesewas. The final instalment absorbs every
            rounding remainder.
          </p>
        </section>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={busy}
          className="border-border rounded-lg border px-5 py-3 font-bold"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit(true)}
          className="bg-primary rounded-lg px-5 py-3 font-bold text-white"
        >
          Submit for manager review
        </button>
      </div>
    </form>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-lg p-4">
      <p className="text-muted text-xs">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
