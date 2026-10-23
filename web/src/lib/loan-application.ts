export const PRODUCT_CODE = "GROUP_FLAT_20";
export const PRODUCT_VERSION = 1;
export const CONTRACTUAL_INTEREST_RATE = 20;
export const MAXIMUM_TERM_MONTHS = 6;
export type LoanFrequency = "WEEKLY" | "FORTNIGHTLY" | "MONTHLY";

function isMonthEnd(date: Date) {
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return date.getUTCDate() === lastDay;
}

function addCalendarMonths(anchor: Date, months: number) {
  const targetMonth = anchor.getUTCMonth() + months;
  const lastDay = new Date(
    Date.UTC(anchor.getUTCFullYear(), targetMonth + 1, 0),
  ).getUTCDate();
  const day = isMonthEnd(anchor)
    ? lastDay
    : Math.min(anchor.getUTCDate(), lastDay);
  return new Date(Date.UTC(anchor.getUTCFullYear(), targetMonth, day, 12));
}

export function nextBusinessDay(date: Date) {
  const result = new Date(date);
  while (result.getUTCDay() === 0 || result.getUTCDay() === 6)
    result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

function contractualDueDate(
  anchor: Date,
  frequency: LoanFrequency,
  number: number,
) {
  if (frequency === "MONTHLY") return addCalendarMonths(anchor, number);
  const result = new Date(anchor);
  result.setUTCDate(
    result.getUTCDate() + number * (frequency === "WEEKLY" ? 7 : 14),
  );
  return result;
}

export function calculateLoanTerms(
  principalPesewas: number,
  termMonths: number,
  frequency: LoanFrequency = "MONTHLY",
  actualCashOutAt?: Date,
) {
  if (!Number.isInteger(principalPesewas) || principalPesewas <= 0)
    throw new Error("Principal must be greater than zero.");
  if (
    !Number.isInteger(termMonths) ||
    termMonths < 1 ||
    termMonths > MAXIMUM_TERM_MONTHS
  )
    throw new Error(
      `Term must be between one and ${MAXIMUM_TERM_MONTHS} months.`,
    );
  if (!["WEEKLY", "FORTNIGHTLY", "MONTHLY"].includes(frequency))
    throw new Error("Unsupported repayment frequency.");

  const interestPesewas = Math.round(
    principalPesewas * (CONTRACTUAL_INTEREST_RATE / 100),
  );
  const totalRepayablePesewas = principalPesewas + interestPesewas;
  const count =
    termMonths *
    (frequency === "WEEKLY" ? 4 : frequency === "FORTNIGHTLY" ? 2 : 1);
  const basePrincipal = Math.floor(principalPesewas / count);
  const baseInterest = Math.floor(interestPesewas / count);
  const schedule = Array.from({ length: count }, (_, index) => {
    const final = index === count - 1;
    const principalPart = final
      ? principalPesewas - basePrincipal * (count - 1)
      : basePrincipal;
    const interestPart = final
      ? interestPesewas - baseInterest * (count - 1)
      : baseInterest;
    const due = actualCashOutAt
      ? contractualDueDate(actualCashOutAt, frequency, index + 1)
      : undefined;
    return {
      number: index + 1,
      principalPesewas: principalPart,
      interestPesewas: interestPart,
      totalPesewas: principalPart + interestPart,
      contractualDueDate: due,
      effectiveCollectionDate: due ? nextBusinessDay(due) : undefined,
    };
  });
  return {
    interestPesewas,
    totalRepayablePesewas,
    instalments: schedule.map((item) => item.totalPesewas),
    schedule,
  };
}
