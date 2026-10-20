import { describe, expect, it } from "vitest";
import { createSessionToken, hashSessionToken } from "./session-token";

describe("session tokens", () => {
  it("creates unpredictable opaque values and stores fixed hashes", () => {
    const first = createSessionToken();
    const second = createSessionToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashSessionToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(first)).not.toContain(first);
  });
});
