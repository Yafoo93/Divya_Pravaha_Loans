export function daysPastDue(effectiveDueDate: Date, asOf: Date) {
  const due = Date.UTC(
    effectiveDueDate.getUTCFullYear(),
    effectiveDueDate.getUTCMonth(),
    effectiveDueDate.getUTCDate(),
  );
  const today = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate(),
  );
  return Math.max(0, Math.floor((today - due) / 86_400_000));
}

export function isImmediatelyPastDue(
  effectiveDueDate: Date,
  asOf: Date,
  unpaidPesewas: number,
) {
  return unpaidPesewas > 0 && daysPastDue(effectiveDueDate, asOf) > 0;
}

export function allocateJointLiability(
  unpaidPesewas: number,
  guarantorBorrowerIds: readonly string[],
) {
  if (!Number.isSafeInteger(unpaidPesewas) || unpaidPesewas <= 0)
    throw new Error("Eligible unpaid amount must be positive integer pesewas.");
  const ids = [...new Set(guarantorBorrowerIds)].sort((a, b) =>
    a.localeCompare(b),
  );
  if (ids.length === 0)
    throw new Error("At least one eligible frozen guarantor is required.");
  const base = Math.floor(unpaidPesewas / ids.length);
  const remainder = unpaidPesewas % ids.length;
  return ids.map((guarantorBorrowerId, index) => ({
    guarantorBorrowerId,
    sequence: index + 1,
    assessedPesewas: base + (index < remainder ? 1 : 0),
  }));
}
