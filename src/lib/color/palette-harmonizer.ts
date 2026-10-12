import { formatHex, parse, oklch, interpolate, samples } from "culori";

export interface HarmonizedPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  shades: string[]; // 9 values: shade 100 (lightest) to 900 (darkest)
}

const FALLBACK = "#6366F1"; // Indigo fallback

/**
 * Generates a harmonized 4-role + 9-shade palette from a brand hex using OKLCH.
 *
 * Roles:
 *   primary   = the input hex
 *   secondary = hue + 30°
 *   accent    = hue + 60°
 *   neutral   = same hue, 8% chroma, 50% lightness
 *
 * Shades:
 *   9 interpolated colors from very light (100) to very dark (900) using OKLCH.
 *
 * Falls back to #6366F1 (indigo) if the input is invalid.
 */
export function generateHarmonizedPalette(brandHex: string, _depth = 0): HarmonizedPalette {
  // Depth guard to prevent infinite recursion on catastrophic fallback failure
  if (_depth > 1) {
    return {
      primary: FALLBACK,
      secondary: FALLBACK,
      accent: FALLBACK,
      neutral: "#888888",
      shades: Array(9).fill(FALLBACK),
    };
  }

  const parsed = parse(brandHex);
  if (!parsed) return generateHarmonizedPalette(FALLBACK, _depth + 1);

  const lchColor = oklch(parsed);
  if (!lchColor) return generateHarmonizedPalette(FALLBACK, _depth + 1);

  const { h = 0, c, l } = lchColor;

  const toHex = (hue: number, chroma = c, lightness = l): string =>
    formatHex(oklch({ mode: "oklch", l: lightness, c: chroma, h: hue % 360 })) ?? FALLBACK;

  const primary = formatHex(parsed) ?? FALLBACK;
  const secondary = toHex(h + 30);
  const accent = toHex(h + 60);
  const neutral = toHex(h, (c ?? 0) * 0.08, 0.5);

  // Build a 9-shade scale using OKLCH interpolation
  const interp = interpolate(
    [
      oklch({ mode: "oklch", l: 0.97, c: (c ?? 0) * 0.15, h }),
      oklch({ mode: "oklch", l, c, h }),
      oklch({ mode: "oklch", l: 0.18, c: (c ?? 0) * 0.6, h }),
    ],
    "oklch"
  );
  const shades = samples(9).map((t: number) => formatHex(interp(t)) ?? "#000000");

  return { primary, secondary, accent, neutral, shades };
}
