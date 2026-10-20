import { Suspense } from "react";
import {
  PrintDocument,
  DocumentField,
  DocumentTable,
} from "../../components/print/print-document";
import { PrintPage } from "../../components/print/print-button";
import { PermissionBoundary } from "../../components/server-permission-boundary";

export default function PrintableReceiptPage() {
  return (
    <Suspense fallback={<div className="p-8">Checking receipt access...</div>}>
      <PermissionBoundary
        permissions={[
          "record_cash_receipts",
          "post_reconciled_receipts",
          "read_financial_history",
        ]}
      >
        <PrintPage>
          <PrintDocument
            compact
            title="Cash Receipt"
            reference="RCT-20261016-0057"
            date="16 Oct 2026 · 14:40 GMT"
          >
            <dl className="grid grid-cols-2 gap-5">
              <DocumentField label="Received from" value="Abena Boateng" />
              <DocumentField label="Loan" value="LN-0204" />
              <DocumentField label="Group" value="Kasoa Market Circle" />
              <DocumentField label="Payment channel" value="Cash" />
            </dl>
            <div className="bg-primary/10 text-primary my-6 rounded-xl p-5 text-center">
              <p className="text-xs font-bold uppercase">Amount received</p>
              <p className="mt-1 text-3xl font-black">GHS 300.00</p>
            </div>
            <DocumentTable
              headings={["Allocation", "Amount (GHS)"]}
              rows={[
                ["Principal", "250.00"],
                ["Interest", "50.00"],
              ]}
              total={["Total", "300.00"]}
            />
            <p className="text-muted mt-5 text-xs">
              Issued by Kofi Asante · Collector custody · Borrower debt reduced
              at receipt issuance.
            </p>
          </PrintDocument>
        </PrintPage>
      </PermissionBoundary>
    </Suspense>
  );
}
