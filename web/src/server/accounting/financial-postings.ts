import "server-only";
import { randomUUID } from "node:crypto";
import {
  financialPostingLines,
  type FinancialPostingType,
  type PostingAmounts,
} from "@/lib/financial-posting-rules";
import { postBalancedJournal } from "./journal";

const descriptions: Record<FinancialPostingType, string> = {
  LOAN_DISBURSEMENT: "Post cash loan disbursement",
  INTEREST_ACCRUAL: "Post elapsed-term interest accrual",
  CASH_RECEIPT: "Post cash receipt principal and interest components",
  CUSTODY_TRANSFER: "Post verified cash-custody transfer",
  UNIDENTIFIED_CASH: "Post unidentified cash to suspense",
  CUSTOMER_OVERPAYMENT: "Post excess cash to customer-overpayment liability",
  JOINT_LIABILITY_CONTRIBUTION:
    "Post guarantor contribution against original borrower",
};

export function postFinancialEvent(input: {
  type: FinancialPostingType;
  sourceReference: string;
  entryDate: Date;
  branchId: string;
  actorUserId: string;
  amounts: PostingAmounts;
}) {
  if (!input.sourceReference.trim())
    throw new Error("A source reference is required.");
  return postBalancedJournal({
    journalNumber: `J-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
    description: descriptions[input.type],
    sourceEventType: input.type,
    sourceReference: input.sourceReference.trim(),
    entryDate: input.entryDate,
    branchId: input.branchId,
    actorUserId: input.actorUserId,
    lines: financialPostingLines(input.type, input.amounts),
  });
}
