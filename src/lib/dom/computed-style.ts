import { classifyUtilityClass } from "../tailwind/classify";
import { DEFAULT_SPACING, DEFAULT_FONT_SIZE } from "../tailwind/default-theme";
import type { EditableProperty, ThemeMap } from "@/types";

type Side = "top" | "right" | "bottom" | "left" | "top-left" | "top-right" | "bottom-right" | "bottom-left";

function capitalize(s?: string): string {
  if (!s || typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CORNER_CSS_SEGMENT: Partial<Record<Side, string>> = {
  "top-left": "TopLeft",
  "top-right": "TopRight",
  "bottom-right": "BottomRight",
  "bottom-left": "BottomLeft",
};

export function isStyleableElement(el: unknown): el is HTMLElement | SVGElement {
  return el !== null && typeof el === "object" && "style" in el;
}

export function readInlineOrComputedStyleValue(el: Element, styleProp: string): string {
  if (isStyleableElement(el)) {
    const inline = el.style.getPropertyValue(styleProp);
    if (inline) return inline;
  }
  const win = el.ownerDocument?.defaultView || window;
  return win.getComputedStyle(el).getPropertyValue(styleProp);
}

function resolveScaleSuffix(property: EditableProperty, suffix: string, theme: ThemeMap): string {
  if (property === "border-width") {
    if (suffix === "" || suffix === "border") return "1px";
    if (/^\d+$/.test(suffix)) return `${suffix}px`;
  }

  if (!suffix) return suffix;

  // Bracket syntax pass-through e.g. [257px] -> 257px
  if (suffix.startsWith("[") && suffix.endsWith("]")) {
    return suffix.slice(1, -1);
  }

  if (
    property === "width" ||
    property === "height" ||
    property === "min-width" ||
    property === "max-width" ||
    property === "min-height" ||
    property === "max-height" ||
    property === "top" ||
    property === "right" ||
    property === "bottom" ||
    property === "left" ||
    property === "padding" ||
    property === "padding-top" ||
    property === "padding-right" ||
    property === "padding-bottom" ||
    property === "padding-left" ||
    property === "margin" ||
    property === "margin-top" ||
    property === "margin-right" ||
    property === "margin-bottom" ||
    property === "margin-left" ||
    property === "gap"
  ) {
    const step = DEFAULT_SPACING.find((s) => s.name === suffix);
    if (step) return `${step.px}px`;
  }

  if (property === "font-size") {
    const step = DEFAULT_FONT_SIZE.find((s) => s.name === suffix);
    if (step) return `${step.px}px`;
  }

  if (property === "text-color" || property === "background-color" || property === "border-color") {
    const custom = theme.colors.find((c) => c.name === suffix);
    if (custom) return custom.value;
  }

  return suffix;
}

export function readCurrentValue(
  el: Element,
  property: EditableProperty,
  arg3?: string[] | ThemeMap,
  arg4?: ThemeMap | Side,
  arg5?: Side
): string {
  let classList: string[];
  let theme: ThemeMap;
  let side: Side | undefined;

  if (Array.isArray(arg3)) {
    classList = arg3;
    theme = (arg4 as ThemeMap) ?? { mode: "none", colors: [], fonts: [] };
    side = arg5;
  } else {
    classList = Array.from(el.classList);
    theme = (arg3 as ThemeMap) ?? { mode: "none", colors: [], fonts: [] };
    side = arg4 as Side | undefined;
  }

  // 1. Check explicit inline styles on the HTML element first (highest specificity)
  if (isStyleableElement(el)) {
    const inline = el.style.getPropertyValue(property);
    if (inline) return inline;
  }

  // 2. Check Tailwind utility classes if present
  let unscopedCandidate: string | undefined;

  for (const cls of classList) {
    const c = classifyUtilityClass(cls, theme);
    if (!c || c.property !== property) continue;
    if (side) {
      if (c.side === side) {
        return resolveScaleSuffix(property, c.suffix, theme);
      }
      if (!c.side && unscopedCandidate === undefined) {
        unscopedCandidate = resolveScaleSuffix(property, c.suffix, theme);
      }
    } else {
      if (c.side === undefined) {
        return resolveScaleSuffix(property, c.suffix, theme);
      }
    }
  }

  if (unscopedCandidate !== undefined) {
    return unscopedCandidate;
  }

  // 3. Fall back to computed style
  const win = el.ownerDocument?.defaultView || window;
  const computed = win.getComputedStyle(el);

  switch (property) {
    case "width":
      return computed.width;
    case "height":
      return computed.height;
    case "min-width":
      return computed.minWidth;
    case "max-width":
      return computed.maxWidth;
    case "min-height":
      return computed.minHeight;
    case "max-height":
      return computed.maxHeight;
    case "position":
      return computed.position || "static";
    case "top":
      return computed.top;
    case "right":
      return computed.right;
    case "bottom":
      return computed.bottom;
    case "left":
      return computed.left;
    case "z-index":
      return computed.zIndex || "auto";
    case "overflow":
      return computed.overflow || "visible";
    case "cursor":
      return computed.cursor || "default";
    case "backdrop-blur":
      return (computed as any).backdropFilter || "none";
    case "rotate":
      return (computed as any).rotate || "0deg";
    case "scale":
      return (computed as any).scale || "1";
    case "padding":
      return computed.padding || computed.paddingTop;
    case "padding-top":
      return computed.paddingTop;
    case "padding-right":
      return computed.paddingRight;
    case "padding-bottom":
      return computed.paddingBottom;
    case "padding-left":
      return computed.paddingLeft;
    case "margin":
      return computed.margin || computed.marginTop;
    case "margin-top":
      return computed.marginTop;
    case "margin-right":
      return computed.marginRight;
    case "margin-bottom":
      return computed.marginBottom;
    case "margin-left":
      return computed.marginLeft;
    case "font-size":
      return computed.fontSize;
    case "font-weight":
      return computed.fontWeight;
    case "font-family":
      return computed.fontFamily;
    case "line-height":
      return computed.lineHeight;
    case "letter-spacing":
      return computed.letterSpacing;
    case "text-align":
      return computed.textAlign;
    case "text-color":
      return computed.color;
    case "background-color":
      return computed.backgroundColor;
    case "opacity":
      return computed.opacity || "1";
    case "gap":
      return computed.gap || "0px";
    case "border-width": {
      const prop = side ? `border${capitalize(side)}Width` : "borderTopWidth";
      return (computed as any)[prop] || "0px";
    }
    case "border-style": {
      const prop = side ? `border${capitalize(side)}Style` : "borderTopStyle";
      return (computed as any)[prop] || "none";
    }
    case "border-color": {
      const prop = side ? `border${capitalize(side)}Color` : "borderTopColor";
      return (computed as any)[prop] || "rgba(0,0,0,0)";
    }
    case "border-radius": {
      const segment = side ? CORNER_CSS_SEGMENT[side] : "TopLeft";
      const prop = `border${segment}Radius`;
      return (computed as any)[prop] || "0px";
    }
    default:
      return "";
  }
}
