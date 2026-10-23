export type JournalLineInput = {
  accountCode: string;
  debitPesewas: number;
  creditPesewas: number;
};

export function validateBalancedJournal(lines: readonly JournalLineInput[]) {
  if (lines.length < 2)
    throw new Error("A journal requires at least two lines.");
  let debits = 0;
  let credits = 0;
  for (const line of lines) {
    if (
      !Number.isSafeInteger(line.debitPesewas) ||
      !Number.isSafeInteger(line.creditPesewas) ||
      line.debitPesewas < 0 ||
      line.creditPesewas < 0
    )
      throw new Error("Journal money must be non-negative integer pesewas.");
    if (line.debitPesewas > 0 === line.creditPesewas > 0)
      throw new Error("Each line must contain either a debit or a credit.");
    debits += line.debitPesewas;
    credits += line.creditPesewas;
  }
  if (debits === 0 || debits !== credits)
    throw new Error("Journal debits and credits must balance.");
  return { debits, credits };
}

export function reversedLines(lines: readonly JournalLineInput[]) {
  return lines.map((line) => ({
    accountCode: line.accountCode,
    debitPesewas: line.creditPesewas,
    creditPesewas: line.debitPesewas,
  }));
}
