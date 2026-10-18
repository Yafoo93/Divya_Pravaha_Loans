import {
  DocumentField,
  PrintDocument,
  SignatureLine,
} from "../../components/print/print-document";
import { PrintPage } from "../../components/print/print-button";

export default function PrintableVoucherPage() {
  return (
    <PrintPage>
      <PrintDocument
        title="Cash Disbursement Voucher"
        reference="CV-20261016-0268"
        date="16 Oct 2026"
      >
        <dl className="grid gap-5 sm:grid-cols-3">
          <DocumentField label="Beneficiary" value="Akuosa Addo" />
          <DocumentField label="Customer ID" value="CUS-0132" />
          <DocumentField label="Loan" value="LN-0268" />
          <DocumentField label="Funding lot" value="CAP-001" />
          <DocumentField label="Payment method" value="Physical cash" />
          <DocumentField label="Amount" value="GHS 10,000.00" />
        </dl>
        <section className="border-border mt-8 rounded-xl border p-5">
          <h2 className="font-bold">Authorization statement</h2>
          <p className="text-muted mt-2 text-sm">
            Cash release is supported by approved loan terms, verified funding
            reservation, beneficiary confirmation, and independent Manager
            authorization.
          </p>
        </section>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <SignatureLine label="Beneficiary signature" />
          <SignatureLine label="Prepared by · Cashier" />
          <SignatureLine label="Authorized by · Manager" />
        </div>
      </PrintDocument>
    </PrintPage>
  );
}
