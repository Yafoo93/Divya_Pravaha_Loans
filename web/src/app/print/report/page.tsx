import {
  DocumentField,
  DocumentTable,
  PrintDocument,
} from "../../components/print/print-document";
import { PrintPage } from "../../components/print/print-button";
import { PermissionBoundary } from "../../components/server-permission-boundary";

export default function PrintableReportPage() {
  return (
    <Suspense fallback={<div className="p-8">Checking report access...</div>}>
      <PermissionBoundary
        permissions={[
          "manage_ledger",
          "read_financial_history",
          "read_exception_reports",
        ]}
      >
        <PrintPage>
          <PrintDocument
            title="Portfolio Summary Report"
            reference="RPT-PORTFOLIO-20261018"
            date="Reporting date: 18 Oct 2026"
          >
            <dl className="grid gap-5 sm:grid-cols-4">
              <DocumentField label="Branch" value="Kasoa Market" />
              <DocumentField label="Currency" value="GHS" />
              <DocumentField label="Active loans" value="248" />
              <DocumentField label="Past-due exposure" value="9.0%" />
            </dl>
            <h2 className="mt-8 mb-3 font-bold">Portfolio aging</h2>
            <DocumentTable
              headings={["Aging band", "Loans", "Principal exposure (GHS)"]}
              rows={[
                ["Current", "226", "436,800.00"],
                ["1–7 days", "12", "24,000.00"],
                ["8–30 days", "7", "14,400.00"],
                ["31+ days", "3", "4,800.00"],
              ]}
              total={["Total", "248", "480,000.00"]}
            />
            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="bg-background rounded-xl p-4">
                <p className="text-muted text-xs uppercase">
                  Collector custody
                </p>
                <p className="mt-1 text-xl font-bold">GHS 8,400.00</p>
              </div>
              <div className="bg-background rounded-xl p-4">
                <p className="text-muted text-xs uppercase">
                  Available funding
                </p>
                <p className="mt-1 text-xl font-bold">GHS 48,000.00</p>
              </div>
            </section>
          </PrintDocument>
        </PrintPage>
      </PermissionBoundary>
    </Suspense>
  );
}
import { Suspense } from "react";
