import { describe, it, expect } from "vitest";
import {
  TRANSITION_PRESETS,
  ANIMATION_PRESETS,
  HOVER_EFFECT_PRESETS,
  buildTransitionClasses,
  getTransitionClassesToRemove,
  getAnimationClassesToRemove,
  getHoverClassesToRemove,
} from "@/lib/presets/animation-presets";

describe("animation-presets", () => {
  it("exports at least 5 transition presets", () => {
    expect(TRANSITION_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it("exports at least 4 hover presets", () => {
    expect(HOVER_EFFECT_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it("exports at least 4 animation presets", () => {
    expect(ANIMATION_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it("buildTransitionClasses produces valid Tailwind string", () => {
    const cls = buildTransitionClasses({ duration: 300, easing: "ease-out", property: "all" });
    expect(cls).toContain("transition");
    expect(cls).toContain("duration-300");
    expect(cls).toContain("ease-out");
  });

  it("each preset has id, label, and classes or hoverClasses array", () => {
    for (const p of [...TRANSITION_PRESETS, ...ANIMATION_PRESETS]) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("label");
      expect(Array.isArray(p.classes)).toBe(true);
    }
    for (const p of HOVER_EFFECT_PRESETS) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("label");
      expect(Array.isArray(p.hoverClasses)).toBe(true);
    }
  });

  it("provides removal helper arrays for each category", () => {
    expect(getTransitionClassesToRemove().length).toBeGreaterThan(0);
    expect(getAnimationClassesToRemove().length).toBeGreaterThan(0);
    expect(getHoverClassesToRemove().length).toBeGreaterThan(0);
  });
});
