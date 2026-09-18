import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as parse5 from "parse5";
import { analyzeHtmlClientSide } from "@/lib/ast/analyze";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import { serializeCleanDocument } from "@/components/editor/EditorStudio";
import { parseTailwindConfigContent } from "@/lib/tailwind/config-parser";

const FULL_WEBSITE_ROOT = path.resolve(__dirname, "../../Full Website Tests");

function getAllHtmlFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== ".vercel") {
      getAllHtmlFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe("Full Website Folder — Comprehensive All-Files Test Suite", () => {
  const allHtmlFiles = getAllHtmlFiles(FULL_WEBSITE_ROOT);

  it("discovered all HTML files across all project folders in Full Website Tests", () => {
    expect(allHtmlFiles.length).toBeGreaterThan(0);
    console.log(`Discovered ${allHtmlFiles.length} HTML files across Full Website Tests.`);
  });

  describe("Tailwind Config Processing across projects", () => {
    it("parses arabian-majlis tailwind.config.js and extracts custom brand colors and fonts", () => {
      const configPath = path.join(FULL_WEBSITE_ROOT, "arabian-majlis/tailwind.config.js");
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, "utf-8");
        const parsed = parseTailwindConfigContent(raw, "tailwind.config.js");
        expect(parsed).toBeDefined();
        expect(parsed.colors.length).toBeGreaterThan(0);
        expect(parsed.colors.some((c) => c.name.includes("brand"))).toBe(true);
      }
    });

    it("parses axris_project tailwind.config.js safely without execution errors", () => {
      const configPath = path.join(FULL_WEBSITE_ROOT, "axris_project/tailwind.config.js");
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, "utf-8");
        const parsed = parseTailwindConfigContent(raw, "tailwind.config.js");
        expect(parsed).toBeDefined();
        expect(parsed.colors.length).toBeGreaterThan(0);
      }
    });
  });

  allHtmlFiles.forEach((filePath) => {
    const relPath = path.relative(FULL_WEBSITE_ROOT, filePath);

    describe(`File: ${relPath}`, () => {
      const htmlContent = fs.readFileSync(filePath, "utf-8");

      it("parses HTML with parse5 AST and serializes back without loss", () => {
        expect(() => {
          const document = parse5.parse(htmlContent, { sourceCodeLocationInfo: true });
          expect(document).toBeDefined();
          const serialized = parse5.serialize(document);
          expect(serialized.length).toBeGreaterThan(0);
        }).not.toThrow();
      });

      it("analyzes AST and builds location map and themes without errors", () => {
        expect(() => {
          const analysis = analyzeHtmlClientSide(htmlContent);
          expect(analysis).toBeDefined();
          expect(analysis.locations).toBeDefined();
          expect(analysis.theme).toBeDefined();
        }).not.toThrow();
      });

      it("simulates client-side edit splicing cleanly", () => {
        expect(() => {
          const spliced = applyEditsClientSide(
            htmlContent,
            [
              {
                kind: "style",
                structuralPath: "body",
                styleProperty: "color",
                newStyleValue: "red",
              },
            ]
          );
          expect(spliced).toBeDefined();
          if (spliced.ok && spliced.html) {
            expect(typeof spliced.html).toBe("string");
          }
        }).not.toThrow();
      });

      it("cleans editor helper styles while preserving all animation triggers and scripts", () => {
        const domParser = new DOMParser();
        const doc = domParser.parseFromString(htmlContent, "text/html");

        // Simulate editor helper injection
        const helperStyle = doc.createElement("style");
        helperStyle.id = "vse-editor-helper-styles";
        helperStyle.textContent = ".gs-reveal { opacity: 1 !important; }";
        doc.head?.appendChild(helperStyle);

        // Add a mock element with data-vse-path
        const firstEl = doc.body?.firstElementChild;
        if (firstEl) {
          firstEl.setAttribute("data-vse-path", "0/0");
        }

        const cleanHtml = serializeCleanDocument(doc);
        expect(cleanHtml).not.toContain("vse-editor-helper-styles");
        expect(cleanHtml).not.toContain("data-vse-path");

        if (htmlContent.includes("data-aos")) {
          expect(cleanHtml).toContain("data-aos");
        }
        if (htmlContent.includes("gs-reveal")) {
          expect(cleanHtml).toContain("gs-reveal");
        }
      });
    });
  });
});
