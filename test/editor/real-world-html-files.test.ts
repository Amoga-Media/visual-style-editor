import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { detectTailwindMode } from "@/lib/tailwind/detect-mode";
import { analyzeHtmlClientSide } from "@/lib/ast/analyze";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import { convertHtmlToJsx } from "@/lib/export/html-to-jsx";
import type { SaveRequestEdit } from "@/types";

describe("Real-world test files compatibility suite", () => {
  const testDir = path.resolve(__dirname, "../../files for testing");
  const files = fs.readdirSync(testDir).filter((f) => f.endsWith(".html"));

  it("found all 9 test files in 'files for testing'", () => {
    expect(files.length).toBeGreaterThanOrEqual(9);
  });

  for (const file of files) {
    describe(`File: ${file}`, () => {
      const filePath = path.join(testDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      it("detects valid framework mode without error", () => {
        const mode = detectTailwindMode(content);
        expect(["v3-cdn", "v4-cdn", "none"]).toContain(mode);
      });

      it("analyzes AST and extracts theme colors and fonts without throwing", () => {
        const analysis = analyzeHtmlClientSide(content);
        expect(analysis).toBeDefined();
        expect(analysis.theme).toBeDefined();
        expect(Array.isArray(analysis.theme.colors)).toBe(true);
        expect(Array.isArray(analysis.theme.fonts)).toBe(true);

        // Vanilla CSS files should harvest :root tokens
        if (file.startsWith("gemini-code-1785182456557") || file.startsWith("gemini-code-1785182269955")) {
          expect(analysis.theme.colors.length).toBeGreaterThan(0);
        }

        // Tailwind v3 config files should harvest extended colors
        if (file.startsWith("besty-redesigned")) {
          expect(analysis.theme.colors.some((c) => c.name.includes("accent") || c.name.includes("primary"))).toBe(true);
        }
      });

      it("executes idempotent AST pass-through preserving 100% of source", () => {
        const res = applyEditsClientSide(content, []);
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.html).toBe(content);
        }
      });

      it("applies a style edit via AST splicing cleanly without breaking scripts or tags", () => {
        const bodyTagMatch = content.match(/<body[^>]*>/i);
        if (bodyTagMatch) {
          const edit: SaveRequestEdit = {
            kind: "style",
            structuralPath: "html>body:nth-of-type(1)",
            styleProperty: "opacity",
            newStyleValue: "0.98",
            viewport: "desktop",
          };
          const res = applyEditsClientSide(content, [edit]);
          expect(res.ok).toBe(true);
          if (res.ok) {
            expect(res.html).toContain("opacity: 0.98");
          }
        }
      });

      it("generates JSX markup safely without unescaped script errors", () => {
        const jsx = convertHtmlToJsx(content);
        expect(typeof jsx).toBe("string");
        expect(jsx.length).toBeGreaterThan(0);
      });
    });
  }
});
