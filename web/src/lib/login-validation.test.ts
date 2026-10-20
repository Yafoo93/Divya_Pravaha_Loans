import { describe, expect, it } from "vitest";
import { validateLogin } from "./login-validation";

describe("staff login form", () => {
  it("requires a valid email and password", () => {
    expect(validateLogin({ email: "invalid", password: "short" })).toEqual({
      email: "Enter a valid email address.",
      password: "Password must contain at least 8 characters.",
    });
  });

  it("accepts a well-formed form for later server authentication", () => {
    expect(
      validateLogin({
        email: "abdul.kassim@divyapravaha.example",
        password: "sample-password",
      }),
    ).toEqual({});
  });
});
