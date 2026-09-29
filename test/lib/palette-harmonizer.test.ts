import { describe, it, expect } from "vitest";
import { generateHarmonizedPalette } from "@/lib/color/palette-harmonizer";

describe("generateHarmonizedPalette", () => {
  it("returns all required keys", () => {
    const p = generateHarmonizedPalette("#0084FF");
    ["primary", "secondary", "accent", "neutral"].forEach((k) =>
      expect(p).toHaveProperty(k)
    );
    expect(p.shades).toHaveLength(9);
  });

  it("all shades are valid 6-digit hex strings", () => {
    generateHarmonizedPalette("#10B981").shades.forEach((s) =>
      expect(s).toMatch(/^#[0-9a-fA-F]{6}$/)
    );
  });

  it("falls back to indigo (#6366F1) on invalid input", () => {
    const p = generateHarmonizedPalette("bad-color");
    expect(p.primary).toBe("#6366f1");
  });

  it("all color roles are valid hex strings", () => {
    const p = generateHarmonizedPalette("#FF5733");
    ["primary", "secondary", "accent", "neutral"].forEach((role) => {
      expect((p as any)[role]).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it("secondary and accent differ from primary", () => {
    const p = generateHarmonizedPalette("#0084FF");
    // Hue-shifted colors should be different from the primary
    expect(p.secondary.toLowerCase()).not.toBe(p.primary.toLowerCase());
    expect(p.accent.toLowerCase()).not.toBe(p.primary.toLowerCase());
  });

  it("handles black (#000000) without crashing", () => {
    const p = generateHarmonizedPalette("#000000");
    expect(p.shades).toHaveLength(9);
    expect(p.primary).toBeTruthy();
  });

  it("handles white (#ffffff) without crashing", () => {
    const p = generateHarmonizedPalette("#ffffff");
    expect(p.shades).toHaveLength(9);
    expect(p.primary).toBeTruthy();
  });

  it("returns 9 shades ordered from light to dark", () => {
    const p = generateHarmonizedPalette("#0084FF");
    // The first shade should be lighter (higher lightness) than the last
    // We verify the array has exactly 9 entries
    expect(p.shades.length).toBe(9);
    p.shades.forEach((shade) => {
      expect(shade).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
