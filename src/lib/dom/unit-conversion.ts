import type { EditableProperty } from "@/types";

export type SupportedUnit = "px" | "%" | "pt" | "rem" | "em" | "vw" | "vh";

export interface ConvertUnitOptions {
  property?: EditableProperty | string;
  element?: Element | null;
  viewport?: "desktop" | "tablet" | "mobile";
  referenceWidth?: number;
  referenceHeight?: number;
  baseFontSize?: number;
}

const VIEWPORT_WIDTHS: Record<string, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

const VIEWPORT_HEIGHTS: Record<string, number> = {
  desktop: 800,
  tablet: 1024,
  mobile: 812,
};

const VERTICAL_PROPERTIES = new Set([
  "height",
  "min-height",
  "max-height",
  "top",
  "bottom",
  "padding-top",
  "padding-bottom",
  "margin-top",
  "margin-bottom",
  "row-gap",
]);

const TYPOGRAPHY_PROPERTIES = new Set([
  "font-size",
  "line-height",
  "letter-spacing",
]);

/**
 * Converts any CSS numeric length from one unit to another with mathematical precision.
 * 
 * E.g.:
 * - 67px to pt -> 50.25pt
 * - 50.25pt to px -> 67px
 * - 32px to rem -> 2rem
 * - 24px font-size to % -> 150%
 * - 600px width on 1200px desktop container to % -> 50%
 */
export function convertUnit(
  amount: number,
  fromUnit: string,
  toUnit: string,
  options: ConvertUnitOptions = {}
): number {
  const normFrom = (fromUnit || "px").toLowerCase().trim() as SupportedUnit;
  const normTo = (toUnit || "px").toLowerCase().trim() as SupportedUnit;

  if (normFrom === normTo) return amount;
  if (isNaN(amount)) return 0;

  const viewport = options.viewport || "desktop";
  const baseFontSize = options.baseFontSize ?? 16;
  const viewportWidth = options.referenceWidth ?? VIEWPORT_WIDTHS[viewport] ?? 1200;
  const viewportHeight = options.referenceHeight ?? VIEWPORT_HEIGHTS[viewport] ?? 800;

  const property = options.property || "";
  const isVertical = VERTICAL_PROPERTIES.has(property);
  const isTypography = TYPOGRAPHY_PROPERTIES.has(property);

  // Compute reference container dimension for percentages
  let containerDimension = isVertical ? viewportHeight : viewportWidth;
  if (options.element) {
    const parent = options.element.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      if (isVertical && parentRect.height > 0) {
        containerDimension = parentRect.height;
      } else if (!isVertical && parentRect.width > 0) {
        containerDimension = parentRect.width;
      }
    }
  }

  // 1. Convert source unit to standard base pixels (px)
  let pxValue = 0;
  switch (normFrom) {
    case "px":
      pxValue = amount;
      break;
    case "pt":
      // 1 pt = 96/72 px = 4/3 px ≈ 1.333333 px
      pxValue = amount * (96 / 72);
      break;
    case "rem":
    case "em":
      pxValue = amount * baseFontSize;
      break;
    case "%":
      if (isTypography) {
        pxValue = (amount * baseFontSize) / 100;
      } else {
        pxValue = (amount * containerDimension) / 100;
      }
      break;
    case "vw":
      pxValue = (amount * viewportWidth) / 100;
      break;
    case "vh":
      pxValue = (amount * viewportHeight) / 100;
      break;
    default:
      pxValue = amount;
  }

  // 2. Convert base pixels (px) to target unit
  let targetValue = 0;
  switch (normTo) {
    case "px":
      targetValue = pxValue;
      break;
    case "pt":
      // 1 px = 72/96 pt = 0.75 pt
      targetValue = pxValue * (72 / 96);
      break;
    case "rem":
    case "em":
      targetValue = pxValue / baseFontSize;
      break;
    case "%":
      if (isTypography) {
        targetValue = (pxValue / baseFontSize) * 100;
      } else {
        targetValue = (pxValue / containerDimension) * 100;
      }
      break;
    case "vw":
      targetValue = (pxValue / viewportWidth) * 100;
      break;
    case "vh":
      targetValue = (pxValue / viewportHeight) * 100;
      break;
    default:
      targetValue = pxValue;
  }

  if (!isFinite(targetValue) || isNaN(targetValue)) {
    return 0;
  }

  // Round cleanly (up to 2 decimal places, no spurious floating point junk)
  const rounded = Math.round(targetValue * 100) / 100;
  return rounded;
}
