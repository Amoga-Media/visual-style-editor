import { describe, it, expect } from "vitest";
import { SHADOW_PRESETS, getShadowPreset, getShadowPresetsByCategory } from "@/lib/presets/shadow-presets";

describe("shadow-presets", () => {
  it("exports 12 presets", () => {
    expect(SHADOW_PRESETS.length).toBeGreaterThanOrEqual(12);
  });

  it("each preset has id, label, css, tailwindClass, and category", () => {
    SHADOW_PRESETS.forEach((p) => {
      ["id", "label", "css", "tailwindClass", "category"].forEach((k) =>
        expect(p).toHaveProperty(k)
      );
    });
  });

  it("getShadowPreset finds a preset by id", () => {
    expect(getShadowPreset("soft-md")).toBeDefined();
    expect(getShadowPreset("soft-md")?.label).toBe("Soft M");
  });

  it("getShadowPreset returns undefined for an unknown id", () => {
    expect(getShadowPreset("nonexistent-id")).toBeUndefined();
  });

  it("includes both glow and shadow categories", () => {
    const categories = [...new Set(SHADOW_PRESETS.map((p) => p.category))];
    expect(categories).toContain("glow");
    expect(categories).toContain("shadow");
    expect(categories).toContain("inset");
    expect(categories).toContain("none");
  });

  it("getShadowPresetsByCategory returns only matching presets", () => {
    const glowPresets = getShadowPresetsByCategory("glow");
    expect(glowPresets.length).toBeGreaterThanOrEqual(4); // blue, purple, green, amber
    glowPresets.forEach((p) => expect(p.category).toBe("glow"));
  });

  it("all preset IDs are unique", () => {
    const ids = SHADOW_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
