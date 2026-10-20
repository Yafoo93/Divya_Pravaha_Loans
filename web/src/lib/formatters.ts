const ghsNumber = new Intl.NumberFormat("en-GH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatGhsFromPesewas(pesewas: number) {
  if (!Number.isInteger(pesewas))
    throw new Error("Money must be supplied as integer pesewas");
  return `GHS ${ghsNumber.format(pesewas / 100)}`;
}

export function formatAccraDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Accra",
  }).format(new Date(value));
}

export function formatAccraHeadingDate(value: Date | string) {
  return formatAccraDate(value).toUpperCase();
}

export function formatAccraLongDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Accra",
  }).format(new Date(value));
}

export function formatAccraDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Africa/Accra",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function toAccraDateInputValue(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Accra",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
