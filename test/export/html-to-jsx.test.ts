import { describe, it, expect } from "vitest";
import { convertHtmlToJsx, exportAsReactComponent } from "@/lib/export/html-to-jsx";

describe("HTML to React JSX/TSX Conversion", () => {
  it("converts standard HTML attributes to React JSX attributes", () => {
    const html = `<div class="card p-4" tabindex="0">
      <label for="email">Email</label>
      <input id="email" readonly autocomplete="off" maxlength="50" />
    </div>`;

    const jsx = convertHtmlToJsx(html);
    expect(jsx).toContain('className="card p-4"');
    expect(jsx).toContain('tabIndex="0"');
    expect(jsx).toContain('htmlFor="email"');
    expect(jsx).toContain('readOnly');
    expect(jsx).toContain('autoComplete="off"');
    expect(jsx).toContain('maxLength="50"');
  });

  it("converts inline style strings to React style object", () => {
    const html = `<div style="background-color: rgb(240, 240, 240); margin-top: 16px; z-index: 10;">
      Styled Content
    </div>`;

    const jsx = convertHtmlToJsx(html);
    expect(jsx).toContain('style={{');
    expect(jsx).toContain('backgroundColor: "rgb(240, 240, 240)"');
    expect(jsx).toContain('marginTop: "16px"');
    expect(jsx).toContain('zIndex: "10"');
  });

  it("self-closes void elements in JSX", () => {
    const html = `<div class="wrapper">
      <img src="https://example.com/pic.jpg" alt="Photo">
      <hr>
      <input type="text" placeholder="Name">
      <br>
    </div>`;

    const jsx = convertHtmlToJsx(html);
    expect(jsx).toContain('<img src="https://example.com/pic.jpg" alt="Photo" />');
    expect(jsx).toContain('<hr />');
    expect(jsx).toContain('<input type="text" placeholder="Name" />');
    expect(jsx).toContain('<br />');
  });

  it("exports a complete standalone React TypeScript component", () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Card</title></head>
<body>
  <div class="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
    <h2 class="text-xl font-bold">Hello World</h2>
    <p class="text-gray-600">Exported component text</p>
  </div>
</body>
</html>`;

    const tsx = exportAsReactComponent(html, { componentName: "HeroCard", typescript: true });
    expect(tsx).toContain('import React from "react";');
    expect(tsx).toContain("export interface HeroCardProps");
    expect(tsx).toContain("export const HeroCard: React.FC<HeroCardProps> = ({ className = '', ...props }) => {");
    expect(tsx).toContain('className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6"');
    expect(tsx).toContain('<h2 className="text-xl font-bold">Hello World</h2>');
    expect(tsx).toContain("export default HeroCard;");
  });
});
