import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import type { SaveRequestEdit } from "@/types";

describe("AST-first persistence with dynamic script mutations", () => {
  it("preserves original text and ignores ephemeral runtime DOM mutations when applying AST style edits", () => {
    const rawHtml = `<!DOCTYPE html><html><head></head><body><h1 id="title">Best Burgers</h1><script>document.getElementById("title").innerHTML = "<span>Mutated</span>";</script></body></html>`;
    const edits: SaveRequestEdit[] = [
      {
        kind: "style",
        structuralPath: "#title",
        styleProperty: "color",
        newStyleValue: "#ff0000",
        viewport: "desktop",
      },
    ];

    const result = applyEditsClientSide(rawHtml, edits);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.html).toContain('style="color: #ff0000;"');
      // Must preserve the original source text in markup, NOT the JS runtime mutation
      expect(result.html).toContain("Best Burgers");
      expect(result.html).toContain("<script>");
    }
  });

  it("handles empty edits idempotently without altering source file", () => {
    const rawHtml = `<!DOCTYPE html>\n<html>\n<head>\n  <title>Test</title>\n</head>\n<body>\n  <p>Hello World</p>\n</body>\n</html>`;
    const result = applyEditsClientSide(rawHtml, []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.html).toBe(rawHtml);
    }
  });
});
