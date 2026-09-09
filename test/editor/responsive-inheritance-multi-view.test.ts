import { describe, it, expect, beforeEach } from "vitest";
import {
  clearResponsiveRegistry,
  getResponsiveRegistry,
  getResponsivePropertyInfo,
  setResponsiveStyle,
  generateResponsiveCssString,
  resetResponsivePropertyForViewport,
} from "@/lib/dom/responsive-style-engine";

// Minimal mock element
function mockElement(path: string): Element {
  const el = document.createElement("div");
  el.setAttribute("data-vse-path", path);
  // Stub style for isStyleableElement
  return el;
}

describe("Responsive Inheritance Multi-Viewport", () => {
  beforeEach(() => {
    clearResponsiveRegistry();
  });

  it("desktop change cascades to tablet and mobile", () => {
    const el = mockElement("html>body>div[0]");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "24px", "desktop");

    const desktopInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "desktop");
    expect(desktopInfo.value).toBe("24px");
    expect(desktopInfo.isOverridden).toBe(false);
    expect(desktopInfo.inheritedFrom).toBe("desktop");

    const tabletInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "tablet");
    expect(tabletInfo.value).toBe("24px");
    expect(tabletInfo.isOverridden).toBe(false);
    expect(tabletInfo.inheritedFrom).toBe("desktop");

    const mobileInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "mobile");
    expect(mobileInfo.value).toBe("24px");
    expect(mobileInfo.isOverridden).toBe(false);
    expect(mobileInfo.inheritedFrom).toBe("desktop");
  });

  it("mobile change does NOT affect tablet or desktop", () => {
    const el = mockElement("html>body>div[0]");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "24px", "desktop");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "14px", "mobile");

    const desktopInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "desktop");
    expect(desktopInfo.value).toBe("24px");
    expect(desktopInfo.isOverridden).toBe(false);

    const tabletInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "tablet");
    expect(tabletInfo.value).toBe("24px");
    expect(tabletInfo.isOverridden).toBe(false);
    expect(tabletInfo.inheritedFrom).toBe("desktop");

    const mobileInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "mobile");
    expect(mobileInfo.value).toBe("14px");
    expect(mobileInfo.isOverridden).toBe(true);
    expect(mobileInfo.inheritedFrom).toBe("mobile");
  });

  it("tablet change affects mobile but NOT desktop", () => {
    const el = mockElement("html>body>div[0]");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "24px", "desktop");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "18px", "tablet");

    const desktopInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "desktop");
    expect(desktopInfo.value).toBe("24px");
    expect(desktopInfo.isOverridden).toBe(false);

    const tabletInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "tablet");
    expect(tabletInfo.value).toBe("18px");
    expect(tabletInfo.isOverridden).toBe(true);
    expect(tabletInfo.inheritedFrom).toBe("tablet");

    // Mobile should inherit tablet's value (not desktop)
    const mobileInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "mobile");
    expect(mobileInfo.value).toBe("18px");
    expect(mobileInfo.isOverridden).toBe(false);
    expect(mobileInfo.inheritedFrom).toBe("tablet");
  });

  it("mobile override takes priority over tablet inheritance", () => {
    const el = mockElement("html>body>div[0]");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "24px", "desktop");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "18px", "tablet");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "14px", "mobile");

    const mobileInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "mobile");
    expect(mobileInfo.value).toBe("14px");
    expect(mobileInfo.isOverridden).toBe(true);
    expect(mobileInfo.inheritedFrom).toBe("mobile");
  });

  it("resetting mobile override restores tablet-inherited value", () => {
    const el = mockElement("html>body>div[0]");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "24px", "desktop");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "18px", "tablet");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "14px", "mobile");

    resetResponsivePropertyForViewport("html>body>div[0]", "font-size", "mobile");

    const mobileInfo = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "mobile");
    expect(mobileInfo.value).toBe("18px");
    expect(mobileInfo.isOverridden).toBe(false);
    expect(mobileInfo.inheritedFrom).toBe("tablet");
  });

  it("CSS generation uses correct media queries and attribute selectors", () => {
    const el = mockElement("html>body>div[0]");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "24px", "desktop");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "18px", "tablet");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "14px", "mobile");

    const css = generateResponsiveCssString();
    expect(css).toContain('html[data-vse-viewport="tablet"]');
    expect(css).toContain('html[data-vse-viewport="mobile"]');
    expect(css).toContain("font-size: 18px !important");
    expect(css).toContain("font-size: 14px !important");
    expect(css).toContain("@media (max-width: 1024px)");
    expect(css).toContain("@media (max-width: 640px)");
  });

  it("multiple properties stay independent across viewports", () => {
    const el = mockElement("html>body>div[0]");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "24px", "desktop");
    setResponsiveStyle(el, "html>body>div[0]", "width", "800px", "desktop");
    setResponsiveStyle(el, "html>body>div[0]", "font-size", "16px", "mobile");

    // Width should still be inherited from desktop on mobile
    const widthMobile = getResponsivePropertyInfo(el, "html>body>div[0]", "width", "mobile");
    expect(widthMobile.value).toBe("800px");
    expect(widthMobile.inheritedFrom).toBe("desktop");

    // Font-size should be overridden on mobile
    const fontMobile = getResponsivePropertyInfo(el, "html>body>div[0]", "font-size", "mobile");
    expect(fontMobile.value).toBe("16px");
    expect(fontMobile.isOverridden).toBe(true);
  });
});
