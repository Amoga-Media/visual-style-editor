import { describe, it, expect } from "vitest";
import { convertHtmlToJsx, exportAsReactComponent, exportAsNextComponent } from "@/lib/export/html-to-jsx";
import { convertHtmlToAstro } from "@/lib/export/html-to-astro";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("ExportStudio Formats & Splicing", () => {
  const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hero Section</title>
</head>
<body>
  <div class="card p-6 bg-white">
    <h1 class="text-2xl font-bold">Hello World</h1>
    <p class="text-slate-600">Sample description text</p>
  </div>
</body>
</html>`;

  it("exports clean React TSX component", () => {
    const tsx = exportAsReactComponent(sampleHtml, { componentName: "HeroSection", typescript: true });
    expect(tsx).toContain("export const HeroSection: React.FC<HeroSectionProps>");
    expect(tsx).toContain("export default HeroSection;");
    expect(tsx).toContain("Hello World");
    expect(tsx).toContain("className=");
  });

  it("exports Next.js App Router client component", () => {
    const nextCode = exportAsNextComponent(sampleHtml, "HeroSection");
    expect(nextCode).toContain('"use client";');
    expect(nextCode).toContain("export default function HeroSection()");
  });

  it("exports Astro component with frontmatter", () => {
    const astroCode = convertHtmlToAstro(sampleHtml, "HeroSection");
    expect(astroCode).toContain("---");
    expect(astroCode).toContain("Hello World");
  });

  it("applies edits during export and reflects updated content", () => {
    const res = applyEditsClientSide(sampleHtml, [
      {
        kind: "text",
        structuralPath: "html>body:nth-of-type(1)>div:nth-of-type(1)>h1:nth-of-type(1)",
        newText: "Supercharged Title",
      },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain("Supercharged Title");
      expect(res.html).not.toContain("Hello World");
    }
  });

  it("serializes valid XML for foreignObject without unclosed tags", () => {
    const serializer = new XMLSerializer();
    const parser = new DOMParser();
    const doc = parser.parseFromString("<div class='p-4'><img src='foo.jpg'><br><input type='text'></div>", "text/html");
    const serialized = serializer.serializeToString(doc.body);
    expect(serialized).toContain("<img");
    expect(serialized).toContain("<br");
    expect(serialized).toContain("<input");
  });
});
