import type { ThemeColorToken, ThemeFontToken } from "@/types";

const COLOR_REGEX = /^(?:#(?:[0-9a-fA-F]{3,8})|rgba?\([^)]+\)|hsla?\([^)]+\))$/i;

export function extractCssCustomProperties(html: string): {
  colors: ThemeColorToken[];
  fonts: ThemeFontToken[];
} {
  const colors: ThemeColorToken[] = [];
  const fonts: ThemeFontToken[] = [];

  const styleTagRe = /<style(?![^>]*\bid=["']vse-)[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;

  while ((match = styleTagRe.exec(html))) {
    const css = match[1];
    const rootRe = /:root\s*\{([\s\S]*?)\}/gi;
    let rootMatch: RegExpExecArray | null;

    while ((rootMatch = rootRe.exec(css))) {
      const declarations = rootMatch[1].split(";");
      for (const decl of declarations) {
        const colonIdx = decl.indexOf(":");
        if (colonIdx === -1) continue;
        const rawKey = decl.slice(0, colonIdx).trim();
        const rawVal = decl.slice(colonIdx + 1).trim();

        if (rawKey.startsWith("--") && rawVal) {
          // Check if value is a color (exact or ends with comment / extra whitespace cleaned)
          const cleanVal = rawVal.replace(/\/\*[\s\S]*?\*\//g, "").trim();
          if (COLOR_REGEX.test(cleanVal)) {
            colors.push({ name: rawKey, value: cleanVal });
          } else if (
            rawKey.includes("font") ||
            rawKey.includes("family") ||
            cleanVal.includes("sans-serif") ||
            cleanVal.includes("serif") ||
            cleanVal.includes("monospace") ||
            cleanVal.includes("system-ui")
          ) {
            fonts.push({ name: rawKey, stack: cleanVal });
          }
        }
      }
    }
  }

  return { colors, fonts };
}
