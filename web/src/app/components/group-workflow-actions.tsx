"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function GroupWorkflowActions({
  groupId,
  status,
  ready,
  pendingReview,
  ownReview,
  canManage,
  canApprove,
  borrowers,
}: {
  groupId: string;
  status: string;
  ready: boolean;
  pendingReview: boolean;
  ownReview: boolean;
  canManage: boolean;
  canApprove: boolean;
  borrowers: readonly { id: string; label: string }[];
}) {
  const router = useRouter();
  const [action, setAction] = useState("");
  const [borrowerId, setBorrowerId] = useState(borrowers[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const actions: { value: string; label: string }[] = [];
  if (canManage) {
    actions.push(
      { value: "ADD_MEMBER", label: "Add member" },
      { value: "EXIT_MEMBER", label: "Exit member" },
    );
    if (status === "DRAFT" && ready && !pendingReview)
      actions.push({
        value: "REQUEST_ACTIVATION",
        label: "Request activation",
      });
  }
  if (canApprove && pendingReview && !ownReview)
    actions.push(
      { value: "APPROVE_ACTIVATION", label: "Approve activation" },
      { value: "REJECT_ACTIVATION", label: "Reject activation" },
    );
  async function submit() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, borrowerId, effectiveDate: date, reason }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Action failed.");
      return;
    }
    setAction("");
    setReason("");
    router.refresh();
  }
  return (
    <section className="border-border bg-surface rounded-xl border p-5">
      <h2 className="text-lg font-bold">Group workflow</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.value}
            onClick={() => setAction(a.value)}
            className="bg-primary min-h-10 rounded-lg px-3 text-sm font-bold text-white"
          >
            {a.label}
          </button>
        ))}
      </div>
      {ownReview && pendingReview && (
        <p className="text-danger mt-3 text-sm">
          A different manager must review this activation request.
        </p>
      )}
      {action && (
        <div className="bg-background mt-4 rounded-lg p-4">
          {["ADD_MEMBER", "EXIT_MEMBER"].includes(action) && (
            <>
              <select
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value)}
                className="control"
              >
                {borrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="control mt-3"
              />
            </>
          )}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (minimum 10 characters)"
            rows={3}
            className="control mt-3"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={submit}
              disabled={busy}
              className="bg-primary rounded-lg px-4 py-2 font-bold text-white"
            >
              {busy ? "Saving..." : "Confirm"}
            </button>
            <button
              onClick={() => setAction("")}
              className="border-border rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-danger mt-3 text-sm">{error}</p>}
    </section>
  );
}
