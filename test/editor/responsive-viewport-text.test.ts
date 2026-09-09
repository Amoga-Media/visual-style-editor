import { describe, it, expect, beforeEach } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import {
  setResponsiveStyle,
  getResponsivePropertyInfo,
  resetResponsivePropertyForViewport,
  clearResponsiveRegistry,
} from "@/lib/dom/responsive-style-engine";

describe("BUG-020: Responsive Viewport Text Size Isolation", () => {
  beforeEach(() => {
    clearResponsiveRegistry();
  });

  it("desktop edits update base inline styles, while mobile edits do not overwrite desktop", () => {
    const originalHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <!-- hero title -->
  <h1 id="title" style="font-size: 32px; color: #000;">Main Heading</h1>
</body>
</html>`;

    // 1. Desktop style edit (e.g. change font-size from 32px to 48px)
    // 2. Mobile style edit (change font-size to 24px)
    const result = applyEditsClientSide(originalHtml, [
      {
        id: "edit-desktop",
        kind: "style",
        structuralPath: "#title",
        property: "font-size" as any,
        styleProperty: "font-size",
        oldStyleValue: "32px",
        newStyleValue: "48px",
        viewport: "desktop",
        timestamp: new Date().toISOString(),
      } as any,
      {
        id: "edit-mobile",
        kind: "style",
        structuralPath: "#title",
        property: "font-size" as any,
        styleProperty: "font-size",
        oldStyleValue: "48px",
        newStyleValue: "24px",
        viewport: "mobile",
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    // Base inline style on <h1> MUST have desktop size 48px, NOT mobile 24px!
    expect(result.html).toContain('style="font-size: 48px; color: #000;"');
    // Mobile size must be preserved inside responsive stylesheet
    expect(result.html).toContain('<style id="vse-responsive-styles">');
    expect(result.html).toContain("@media (max-width: 640px)");
    expect(result.html).toContain("24px");
  });

  it("tracks inheritance and allows resetting overrides", () => {
    const el = document.createElement("h2");
    el.style.fontSize = "36px";
    const path = "#subheading";

    // Set base desktop
    setResponsiveStyle(el, path, "font-size", "36px", "desktop");
    // Initially on tablet: inherited from desktop
    const tabletInitial = getResponsivePropertyInfo(el, path, "font-size", "tablet");
    expect(tabletInitial.isOverridden).toBe(false);
    expect(tabletInitial.inheritedFrom).toBe("desktop");
    expect(tabletInitial.value).toBe("36px");

    // Set override on tablet
    setResponsiveStyle(el, path, "font-size", "28px", "tablet");
    const tabletOverridden = getResponsivePropertyInfo(el, path, "font-size", "tablet");
    expect(tabletOverridden.isOverridden).toBe(true);
    expect(tabletOverridden.value).toBe("28px");

    // Mobile inherits from tablet when mobile has no override
    const mobileInherited = getResponsivePropertyInfo(el, path, "font-size", "mobile");
    expect(mobileInherited.isOverridden).toBe(false);
    expect(mobileInherited.inheritedFrom).toBe("tablet");
    expect(mobileInherited.value).toBe("28px");

    // Reset tablet override
    resetResponsivePropertyForViewport(path, "font-size", "tablet");
    const tabletReset = getResponsivePropertyInfo(el, path, "font-size", "tablet");
    expect(tabletReset.isOverridden).toBe(false);
    expect(tabletReset.inheritedFrom).toBe("desktop");
    expect(tabletReset.value).toBe("36px");
  });
});
