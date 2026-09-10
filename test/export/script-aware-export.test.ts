import { describe, it, expect } from "vitest";
import { exportAsReactComponent, convertHtmlToJsx } from "@/lib/export/html-to-jsx";

describe("Script-Aware Component Exporter", () => {
  it("safely handles embedded inline script tags without producing unescaped JSX syntax errors", () => {
    const html = `
      <div class="hero">
        <h1>Welcome</h1>
        <script>
          for (let i = 0; i < 10; i++) {
            if (a && b) console.log("running");
          }
        </script>
      </div>
    `;

    const tsx = exportAsReactComponent(html, { componentName: "HeroComponent", typescript: true });
    expect(tsx).toContain("export const HeroComponent");
    // Inline scripts should not have raw unescaped < or && directly in JSX body
    expect(tsx).not.toMatch(/<script>\s*for/);
    // Either wrapped in dangerouslySetInnerHTML or commented
    expect(
      tsx.includes("dangerouslySetInnerHTML") || tsx.includes("{/* Client Script:")
    ).toBe(true);
  });

  it("handles external script tags by converting them to self-closing JSX elements", () => {
    const html = `
      <div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      </div>
    `;

    const jsx = convertHtmlToJsx(html);
    expect(jsx).toContain('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" />');
  });
});
