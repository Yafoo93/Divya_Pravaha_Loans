import { describe, expect, it } from "vitest";
import { contrastRatio } from "./accessibility";

const palettePairs = [
  ["#17233d", "#f5f7fc", "foreground on background"],
  ["#69748c", "#ffffff", "muted text on surface"],
  ["#2f55e7", "#ffffff", "primary on surface"],
  ["#ffffff", "#2f55e7", "text on primary button"],
  ["#ffffff", "#0f7a4b", "text on success"],
  ["#ffffff", "#b42336", "text on danger"],
  ["#92540a", "#ffffff", "warning text on surface"],
] as const;

describe("theme accessibility", () => {
  it.each(palettePairs)(
    "meets WCAG AA contrast for %s",
    (foreground, background) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("rejects malformed colors", () => {
    expect(() => contrastRatio("blue", "#ffffff")).toThrow("six-digit hex");
  });
});
