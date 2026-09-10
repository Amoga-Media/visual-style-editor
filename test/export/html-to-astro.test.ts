import { describe, it, expect } from "vitest";
import { convertHtmlToAstro } from "@/lib/export/html-to-astro";

describe("HTML to Astro Converter", () => {
  it("converts basic HTML into valid Astro component with frontmatter", () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><h1 class="text-3xl font-bold">Hello World</h1><p>Description</p></body></html>`;
    const astro = convertHtmlToAstro(html, "HeroSection");

    expect(astro).toContain("---");
    expect(astro).toContain("interface Props");
    expect(astro).toContain("const { class: className, ...props } = Astro.props;");
    expect(astro).toContain('<h1 class="text-3xl font-bold">Hello World</h1>');
    expect(astro).toContain("<p>Description</p>");
  });

  it("extracts and appends responsive style tags if present", () => {
    const html = `<!DOCTYPE html><html><head><style id="vse-responsive-styles">@media (max-width: 640px) { h1 { font-size: 24px !important; } }</style></head><body><h1>Responsive Heading</h1></body></html>`;
    const astro = convertHtmlToAstro(html);

    expect(astro).toContain("vse-responsive-styles");
    expect(astro).toContain("@media (max-width: 640px)");
  });
});
