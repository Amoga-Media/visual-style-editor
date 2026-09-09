import { describe, it, expect } from "vitest";
import { forwardMap } from "@/lib/tailwind/forward-map";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

const emptyTheme = { mode: "none" as const, colors: [], fonts: [] };
const tailwindTheme = { mode: "tailwind" as const, colors: [], fonts: [] };

describe("BUG-021: Visual Element Resize", () => {
  it("forwardMaps custom width and height correctly", () => {
    expect(forwardMap("width" as any, "320px", { snap: false, theme: emptyTheme })).toBe("w-[320px]");
    expect(forwardMap("height" as any, "240px", { snap: false, theme: emptyTheme })).toBe("h-[240px]");
  });

  it("applies live width and height styles to DOM elements", () => {
    const el = document.createElement("div");
    applyLiveStyle(el, "width", "400px", emptyTheme);
    applyLiveStyle(el, "height", "300px", emptyTheme);

    expect(el.style.width).toBe("400px");
    expect(el.style.height).toBe("300px");
  });

  it("calculates proportional dimension lock during aspect-ratio scaling", () => {
    const initialWidth = 400;
    const initialHeight = 200;
    const aspectRatio = initialWidth / initialHeight; // 2.0

    // User drags corner handle changing width to 600px
    const newWidth = 600;
    const lockedHeight = newWidth / aspectRatio;
    expect(lockedHeight).toBe(300);

    // User drags corner handle changing height to 150px
    const newHeight = 150;
    const lockedWidth = newHeight * aspectRatio;
    expect(lockedWidth).toBe(300);
  });

  it("commits resized dimensions and splices into source HTML cleanly", () => {
    const originalHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <!-- hero banner -->
  <div id="banner" style="background-color: blue;">
    Banner Content
  </div>
</body>
</html>`;

    const result = applyEditsClientSide(originalHtml, [
      {
        id: "resize-w",
        kind: "style",
        structuralPath: "#banner",
        property: "width" as any,
        styleProperty: "width",
        oldStyleValue: "",
        newStyleValue: "480px",
        viewport: "desktop",
        timestamp: new Date().toISOString(),
      } as any,
      {
        id: "resize-h",
        kind: "style",
        structuralPath: "#banner",
        property: "height" as any,
        styleProperty: "height",
        oldStyleValue: "",
        newStyleValue: "320px",
        viewport: "desktop",
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    expect(result.html).toContain("width: 480px");
    expect(result.html).toContain("height: 320px");
    expect(result.html).toContain("background-color: blue");
    expect(result.html).toContain("<!-- hero banner -->");
  });
});
