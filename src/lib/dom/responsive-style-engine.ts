import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";
import { resolvePropertyForSide, PROPERTY_TO_CSS, isStyleableElement } from "./live-style-engine";
import { readCurrentValue } from "./computed-style";
import type { EditableProperty, EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "@/components/editor/Toolbar";

export interface ResponsiveRule {
  structuralPath: string;
  cssProperty: string;
  value: string;
  viewport: "desktop" | "tablet" | "mobile";
}

// In-memory responsive rules registry mapped by structuralPath -> property -> viewport -> value
const responsiveRegistry = new Map<string, Map<string, { desktop?: string; tablet?: string; mobile?: string }>>();

export function clearResponsiveRegistry(): void {
  responsiveRegistry.clear();
}

export function getResponsiveRegistry(): Map<string, Map<string, { desktop?: string; tablet?: string; mobile?: string }>> {
  return responsiveRegistry;
}

/**
 * Resets a specific property's override for a given viewport back to "inherited" (removes the override).
 * Useful for a "Reset to Desktop" button on tablet/mobile views.
 */
export function resetResponsivePropertyForViewport(
  structuralPath: string,
  cssProperty: string,
  viewport: "tablet" | "mobile",
  doc?: Document | null
): void {
  const pathMap = responsiveRegistry.get(structuralPath);
  if (!pathMap) return;
  const current = pathMap.get(cssProperty);
  if (!current) return;
  delete current[viewport];
  pathMap.set(cssProperty, current);

  if (doc) {
    syncResponsiveStylesheet(doc);
  }
}

/**
 * Returns the effective value and inheritance state for a given property and viewport.
 */
export function getResponsivePropertyInfo(
  element: Element,
  structuralPath: string,
  property: string,
  viewport: ViewportMode,
  side?: string
): {
  value: string;
  isOverridden: boolean;
  inheritedFrom: "desktop" | "tablet" | "mobile";
} {
  const cssProp = resolvePropertyForSide(property, side);
  const pathRules = responsiveRegistry.get(structuralPath);
  const propRules = pathRules?.get(cssProp);

  let baseDesktopValue = propRules?.desktop;
  if (!baseDesktopValue && isStyleableElement(element)) {
    baseDesktopValue = element.style.getPropertyValue(cssProp);
  }
  if (!baseDesktopValue && isStyleableElement(element)) {
    baseDesktopValue = readCurrentValue(element, property as any, undefined, side as any);
  }

  if (viewport === "desktop") {
    return {
      value: baseDesktopValue || "",
      isOverridden: false,
      inheritedFrom: "desktop",
    };
  }

  if (viewport === "tablet") {
    if (propRules?.tablet !== undefined && propRules.tablet !== "") {
      return {
        value: propRules.tablet,
        isOverridden: true,
        inheritedFrom: "tablet",
      };
    }
    return {
      value: baseDesktopValue || "",
      isOverridden: false,
      inheritedFrom: "desktop",
    };
  }

  // mobile viewport
  if (propRules?.mobile !== undefined && propRules.mobile !== "") {
    return {
      value: propRules.mobile,
      isOverridden: true,
      inheritedFrom: "mobile",
    };
  }
  if (propRules?.tablet !== undefined && propRules.tablet !== "") {
    return {
      value: propRules.tablet,
      isOverridden: false,
      inheritedFrom: "tablet",
    };
  }
  return {
    value: baseDesktopValue || "",
    isOverridden: false,
    inheritedFrom: "desktop",
  };
}

export function hasActiveResponsiveOverrides(): boolean {
  for (const propMap of responsiveRegistry.values()) {
    for (const overrides of propMap.values()) {
      if (overrides.tablet || overrides.mobile) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Generates the full CSS string for all registered responsive overrides.
 * Scoped cleanly by data-vse-viewport inside the live editor preview, and
 * standard media queries for exported HTML.
 */
export function generateResponsiveCssString(): string {
  if (!hasActiveResponsiveOverrides()) {
    return "";
  }

  const liveTabletRules: string[] = [];
  const liveMobileRules: string[] = [];
  const exportTabletRules: string[] = [];
  const exportMobileRules: string[] = [];

  for (const [path, propMap] of responsiveRegistry.entries()) {
    const selector = `[data-vse-path="${path}"]`;

    const tabletDecls: string[] = [];
    const mobileDecls: string[] = [];

    for (const [prop, overrides] of propMap.entries()) {
      if (overrides.tablet) {
        tabletDecls.push(`  ${prop}: ${overrides.tablet} !important;`);
        if (prop === "color") {
          tabletDecls.push(`  -webkit-text-fill-color: ${overrides.tablet} !important;`);
        }
      }
      if (overrides.mobile) {
        mobileDecls.push(`  ${prop}: ${overrides.mobile} !important;`);
        if (prop === "color") {
          mobileDecls.push(`  -webkit-text-fill-color: ${overrides.mobile} !important;`);
        }
      }
    }

    if (tabletDecls.length > 0) {
      // Live Editor Tablet & Mobile inheritance
      liveTabletRules.push(`html[data-vse-viewport="tablet"] ${selector},\nhtml[data-vse-viewport="mobile"] ${selector} {\n${tabletDecls.join("\n")}\n}`);
      exportTabletRules.push(`${selector} {\n${tabletDecls.join("\n")}\n}`);
    }

    if (mobileDecls.length > 0) {
      // Live Editor Mobile override
      liveMobileRules.push(`html[data-vse-viewport="mobile"] ${selector} {\n${mobileDecls.join("\n")}\n}`);
      exportMobileRules.push(`${selector} {\n${mobileDecls.join("\n")}\n}`);
    }
  }

  let css = "/* Visual Style Editor Responsive Cascades */\n";

  // 1. Live Editor Viewport Scoped Rules
  if (liveTabletRules.length > 0) {
    css += `/* Tablet Viewport Rules */\n${liveTabletRules.join("\n\n")}\n\n`;
  }
  if (liveMobileRules.length > 0) {
    css += `/* Mobile Viewport Rules */\n${liveMobileRules.join("\n\n")}\n\n`;
  }

  // 2. Standalone / Export Media Queries
  if (exportTabletRules.length > 0) {
    css += `@media (max-width: 1024px) {\n${exportTabletRules.map((r) => "  " + r.split("\n").join("\n  ")).join("\n")}\n}\n\n`;
  }
  if (exportMobileRules.length > 0) {
    css += `@media (max-width: 640px) {\n${exportMobileRules.map((r) => "  " + r.split("\n").join("\n  ")).join("\n")}\n}\n`;
  }

  return css;
}

/**
 * Synchronizes the `<style id="vse-responsive-styles">` tag in the iframe document.
 */
export function syncResponsiveStylesheet(doc: Document | null | undefined): void {
  if (!doc) return;
  let styleEl = doc.getElementById("vse-responsive-styles") as HTMLStyleElement | null;
  const css = generateResponsiveCssString();

  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.id = "vse-responsive-styles";
    if (doc.head) {
      doc.head.appendChild(styleEl);
    } else if (doc.body) {
      doc.body.appendChild(styleEl);
    }
  }
  styleEl.textContent = css;
}

/**
 * Sets a responsive style override following the top-down cascade:
 * - Desktop: updates base element inline style and registry. Cascades to tablet and mobile unless overridden.
 * - Tablet: updates tablet rule in registry. Cascades to mobile (unless mobile has its own override). Desktop remains untouched.
 * - Mobile: updates mobile rule in registry. Scoped only to mobile.
 */
export function setResponsiveStyle(
  element: Element,
  structuralPath: string,
  property: string,
  formattedVal: string,
  viewport: ViewportMode,
  side?: string
): void {
  const cssProp = resolvePropertyForSide(property, side);

  // Ensure element has data-vse-path for stylesheet selector matching
  if (!element.getAttribute("data-vse-path")) {
    element.setAttribute("data-vse-path", structuralPath);
  }

  let pathMap = responsiveRegistry.get(structuralPath);
  if (!pathMap) {
    pathMap = new Map();
    responsiveRegistry.set(structuralPath, pathMap);
  }
  const current = pathMap.get(cssProp) || {};

  if (viewport === "desktop") {
    // 1. Desktop updates base style directly and records in registry
    current.desktop = formattedVal;
    pathMap.set(cssProp, current);

    if (isStyleableElement(element)) {
      element.style.setProperty(cssProp, formattedVal, "important");
      if (property === "text-color" || cssProp === "color") {
        element.style.setProperty("-webkit-text-fill-color", formattedVal, "important");
      }
    }
  } else if (viewport === "tablet") {
    // 2. Tablet sets tablet override
    current.tablet = formattedVal;
    pathMap.set(cssProp, current);

    // Sync stylesheet in iframe document
    syncResponsiveStylesheet(element.ownerDocument);
  } else if (viewport === "mobile") {
    // 3. Mobile sets mobile override
    current.mobile = formattedVal;
    pathMap.set(cssProp, current);

    // Sync stylesheet in iframe document
    syncResponsiveStylesheet(element.ownerDocument);
  }
}
