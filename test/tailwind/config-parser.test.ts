import { describe, it, expect } from "vitest";
import { parseTailwindConfigContent } from "@/lib/tailwind/config-parser";

describe("tailwind config parser", () => {
  it("parses CommonJS module.exports with custom colors and fonts", () => {
    const raw = `
      module.exports = {
        theme: {
          extend: {
            colors: {
              brand: '#4f46e5',
              secondary: {
                light: '#a5b4fc',
                DEFAULT: '#6366f1',
                dark: '#4338ca'
              }
            },
            fontFamily: {
              display: ['Clash Display', 'sans-serif'],
              body: 'Inter, sans-serif'
            }
          }
        }
      };
    `;

    const result = parseTailwindConfigContent(raw, "tailwind.config.js");
    expect(result.colors).toContainEqual({ name: "brand", value: "#4f46e5" });
    expect(result.colors).toContainEqual({ name: "secondary-light", value: "#a5b4fc" });
    expect(result.colors).toContainEqual({ name: "secondary-DEFAULT", value: "#6366f1" });
    expect(result.fonts).toContainEqual({ name: "display", stack: "Clash Display, sans-serif" });
    expect(result.fonts).toContainEqual({ name: "body", stack: "Inter, sans-serif" });
  });

  it("parses ES Module export default", () => {
    const raw = `
      export default {
        theme: {
          colors: {
            accent: '#06b6d4',
            neon: '#10b981'
          }
        }
      };
    `;

    const result = parseTailwindConfigContent(raw, "tailwind.config.mjs");
    expect(result.colors).toContainEqual({ name: "accent", value: "#06b6d4" });
    expect(result.colors).toContainEqual({ name: "neon", value: "#10b981" });
  });

  it("parses JSON tailwind config", () => {
    const raw = JSON.stringify({
      theme: {
        extend: {
          colors: {
            purpleCustom: "#8b5cf6"
          }
        }
      }
    });

    const result = parseTailwindConfigContent(raw, "tailwind.config.json");
    expect(result.colors).toContainEqual({ name: "purpleCustom", value: "#8b5cf6" });
  });

  it("gracefully returns empty tokens for invalid or empty config", () => {
    const result = parseTailwindConfigContent("const x = 123;", "tailwind.config.js");
    expect(result.colors).toEqual([]);
    expect(result.fonts).toEqual([]);
  });
});
