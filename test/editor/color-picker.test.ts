import { describe, it, expect } from "vitest";
import { parse as parseColor, converter, formatHex, formatRgb, formatHsl } from "culori";

const toHsv = converter("hsv");
const toRgb = converter("rgb");

describe("ColorPicker and Transparency Engine", () => {
  it("parses transparent color and handles alpha channel = 0", () => {
    const parsed = parseColor("transparent");
    expect(parsed).toBeDefined();
    expect(parsed?.alpha).toBe(0);
  });

  it("converts hex color to HSV accurately", () => {
    const parsed = parseColor("#3b82f6");
    expect(parsed).toBeDefined();
    const hsv = toHsv(parsed!);
    expect(hsv.h).toBeGreaterThan(200);
    expect(hsv.h).toBeLessThan(230);
    expect(hsv.s).toBeGreaterThan(0.7);
    expect(hsv.v).toBeGreaterThan(0.9);
  });

  it("converts HSV back to hex format", () => {
    const rgb = toRgb({ mode: "hsv", h: 0, s: 1, v: 1, alpha: 1 });
    const hex = formatHex(rgb!);
    expect(hex).toBe("#ff0000");
  });

  it("handles alpha transparency and formats rgba/hex8", () => {
    const rgb = toRgb({ mode: "hsv", h: 120, s: 1, v: 1, alpha: 0.5 });
    expect(rgb?.alpha).toBe(0.5);
    const rgbStr = formatRgb(rgb!);
    expect(rgbStr).toContain("0.5");
  });

  it("handles HSL formatting from culori", () => {
    const parsed = parseColor("hsl(210, 100%, 50%)");
    expect(parsed).toBeDefined();
    const hslStr = formatHsl(parsed!);
    expect(hslStr).toContain("hsl");
  });

  it("preserves color format and avoids resetting to #000000 for standard hex values", () => {
    const parsed = parseColor("#ef4444");
    expect(parsed).toBeDefined();
    const hex = formatHex(parsed!);
    expect(hex).toBe("#ef4444");
  });

  it("handles black and white parsing without throwing", () => {
    const black = parseColor("#000000");
    const white = parseColor("#ffffff");
    expect(formatHex(black!)).toBe("#000000");
    expect(formatHex(white!)).toBe("#ffffff");
  });
});
