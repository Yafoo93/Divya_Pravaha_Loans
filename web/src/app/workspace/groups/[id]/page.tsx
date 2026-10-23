import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";
import { db } from "@/lib/db";
import { formatAccraDate, formatAccraDateTime } from "@/lib/formatters";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { andBranchScope, requireBranchScope } from "@/server/auth/branch-scope";
import { requireWorkspacePath } from "@/server/auth/session";
import { GroupWorkflowActions } from "../../../components/group-workflow-actions";
import { GroupEditForm } from "../../../components/group-edit-form";
import { PageHeading } from "../../../components/page-heading";
import { Badge, Card, DataTable } from "../../../components/ui/data-display";
export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireWorkspacePath("/workspace/groups");
  const scope = await requireBranchScope(session);
  const { id } = await params;
  const group = await db.borrowerGroup.findFirst({
    where: andBranchScope(scope, { OR: [{ id }, { groupNumber: id }] }),
    include: {
      branch: true,
      officer: true,
      memberships: {
        orderBy: { joinedAt: "asc" },
        include: {
          borrower: {
            include: {
              verifications: { where: { status: "VERIFIED" }, take: 1 },
            },
          },
        },
      },
      loans: { select: { id: true } },
      snapshots: { orderBy: { capturedAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      membershipChanges: {
        orderBy: { effectiveDate: "desc" },
        include: { recordedBy: true },
      },
      activationReviews: {
        orderBy: { requestedAt: "desc" },
        include: { requestedBy: true, decidedBy: true },
      },
      agreements: { orderBy: { version: "desc" } },
      visits: { orderBy: { visitedAt: "desc" }, include: { officer: true } },
      statusEvents: {
        orderBy: { effectiveAt: "desc" },
        include: { recordedBy: true },
      },
    },
  });
  if (!group) notFound();
  const active = group.memberships.filter((m) => m.status === "ACTIVE");
  const ready =
    active.length >= 5 &&
    active.every(
      (m) => m.hasConsented && m.borrower.verifications.length > 0,
    ) &&
    group.agreements.some(
      (agreement) => agreement.status === "SIGNED" && agreement.signedAt,
    );
  const candidates = await db.borrower.findMany({
    where: { branchId: group.branchId, status: "ACTIVE" },
    orderBy: { legalName: "asc" },
    select: { id: true, legalName: true, customerId: true },
  });
  const officers = await db.user.findMany({
    where: {
      status: "ACTIVE",
      branchAssignments: {
        some: { branchId: group.branchId, effectiveTo: null },
      },
      roles: {
        some: {
          effectiveTo: null,
          role: { code: { in: ["MANAGER", "LOAN_OFFICER"] } },
        },
      },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const latestReview = group.activationReviews[0];
  const canManage = canPerformPermission(
    session.user.permissions,
    session.user.restrictions,
    "manage_groups",
    session.user.featureGate,
    true,
    session.user.role,
  );
  const canApprove = canPerformPermission(
    session.user.permissions,
    session.user.restrictions,
    "approve_exceptions",
    session.user.featureGate,
    true,
    session.user.role,
  );
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title={group.name}
          description={`${group.groupNumber} · Membership, evidence, activation, and effective-dated history.`}
          branchName={group.branch.name}
          date={new Date()}
          currency="GHS"
          actions={
            <Link
              href="/workspace/groups"
              className="border-border rounded-lg border px-4 py-3 text-sm font-bold"
            >
              Back to groups
            </Link>
          }
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <Summary label="Status" value={group.status} />
          <Summary label="Active members" value={String(active.length)} />
          <Summary
            label="Officer"
            value={group.officer?.name ?? "Unassigned"}
          />
          <Summary label="Readiness" value={ready ? "READY" : "NOT READY"} />
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Table
              title="Membership"
              columns={[
                { key: "member", label: "Member" },
                { key: "status", label: "Status" },
                { key: "joined", label: "Joined effective" },
                { key: "exited", label: "Exited effective" },
                { key: "consent", label: "Consent" },
              ]}
              rows={group.memberships.map((m) => ({
                id: m.id,
                cells: {
                  member: (
                    <div>
                      <p className="font-bold">{m.borrower.legalName}</p>
                      <p className="text-muted text-xs">
                        {m.borrower.customerId}
                      </p>
                    </div>
                  ),
                  status: (
                    <Badge
                      variant={m.status === "ACTIVE" ? "success" : "neutral"}
                    >
                      {m.status}
                    </Badge>
                  ),
                  joined: formatAccraDate(m.joinedAt),
                  exited: m.exitedAt ? formatAccraDate(m.exitedAt) : "—",
                  consent: m.hasConsented ? "Recorded" : "Missing",
                },
              }))}
            />
            <Table
              title="Effective-dated membership history"
              columns={[
                { key: "date", label: "Effective date" },
                { key: "action", label: "Action" },
                { key: "borrower", label: "Borrower ID" },
                { key: "reason", label: "Reason" },
                { key: "actor", label: "Recorded by" },
              ]}
              rows={group.membershipChanges.map((e) => ({
                id: e.id,
                cells: {
                  date: formatAccraDate(e.effectiveDate),
                  action: e.action,
                  borrower: e.borrowerId,
                  reason: e.reason,
                  actor: e.recordedBy.name,
                },
              }))}
            />
            <Table
              title="Frozen snapshots"
              columns={[
                { key: "number", label: "Snapshot" },
                { key: "date", label: "Captured" },
                { key: "reason", label: "Reason" },
                { key: "members", label: "Members" },
              ]}
              rows={group.snapshots.map((s) => ({
                id: s.id,
                cells: {
                  number: s.snapshotNumber,
                  date: formatAccraDateTime(s.capturedAt),
                  reason: s.reason,
                  members: String(s.memberIds.length),
                },
              }))}
            />
            <Table
              title="Group visits"
              columns={[
                { key: "date", label: "Visit date" },
                { key: "purpose", label: "Purpose" },
                { key: "outcome", label: "Outcome" },
                { key: "officer", label: "Officer" },
              ]}
              rows={group.visits.map((visit) => ({
                id: visit.id,
                cells: {
                  date: formatAccraDateTime(visit.visitedAt),
                  purpose: visit.purpose,
                  outcome: visit.outcome,
                  officer: visit.officer.name,
                },
              }))}
            />
            <Table
              title="Group status history"
              columns={[
                { key: "date", label: "Effective" },
                { key: "change", label: "Status change" },
                { key: "reason", label: "Reason" },
                { key: "actor", label: "Recorded by" },
              ]}
              rows={group.statusEvents.map((event) => ({
                id: event.id,
                cells: {
                  date: formatAccraDateTime(event.effectiveAt),
                  change: `${event.fromStatus ?? "Created"} → ${event.toStatus}`,
                  reason: event.reason,
                  actor: event.recordedBy.name,
                },
              }))}
            />
          </div>
          <aside className="space-y-6">
            {canManage && (
              <Card className="p-5">
                <h2 className="font-bold">Manage group</h2>
                <p className="text-muted mt-1 text-sm">
                  Update group details or suspend future activity without
                  deleting history.
                </p>
                <GroupEditForm
                  groupId={group.groupNumber}
                  name={group.name}
                  officerId={group.officerId ?? officers[0]?.id ?? ""}
                  officers={officers}
                  status={group.status}
                />
              </Card>
            )}
            <GroupWorkflowActions
              groupId={group.groupNumber}
              status={group.status}
              ready={ready}
              pendingReview={latestReview?.status === "PENDING"}
              ownReview={latestReview?.requestedByUserId === session.user.id}
              canManage={canManage}
              canApprove={canApprove}
              borrowers={candidates.map((b) => ({
                id: b.id,
                label: `${b.legalName} · ${b.customerId}`,
              }))}
            />
            <Card className="p-5">
              <h2 className="font-bold">Agreement & documents</h2>
              <p className="text-muted mt-3 text-sm">
                {group.jointLiabilityReference}
              </p>
              {group.agreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="border-border mt-3 border-t pt-3 text-sm"
                >
                  <p className="font-bold">Agreement v{agreement.version}</p>
                  <p className="text-muted">
                    {agreement.agreementNumber} · {agreement.status} ·{" "}
                    {agreement.signedAt
                      ? formatAccraDate(agreement.signedAt)
                      : "Not signed"}
                  </p>
                </div>
              ))}
              {group.documents.map((d) => (
                <div
                  key={d.id}
                  className="border-border mt-3 border-t pt-3 text-sm"
                >
                  <p className="font-bold">{d.type.replaceAll("_", " ")}</p>
                  <p className="text-muted">
                    {d.documentNumber} · v{d.version} · {d.status}
                  </p>
                </div>
              ))}
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Activation reviews</h2>
              {group.activationReviews.length === 0 ? (
                <p className="text-muted mt-3 text-sm">No review submitted.</p>
              ) : (
                group.activationReviews.map((r) => (
                  <div
                    key={r.id}
                    className="border-border mt-3 border-t pt-3 text-sm"
                  >
                    <Badge
                      variant={
                        r.status === "APPROVED"
                          ? "success"
                          : r.status === "PENDING"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {r.status}
                    </Badge>
                    <p className="mt-2">{r.requestReason}</p>
                    <p className="text-muted mt-1">
                      Requested by {r.requestedBy.name}
                    </p>
                    {r.decisionReason && (
                      <p className="mt-2">
                        Decision: {r.decisionReason} · {r.decidedBy?.name}
                      </p>
                    )}
                  </div>
                ))
              )}
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-muted text-sm">{label}</p>
      <p className="mt-2 font-bold">{value}</p>
    </Card>
  );
}
function Table({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: { key: string; label: string }[];
  rows: { id: string; cells: Record<string, React.ReactNode> }[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-border border-b p-5">
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <DataTable columns={columns} rows={rows} emptyMessage="No records." />
    </Card>
  );
}
