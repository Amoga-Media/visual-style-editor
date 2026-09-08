import { describe, it, expect } from "vitest";
import { forwardMap } from "@/lib/tailwind/forward-map";
import { PROPERTY_TO_CSS } from "@/lib/dom/live-style-engine";

const emptyTheme = { mode: "none" as const, colors: [], fonts: [] };

describe("SVG Styling Engine", () => {
  it("maps fill, stroke, stroke-width in PROPERTY_TO_CSS", () => {
    expect(PROPERTY_TO_CSS["fill"]).toBe("fill");
    expect(PROPERTY_TO_CSS["stroke"]).toBe("stroke");
    expect(PROPERTY_TO_CSS["stroke-width"]).toBe("stroke-width");
  });

  it("forwardMaps fill and stroke to Tailwind classes", () => {
    expect(forwardMap("fill" as any, "currentColor", { snap: false, theme: emptyTheme })).toBe("fill-current");
    expect(forwardMap("fill" as any, "transparent", { snap: false, theme: emptyTheme })).toBe("fill-transparent");
    expect(forwardMap("fill" as any, "#3b82f6", { snap: false, theme: emptyTheme })).toBe("fill-[#3b82f6]");

    expect(forwardMap("stroke" as any, "currentColor", { snap: false, theme: emptyTheme })).toBe("stroke-current");
    expect(forwardMap("stroke" as any, "transparent", { snap: false, theme: emptyTheme })).toBe("stroke-transparent");
    expect(forwardMap("stroke" as any, "#ef4444", { snap: false, theme: emptyTheme })).toBe("stroke-[#ef4444]");
  });

  it("forwardMaps stroke-width to Tailwind classes", () => {
    expect(forwardMap("stroke-width" as any, "2px", { snap: false, theme: emptyTheme })).toBe("stroke-[2px]");
  });
});
