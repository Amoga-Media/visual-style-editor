import { buildLocationMap } from "./build-location-map";
import { detectTailwindMode } from "../tailwind/detect-mode";
import { parseV3Theme } from "../tailwind/theme-v3";
import { parseV4Theme } from "../tailwind/theme-v4";
import { extractCssCustomProperties } from "../dom/css-variable-harvester";
import type { AnalyzeResponse, ThemeMap, ProjectConfig } from "@/types";

export function analyzeHtmlClientSide(html: string, projectConfig?: ProjectConfig | null): AnalyzeResponse {
  const { locations } = buildLocationMap(html);
  let tailwindMode = detectTailwindMode(html);

  // If project has an uploaded tailwind config and doc has no Tailwind CDN, adopt v3 mode
  if (tailwindMode === "none" && projectConfig?.tailwindConfig) {
    tailwindMode = "v3";
  }

  let theme: ThemeMap = { mode: tailwindMode, colors: [], fonts: [] };
  if (tailwindMode === "v3-cdn" || tailwindMode === "v3") {
    const { colors, fonts } = parseV3Theme(html);
    theme = { mode: tailwindMode, colors, fonts };
  } else if (tailwindMode === "v4-cdn") {
    const { colors, fonts } = parseV4Theme(html);
    theme = { mode: "v4-cdn", colors, fonts };
  }

  // Merge project-level Tailwind config if present
  if (projectConfig?.tailwindConfig?.theme) {
    const cfgTheme = projectConfig.tailwindConfig.theme;
    if (cfgTheme.colors) {
      for (const c of cfgTheme.colors) {
        if (!theme.colors.some((existing) => existing.name === c.name)) {
          theme.colors.push(c);
        }
      }
    }
    if (cfgTheme.fonts) {
      for (const f of cfgTheme.fonts) {
        if (!theme.fonts.some((existing) => existing.name === f.name)) {
          theme.fonts.push(f);
        }
      }
    }
  }

  // Merge project-level custom styles if present
  if (projectConfig?.customStyles?.extractedTheme) {
    const cssTheme = projectConfig.customStyles.extractedTheme;
    if (cssTheme.colors) {
      for (const c of cssTheme.colors) {
        if (!theme.colors.some((existing) => existing.name === c.name || existing.value === c.value)) {
          theme.colors.push(c);
        }
      }
    }
    if (cssTheme.fonts) {
      for (const f of cssTheme.fonts) {
        if (!theme.fonts.some((existing) => existing.name === f.name)) {
          theme.fonts.push(f);
        }
      }
    }
  }

  // Also harvest CSS custom properties from in-document :root blocks
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
