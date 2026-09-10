import { buildLocationMap } from "./build-location-map";
import { detectTailwindMode } from "../tailwind/detect-mode";
import { parseV3Theme } from "../tailwind/theme-v3";
import { parseV4Theme } from "../tailwind/theme-v4";
import { extractCssCustomProperties } from "../dom/css-variable-harvester";
import type { AnalyzeResponse, ThemeMap } from "@/types";

export function analyzeHtmlClientSide(html: string): AnalyzeResponse {
  const { locations } = buildLocationMap(html);
  const tailwindMode = detectTailwindMode(html);

  let theme: ThemeMap = { mode: tailwindMode, colors: [], fonts: [] };
  if (tailwindMode === "v3-cdn") {
    const { colors, fonts } = parseV3Theme(html);
    theme = { mode: "v3-cdn", colors, fonts };
  } else if (tailwindMode === "v4-cdn") {
    const { colors, fonts } = parseV4Theme(html);
    theme = { mode: "v4-cdn", colors, fonts };
  }

  // Also harvest CSS custom properties from :root blocks (e.g. Vanilla CSS files)
  try {
    const cssVars = extractCssCustomProperties(html);
    const mergedColors = [...theme.colors];
    for (const c of cssVars.colors) {
      if (!mergedColors.some((existing) => existing.name === c.name || existing.value === c.value)) {
        mergedColors.push(c);
      }
    }
    const mergedFonts = [...theme.fonts];
    for (const f of cssVars.fonts) {
      if (!mergedFonts.some((existing) => existing.name === f.name)) {
        mergedFonts.push(f);
      }
    }
    theme.colors = mergedColors;
    theme.fonts = mergedFonts;
  } catch {}

  return {
    locations,
    tailwindMode,
    theme,
  };
}
