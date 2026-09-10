import { formatHex, parse as parseColor, differenceEuclidean } from "culori";
import type { EditableProperty, ThemeMap } from "@/types";
import { DEFAULT_COLORS, DEFAULT_SPACING, DEFAULT_FONT_SIZE } from "./default-theme";

export interface ForwardMapOptions {
  snap: boolean;
  theme: ThemeMap;
}

const colorDistance = differenceEuclidean("oklch");

const SNAP_COLOR_THRESHOLD = 0.001;

function snapColor(value: string, theme: ThemeMap): string | null {
  const target = parseColor(value);
  if (!target) return null;
  const candidates = [
    ...theme.colors.map((c) => ({ name: c.name, hex: c.value })),
    ...DEFAULT_COLORS.map((c) => ({ name: c.name, hex: c.hex })),
  ];
  for (const candidate of candidates) {
    const parsed = parseColor(candidate.hex);
    if (parsed && colorDistance(target, parsed) < SNAP_COLOR_THRESHOLD) return candidate.name;
  }
  return null;
}

function forwardColor(value: string, options: ForwardMapOptions, prefix: "text" | "bg" | "border"): string {
  if (options.snap) {
    const match = snapColor(value, options.theme);
    if (match) return `${prefix}-${match}`;
  }
  const hex = formatHex(parseColor(value)) ?? value;
  return `${prefix}-[${hex}]`;
}

function forwardLength(
  numValue: number,
  unit: string,
  options: ForwardMapOptions,
  prefix: string,
  scale: { name: string; px: number }[]
): string {
  if (options.snap && unit === "px") {
    const match = scale.find((s) => s.px === numValue);
    if (match) return `${prefix}-${match.name}`;
  }
  return `${prefix}-[${numValue}${unit}]`;
}

function unitOf(value: string): string {
  const match = value.match(/(px|%|vw|vh|rem|em|pt)$/i);
  return match ? match[1].toLowerCase() : "px";
}

