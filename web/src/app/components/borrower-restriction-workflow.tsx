"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatAccraDateTime } from "@/lib/formatters";
import type { RestrictionAction } from "@/lib/borrower-restriction";
import { Badge, Card } from "./ui/data-display";

export type RestrictionWorkflowRecord = {
  id: string;
  restrictionNumber: string;
  reason: string;
  status: string;
  restrictedAt: string;
  restrictedBy: string;
  decisions: {
    id: string;
    decisionNumber: string;
    requestReason: string;
    status: string;
    requestedAt: string;
    requestedBy: string;
    requestedByUserId: string;
    decisionReason: string | null;
    decidedAt: string | null;
    decidedBy: string | null;
  }[];
};

export function BorrowerRestrictionWorkflow({
  borrowerId,
  borrowerStatus,
  records,
  canManage,
  canApprove,
  currentUserId,
}: {
  borrowerId: string;
  borrowerStatus: "ACTIVE" | "RESTRICTED";
  records: readonly RestrictionWorkflowRecord[];
  canManage: boolean;
  canApprove: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState<RestrictionAction | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = records[0];
  const currentDecision = current?.decisions[0];
  const pending = current?.status === "REACTIVATION_PENDING";
  const isOwnRequest = currentDecision?.requestedByUserId === currentUserId;

  async function submit() {
    if (!action) return;
    if (reason.trim().length < 10) {
      setError("Provide a reason of at least 10 characters.");
      return;
    }
    const destructive =
      action === "RESTRICT" || action === "REJECT_REACTIVATION";
    if (
      destructive &&
      !window.confirm(
        action === "RESTRICT"
          ? "Restrict this borrower and block new lending activity?"
          : "Reject this reactivation request and keep the borrower restricted?",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `/api/borrowers/${encodeURIComponent(borrowerId)}/restrictions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, reason }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The action failed.");
      setSuccess(
        action === "RESTRICT"
          ? "Borrower restricted."
          : action === "REQUEST_REACTIVATION"
            ? "Reactivation request submitted for independent manager review."
            : action === "APPROVE_REACTIVATION"
              ? "Reactivation approved."
              : "Reactivation rejected.",
      );
      setAction(null);
      setReason("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The action failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  const availableActions: {
    action: RestrictionAction;
    label: string;
    danger?: boolean;
  }[] = [];
  if (borrowerStatus === "ACTIVE" && canManage) {
    availableActions.push({
      action: "RESTRICT",
      label: "Restrict borrower",
      danger: true,
    });
  }
  if (
    borrowerStatus === "RESTRICTED" &&
    canManage &&
    current &&
    ["ACTIVE", "REACTIVATION_REJECTED"].includes(current.status)
  ) {
    availableActions.push({
      action: "REQUEST_REACTIVATION",
      label: "Request reactivation",
    });
  }
  if (pending && canApprove && !isOwnRequest) {
    availableActions.push(
      { action: "APPROVE_REACTIVATION", label: "Approve reactivation" },
      { action: "REJECT_REACTIVATION", label: "Reject request", danger: true },
    );
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Restriction workflow</h2>
          <p className="text-muted mt-1 text-sm">
            Document restrictions and obtain independent manager approval before
            reactivation.
          </p>
        </div>
        <Badge variant={borrowerStatus === "ACTIVE" ? "success" : "danger"}>
          {borrowerStatus}
        </Badge>
      </div>

      {pending && (
        <div className="border-warning/30 bg-warning/5 mt-4 rounded-lg border p-4 text-sm">
          <p className="font-bold">Manager decision pending</p>
          <p className="text-muted mt-1">
            Requested by {currentDecision?.requestedBy} on{" "}
            {currentDecision
              ? formatAccraDateTime(currentDecision.requestedAt)
              : "unknown date"}
            .
          </p>
          {isOwnRequest && canApprove && (
            <p className="text-danger mt-2 font-semibold">
              You cannot decide your own request. A different manager must
              review it.
            </p>
          )}
        </div>
      )}

      {availableActions.length > 0 && (
        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            {availableActions.map((item) => (
              <button
                key={item.action}
                type="button"
                onClick={() => {
                  setAction(item.action);
                  setError(null);
                  setSuccess(null);
                }}
                className={`min-h-11 rounded-lg px-4 text-sm font-bold transition ${
                  item.danger
                    ? "bg-danger text-white hover:opacity-90"
                    : "bg-primary text-white hover:opacity-90"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {action && (
            <div className="border-border bg-background mt-4 rounded-lg border p-4">
              <label htmlFor="restriction-reason" className="text-sm font-bold">
                {action === "RESTRICT"
                  ? "Restriction reason"
                  : action === "REQUEST_REACTIVATION"
                    ? "Reactivation justification"
                    : "Manager decision reason"}
              </label>
              <textarea
                id="restriction-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                maxLength={500}
                disabled={busy}
                className="border-border bg-surface focus:border-primary focus:ring-primary/20 mt-2 w-full rounded-lg border p-3 text-sm outline-none focus:ring-4 disabled:opacity-60"
                placeholder="Record clear evidence and reasoning (10-500 characters)."
              />
              <p className="text-muted mt-1 text-xs">
                {reason.length}/500 characters
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="bg-primary min-h-11 rounded-lg px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                  {busy ? "Saving..." : "Confirm action"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAction(null);
                    setReason("");
                  }}
                  disabled={busy}
                  className="border-border bg-surface min-h-11 rounded-lg border px-4 text-sm font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="bg-danger/10 text-danger mt-4 rounded-lg p-3 text-sm font-semibold"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="bg-success/10 text-success mt-4 rounded-lg p-3 text-sm font-semibold"
        >
          {success}
        </p>
      )}

      <div className="border-border mt-6 border-t pt-5">
        <h3 className="font-bold">Restriction history</h3>
        {records.length === 0 ? (
          <p className="text-muted mt-3 text-sm">
            No restrictions have been recorded.
          </p>
        ) : (
          <ol className="mt-4 space-y-4">
            {records.map((record) => (
              <li
                key={record.id}
                className="border-border rounded-lg border p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{record.restrictionNumber}</p>
                    <p className="text-muted text-xs">
                      Restricted by {record.restrictedBy} -{" "}
                      {formatAccraDateTime(record.restrictedAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      record.status === "REACTIVATED"
                        ? "success"
                        : record.status === "REACTIVATION_PENDING"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {record.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <p className="mt-3">
                  <span className="font-semibold">Restriction:</span>{" "}
                  {record.reason}
                </p>
                {record.decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="border-border mt-3 border-t pt-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{decision.decisionNumber}</p>
                      <Badge
                        variant={
                          decision.status === "APPROVED"
                            ? "success"
                            : decision.status === "PENDING"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {decision.status}
                      </Badge>
                    </div>
                    <p className="mt-2">
                      <span className="font-semibold">Request:</span>{" "}
                      {decision.requestReason}
                    </p>
                    <p className="text-muted mt-1 text-xs">
                      Requested by {decision.requestedBy} -{" "}
                      {formatAccraDateTime(decision.requestedAt)}
                    </p>
                    {decision.decisionReason && (
                      <p className="mt-2">
                        <span className="font-semibold">Decision:</span>{" "}
                        {decision.decisionReason}
                      </p>
                    )}
                    {decision.decidedBy && decision.decidedAt && (
                      <p className="text-muted mt-1 text-xs">
                        Decided by {decision.decidedBy} -{" "}
                        {formatAccraDateTime(decision.decidedAt)}
                      </p>
                    )}
                  </div>
                ))}
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
