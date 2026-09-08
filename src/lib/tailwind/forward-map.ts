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
    case "width":
      return forwardLength(parseFloat(value), unitOf(value), options, "w", DEFAULT_SPACING);
    case "height":
      return forwardLength(parseFloat(value), unitOf(value), options, "h", DEFAULT_SPACING);
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
    case "font-weight":
      return `font-[${value}]`;
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
    case "text-content":
      return "";
  }
}