export function forwardMap(property: EditableProperty, value: string, options: ForwardMapOptions): string {
  switch (property) {
    case "width": {
      if (value === "auto") return "w-auto";
      if (value === "fit-content" || value === "fit") return "w-fit";
      if (value === "max-content" || value === "max") return "w-max";
      if (value === "min-content" || value === "min") return "w-min";
      if (options.snap !== false) {
        if (value === "100%") return "w-full";
        if (value === "100vw") return "w-screen";
      }
      return forwardLength(parseFloat(value), unitOf(value), options, "w", DEFAULT_SPACING);
    }
    case "height": {
      if (value === "auto") return "h-auto";
      if (value === "fit-content" || value === "fit") return "h-fit";
      if (value === "max-content" || value === "max") return "h-max";
      if (value === "min-content" || value === "min") return "h-min";
      if (options.snap !== false) {
        if (value === "100%") return "h-full";
        if (value === "100vh") return "h-screen";
      }
      return forwardLength(parseFloat(value), unitOf(value), options, "h", DEFAULT_SPACING);
    }
    case "min-width": {
      const presets = ["0", "full", "min", "max", "fit"];
      if (presets.includes(value)) return `min-w-${value}`;
      return forwardLength(parseFloat(value), unitOf(value), options, "min-w", DEFAULT_SPACING);
    }
    case "max-width": {
      const presets = ["none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "full", "min", "max", "fit", "prose"];
      if (presets.includes(value)) return `max-w-${value}`;
      return forwardLength(parseFloat(value), unitOf(value), options, "max-w", DEFAULT_SPACING);
    }
    case "min-height": {
      const presets = ["0", "full", "screen", "min", "max", "fit"];
      if (presets.includes(value)) return `min-h-${value}`;
      return forwardLength(parseFloat(value), unitOf(value), options, "min-h", DEFAULT_SPACING);
    }
    case "max-height": {
      const presets = ["none", "full", "screen", "min", "max", "fit"];
      if (presets.includes(value)) return `max-h-${value}`;
      return forwardLength(parseFloat(value), unitOf(value), options, "max-h", DEFAULT_SPACING);
    }
    case "position":
      return value;
    case "top":
      return forwardLength(parseFloat(value), unitOf(value), options, "top", DEFAULT_SPACING);
    case "right":
      return forwardLength(parseFloat(value), unitOf(value), options, "right", DEFAULT_SPACING);
    case "bottom":
      return forwardLength(parseFloat(value), unitOf(value), options, "bottom", DEFAULT_SPACING);
    case "left":
      return forwardLength(parseFloat(value), unitOf(value), options, "left", DEFAULT_SPACING);
    case "z-index": {
      const zPresets = ["0", "10", "20", "30", "40", "50", "auto"];
      return zPresets.includes(value) ? `z-${value}` : `z-[${value}]`;
    }
    case "overflow":
      return `overflow-${value}`;
    case "cursor":
      return `cursor-${value}`;
    case "backdrop-blur": {
      const blurPresets = ["none", "sm", "md", "lg", "xl", "2xl", "3xl"];
      if (blurPresets.includes(value)) return value === "md" ? "backdrop-blur" : `backdrop-blur-${value}`;
      return `backdrop-blur-[${value}]`;
    }
    case "rotate": {
      const rotPresets = ["0", "1", "2", "3", "6", "12", "45", "90", "180"];
      if (rotPresets.includes(value)) return `rotate-${value}`;
      const deg = value.endsWith("deg") ? value : `${value}deg`;
      return `rotate-[${deg}]`;
    }
    case "scale": {
      const scalePresets = ["0", "50", "75", "90", "95", "100", "105", "110", "125", "150"];
      if (scalePresets.includes(value)) return `scale-${value}`;
      return `scale-[${value}]`;
    }
    case "padding":
      return forwardLength(parseFloat(value), unitOf(value), options, "p", DEFAULT_SPACING);
    case "padding-top":
      return forwardLength(parseFloat(value), unitOf(value), options, "pt", DEFAULT_SPACING);
    case "padding-right":
      return forwardLength(parseFloat(value), unitOf(value), options, "pr", DEFAULT_SPACING);
    case "padding-bottom":
      return forwardLength(parseFloat(value), unitOf(value), options, "pb", DEFAULT_SPACING);
    case "padding-left":
      return forwardLength(parseFloat(value), unitOf(value), options, "pl", DEFAULT_SPACING);
    case "margin":
      return forwardLength(parseFloat(value), unitOf(value), options, "m", DEFAULT_SPACING);
    case "margin-top":
      return forwardLength(parseFloat(value), unitOf(value), options, "mt", DEFAULT_SPACING);
    case "margin-right":
      return forwardLength(parseFloat(value), unitOf(value), options, "mr", DEFAULT_SPACING);
    case "margin-bottom":
      return forwardLength(parseFloat(value), unitOf(value), options, "mb", DEFAULT_SPACING);
    case "margin-left":
      return forwardLength(parseFloat(value), unitOf(value), options, "ml", DEFAULT_SPACING);
    case "opacity":
      return `opacity-[${value}]`;
    case "gap":
      return forwardLength(parseFloat(value), unitOf(value), options, "gap", DEFAULT_SPACING);
    case "font-size":
      return forwardLength(parseFloat(value), unitOf(value), options, "text", DEFAULT_FONT_SIZE);
    case "line-height":
      return `leading-[${value}]`;
    case "letter-spacing":
      return `tracking-[${value}]`;
    case "text-align":
      return `text-${value}`;
    case "font-weight": {
      const namedWeights: Record<string, string> = {
        thin: "font-thin",
        extralight: "font-extralight",
        light: "font-light",
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
        extrabold: "font-extrabold",
        black: "font-black",
      };
      const clean = value.toLowerCase().trim();
      return namedWeights[clean] ?? `font-[${value}]`;
    }
    case "font-family": {
      const foundTheme = options.theme.fonts.find((f) => f.stack === value || f.name.toLowerCase() === value.toLowerCase());
      return foundTheme ? `font-${foundTheme.name}` : value;
    }
    case "font-style":
      return value === "italic" ? "italic" : "not-italic";
    case "text-transform":
      return value === "uppercase"
        ? "uppercase"
        : value === "lowercase"
        ? "lowercase"
        : value === "capitalize"
        ? "capitalize"
        : "normal-case";
    case "text-decoration":
      return value === "underline"
        ? "underline"
        : value === "line-through"
        ? "line-through"
        : "no-underline";
    case "border-width":
      return `border-[${value}]`;
    case "border-style":
      return value === "none" ? "" : `border-${value}`;
    case "border-radius":
      return `rounded-[${value}]`;
    case "text-color":
      return forwardColor(value, options, "text");
    case "background-color":
      return forwardColor(value, options, "bg");
    case "border-color":
      return forwardColor(value, options, "border");
    case "fill":
      return value === "currentColor" ? "fill-current" : value === "transparent" ? "fill-transparent" : `fill-[${value}]`;
    case "stroke":
      return value === "currentColor" ? "stroke-current" : value === "transparent" ? "stroke-transparent" : `stroke-[${value}]`;
    case "stroke-width":
      return `stroke-[${value}]`;
    case "aspect-ratio":
      return value === "auto" ? "aspect-auto" : value === "1 / 1" || value === "1/1" ? "aspect-square" : value === "16 / 9" || value === "16/9" ? "aspect-video" : `aspect-[${value}]`;
    case "object-fit":
      return `object-${value}`;
    case "object-position":
      return `object-${value}`;
    case "display": {
      const displayMap: Record<string, string> = {
        block: "block",
        "inline-block": "inline-block",
        inline: "inline",
        flex: "flex",
        "inline-flex": "inline-flex",
        grid: "grid",
        "inline-grid": "inline-grid",
        contents: "contents",
        none: "hidden",
        hidden: "hidden",
      };
      return displayMap[value.toLowerCase().trim()] ?? (value ? `[display:${value}]` : "");
    }
    case "flex-direction": {
      const dirMap: Record<string, string> = {
        row: "flex-row",
        "row-reverse": "flex-row-reverse",
        column: "flex-col",
        "column-reverse": "flex-col-reverse",
      };
      return dirMap[value.toLowerCase().trim()] ?? (value ? `flex-[${value}]` : "");
    }
    case "flex-wrap": {
      const wrapMap: Record<string, string> = {
        nowrap: "flex-nowrap",
        wrap: "flex-wrap",
        "wrap-reverse": "flex-wrap-reverse",
      };
      return wrapMap[value.toLowerCase().trim()] ?? (value ? `flex-[${value}]` : "");
    }
    case "justify-content": {
      const justifyMap: Record<string, string> = {
        start: "justify-start",
        "flex-start": "justify-start",
        end: "justify-end",
        "flex-end": "justify-end",
        center: "justify-center",
        between: "justify-between",
        "space-between": "justify-between",
        around: "justify-around",
        "space-around": "justify-around",
        evenly: "justify-evenly",
        "space-evenly": "justify-evenly",
        stretch: "justify-stretch",
        normal: "justify-normal",
      };
      return justifyMap[value.toLowerCase().trim()] ?? `justify-[${value}]`;
    }
    case "align-items": {
      const itemsMap: Record<string, string> = {
        start: "items-start",
        "flex-start": "items-start",
        end: "items-end",
        "flex-end": "items-end",
        center: "items-center",
        baseline: "items-baseline",
        stretch: "items-stretch",
      };
      return itemsMap[value.toLowerCase().trim()] ?? `items-[${value}]`;
    }
    case "align-content": {
      const contentMap: Record<string, string> = {
        start: "content-start",
        "flex-start": "content-start",
        end: "content-end",
        "flex-end": "content-end",
        center: "content-center",
        between: "content-between",
        "space-between": "content-between",
        around: "content-around",
        "space-around": "content-around",
        evenly: "content-evenly",
        "space-evenly": "content-evenly",
        baseline: "content-baseline",
        stretch: "content-stretch",
      };
      return contentMap[value.toLowerCase().trim()] ?? `content-[${value}]`;
    }
    case "align-self": {
      const selfMap: Record<string, string> = {
        auto: "self-auto",
        start: "self-start",
        "flex-start": "self-start",
        end: "self-end",
        "flex-end": "self-end",
        center: "self-center",
        stretch: "self-stretch",
        baseline: "self-baseline",
      };
      return selfMap[value.toLowerCase().trim()] ?? `self-[${value}]`;
    }
    case "row-gap":
      return forwardLength(parseFloat(value), unitOf(value), options, "gap-y", DEFAULT_SPACING);
    case "column-gap":
      return forwardLength(parseFloat(value), unitOf(value), options, "gap-x", DEFAULT_SPACING);
    case "flex-grow":
      return value === "1" || value === "true" ? "grow" : value === "0" ? "grow-0" : `grow-[${value}]`;
    case "flex-shrink":
      return value === "1" || value === "true" ? "shrink" : value === "0" ? "shrink-0" : `shrink-[${value}]`;
    case "flex-basis":
      return value === "auto" ? "basis-auto" : `basis-[${value}]`;
    case "order": {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 1 && num <= 12) return `order-${num}`;
      if (value === "first" || value === "last" || value === "none") return `order-${value}`;
      return `order-[${value}]`;
    }
    case "grid-template-columns": {
      const numMatch = value.match(/^repeat\((\d+),\s*(minmax\(0,\s*1fr\)|1fr)\)$/);
      if (numMatch) {
        const count = parseInt(numMatch[1], 10);
        if (count >= 1 && count <= 12) return `grid-cols-${count}`;
      }
      const directNum = parseInt(value, 10);
      if (!isNaN(directNum) && String(directNum) === value.trim() && directNum >= 1 && directNum <= 12) {
        return `grid-cols-${directNum}`;
      }
      if (value === "none") return "grid-cols-none";
      return `grid-cols-[${value}]`;
    }
    case "grid-template-rows": {
      const numMatch = value.match(/^repeat\((\d+),\s*(minmax\(0,\s*1fr\)|1fr)\)$/);
      if (numMatch) {
        const count = parseInt(numMatch[1], 10);
        if (count >= 1 && count <= 6) return `grid-rows-${count}`;
      }
      const directNum = parseInt(value, 10);
      if (!isNaN(directNum) && String(directNum) === value.trim() && directNum >= 1 && directNum <= 6) {
        return `grid-rows-${directNum}`;
      }
      if (value === "none") return "grid-rows-none";
      return `grid-rows-[${value}]`;
    }
    case "grid-auto-flow": {
      const flowMap: Record<string, string> = {
        row: "grid-flow-row",
        column: "grid-flow-col",
        col: "grid-flow-col",
        dense: "grid-flow-dense",
        "row dense": "grid-flow-row-dense",
        "column dense": "grid-flow-col-dense",
        "col dense": "grid-flow-col-dense",
      };
      return flowMap[value.toLowerCase().trim()] ?? `grid-flow-[${value}]`;
    }
    case "place-items": {
      const placeMap: Record<string, string> = {
        start: "place-items-start",
        end: "place-items-end",
        center: "place-items-center",
        baseline: "place-items-baseline",
        stretch: "place-items-stretch",
      };
      return placeMap[value.toLowerCase().trim()] ?? `place-items-[${value}]`;
    }
    case "place-content": {
      const placeMap: Record<string, string> = {
        center: "place-content-center",
        start: "place-content-start",
        end: "place-content-end",
        between: "place-content-between",
        around: "place-content-around",
        evenly: "place-content-evenly",
        baseline: "place-content-baseline",
        stretch: "place-content-stretch",
      };
      return placeMap[value.toLowerCase().trim()] ?? `place-content-[${value}]`;
    }
    case "place-self": {
      const placeMap: Record<string, string> = {
        auto: "place-self-auto",
        start: "place-self-start",
        end: "place-self-end",
        center: "place-self-center",
        stretch: "place-self-stretch",
      };
      return placeMap[value.toLowerCase().trim()] ?? `place-self-[${value}]`;
    }
    case "text-content":
      return "";
    default:
      return "";
  }
}
