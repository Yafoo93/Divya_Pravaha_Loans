import Link from "next/link";
import { db } from "@/lib/db";
import { formatAccraDateTime } from "@/lib/formatters";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { requireWorkspacePath } from "@/server/auth/session";
import { PageHeading } from "../../components/page-heading";
import { Badge, Card } from "../../components/ui/data-display";

const policySignOffs = [
  ["Maximum group size", "Management"],
  ["Accounting and credit-loss policy", "Accountant / Management"],
  ["Regulatory reporting and licensing", "Legal / Compliance"],
  ["Data-retention schedule", "Legal / Data Protection"],
  ["Privacy and consent review", "Legal / Compliance"],
  ["Joint-liability appeals procedure", "Legal / Management"],
] as const;

const investorGates = [
  "Private named contributors only",
  "No public solicitation",
  "Cleared-funds evidence required",
  "60% daily simple-return basis",
  "Principal repayment blocked before maturity",
  "Independent payout approval",
  "Principal and returns posted separately",
] as const;

const securityControls = [
  ["Named staff sessions", "ENFORCED"],
  ["Server-side role permissions", "ENFORCED"],
  ["Independent maker/checker", "ENFORCED"],
  ["Password hashing", "ENFORCED"],
  ["Append-only application audit", "ENFORCED"],
  ["Multi-factor authentication", "DEFERRED"],
] as const;

const outcomeVariant = {
  SUCCESS: "success",
  DENIED: "danger",
  FAILURE: "danger",
} as const;

