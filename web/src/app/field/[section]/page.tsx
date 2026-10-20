import { notFound } from "next/navigation";
import Link from "next/link";
import { fieldNavigation } from "@/lib/field-navigation";
import { formatAccraLongDate } from "@/lib/formatters";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { requirePermission } from "@/server/auth/session";

export function generateStaticParams() {
  return fieldNavigation.map((item) => ({
    section: item.href.split("/").at(-1),
  }));
}

const descriptions: Record<string, string> = {
  assignments: "Your collection route and borrower stops for today.",
  receipts: "Cash receipts captured during your assigned route.",
  handover: "Prepare collected cash for independent cashier verification.",
  account: "Collector identity, branch assignment, and session details.",
};

export default async function FieldSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const item = fieldNavigation.find(
    (entry) => entry.href === `/field/${section}`,
  );
  if (!item) notFound();
  const requiredPermission =
    section === "handover" ? "submit_cash_handovers" : "view_assignments";
  await requirePermission(requiredPermission, section === "handover");

  return (
    <main className="px-4 py-6">
      <p className="text-primary text-[10px] font-bold tracking-wider uppercase">
        {formatAccraLongDate(prototypeWorkspace.displayDate)} · GHS
      </p>
      <h1 className="mt-2 text-2xl font-bold">{item.label}</h1>
      <p className="text-muted mt-2 text-sm">{descriptions[section]}</p>
      <section className="border-border bg-surface mt-6 rounded-2xl border p-5 shadow-sm">
        <p className="text-sm font-bold">Mobile workspace ready</p>
        <p className="text-muted mt-2 text-sm">
          The detailed {item.label.toLowerCase()} workflow will be added in its
          dedicated checklist stage.
        </p>
        {section === "assignments" && (
          <Link
            href="/field/assignments/collect"
            className="bg-primary hover:bg-primary-hover mt-5 flex min-h-14 w-full items-center justify-center rounded-xl px-4 text-base font-bold text-white"
          >
            Open sample cash form
          </Link>
        )}
      </section>
    </main>
  );
}
