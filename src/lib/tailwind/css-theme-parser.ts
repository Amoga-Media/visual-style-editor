import type { ThemeColorToken, ThemeFontToken } from "@/types";
import { extractCssCustomProperties } from "../dom/css-variable-harvester";

/**
 * Parses uploaded style.css / globals.css / stylesheet content.
 * Extracts:
 * 1. :root and CSS custom properties (--color-*, --primary, --font-*)
 * 2. Tailwind v4 @theme { --color-*: ...; --font-*: ...; }
 * 3. Returns extracted theme tokens and sanitized CSS for iframe injection.
 */
export function parseCssThemeContent(
  cssContent: string,
  fileName = "style.css"
): {
  colors: ThemeColorToken[];
  fonts: ThemeFontToken[];
  injectableCss: string;
} {
  const colors: ThemeColorToken[] = [];
  const fonts: ThemeFontToken[] = [];

  if (!cssContent || typeof cssContent !== "string") {
    return { colors: [], fonts: [], injectableCss: "" };
  }

  // 1. Extract Tailwind v4 @theme blocks
  const themeBlockRe = /@theme\s*\{([\s\S]*?)\}/gi;
  let themeMatch: RegExpExecArray | null;
  while ((themeMatch = themeBlockRe.exec(cssContent))) {
    const blockContent = themeMatch[1];
    // --color-primary: #3b82f6;
    const colorDeclRe = /--color-([\w-]+)\s*:\s*([^;]+);/gi;
    let colorMatch: RegExpExecArray | null;
    while ((colorMatch = colorDeclRe.exec(blockContent))) {
      const name = colorMatch[1];
      const value = colorMatch[2].trim();
      if (!colors.some((c) => c.name === name)) {
        colors.push({ name, value });
      }
    }

    // --font-sans: 'Inter', sans-serif;
    const fontDeclRe = /--font-([\w-]+)\s*:\s*([^;]+);/gi;
    let fontMatch: RegExpExecArray | null;
    while ((fontMatch = fontDeclRe.exec(blockContent))) {
      const name = fontMatch[1];
      const stack = fontMatch[2].trim();
      if (!fonts.some((f) => f.name === name)) {
        fonts.push({ name, stack });
      }
    }
  }

  // 2. Extract standard :root CSS variables directly from raw CSS
  const COLOR_REGEX = /^(?:#(?:[0-9a-fA-F]{3,8})|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\))$/i;
  const rootRe = /:root\s*\{([\s\S]*?)\}/gi;
  let rootMatch: RegExpExecArray | null;
  while ((rootMatch = rootRe.exec(cssContent))) {
    const declarations = rootMatch[1].split(";");
    for (const decl of declarations) {
      const colonIdx = decl.indexOf(":");
      if (colonIdx === -1) continue;
      const rawKey = decl.slice(0, colonIdx).trim();
      const rawVal = decl.slice(colonIdx + 1).trim();

      if (rawKey.startsWith("--") && rawVal) {
        const cleanName = rawKey.startsWith("--color-") ? rawKey.slice(8) : rawKey.startsWith("--") ? rawKey.slice(2) : rawKey;
        const cleanVal = rawVal.replace(/\/\*[\s\S]*?\*\//g, "").trim();
        if (COLOR_REGEX.test(cleanVal)) {
          if (!colors.some((c) => c.name === cleanName || c.name === rawKey)) {
            colors.push({ name: cleanName, value: cleanVal });
          }
        } else if (
          rawKey.includes("font") ||
          rawKey.includes("family") ||
          cleanVal.includes("sans-serif") ||
          cleanVal.includes("serif") ||
          cleanVal.includes("monospace") ||
          cleanVal.includes("system-ui")
        ) {
          const fontName = rawKey.startsWith("--font-") ? rawKey.slice(7) : cleanName;
          if (!fonts.some((f) => f.name === fontName || f.name === rawKey)) {
            fonts.push({ name: fontName, stack: cleanVal });
          }
        }
      }
    }
  }

  return {
    colors,
    fonts,
    injectableCss: cssContent,
  };
}
