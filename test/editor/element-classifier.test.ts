import { describe, it, expect } from "vitest";
import { classifyElement } from "@/lib/dom/element-classifier";

describe("element-classifier", () => {
  it("handles null element safely", () => {
    const result = classifyElement(null);
    expect(result.category).toBe("container");
    expect(result.visiblePanels.imageMedia).toBe(false);
    expect(result.visiblePanels.typography).toBe(false);
  });

  describe("Text elements", () => {
    it("classifies h1-h6 as HEADING with typography enabled and imageMedia disabled", () => {
      const h1 = document.createElement("h1");
      h1.textContent = "Main Title";
      const res = classifyElement(h1);

      expect(res.category).toBe("text");
      expect(res.typeLabel).toBe("HEADING 1");
      expect(res.visiblePanels.typography).toBe(true);
      expect(res.visiblePanels.contentCopy).toBe(true);
      expect(res.visiblePanels.textColor).toBe(true);
      expect(res.visiblePanels.imageMedia).toBe(false);
      expect(res.visiblePanels.flexGrid).toBe(false);
    });

    it("classifies paragraph p with typography and text content", () => {
      const p = document.createElement("p");
      p.textContent = "Some paragraph text here";
      const res = classifyElement(p);

      expect(res.category).toBe("text");
      expect(res.typeLabel).toBe("PARAGRAPH");
      expect(res.visiblePanels.typography).toBe(true);
      expect(res.visiblePanels.contentCopy).toBe(true);
      expect(res.visiblePanels.imageMedia).toBe(false);
    });

    it("classifies span and inline elements", () => {
      const span = document.createElement("span");
      span.textContent = "Badge Text";
      const res = classifyElement(span);

      expect(res.category).toBe("text");
      expect(res.visiblePanels.typography).toBe(true);
      expect(res.visiblePanels.imageMedia).toBe(false);
    });
  });

  describe("Image & Media elements", () => {
    it("classifies img with imageMedia enabled and typography/text disabled", () => {
      const img = document.createElement("img");
      img.src = "https://example.com/pic.jpg";
      const res = classifyElement(img);

      expect(res.category).toBe("image");
      expect(res.typeLabel).toBe("IMG");
      expect(res.visiblePanels.imageMedia).toBe(true);
      expect(res.visiblePanels.layoutSizing).toBe(true);
      expect(res.visiblePanels.border).toBe(true);
      expect(res.visiblePanels.typography).toBe(false);
      expect(res.visiblePanels.contentCopy).toBe(false);
      expect(res.visiblePanels.textColor).toBe(false);
    });

    it("classifies video and picture tags", () => {
      const video = document.createElement("video");
      const res = classifyElement(video);

      expect(res.category).toBe("image");
      expect(res.visiblePanels.imageMedia).toBe(true);
      expect(res.visiblePanels.typography).toBe(false);
    });
  });

  describe("Button elements", () => {
    it("classifies button with typography, border, colors, and layout enabled", () => {
      const btn = document.createElement("button");
      btn.textContent = "Click Me";
      const res = classifyElement(btn);

      expect(res.category).toBe("button");
      expect(res.typeLabel).toBe("BUTTON");
      expect(res.visiblePanels.typography).toBe(true);
      expect(res.visiblePanels.contentCopy).toBe(true);
      expect(res.visiblePanels.border).toBe(true);
      expect(res.visiblePanels.textColor).toBe(true);
      expect(res.visiblePanels.backgroundColor).toBe(true);
      expect(res.visiblePanels.imageMedia).toBe(false);
    });

    it("classifies anchor tag with .btn class as button", () => {
      const a = document.createElement("a");
      a.className = "btn btn-primary";
      a.textContent = "Explore Now";
      const res = classifyElement(a);

      expect(res.category).toBe("button");
      expect(res.typeLabel).toBe("BUTTON");
      expect(res.visiblePanels.linkNav).toBe(true);
      expect(res.visiblePanels.imageMedia).toBe(false);
    });
  });

  describe("Links", () => {
    it("classifies standard anchor links with linkNav and typography enabled", () => {
      const a = document.createElement("a");
      a.href = "https://example.com";
      a.textContent = "Learn More";
      const res = classifyElement(a);

      expect(res.category).toBe("link");
      expect(res.typeLabel).toBe("LINK");
      expect(res.visiblePanels.linkNav).toBe(true);
      expect(res.visiblePanels.typography).toBe(true);
      expect(res.visiblePanels.imageMedia).toBe(false);
    });
  });

  describe("Container elements", () => {
    it("classifies section/div with flexGrid, layoutSizing, and backgroundColor enabled", () => {
      const section = document.createElement("section");
      section.innerHTML = "<div><h1>Title</h1></div>";
      const res = classifyElement(section);

      expect(res.category).toBe("container");
      expect(res.typeLabel).toBe("SECTION");
      expect(res.visiblePanels.flexGrid).toBe(true);
      expect(res.visiblePanels.layoutSizing).toBe(true);
      expect(res.visiblePanels.backgroundColor).toBe(true);
      expect(res.visiblePanels.typography).toBe(false);
      expect(res.visiblePanels.imageMedia).toBe(false);
      // Safeguard: Content copy disabled because section has child elements
      expect(res.visiblePanels.contentCopy).toBe(false);
    });

    it("classifies nav, header, footer with specialized container labels", () => {
      const nav = document.createElement("nav");
      expect(classifyElement(nav).typeLabel).toBe("NAV");

      const header = document.createElement("header");
      expect(classifyElement(header).typeLabel).toBe("HEADER");

      const footer = document.createElement("footer");
      expect(classifyElement(footer).typeLabel).toBe("FOOTER");
    });
  });

  describe("SVG & Icon elements", () => {
    it("classifies svg with icon coloring, transform effects, and sizing", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const res = classifyElement(svg);

      expect(res.category).toBe("svg");
      expect(res.typeLabel).toBe("SVG ICON");
      expect(res.visiblePanels.textColor).toBe(true);
      expect(res.visiblePanels.layoutSizing).toBe(true);
      expect(res.visiblePanels.effects).toBe(true);
      expect(res.visiblePanels.typography).toBe(false);
      expect(res.visiblePanels.imageMedia).toBe(false);
      expect(res.visiblePanels.contentCopy).toBe(false);
    });
  });

  describe("Input elements", () => {
    it("classifies input field with typography, border, and sizing enabled", () => {
      const input = document.createElement("input");
      input.type = "text";
      const res = classifyElement(input);

      expect(res.category).toBe("input");
      expect(res.typeLabel).toBe("INPUT");
      expect(res.visiblePanels.typography).toBe(true);
      expect(res.visiblePanels.border).toBe(true);
      expect(res.visiblePanels.layoutSizing).toBe(true);
      expect(res.visiblePanels.contentCopy).toBe(false);
      expect(res.visiblePanels.imageMedia).toBe(false);
    });
  });
});
