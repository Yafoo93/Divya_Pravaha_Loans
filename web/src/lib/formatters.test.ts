import { describe, expect, it } from "vitest";
import {
  formatAccraDate,
  formatAccraDateTime,
  formatAccraHeadingDate,
  formatAccraLongDate,
  formatGhsFromPesewas,
  toAccraDateInputValue,
} from "./formatters";

describe("Ghana presentation formatters", () => {
  it("formats integer pesewas with an explicit GHS currency label", () => {
    expect(formatGhsFromPesewas(1_234_567)).toBe("GHS 12,345.67");
    expect(formatGhsFromPesewas(0)).toBe("GHS 0.00");
  });

  it("rejects fractional minor units", () => {
    expect(() => formatGhsFromPesewas(10.5)).toThrow("integer pesewas");
  });

  it("always formats dates and times in Africa/Accra", () => {
    const instant = "2026-10-18T14:40:00Z";
    expect(formatAccraDate(instant)).toBe("18 Oct 2026");
    expect(formatAccraHeadingDate(instant)).toBe("18 OCT 2026");
    expect(formatAccraLongDate(instant)).toBe("Sunday, 18 October 2026");
    expect(formatAccraDateTime(instant)).toBe("18 Oct 2026, 14:40 GMT");
    expect(toAccraDateInputValue(instant)).toBe("2026-10-18");
  });
});
