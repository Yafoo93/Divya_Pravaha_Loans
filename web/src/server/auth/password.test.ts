import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("stores a salted scrypt hash and verifies only the right password", async () => {
    const password = "SecureDemo!2026";
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).toMatch(/^scrypt\$131072\$8\$1\$/);
    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    await expect(verifyPassword(password, first)).resolves.toBe(true);
    await expect(verifyPassword("WrongPassword!", first)).resolves.toBe(false);
  });

  it("rejects malformed hashes without throwing", async () => {
    await expect(verifyPassword("SecureDemo!2026", "not-a-hash")).resolves.toBe(
      false,
    );
  });
});
