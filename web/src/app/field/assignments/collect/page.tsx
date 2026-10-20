import { MobileCashForm } from "../../../components/mobile-cash-form";
import { formatAccraLongDate } from "@/lib/formatters";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { requirePermission } from "@/server/auth/session";

export default async function MobileCashCollectionPage() {
  await requirePermission("record_cash_receipts", true);
  return (
    <main className="px-4 py-6">
      <p className="text-primary text-[10px] font-bold tracking-wider uppercase">
        {formatAccraLongDate(prototypeWorkspace.displayDate)} · GHS
      </p>
      <h1 className="mt-2 text-2xl font-bold">Capture cash receipt</h1>
      <p className="text-muted mt-2 text-sm">
        Confirm physical cash and preview its automatic allocation.
      </p>
      <div className="mt-6">
        <MobileCashForm />
      </div>
    </main>
  );
}
