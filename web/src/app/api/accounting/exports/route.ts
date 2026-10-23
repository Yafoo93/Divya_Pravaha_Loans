import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canPerformPermission } from "@/lib/workspace-authorization";
import { requireBranchScope } from "@/server/auth/branch-scope";
import { getServerSession } from "@/server/auth/session";

const csv = (rows: (string | number | Date | null)[][]) =>
  rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\r\n");

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const allowed = ["manage_ledger", "read_financial_history"].some(
    (permission) =>
      canPerformPermission(
        session.user.permissions,
        session.user.restrictions,
        permission,
        session.user.featureGate,
        true,
        session.user.role,
      ),
  );
  if (!allowed)
    return NextResponse.json(
      { error: "Financial reporting permission is required." },
      { status: 403 },
    );
  const scope = await requireBranchScope(session);
  const table = request.nextUrl.searchParams.get("table") ?? "journals";
  let rows: (string | number | Date | null)[][];
  if (table === "journals") {
    const data = await db.journalEntry.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
      include: { lines: { include: { account: true } } },
      orderBy: { entryDate: "asc" },
    });
    rows = [
      [
        "journal",
        "date",
        "source_type",
        "source_reference",
        "account",
        "debit_pesewas",
        "credit_pesewas",
        "status",
      ],
      ...data.flatMap((journal) =>
        journal.lines.map((line) => [
          journal.journalNumber,
          journal.entryDate,
          journal.sourceEventType,
          journal.sourceReference,
          `${line.account.code} ${line.account.name}`,
          line.debitPesewas,
          line.creditPesewas,
          journal.status,
        ]),
      ),
    ];
  } else if (table === "loans") {
    const data = await db.loan.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
      include: { borrower: true },
      orderBy: { loanNumber: "asc" },
    });
    rows = [
      [
        "loan",
        "borrower",
        "status",
        "principal_pesewas",
        "interest_pesewas",
        "total_repayable_pesewas",
        "disbursed_at",
      ],
      ...data.map((item) => [
        item.loanNumber,
        item.borrower.legalName,
        item.status,
        item.principalPesewas,
        item.contractualInterest,
        item.totalRepayablePesewas,
        item.disbursedAt,
      ]),
    ];
  } else if (table === "receipts") {
    const data = await db.receipt.findMany({
      where: { branchId: { in: [...scope.branchIds] } },
      include: { borrower: true },
      orderBy: { receivedAt: "asc" },
    });
    rows = [
      [
        "receipt",
        "borrower",
        "amount_pesewas",
        "principal_pesewas",
        "interest_pesewas",
        "status",
        "received_at",
      ],
      ...data.map((item) => [
        item.receiptNumber,
        item.borrower.legalName,
        item.amountPesewas,
        item.principalAllocatedPesewas,
        item.interestAllocatedPesewas,
        item.status,
        item.receivedAt,
      ]),
    ];
  } else if (table === "arrears") {
    const data = await db.arrear.findMany({
      where: { loan: { branchId: { in: [...scope.branchIds] } } },
      include: { borrower: true, loan: true },
      orderBy: { effectiveDueDate: "asc" },
    });
    rows = [
      [
        "assessment",
        "loan",
        "borrower",
        "effective_due",
        "days_past_due",
        "unpaid_pesewas",
        "status",
      ],
      ...data.map((item) => [
        item.assessmentNumber,
        item.loan.loanNumber,
        item.borrower.legalName,
        item.effectiveDueDate,
        item.daysPastDue,
        item.unpaidAmountPesewas,
        item.status,
      ]),
    ];
  } else
    return NextResponse.json(
      { error: "Unsupported export table." },
      { status: 400 },
    );
  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${table}.csv"`,
    },
  });
}
