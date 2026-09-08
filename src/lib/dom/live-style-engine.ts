import { forwardMap } from "@/lib/tailwind/forward-map";
import { applyClassMutation } from "@/lib/dom/class-list-mutation";
import { useSettingsStore } from "@/store/settings-store";
import { setResponsiveStyle } from "@/lib/dom/responsive-style-engine";
import { loadFontInDocument, cleanFontFamilyName } from "@/lib/fonts/google-fonts";
import type { EditableProperty, EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "@/components/editor/Toolbar";

export function isStyleableElement(el: unknown): el is HTMLElement | SVGElement {
  return el !== null && typeof el === "object" && "style" in el;
}

export const PROPERTY_TO_CSS: Record<string, string> = {
  width: "width",
  height: "height",
  "min-width": "min-width",
  "max-width": "max-width",
  "min-height": "min-height",
  "max-height": "max-height",
  position: "position",
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
  "z-index": "z-index",
  overflow: "overflow",
  cursor: "cursor",
  padding: "padding",
  "padding-top": "padding-top",
  "padding-right": "padding-right",
  "padding-bottom": "padding-bottom",
  "padding-left": "padding-left",
  margin: "margin",
  "margin-top": "margin-top",
  "margin-right": "margin-right",
  "margin-bottom": "margin-bottom",
  "margin-left": "margin-left",
  "font-size": "font-size",
  "font-weight": "font-weight",
  "font-family": "font-family",
  "font-style": "font-style",
  "text-transform": "text-transform",
  "text-decoration": "text-decoration",
  "line-height": "line-height",
  "letter-spacing": "letter-spacing",
  "text-align": "text-align",
  "border-width": "border-width",
  "border-style": "border-style",
  "border-radius": "border-radius",
  "border-color": "border-color",
  "border-top-width": "border-top-width",
  "border-right-width": "border-right-width",
  "border-bottom-width": "border-bottom-width",
  "border-left-width": "border-left-width",
  "border-top-left-radius": "border-top-left-radius",
  "border-top-right-radius": "border-top-right-radius",
  "border-bottom-right-radius": "border-bottom-right-radius",
  "border-bottom-left-radius": "border-bottom-left-radius",
  "text-color": "color",
  "background-color": "background-color",
  opacity: "opacity",
  "backdrop-blur": "backdrop-filter",
  rotate: "rotate",
  scale: "scale",
  gap: "gap",
  "row-gap": "row-gap",
  "column-gap": "column-gap",
  "box-shadow": "box-shadow",
  display: "display",
  "justify-content": "justify-content",
  "align-items": "align-items",
  "flex-direction": "flex-direction",
  "object-fit": "object-fit",
  "object-position": "object-position",
  "aspect-ratio": "aspect-ratio",
  fill: "fill",
  stroke: "stroke",
  "stroke-width": "stroke-width",
};

export function resolvePropertyForSide(property: string, side?: string): string {
  if (!side) return PROPERTY_TO_CSS[property] || property;

  if (property === "border-radius") {
    switch (side) {
      case "top-left":
        return "border-top-left-radius";
      case "top-right":
        return "border-top-right-radius";
      case "bottom-right":
        return "border-bottom-right-radius";
      case "bottom-left":
        return "border-bottom-left-radius";
    }
  }

  if (property === "border-width") {
    switch (side) {
      case "top":
        return "border-top-width";
      case "right":
        return "border-right-width";
      case "bottom":
        return "border-bottom-width";
      case "left":
        return "border-left-width";
    }
  }

  if (property === "padding") {
    switch (side) {
      case "top":
        return "padding-top";
      case "right":
        return "padding-right";
      case "bottom":
        return "padding-bottom";
      case "left":
        return "padding-left";
    }
  }

  if (property === "margin") {
    switch (side) {
      case "top":
        return "margin-top";
      case "right":
        return "margin-right";
      case "bottom":
        return "margin-bottom";
      case "left":
        return "margin-left";
    }
  }

  return PROPERTY_TO_CSS[property] || property;
}

export function formatCssValue(property: string, value: string, side?: string): { prop: string; val: string } {
  const cssProp = resolvePropertyForSide(property, side);
  if (property === "backdrop-blur") {
    if (!value || value === "none" || value === "0px") return { prop: "backdrop-filter", val: "none" };
    const blurVal = value.includes("px") ? value : `${value}px`;
    return { prop: "backdrop-filter", val: `blur(${blurVal})` };
  }
  if (property === "rotate") {
    const deg = value.endsWith("deg") ? value : `${value}deg`;
    return { prop: "rotate", val: deg };
  }
  if (property === "scale") {
    return { prop: "scale", val: value };
  }
  return { prop: cssProp, val: value };
}

/**
 * 60fps Real-Time Live Preview Engine.
 * Modifies the element directly as the user drags sliders or selects colors.
 */
export function applyLiveStyle(
  element: Element,
  property: EditableProperty | string,
  value: string,
  theme?: ThemeMap,
  side?: any,
  viewport: ViewportMode = "desktop",
  structuralPath?: string
) {
  if (!isStyleableElement(element)) return;

  const { prop: cssProp, val: formattedVal } = formatCssValue(property, value, side);

  // 1. If modifying border-width and element has no border-style, supply default solid style
  if ((property === "border-width" || cssProp.includes("border-")) && parseFloat(value) > 0) {
    const currentStyle = element.style.borderStyle || (element.ownerDocument?.defaultView || window).getComputedStyle(element).borderStyle;
    if (!currentStyle || currentStyle === "none") {
      element.style.setProperty("border-style", "solid", "important");
    }
  }

  // 2. If modifying text-color on gradient text that has -webkit-text-fill-color: transparent, override fill color
  if (property === "text-color" || cssProp === "color") {
    try {
      element.style.setProperty("-webkit-text-fill-color", formattedVal, "important");
    } catch {}
  }

  // 3. If modifying font-family, auto load Google Font if needed
  if (property === "font-family" || cssProp === "font-family") {
    try {
      loadFontInDocument(element.ownerDocument, cleanFontFamilyName(formattedVal));
    } catch {}
  }

  // 4. Handle Responsive Cascades
  if (viewport !== "desktop" && (structuralPath || element.getAttribute("data-vse-path"))) {
    const path = structuralPath || element.getAttribute("data-vse-path") || "";
    setResponsiveStyle(element, path, property, formattedVal, viewport, side);
  } else {
    // Desktop / Base Style
    try {
      element.style.setProperty(cssProp, formattedVal, "important");
      if (structuralPath || element.getAttribute("data-vse-path")) {
        const path = structuralPath || element.getAttribute("data-vse-path") || "";
        setResponsiveStyle(element, path, property, formattedVal, "desktop", side);
      }
    } catch {}
  }

  // 5. In Tailwind mode, also update className in real time
  if (theme && theme.mode !== "none") {
    try {
      const snap = useSettingsStore.getState().snapToDefaultScale;
      const newClass = forwardMap(property as EditableProperty, value, { snap, theme });
      if (newClass) {
        const oldClassList = Array.from(element.classList);
        const newClassList = applyClassMutation(
          oldClassList,
          property as EditableProperty,
          newClass,
          theme,
          side
        );
        element.className = newClassList.join(" ");
      } else if (property === "font-family") {
        // Strip conflicting generic font-* classes so inline font-family takes priority
        const oldClassList = Array.from(element.classList);
        const newClassList = oldClassList.filter((c) => !c.startsWith("font-sans") && !c.startsWith("font-serif") && !c.startsWith("font-mono"));
        if (newClassList.length !== oldClassList.length) {
          element.className = newClassList.join(" ");
        }
      }
    } catch {}
  }
}

/**
 * Commits the change to the persistent changeset store and undo stack when interaction finishes.
 */
export function commitStyleChange(
  element: Element,
  structuralPath: string,
  property: EditableProperty,
  value: string,
  theme: ThemeMap,
  onEdit?: (record: EditRecord) => void,
  baselineOldValue?: string,
  side?: any,
  viewport: ViewportMode = "desktop"
) {
  const { prop: targetProp, val: formattedVal } = formatCssValue(property, value, side);

  if (viewport !== "desktop") {
    setResponsiveStyle(element, structuralPath, property, formattedVal, viewport, side);
    onEdit?.({
      kind: "style",
      structuralPath,
      property,
      styleProperty: targetProp,
      oldStyleValue: baselineOldValue ?? "",
      newStyleValue: formattedVal,
      viewport,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Desktop viewport: record in responsive registry as base desktop value
  setResponsiveStyle(element, structuralPath, property, formattedVal, "desktop", side);

  // Font family: always apply directly to inline style with !important and strip conflicting generic classes
  if (property === "font-family" || targetProp === "font-family") {
    if (isStyleableElement(element)) {
      element.style.setProperty("font-family", formattedVal, "important");
      loadFontInDocument(element.ownerDocument, cleanFontFamilyName(formattedVal));
    }
    const oldClassList = Array.from(element.classList);
    const newClassList = oldClassList.filter((c) => !c.startsWith("font-sans") && !c.startsWith("font-serif") && !c.startsWith("font-mono"));
    if (newClassList.length !== oldClassList.length) {
      element.className = newClassList.join(" ");
    }
    onEdit?.({
      kind: "style",
      structuralPath,
      property,
      styleProperty: targetProp,
      oldStyleValue: baselineOldValue ?? "",
      newStyleValue: formattedVal,
      viewport: "desktop",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (theme?.mode === "none") {
    if (isStyleableElement(element)) {
      element.style.setProperty(targetProp, formattedVal);
      if (property === "text-color" || targetProp === "color") {
        element.style.setProperty("-webkit-text-fill-color", formattedVal);
      }
    }
    onEdit?.({
      kind: "style",
      structuralPath,
      property,
      styleProperty: targetProp,
      oldStyleValue: baselineOldValue ?? "",
      newStyleValue: formattedVal,
      viewport: "desktop",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const snap = useSettingsStore.getState().snapToDefaultScale;
  const newClass = forwardMap(property, value, { snap, theme });
  const oldClassList = Array.from(element.classList);
  const newClassList = applyClassMutation(oldClassList, property, newClass, theme, side);

  element.className = newClassList.join(" ");
  if (isStyleableElement(element)) {
    element.style.removeProperty(targetProp);
  }

  onEdit?.({
    kind: "class",
    structuralPath,
    property,
    oldClassList,
    newClassList,
    viewport: "desktop",
    timestamp: new Date().toISOString(),
  });
}
