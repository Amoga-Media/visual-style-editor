import { describe, it, expect, beforeEach } from "vitest";
import {
  setResponsiveStyle,
  getResponsivePropertyInfo,
  generateResponsiveCssString,
  syncResponsiveStylesheet,
  clearResponsiveRegistry,
  getResponsiveRegistry,
} from "@/lib/dom/responsive-style-engine";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import type { ThemeMap } from "@/types";

const THEME: ThemeMap = { mode: "none", colors: [], fonts: [] };

describe("Responsive Style Engine Cascade (Desktop -> Tablet -> Mobile)", () => {
  let doc: Document;
  let element: HTMLElement;
  const structuralPath = "body > div:nth-child(1) > h1:nth-child(1)";

  beforeEach(() => {
    clearResponsiveRegistry();
    doc = document.implementation.createHTMLDocument("Test Doc");
    element = doc.createElement("h1");
    element.textContent = "Heading";
    doc.body.appendChild(element);
  });

  it("cascades Desktop styles down to Tablet and Mobile when no overrides exist", () => {
    // 1. Apply style on Desktop
    applyLiveStyle(element, "font-size", "48px", THEME, undefined, "desktop", structuralPath);

    // Verify desktop base style was applied directly to element
    expect(element.style.fontSize).toBe("48px");

    // 2. Query effective value on Desktop, Tablet, and Mobile
    const desktopInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "desktop");
    const tabletInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "tablet");
    const mobileInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "mobile");

    expect(desktopInfo.value).toBe("48px");
    expect(desktopInfo.isOverridden).toBe(false);
    expect(desktopInfo.inheritedFrom).toBe("desktop");

    expect(tabletInfo.value).toBe("48px");
    expect(tabletInfo.isOverridden).toBe(false);
    expect(tabletInfo.inheritedFrom).toBe("desktop");

    expect(mobileInfo.value).toBe("48px");
    expect(mobileInfo.isOverridden).toBe(false);
    expect(mobileInfo.inheritedFrom).toBe("desktop");
  });

  it("cascades Tablet overrides to Mobile while leaving Desktop untouched", () => {
    // 1. Set Desktop base style
    applyLiveStyle(element, "font-size", "48px", THEME, undefined, "desktop", structuralPath);

    // 2. Override on Tablet
    applyLiveStyle(element, "font-size", "36px", THEME, undefined, "tablet", structuralPath);

    // Desktop inline style on the element must remain 48px
    expect(element.style.fontSize).toBe("48px");

    // 3. Query effective values across viewports
    const desktopInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "desktop");
    const tabletInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "tablet");
    const mobileInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "mobile");

    expect(desktopInfo.value).toBe("48px");
    expect(desktopInfo.isOverridden).toBe(false);

    expect(tabletInfo.value).toBe("36px");
    expect(tabletInfo.isOverridden).toBe(true);
    expect(tabletInfo.inheritedFrom).toBe("tablet");

    // Mobile inherits the Tablet override (not desktop)
    expect(mobileInfo.value).toBe("36px");
    expect(mobileInfo.isOverridden).toBe(false);
    expect(mobileInfo.inheritedFrom).toBe("tablet");
  });

  it("scopes Mobile overrides strictly to Mobile view", () => {
    // 1. Set Desktop base style
    applyLiveStyle(element, "font-size", "48px", THEME, undefined, "desktop", structuralPath);

    // 2. Override on Tablet
    applyLiveStyle(element, "font-size", "36px", THEME, undefined, "tablet", structuralPath);

    // 3. Override on Mobile
    applyLiveStyle(element, "font-size", "24px", THEME, undefined, "mobile", structuralPath);

    // Query effective values across all viewports
    const desktopInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "desktop");
    const tabletInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "tablet");
    const mobileInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "mobile");

    expect(desktopInfo.value).toBe("48px");
    expect(desktopInfo.isOverridden).toBe(false);

    expect(tabletInfo.value).toBe("36px");
    expect(tabletInfo.isOverridden).toBe(true);
    expect(tabletInfo.inheritedFrom).toBe("tablet");

    expect(mobileInfo.value).toBe("24px");
    expect(mobileInfo.isOverridden).toBe(true);
    expect(mobileInfo.inheritedFrom).toBe("mobile");
  });

  it("generates correct media queries in the responsive stylesheet", () => {
    setResponsiveStyle(element, structuralPath, "padding-top", "20px", "tablet", "top");
    setResponsiveStyle(element, structuralPath, "padding-top", "10px", "mobile", "top");

    const css = generateResponsiveCssString();

    expect(css).toContain("@media (max-width: 1024px)");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain(`[data-vse-path="${structuralPath}"]`);
    expect(css).toContain("padding-top: 20px !important;");
    expect(css).toContain("padding-top: 10px !important;");
  });

  it("syncs stylesheet tag in document head seamlessly", () => {
    setResponsiveStyle(element, structuralPath, "color", "#ff0000", "tablet");
    syncResponsiveStylesheet(doc);

    const styleTag = doc.getElementById("vse-responsive-styles") as HTMLStyleElement;
    expect(styleTag).not.toBeNull();
    expect(styleTag.textContent).toContain("@media (max-width: 1024px)");
    expect(styleTag.textContent).toContain("color: #ff0000 !important;");
  });

  it("persists values across viewport switching cycles without resetting", () => {
    // User sets tablet padding
    commitStyleChange(element, structuralPath, "padding" as any, "24px", THEME, undefined, undefined, "top", "tablet");

    // Switching to desktop: desktop still reads base value
    let info = getResponsivePropertyInfo(element, structuralPath, "padding", "desktop", "top");
    expect(info.isOverridden).toBe(false);

    // Switching to mobile: mobile reads inherited tablet value
    info = getResponsivePropertyInfo(element, structuralPath, "padding", "mobile", "top");
    expect(info.value).toBe("24px");
    expect(info.inheritedFrom).toBe("tablet");

    // Switching back to tablet: tablet still retains set value 24px (does NOT reset to base)
    info = getResponsivePropertyInfo(element, structuralPath, "padding", "tablet", "top");
    expect(info.value).toBe("24px");
    expect(info.isOverridden).toBe(true);
  });

  it("ensures Desktop value is NEVER overwritten by Tablet or Mobile overrides when switching back to Desktop", () => {
    // 1. Set Desktop value
    commitStyleChange(element, structuralPath, "font-size", "40px", THEME, undefined, undefined, undefined, "desktop");
    expect(element.style.fontSize).toBe("40px");
    expect(getResponsivePropertyInfo(element, structuralPath, "font-size", "desktop").value).toBe("40px");

    // 2. Set Tablet value
    commitStyleChange(element, structuralPath, "font-size", "28px", THEME, undefined, undefined, undefined, "tablet");
    expect(getResponsivePropertyInfo(element, structuralPath, "font-size", "tablet").value).toBe("28px");

    // 3. Set Mobile value
    commitStyleChange(element, structuralPath, "font-size", "18px", THEME, undefined, undefined, undefined, "mobile");
    expect(getResponsivePropertyInfo(element, structuralPath, "font-size", "mobile").value).toBe("18px");

    // 4. Return to Desktop view -> Must STILL be 40px, NOT 28px or 18px!
    const desktopInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "desktop");
    expect(desktopInfo.value).toBe("40px");
    expect(desktopInfo.isOverridden).toBe(false);
    expect(desktopInfo.inheritedFrom).toBe("desktop");

    // 5. Check generated stylesheet scopes
    const css = generateResponsiveCssString();
    expect(css).toContain('html[data-vse-viewport="tablet"]');
    expect(css).toContain('html[data-vse-viewport="mobile"]');
    // Live tablet rule must never match html[data-vse-viewport="desktop"]
    expect(css).not.toContain('html[data-vse-viewport="desktop"]');
  });

  it("preserves Desktop inline styles on element in Tailwind mode so slider releases never reset visual styling", () => {
    const TAILWIND_THEME: ThemeMap = {
      mode: "v3",
      colors: [],
      fonts: [],
    };

    // 1. Commit font-size change on desktop in Tailwind mode
    commitStyleChange(element, structuralPath, "font-size", "81px", TAILWIND_THEME, undefined, undefined, undefined, "desktop");

    // Must preserve inline style with important
    expect(element.style.fontSize).toBe("81px");

    // Responsive registry must also record desktop value
    const desktopInfo = getResponsivePropertyInfo(element, structuralPath, "font-size", "desktop");
    expect(desktopInfo.value).toBe("81px");
    expect(desktopInfo.isOverridden).toBe(false);
  });
});

