import { describe, it, expect } from "vitest";
import { parseV4Theme } from "@/lib/tailwind/theme-v4";

describe("parseV4Theme", () => {
  it("extracts custom @theme color tokens in style tag", () => {
    const html = `
      <style type="text/tailwindcss">
        @theme {
          --color-brand: #ff5722;
          --font-display: Inter, sans-serif;
        }
      </style>
    `;
    const theme = parseV4Theme(html);
    expect(theme.colors).toEqual([{ name: "brand", value: "#ff5722" }]);
    expect(theme.fonts).toEqual([{ name: "display", stack: "Inter, sans-serif" }]);
  });
});
