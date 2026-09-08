import { describe, it, expect, beforeEach } from "vitest";
import {
  getGoogleFontUrl,
  getFontFamilyCssValue,
  cleanFontFamilyName,
  isGoogleFont,
  loadFontInDocument,
  POPULAR_FONTS,
} from "@/lib/fonts/google-fonts";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import { commitStyleChange } from "@/lib/dom/live-style-engine";

describe("Google Fonts Integration", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  describe("URL & CSS Generation", () => {
    it("generates correct Google Fonts CDN URL", () => {
      const url = getGoogleFontUrl("Plus Jakarta Sans");
      expect(url).toBe(
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap"
      );
    });

    it("returns correct CSS values for popular fonts", () => {
      expect(getFontFamilyCssValue("Poppins")).toBe("'Poppins', sans-serif");
      expect(getFontFamilyCssValue("Playfair Display")).toBe("'Playfair Display', serif");
      expect(getFontFamilyCssValue("JetBrains Mono")).toBe("'JetBrains Mono', monospace");
    });

    it("cleans font family names from complex computed strings", () => {
      expect(cleanFontFamilyName('"Outfit", sans-serif')).toBe("Outfit");
      expect(cleanFontFamilyName("'Space Grotesk', system-ui")).toBe("Space Grotesk");
      expect(cleanFontFamilyName("Inter")).toBe("Inter");
    });

    it("correctly identifies Google Fonts vs system fonts", () => {
      expect(isGoogleFont("Inter")).toBe(true);
      expect(isGoogleFont("Playfair Display")).toBe(true);
      expect(isGoogleFont("System Sans")).toBe(false);
      expect(isGoogleFont("System Mono")).toBe(false);
    });
  });

  describe("Dynamic Iframe Font Loader", () => {
    it("injects Google Font stylesheet and preconnect links into document head", () => {
      loadFontInDocument(document, "Outfit");

      const link = document.head.querySelector('link[href*="family=Outfit"]');
      expect(link).not.toBeNull();
      expect(link?.getAttribute("rel")).toBe("stylesheet");

      const preconnect = document.head.querySelector('link[href="https://fonts.googleapis.com"]');
      expect(preconnect).not.toBeNull();
    });

    it("does not insert duplicate links if font is already loaded", () => {
      loadFontInDocument(document, "Poppins");
      loadFontInDocument(document, "Poppins");

      const links = document.head.querySelectorAll('link[href*="family=Poppins"]');
      expect(links.length).toBe(1);
    });

    it("does not inject external links for system fonts", () => {
      loadFontInDocument(document, "System Sans");
      const link = document.head.querySelector('link[href*="System+Sans"]');
      expect(link).toBeNull();
    });
  });

  describe("AST HTML Auto-Embedding", () => {
    it("auto-splices Google Font link into HTML head when font-family edit is applied", () => {
      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><h1 id="title">Hello</h1></body></html>`;
      const result = applyEditsClientSide(html, [
        {
          kind: "style",
          structuralPath: "html>body:nth-of-type(1)>h1:nth-of-type(1)",
          property: "font-family",
          styleProperty: "font-family",
          newStyleValue: "'Playfair Display', serif",
        },
      ]);

      expect(result.ok).toBe(true);
      expect(result.html).toContain("fonts.googleapis.com/css2?family=Playfair+Display");
      expect(result.html).toContain(`style="font-family: 'Playfair Display', serif;"`);
    });
  });

  describe("Live Style Engine & Commit Integration", () => {
    it("sets font-family inline style and strips conflicting font classes in Tailwind mode", () => {
      const doc = document.implementation.createHTMLDocument("Font Test");
      const el = doc.createElement("p");
      el.className = "text-lg font-sans text-gray-900";
      doc.body.appendChild(el);

      const theme: any = { mode: "tailwind", colors: [], fonts: [{ name: "sans", stack: "sans-serif" }] };
      const edits: any[] = [];

      // 1. Commit font change to Poppins
      commitStyleChange(
        el,
        "body > p:nth-child(1)",
        "font-family",
        "'Poppins', sans-serif",
        theme,
        (record) => edits.push(record),
        "sans-serif",
        undefined,
        "desktop"
      );

      // Verify inline style is set and font-sans class is stripped
      expect(el.style.fontFamily).toContain("Poppins");
      expect(el.classList.contains("font-sans")).toBe(false);
      expect(el.classList.contains("text-lg")).toBe(true);
      expect(edits.length).toBe(1);
      expect(edits[0].kind).toBe("style");
      expect(edits[0].newStyleValue).toBe("'Poppins', sans-serif");

      // Verify font link was loaded in doc head
      const link = doc.head.querySelector('link[href*="family=Poppins"]');
      expect(link).not.toBeNull();
    });
  });
});
