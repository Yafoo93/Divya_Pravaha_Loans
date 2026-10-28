"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateLoanTerms, type LoanFrequency } from "@/lib/loan-application";
import { formatGhsFromPesewas } from "@/lib/formatters";
import { Alert, Button } from "./ui/actions";
import { InputField, SelectField, TextareaField } from "./ui/forms";
import { Badge, Card } from "./ui/data-display";

type MembershipOption = {
  id: string;
  customerId: string;
  legalName: string;
  groupId: string;
  groupName: string;
  groupNumber: string;
  groupStatus: "DRAFT" | "ACTIVE" | "SUSPENDED";
  activeMemberCount: number;
  verifiedConsentingMemberCount: number;
  borrowerVerifiedAndConsenting: boolean;
  hasSignedAgreement: boolean;
};

export function LoanApplicationForm({
  memberships,
}: {
  memberships: readonly MembershipOption[];
}) {
  const router = useRouter();
  const borrowers = useMemo(
    () =>
      Array.from(new Map(memberships.map((item) => [item.id, item])).values()),
    [memberships],
  );
  const [borrowerId, setBorrowerId] = useState(borrowers[0]?.id ?? "");
  const availableGroups = useMemo(
    () => memberships.filter((item) => item.id === borrowerId),
    [borrowerId, memberships],
  );
  const [groupId, setGroupId] = useState(availableGroups[0]?.groupId ?? "");
  useEffect(() => {
    if (!availableGroups.some((item) => item.groupId === groupId))
      setGroupId(availableGroups[0]?.groupId ?? "");
  }, [availableGroups, groupId]);
  const selected = availableGroups.find((item) => item.groupId === groupId);
  const groupReady = Boolean(
    selected &&
    selected.groupStatus === "ACTIVE" &&
    selected.activeMemberCount >= 5 &&
    selected.verifiedConsentingMemberCount >= 5 &&
    selected.borrowerVerifiedAndConsenting &&
    selected.hasSignedAgreement,
  );

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
    if (!selected || !groupReady) {
      setError(
        "Select an eligible borrower and a group with at least five verified, consenting members and a signed agreement.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const response = await fetch("/api/loan-applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        borrowerId,
        groupId,
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

  if (borrowers.length === 0)
    return (
      <Alert title="No eligible borrowers available" variant="warning">
        A borrower must be active, belong to a group, and have no active loan or
        open application before a new application can be created.
      </Alert>
    );

  return (
    <form
      className="mt-6 space-y-6 sm:mt-8"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
    >
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-bold">Borrower and guarantee group</h2>
        <p className="text-muted mt-1 text-sm">
          Choose the person borrowing and the active group guaranteeing the
          loan.
        </p>
        <div className="mt-5 grid items-start gap-5 md:grid-cols-2">
          <SelectField
            id="loan-borrower"
            label="Borrower"
            required
            value={borrowerId}
            onChange={(event) => setBorrowerId(event.target.value)}
          >
            {borrowers.map((borrower) => (
              <option key={borrower.id} value={borrower.id}>
                {borrower.legalName} · {borrower.customerId}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="loan-group"
            label="Guaranteeing group"
            required
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            disabled={availableGroups.length === 0}
          >
            {availableGroups.length === 0 ? (
              <option value="">No active membership</option>
            ) : (
              availableGroups.map((membership) => (
                <option key={membership.groupId} value={membership.groupId}>
                  {membership.groupName} · {membership.groupNumber}
                </option>
              ))
            )}
          </SelectField>
        </div>
        {selected && (
          <div
            className={`mt-5 rounded-xl border p-4 ${groupReady ? "border-success/30 bg-success/5" : "border-warning/40 bg-warning/10"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">Group readiness</h3>
              <Badge variant={groupReady ? "success" : "warning"}>
                {groupReady ? "ELIGIBLE" : "NOT ELIGIBLE"}
              </Badge>
            </div>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Readiness
                label="Active members"
                value={`${selected.activeMemberCount} / minimum 5`}
                valid={selected.activeMemberCount >= 5}
              />
              <Readiness
                label="Verified and consenting"
                value={`${selected.verifiedConsentingMemberCount} / minimum 5`}
                valid={selected.verifiedConsentingMemberCount >= 5}
              />
              <Readiness
                label="Selected borrower"
                value={
                  selected.borrowerVerifiedAndConsenting
                    ? "Verified and consenting"
                    : "Incomplete"
                }
                valid={selected.borrowerVerifiedAndConsenting}
              />
              <Readiness
                label="Joint-liability agreement"
                value={selected.hasSignedAgreement ? "Signed" : "Missing"}
                valid={selected.hasSignedAgreement}
              />
            </dl>
            {selected.groupStatus !== "ACTIVE" && (
              <p className="text-danger mt-3 text-sm font-semibold">
                Group status is {selected.groupStatus}; it must be ACTIVE.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-bold">Loan purpose and terms</h2>
        <div className="mt-5">
          <TextareaField
            id="loan-purpose"
            label="Business purpose"
            required
            minLength={10}
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            help="Enter at least 10 characters describing how the loan will support the business."
          />
        </div>
        <div className="mt-5 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            id="loan-principal"
            label="Principal (GHS)"
            required
            min="1"
            step="0.01"
            type="number"
            value={principal}
            onChange={(event) => setPrincipal(event.target.value)}
          />
          <SelectField
            id="loan-term"
            label="Term"
            required
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          >
            {[1, 2, 3, 4, 5, 6].map((months) => (
              <option key={months} value={months}>
                {months} month{months > 1 ? "s" : ""}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="loan-frequency"
            label="Repayment frequency"
            required
            value={frequency}
            onChange={(event) =>
              setFrequency(event.target.value as LoanFrequency)
            }
          >
            <option value="WEEKLY">Weekly</option>
            <option value="FORTNIGHTLY">Fortnightly</option>
            <option value="MONTHLY">Monthly</option>
          </SelectField>
        </div>
        <p className="text-primary bg-primary/5 mt-5 rounded-lg p-4 text-sm">
          Interest is 20% flat on the original principal. The physical cash-out
          date anchors the final repayment schedule.
        </p>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-bold">Supporting documents</h2>
        <div className="mt-5">
          <TextareaField
            id="loan-documents"
            label="Private evidence references"
            rows={3}
            placeholder={"BUS-CUS-0132.pdf\nCONS-CUS-0132.pdf"}
            value={documents}
            onChange={(event) => setDocuments(event.target.value)}
            help="Enter one private document reference per line."
          />
        </div>
      </Card>

      {preview && (
        <Card className="overflow-hidden">
          <div className="border-border border-b p-4 sm:p-6">
            <h2 className="text-lg font-bold">Repayment schedule preview</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric
                label="Principal"
                value={formatGhsFromPesewas(
                  Math.round(Number(principal) * 100),
                )}
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
          </div>
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-background text-muted text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Instalment</th>
                  <th className="px-4 py-3 text-right">Principal</th>
                  <th className="px-4 py-3 text-right">Interest</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {preview.schedule.map((item) => (
                  <tr key={item.number}>
                    <td className="px-4 py-3">#{item.number}</td>
                    <td className="px-4 py-3 text-right">
                      {formatGhsFromPesewas(item.principalPesewas)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatGhsFromPesewas(item.interestPesewas)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatGhsFromPesewas(item.totalPesewas)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {error && (
        <Alert title="Application cannot continue" variant="danger">
          {error}
        </Alert>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          variant="secondary"
          loading={busy}
          disabled={!groupReady}
          className="w-full sm:w-auto"
        >
          Save draft
        </Button>
        <Button
          type="button"
          disabled={busy || !groupReady}
          onClick={() => void submit(true)}
          className="w-full sm:w-auto"
        >
          Submit for manager review
        </Button>
      </div>
    </form>
  );
}

function Readiness({
  label,
  value,
  valid,
}: {
  label: string;
  value: string;
  valid: boolean;
}) {
  return (
    <div>
      <dt className="text-muted text-xs uppercase">{label}</dt>
      <dd
        className={`mt-1 font-semibold ${valid ? "text-success" : "text-danger"}`}
      >
        {value}
      </dd>
    </div>
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
