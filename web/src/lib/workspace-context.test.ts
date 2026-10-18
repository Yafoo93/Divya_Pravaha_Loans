import { describe, expect, it } from "vitest";
import { formatAccraHeadingDate, prototypeManagers } from "./workspace-context";

describe("workspace display context", () => {
  it("formats heading dates in the Accra timezone", () => {
    expect(formatAccraHeadingDate(new Date("2026-10-18T12:00:00Z"))).toBe(
      "18 OCT 2026",
    );
  });

  it("provides the two requested prototype managers", () => {
    expect(prototypeManagers.map((manager) => manager.name)).toEqual([
      "Abdul Latif Kassim",
      "Tuahira Mahmud",
    ]);
    expect(
      prototypeManagers.every((manager) => manager.role === "MANAGER"),
    ).toBe(true);
  });
});
