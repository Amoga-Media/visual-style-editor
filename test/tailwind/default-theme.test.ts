import { describe, it, expect } from "vitest";
import { DEFAULT_COLORS, DEFAULT_SPACING, DEFAULT_FONT_SIZE } from "@/lib/tailwind/default-theme";

// This suite exists to catch transcription mistakes when the bundled scale
// was populated from Tailwind's published docs, not to test any logic -
// there isn't any logic here to test.
describe("bundled default Tailwind scale", () => {
  it("DEFAULT_COLORS has the expected total size (22 families x 11 steps + 4 keywords)", () => {
    expect(DEFAULT_COLORS.length).toBe(22 * 11 + 4);
  });

  it("DEFAULT_COLORS has red-500 at the well-known hex value", () => {
    expect(DEFAULT_COLORS.find((c) => c.name === "red-500")?.hex).toBe("#ef4444");
  });

  it("DEFAULT_COLORS spot-checks a few more families across the palette", () => {
    expect(DEFAULT_COLORS.find((c) => c.name === "slate-50")?.hex).toBe("#f8fafc");
    expect(DEFAULT_COLORS.find((c) => c.name === "blue-600")?.hex).toBe("#2563eb");
    expect(DEFAULT_COLORS.find((c) => c.name === "emerald-950")?.hex).toBe("#022c22");
    expect(DEFAULT_COLORS.find((c) => c.name === "rose-100")?.hex).toBe("#ffe4e6");
  });

  it("DEFAULT_COLORS includes black/white/transparent/current", () => {
    expect(DEFAULT_COLORS.find((c) => c.name === "black")?.hex).toBe("#000000");
    expect(DEFAULT_COLORS.find((c) => c.name === "white")?.hex).toBe("#ffffff");
    expect(DEFAULT_COLORS.find((c) => c.name === "transparent")?.hex).toBe("transparent");
    expect(DEFAULT_COLORS.find((c) => c.name === "current")?.hex).toBe("currentColor");
  });

  it("every color family has exactly 11 steps (50 through 950)", () => {
    const families = [...new Set(DEFAULT_COLORS.filter((c) => c.name.includes("-")).map((c) => c.name.split("-")[0]))];
    expect(families.length).toBe(22);
    for (const family of families) {
      const steps = DEFAULT_COLORS.filter((c) => c.name.startsWith(`${family}-`));
      expect(steps.length).toBe(11);
    }
  });

  it("DEFAULT_SPACING has the expected size and known entries", () => {
    expect(DEFAULT_SPACING.find((s) => s.name === "64")?.px).toBe(256);
    expect(DEFAULT_SPACING.find((s) => s.name === "4")?.px).toBe(16);
    expect(DEFAULT_SPACING.find((s) => s.name === "px")?.px).toBe(1);
    expect(DEFAULT_SPACING.find((s) => s.name === "0")?.px).toBe(0);
    expect(DEFAULT_SPACING.find((s) => s.name === "96")?.px).toBe(384);
  });

  it("DEFAULT_FONT_SIZE has the expected entries", () => {
    expect(DEFAULT_FONT_SIZE.find((f) => f.name === "lg")?.px).toBe(18);
    expect(DEFAULT_FONT_SIZE.find((f) => f.name === "xl")?.px).toBe(20);
    expect(DEFAULT_FONT_SIZE.find((f) => f.name === "base")?.px).toBe(16);
    expect(DEFAULT_FONT_SIZE.find((f) => f.name === "9xl")?.px).toBe(128);
  });
});
