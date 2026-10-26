const BASIS_POINTS_DENOMINATOR = 10_000;
export const PRIVATE_CAPITAL_ANNUAL_RETURN_BPS = 6_000;

export function parseGhsToPesewas(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!/^\d+(\.\d{1,2})?$/.test(normalized))
    throw new Error("Enter a valid GHS amount with no more than two decimals.");
  const [cedis, decimals = ""] = normalized.split(".");
  const pesewas = Number(cedis) * 100 + Number(decimals.padEnd(2, "0"));
  if (!Number.isSafeInteger(pesewas) || pesewas <= 0)
    throw new Error("Amount must be greater than zero.");
  return pesewas;
}

function utcDay(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function calculatePrivateCapitalReturn(input: {
  principalPesewas: number;
  startDate: Date;
  throughDate: Date;
  maturityDate?: Date;
  annualReturnBps?: number;
}) {
  const principal = input.principalPesewas;
  const rate = input.annualReturnBps ?? PRIVATE_CAPITAL_ANNUAL_RETURN_BPS;
  if (!Number.isInteger(principal) || principal <= 0)
    throw new Error("Principal must be a positive integer number of pesewas.");
  if (rate !== PRIVATE_CAPITAL_ANNUAL_RETURN_BPS)
    throw new Error(
      "Private capital contracts use the approved 60% annual rate.",
    );

  const start = utcDay(input.startDate);
  const requestedThrough = utcDay(input.throughDate);
  const maturity = input.maturityDate
    ? utcDay(input.maturityDate)
    : requestedThrough;
  const through = requestedThrough < maturity ? requestedThrough : maturity;
  if (through <= start)
    return { days: 0, returnPesewas: 0, throughDate: through };

  let cursor = start;
  let days = 0;
  let unroundedPesewas = 0;
  while (cursor < through) {
    const yearBasis = isLeapYear(cursor.getUTCFullYear()) ? 366 : 365;
    unroundedPesewas +=
      (principal * rate) / BASIS_POINTS_DENOMINATOR / yearBasis;
    cursor = new Date(cursor.getTime() + 86_400_000);
    days += 1;
  }
  return {
    days,
    returnPesewas: Math.round(unroundedPesewas),
    throughDate: through,
  };
}

export function remainingInvestorBalances(input: {
  principalPesewas: number;
  principalRepaidPesewas: number;
  accruedReturnPesewas: number;
  returnPaidPesewas: number;
}) {
  return {
    principalDuePesewas: Math.max(
      0,
      input.principalPesewas - input.principalRepaidPesewas,
    ),
    returnDuePesewas: Math.max(
      0,
      input.accruedReturnPesewas - input.returnPaidPesewas,
    ),
  };
}
