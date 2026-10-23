import { describe, expect, it } from "vitest";
import {
  allocateJointLiability,
  daysPastDue,
  isImmediatelyPastDue,
} from "./arrears-rules";

describe("arrears and joint liability", () => {
  it("starts arrears immediately after the effective due date with zero grace", () => {
    const due = new Date("2026-10-09T00:00:00Z");
    expect(
      isImmediatelyPastDue(due, new Date("2026-10-09T23:00:00Z"), 100),
    ).toBe(false);
    expect(
      isImmediatelyPastDue(due, new Date("2026-10-10T00:00:00Z"), 100),
    ).toBe(true);
    expect(daysPastDue(due, new Date("2026-10-16T00:00:00Z"))).toBe(7);
  });

  it("divides equally and gives remainder pesewas to ascending member IDs", () => {
    expect(
      allocateJointLiability(100, ["member-c", "member-a", "member-b"]),
    ).toEqual([
      { guarantorBorrowerId: "member-a", sequence: 1, assessedPesewas: 34 },
      { guarantorBorrowerId: "member-b", sequence: 2, assessedPesewas: 33 },
      { guarantorBorrowerId: "member-c", sequence: 3, assessedPesewas: 33 },
    ]);
  });
});
