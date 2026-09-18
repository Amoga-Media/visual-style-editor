import { describe, it, expect } from "vitest";
import { parseCssThemeContent } from "@/lib/tailwind/css-theme-parser";

describe("css-theme-parser", () => {
  it("extracts Tailwind v4 @theme tokens", () => {
    const css = `
      @theme {
        --color-brand-primary: #6366f1;
        --color-brand-accent: #ec4899;
        --font-heading: 'Outfit', sans-serif;
      }
    `;

    const result = parseCssThemeContent(css, "style.css");
    expect(result.colors).toContainEqual({ name: "brand-primary", value: "#6366f1" });
    expect(result.colors).toContainEqual({ name: "brand-accent", value: "#ec4899" });
    expect(result.fonts).toContainEqual({ name: "heading", stack: "'Outfit', sans-serif" });
    expect(result.injectableCss).toBe(css);
  });

  it("extracts standard :root CSS custom properties", () => {
    const css = `
      :root {
        --primary: #2563eb;
        --surface-dark: #0f172a;
        --font-sans: 'Inter', sans-serif;
      }
    `;

    const result = parseCssThemeContent(css, "globals.css");
    expect(result.colors).toContainEqual({ name: "primary", value: "#2563eb" });
    expect(result.colors).toContainEqual({ name: "surface-dark", value: "#0f172a" });
    expect(result.fonts).toContainEqual({ name: "sans", stack: "'Inter', sans-serif" });
  });
});
