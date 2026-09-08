import { buildLocationMap } from "./build-location-map";
import { detectTailwindMode } from "../tailwind/detect-mode";
import { parseV3Theme } from "../tailwind/theme-v3";
import { parseV4Theme } from "../tailwind/theme-v4";
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

  return {
    locations,
    tailwindMode,
    theme,
  };
}
