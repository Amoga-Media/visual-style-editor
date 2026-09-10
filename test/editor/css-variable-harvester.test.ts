import { describe, it, expect } from "vitest";
import { extractCssCustomProperties } from "@/lib/dom/css-variable-harvester";

describe("CSS Custom Properties Harvester", () => {
  it("extracts hex, rgb, rgba, and hsl color tokens from :root blocks", () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          :root {
            --bg: #09090b;
            --ink: #fafafa;
            --accent: #3b82f6;
            --card: rgba(24, 24, 27, 0.65);
            --line: hsl(240, 5%, 84%);
            --font-main: 'Inter', sans-serif;
            --font-display: 'Plus Jakarta Sans', sans-serif;
          }
        </style>
      </head>
      <body></body>
      </html>
    `;

    const tokens = extractCssCustomProperties(html);
    expect(tokens.colors).toEqual([
      { name: "--bg", value: "#09090b" },
      { name: "--ink", value: "#fafafa" },
      { name: "--accent", value: "#3b82f6" },
      { name: "--card", value: "rgba(24, 24, 27, 0.65)" },
      { name: "--line", value: "hsl(240, 5%, 84%)" },
    ]);
    expect(tokens.fonts).toEqual([
      { name: "--font-main", stack: "'Inter', sans-serif" },
      { name: "--font-display", stack: "'Plus Jakarta Sans', sans-serif" },
    ]);
  });

  it("handles documents without :root or without custom properties gracefully", () => {
    const html = `<!DOCTYPE html><html><head><style>body { margin: 0; }</style></head><body></body></html>`;
    const tokens = extractCssCustomProperties(html);
    expect(tokens.colors).toEqual([]);
    expect(tokens.fonts).toEqual([]);
  });
});
