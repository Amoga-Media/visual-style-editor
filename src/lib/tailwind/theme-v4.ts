import type { ThemeColorToken, ThemeFontToken } from "@/types";

function extractThemeBlocks(html: string): string[] {
  const blocks: string[] = [];
  const styleTagRe = /<style[^>]*type=["']text\/tailwindcss["'][^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;
  while ((match = styleTagRe.exec(html))) {
    const themeRe = /@theme\s*\{([\s\S]*?)\}/g;
    let themeMatch: RegExpExecArray | null;
    while ((themeMatch = themeRe.exec(match[1]))) {
      blocks.push(themeMatch[1]);
    }
  }
  return blocks;
}

function extractDeclarations(block: string, prefix: string): { name: string; value: string }[] {
  const declRe = new RegExp(`--${prefix}-([\\w-]+)\\s*:\\s*([^;]+);`, "g");
  const results: { name: string; value: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = declRe.exec(block))) {
    results.push({ name: match[1], value: match[2].trim() });
  }
  return results;
}

export function parseV4Theme(html: string): { colors: ThemeColorToken[]; fonts: ThemeFontToken[] } {
  const blocks = extractThemeBlocks(html);
  const colors: ThemeColorToken[] = [];
  const fonts: ThemeFontToken[] = [];

  for (const block of blocks) {
    for (const { name, value } of extractDeclarations(block, "color")) {
      colors.push({ name, value });
    }
    for (const { name, value } of extractDeclarations(block, "font")) {
      fonts.push({ name, stack: value });
    }
  }

  return { colors, fonts };
}
