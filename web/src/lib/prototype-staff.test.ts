import { describe, expect, it } from "vitest";
import { filterPrototypeStaff, prototypeStaff } from "./prototype-staff";

describe("prototype staff directory", () => {
  it("contains the two requested active managers", () => {
    expect(
      prototypeStaff
        .filter(
          (record) => record.role === "MANAGER" && record.state === "ACTIVE",
        )
        .map((record) => record.name),
    ).toEqual(["Abdul Latif Kassim", "Tuahira Mahmud"]);
  });

  it("combines text, role, and activation filters", () => {
    expect(
      filterPrototypeStaff(prototypeStaff, "Tuahira", "MANAGER", "ACTIVE").map(
        (record) => record.id,
      ),
    ).toEqual(["STF-0002"]);
    expect(
      filterPrototypeStaff(prototypeStaff, "", "ALL", "SUSPENDED"),
    ).toHaveLength(2);
  });
});
