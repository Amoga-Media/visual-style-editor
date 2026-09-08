import { describe, it, expect } from "vitest";
import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { resolveStructuralPath } from "@/lib/ast/resolve-path";
import { elementChildren } from "@/lib/ast/parse5-adapter";

type Element = DefaultTreeAdapterMap["element"];
type Document = DefaultTreeAdapterMap["document"];

function parseHtml(html: string): Element {
  const doc = parse(html, { sourceCodeLocationInfo: true }) as Document;
  const htmlEl = elementChildren(doc).find((el) => el.tagName === "html");
  if (!htmlEl) throw new Error("no <html>");
  return htmlEl;
}

describe("resolveStructuralPath", () => {
  const fixture = `
    <!doctype html>
    <html>
      <head><title>Test</title></head>
      <body>
        <div id="hero" class="p-4">
          <h1>Title</h1>
        </div>
        <div class="card">
          <p>Text</p>
        </div>
      </body>
    </html>
  `;

  it("resolves id path (#hero)", () => {
    const root = parseHtml(fixture);
    const node = resolveStructuralPath(root, "#hero");
    expect(node).not.toBeNull();
    expect(node?.tagName).toBe("div");
  });

  it("resolves chain path (html>body:nth-of-type(1)>div:nth-of-type(2)>p:nth-of-type(1))", () => {
    const root = parseHtml(fixture);
    const node = resolveStructuralPath(root, "html>body:nth-of-type(1)>div:nth-of-type(2)>p:nth-of-type(1)");
    expect(node).not.toBeNull();
    expect(node?.tagName).toBe("p");
  });

  it("returns null for non-existent path", () => {
    const root = parseHtml(fixture);
    const node = resolveStructuralPath(root, "#non-existent");
    expect(node).toBeNull();
  });
});
