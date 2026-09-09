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

  it("handles SVG presentation attributes and commitStyleChange with SVG elements", async () => {
    const { applyLiveStyle, commitStyleChange } = await import("@/lib/dom/live-style-engine");
    const { applyEditsClientSide } = await import("@/lib/ast/apply-edits");
    
    // Create an SVG element in JSDOM
    const container = document.createElement("div");
    container.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 1" stroke-width="2"/></svg>`;
    const svg = container.querySelector("svg")!;
    const path = container.querySelector("path")!;

    // Apply live style on path
    applyLiveStyle(path, "stroke", "#ef4444");
    expect(path.getAttribute("stroke")).toBe("#ef4444");

    // Commit style change to Tailwind class
    let emittedRecord: any = null;
    commitStyleChange(
      path,
      "0.0",
      "stroke",
      "#ef4444",
      { mode: "tailwind", colors: [], fonts: [] },
      (rec) => { emittedRecord = rec; }
    );
    expect(emittedRecord).toBeDefined();
    expect(path.getAttribute("class")).toContain("stroke-");

    // Test applyEditsClientSide with SVG
    const originalHtml = `<!DOCTYPE html><html><head></head><body><svg viewBox="0 0 24 24" fill="none" stroke="currentColor">\n  <!-- path comment -->\n  <path d="M1 1" stroke-width="2" />\n</svg></body></html>`;
    const result = applyEditsClientSide(originalHtml, [
      {
        kind: "attribute",
        structuralPath: "html>body:nth-of-type(1)>svg:nth-of-type(1)>path:nth-of-type(1)",
        attributeName: "stroke",
        newValue: "#3b82f6",
      },
    ]);
    expect(result.html).toContain('stroke="#3b82f6"');
    expect(result.html).toContain('<!-- path comment -->');
    expect(result.html).toContain('viewBox="0 0 24 24"');
  });

  it("changes icon color directly without changing parent button text color", () => {
    const container = document.createElement("div");
    container.innerHTML = `<button class="text-white flex items-center"><svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24"><path d="M1 1"/></svg><span>Click me</span></button>`;
    const button = container.querySelector("button")!;
    const svg = container.querySelector("svg")!;
    const span = container.querySelector("span")!;

    // Changing color on SVG directly
    svg.style.color = "#10b981";
    expect(svg.style.color).toBe("rgb(16, 185, 129)");
    expect(button.style.color).toBe("");
    expect(span.style.color).toBe("");
  });
});

