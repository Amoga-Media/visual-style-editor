import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("Responsive AST Export Attributes", () => {
  it("attaches data-vse-path attribute to elements with responsive overrides that lack an id", () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><main><div><h1>Heading</h1></div></main></body></html>`;
    const edits = [
      {
        kind: "style" as const,
        structuralPath: "body>main>div:nth-of-type(1)>h1:nth-of-type(1)",
        styleProperty: "font-size",
        newStyleValue: "20px",
        viewport: "mobile" as const,
      },
    ];

    const res = applyEditsClientSide(html, edits);
    expect(res.ok).toBe(true);
    expect(res.html).toContain('data-vse-path="body>main>div:nth-of-type(1)>h1:nth-of-type(1)"');
    expect(res.html).toContain('<style id="vse-responsive-styles">');
    expect(res.html).toContain('@media (max-width: 640px)');
  });
});
