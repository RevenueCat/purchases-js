import { describe, expect, test } from "vitest";
import { applyAlpha } from "../../ui/theme/utils";
describe("overlayColor", () => {
  test("applies black overlay for a light color", () => {
    expect(applyAlpha("#FFFFFF", 0.1)).toBe("#E6E6E6"); // 10% black overlay on white
  });

  test("applies white overlay for a dark color", () => {
    expect(applyAlpha("#000000", 0.1)).toBe("#1A1A1A"); // 10% white overlay on black
  });

  test("applies correct overlay for a mid-tone color", () => {
    expect(applyAlpha("#888888", 0.15)).toBe("#9A9A9A"); // 15% lighter grey
  });

  test("returns same color if alpha is 0", () => {
    expect(applyAlpha("#123456", 0)).toBe("#123456");
  });

  test("returns full overlay color if alpha is 1", () => {
    expect(applyAlpha("#123456", 1)).toBe("#FFFFFF"); // White overlay completely replaces dark color
  });

  test("handles incorrect hex input gracefully", () => {
    expect(applyAlpha("invalid", 0.5)).toBe("#808080"); // Should fall back to neutral gray
  });

  test("handles incorrect alpha input gracefully", () => {
    expect(applyAlpha("#FFFFFF", -4)).toBe("#FFFFFF");
  });
});
