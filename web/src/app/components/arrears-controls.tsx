"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "./ui/actions";
import { TextareaField } from "./ui/forms";

async function act(id: string, body: object) {
  const response = await fetch(`/api/arrears/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    ok: response.ok,
    ...((await response.json()) as { error?: string }),
  };
}

export function ArrearsDecisionForm({ id }: { id: string }) {
  const router = useRouter();
  const [reason, setReason] = useState(
    "Frozen guarantors verified; notice evidence reviewed before collection approval.",
  );
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  async function submit(action: "APPROVE" | "REJECT") {
    setWorking(true);
    const result = await act(id, { action, reason });
    if (!result.ok) {
      setError(result.error ?? "Decision failed.");
      setWorking(false);
    } else router.refresh();
  }
  return (
    <div className="space-y-3">
      <TextareaField
        id="arrears-decision"
        label="Manager decision reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        required
      />
      {error && (
        <Alert title="Decision not recorded" variant="danger">
          {error}
        </Alert>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          disabled={working}
          onClick={() => submit("APPROVE")}
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={working}
          onClick={() => submit("REJECT")}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

export function DisputeForm({ id }: { id: string }) {
  const router = useRouter();
  const [complaint, setComplaint] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await act(id, { action: "DISPUTE", complaint });
    if (!result.ok) setError(result.error ?? "Dispute failed.");
    else router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <TextareaField
        id="arrears-dispute"
        label="Notice or assessment dispute"
        value={complaint}
        onChange={(event) => setComplaint(event.target.value)}
        placeholder="Record the complaint without silently changing financial evidence."
        required
      />
      {error && (
        <Alert title="Dispute not recorded" variant="danger">
          {error}
        </Alert>
      )}
      <Button type="submit" variant="secondary" className="w-full">
        Record dispute
      </Button>
    </form>
  );
}

export function CollectContributionButton({
  arrearId,
  contributionId,
}: {
  arrearId: string;
  contributionId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  async function collect() {
    setWorking(true);
    const result = await act(arrearId, { action: "COLLECT", contributionId });
    if (!result.ok) {
      setError(result.error ?? "Collection failed.");
      setWorking(false);
    } else router.refresh();
  }
  return (
    <div>
      {error && <p className="text-danger mb-2 text-xs font-bold">{error}</p>}
      <Button
        type="button"
        disabled={working}
        onClick={collect}
        className="min-h-10"
      >
        {working ? "Posting..." : "Collect contribution"}
      </Button>
    </div>
  );
}