function readable(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AdministrationPage() {
  await requireWorkspacePath("/workspace/administration");

  const [roles, users, auditEvents] = await Promise.all([
    db.role.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        permissions: true,
        restrictions: true,
        featureGate: true,
        isActive: true,
        _count: { select: { userRoles: { where: { effectiveTo: null } } } },
      },
    }),
    db.user.findMany({
      select: {
        id: true,
        name: true,
        roles: {
          where: { effectiveTo: null },
          select: { role: { select: { name: true } } },
        },
      },
    }),
    db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const activeRoles = roles.filter((role) => role.isActive).length;
  const gatedRoles = roles.filter((role) => role.featureGate).length;

  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          title="Administration, security and audit"
          description="Role boundaries, security controls, immutable activity, policy readiness, and investor activation gates."
          branchName={prototypeWorkspace.branch.name}
          date={new Date()}
          currency={prototypeWorkspace.currency}
        />

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Active roles"
            value={String(activeRoles)}
            detail={`${roles.length} configured roles`}
          />
          <SummaryCard
            label="Recent audit events"
            value={String(auditEvents.length)}
            detail="Latest append-only activity"
          />
          <SummaryCard
            label="Investor-gated roles"
            value={String(gatedRoles)}
            detail="Configured policy and control status"
            emphasized
          />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.7fr)]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <SectionHeading
                title="Roles and permission boundaries"
                description="Role assignments are effective-dated; System Admin has no financial authority by default."
                actionHref="/workspace/administration/roles"
                actionLabel="Manage roles"
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-3xl text-left text-sm">
                  <thead className="bg-background text-muted text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Permissions</th>
                      <th className="px-5 py-3">Restrictions / gate</th>
                      <th className="px-5 py-3 text-right">Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td className="px-5 py-4">
                          <p className="font-bold">{role.name}</p>
                          <p className="text-muted text-xs">{role.code}</p>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {role.permissions.map(readable).join(", ") ||
                            "No permissions"}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {role.featureGate ? (
                            <Badge variant="warning">
                              LOCKED · {readable(role.featureGate)}
                            </Badge>
                          ) : (
                            role.restrictions.map(readable).join(", ") || "None"
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-bold">
                          {role._count.userRoles}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <SectionHeading
                title="Append-only audit history"
                description="Authentication, permission, access, and administration events. No edit or delete action is exposed."
              />
              <div
                className="overflow-x-auto"
                tabIndex={0}
                aria-label="Audit history table"
              >
                <table className="w-full min-w-4xl text-left text-sm">
                  <thead className="bg-background text-muted text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3">Time</th>
                      <th className="px-5 py-3">Actor / role</th>
                      <th className="px-5 py-3">Event</th>
                      <th className="px-5 py-3">Record</th>
                      <th className="px-5 py-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {auditEvents.map((event) => {
                      const actor = event.actorUserId
                        ? usersById.get(event.actorUserId)
                        : undefined;
                      return (
                        <tr key={event.id}>
                          <td className="px-5 py-3 whitespace-nowrap tabular-nums">
                            {formatAccraDateTime(event.createdAt)}
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-semibold">
                              {event.actorName ??
                                actor?.name ??
                                "System / unidentified"}
                            </p>
                            <p className="text-muted text-xs">
                              {event.actorRole
                                ? readable(event.actorRole)
                                : actor?.roles
                                    .map(({ role }) => role.name)
                                    .join(", ") || "No recorded role"}
                            </p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-semibold">
                              {readable(event.eventType)}
                            </p>
                            <p className="text-muted text-xs">
                              {event.permission
                                ? readable(event.permission)
                                : event.reason
                                  ? readable(event.reason)
                                  : "—"}
                            </p>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs">
                            {event.resource ?? "—"}
                          </td>
                          <td className="px-5 py-3">
                            <Badge
                              variant={
                                outcomeVariant[
                                  event.outcome as keyof typeof outcomeVariant
                                ] ?? "neutral"
                              }
                            >
                              {event.outcome}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {auditEvents.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-muted px-5 py-10 text-center"
                        >
                          No audit events recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-border text-muted border-t px-5 py-4 text-xs">
                This application provides no audit-event update or deletion
                endpoint.
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg font-bold">Security controls</h2>
              <p className="text-muted mt-1 text-sm">
                Current enforcement state.
              </p>
              <div className="divide-border mt-4 divide-y">
                {securityControls.map(([label, state]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="text-sm font-semibold">{label}</span>
                    <Badge
                      variant={state === "ENFORCED" ? "success" : "warning"}
                    >
                      {state}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="bg-primary/5 text-primary mt-4 rounded-lg p-3 text-xs">
                System Administrators manage identity and security configuration
                only. Loan approval, cash posting, reversals, and other
                financial powers are not granted automatically.
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">
                  Baseline sign-off readiness
                </h2>
                <Badge variant="success">PRIVATE CAPITAL ACTIVE</Badge>
              </div>
              <p className="text-muted mt-1 text-sm">
                Current policy decisions and accountable owners.
              </p>
              <div className="divide-border mt-4 divide-y">
                {policySignOffs.map(([decision, owner]) => (
                  <div key={decision} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{decision}</p>
                      <Badge variant="success">APPROVED</Badge>
                    </div>
                    <p className="text-muted mt-1 text-xs">Owner: {owner}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Investor module</h2>
                <Badge variant="success">APPROVED</Badge>
              </div>
              <p className="text-muted mt-1 text-sm">
                Activated as an internal register for named owner, family, and
                other private business-support funds. Public investment
                solicitation is not supported. External legal and tax advice
                remains the owner&apos;s responsibility.
              </p>
              <div className="divide-border mt-4 divide-y">
                {investorGates.map((gate) => (
                  <div
                    key={gate}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="text-sm font-semibold">{gate}</span>
                    <Badge variant="success">ENFORCED</Badge>
                  </div>
                ))}
              </div>
              <Link
                href="/workspace/investors"
                className="bg-primary mt-4 flex min-h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-bold text-white"
              >
                Open private capital portfolio
              </Link>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  emphasized = false,
}: {
  label: string;
  value: string;
  detail: string;
  emphasized?: boolean;
}) {
  return (
    <Card className={`p-5 ${emphasized ? "bg-primary text-white" : ""}`}>
      <p className={`text-sm ${emphasized ? "text-blue-100" : "text-muted"}`}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p
        className={`mt-2 text-xs ${emphasized ? "text-blue-100" : "text-muted"}`}
      >
        {detail}
      </p>
    </Card>
  );
}

function SectionHeading({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b p-5">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-muted mt-1 text-sm">{description}</p>
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="text-primary hover:bg-primary/5 min-h-10 rounded-lg px-3 py-2 text-sm font-bold"
        >
          {actionLabel} →
        </Link>
      )}
    </div>
  );
}
