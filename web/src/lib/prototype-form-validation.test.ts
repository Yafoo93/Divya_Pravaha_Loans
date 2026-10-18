import { describe, expect, it } from "vitest";
import { validatePrototypeApplication } from "./prototype-form-validation";

describe("prototype form validation", () => {
  it("returns field-level errors for invalid values", () => {
    const errors = validatePrototypeApplication({
      legalName: "",
      phone: "0244",
      amount: "0",
      frequency: "",
      purpose: "",
      consent: false,
    });
    expect(Object.keys(errors)).toEqual([
      "legalName",
      "phone",
      "amount",
      "frequency",
      "purpose",
      "consent",
    ]);
  });

  it("accepts a valid sample application", () => {
    expect(
      validatePrototypeApplication({
        legalName: "Ama Mensah",
        phone: "+233244555123",
        amount: "10000",
        frequency: "MONTHLY",
        purpose: "Purchase grocery stock",
        consent: true,
      }),
    ).toEqual({});
  });
});
