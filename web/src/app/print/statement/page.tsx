import {
  DocumentField,
  DocumentTable,
  PrintDocument,
} from "../../components/print/print-document";
import { PrintPage } from "../../components/print/print-button";
import { PermissionBoundary } from "../../components/server-permission-boundary";

export default function PrintableStatementPage() {
  return (
    <Suspense
      fallback={<div className="p-8">Checking statement access...</div>}
    >
      <PermissionBoundary
        permissions={[
          "manage_borrower_drafts",
          "approve_or_reject_loans",
          "manage_ledger",
          "read_financial_history",
        ]}
      >
        <PrintPage>
          <PrintDocument
            title="Loan Statement"
            reference="LN-0204"
            date="Statement as at 18 Oct 2026"
          >
            <dl className="grid gap-5 sm:grid-cols-4">
              <DocumentField label="Borrower" value="Abena Boateng" />
              <DocumentField label="Original principal" value="GHS 10,000.00" />
              <DocumentField label="Contract interest" value="GHS 2,000.00" />
              <DocumentField label="Remaining balance" value="GHS 2,000.00" />
            </dl>
            <h2 className="mt-8 mb-3 font-bold">Repayment activity</h2>
            <DocumentTable
              headings={[
                "Date",
                "Reference",
                "Principal",
                "Interest",
                "Received",
              ]}
              rows={[
                [
                  "30 Jun 2026",
                  "RCT-20260630-0112",
                  "1,666.67",
                  "333.33",
                  "2,000.00",
                ],
                [
                  "30 Jul 2026",
                  "RCT-20260730-0272",
                  "1,666.67",
                  "333.33",
                  "2,000.00",
                ],
                [
                  "31 Aug 2026",
                  "RCT-20260831-0351",
                  "1,666.67",
                  "333.33",
                  "2,000.00",
                ],
                [
                  "30 Sep 2026",
                  "RCT-20260930-0428",
                  "1,666.67",
                  "333.33",
                  "2,000.00",
                ],
              ]}
              total={["", "Total received", "6,666.68", "1,333.32", "8,000.00"]}
            />
            <p className="text-muted mt-5 text-xs">
              Contractual balances are separate from accrued accounting income.
              This statement contains fictional demonstration data.
            </p>
          </PrintDocument>
        </PrintPage>
      </PermissionBoundary>
    </Suspense>
  );
}
import { Suspense } from "react";
