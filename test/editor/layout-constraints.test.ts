import { describe, it, expect } from "vitest";
import { forwardMap } from "@/lib/tailwind/forward-map";
import { PROPERTY_TO_CSS } from "@/lib/dom/live-style-engine";

const emptyTheme = { mode: "none" as const, colors: [], fonts: [] };

describe("Layout Constraints & Aspect Ratio Mappings", () => {
  it("maps aspect-ratio in PROPERTY_TO_CSS", () => {
    expect(PROPERTY_TO_CSS["aspect-ratio"]).toBe("aspect-ratio");
  });

  it("maps min-width, max-width, min-height, max-height in PROPERTY_TO_CSS", () => {
    expect(PROPERTY_TO_CSS["min-width"]).toBe("min-width");
    expect(PROPERTY_TO_CSS["max-width"]).toBe("max-width");
    expect(PROPERTY_TO_CSS["min-height"]).toBe("min-height");
    expect(PROPERTY_TO_CSS["max-height"]).toBe("max-height");
  });

  it("forwardMaps aspect-ratio to Tailwind classes", () => {
    expect(forwardMap("aspect-ratio" as any, "1 / 1", { snap: false, theme: emptyTheme })).toBe("aspect-square");
    expect(forwardMap("aspect-ratio" as any, "16 / 9", { snap: false, theme: emptyTheme })).toBe("aspect-video");
    expect(forwardMap("aspect-ratio" as any, "auto", { snap: false, theme: emptyTheme })).toBe("aspect-auto");
    expect(forwardMap("aspect-ratio" as any, "4/3", { snap: false, theme: emptyTheme })).toBe("aspect-[4/3]");
  });

  it("forwardMaps object-fit and object-position to Tailwind classes", () => {
    expect(forwardMap("object-fit" as any, "cover", { snap: false, theme: emptyTheme })).toBe("object-cover");
    expect(forwardMap("object-fit" as any, "contain", { snap: false, theme: emptyTheme })).toBe("object-contain");
    expect(forwardMap("object-position" as any, "center", { snap: false, theme: emptyTheme })).toBe("object-center");
    expect(forwardMap("object-position" as any, "top", { snap: false, theme: emptyTheme })).toBe("object-top");
  });
});
