import { describe, it, expect } from "vitest";
import { exportAsNextComponent, exportAsReactComponent } from "@/lib/export/html-to-jsx";

describe("HTML to React & Next.js Converters", () => {
  it("converts HTML into clean Next.js client component", () => {
    const html = `<div class="p-6 bg-slate-900"><h1 class="text-white">Next.js Header</h1><button disabled>Click</button></div>`;
    const nextCode = exportAsNextComponent(html, "HeaderPage");

    expect(nextCode).toContain('"use client";');
    expect(nextCode).toContain("export default function HeaderPage()");
    expect(nextCode).toContain('className="p-6 bg-slate-900"');
    expect(nextCode).toContain("disabled");
  });

  it("converts HTML into React TSX component with props interface", () => {
    const html = `<section class="container mx-auto"><h2 style="color: red; margin-top: 10px;">Title</h2></section>`;
    const reactCode = exportAsReactComponent(html, { componentName: "Hero", typescript: true });

    expect(reactCode).toContain("export interface HeroProps");
    expect(reactCode).toContain("export const Hero: React.FC<HeroProps>");
    expect(reactCode).toContain('style={{ color: "red", marginTop: "10px" }}');
  });
});
