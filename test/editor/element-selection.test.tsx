import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import PropertyPanel from "@/components/editor/PropertyPanel";
import SelectionOverlay from "@/components/editor/SelectionOverlay";
import type { ThemeMap } from "@/types";

const mockTheme: ThemeMap = { mode: "v4-cdn", colors: [], fonts: [] };

describe("Element Selection & Property Panel Rendering", () => {
  it("renders PropertyPanel without crashing for a text element (h1)", () => {
    const h1 = document.createElement("h1");
    h1.textContent = "Heading Title";
    h1.id = "hero-heading";
    h1.className = "text-4xl font-bold text-white";

    const onEdit = vi.fn();
    const html = renderToString(
      <PropertyPanel
        element={h1}
        structuralPath="html>body>h1#hero-heading"
        theme={mockTheme}
        onEdit={onEdit}
      />
    );

    expect(html).toBeTruthy();
    expect(html).toContain("h1");
    expect(html).toContain("HEADING");
  });

  it("renders PropertyPanel without crashing for a button element", () => {
    const btn = document.createElement("button");
    btn.textContent = "Click Me";
    btn.className = "px-4 py-2 bg-blue-600 text-white rounded-lg";

    const onEdit = vi.fn();
    const html = renderToString(
      <PropertyPanel
        element={btn}
        structuralPath="html>body>button"
        theme={mockTheme}
        onEdit={onEdit}
      />
    );

    expect(html).toBeTruthy();
    expect(html).toContain("button");
  });

  it("renders PropertyPanel without crashing for an SVG element", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as unknown as Element;
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("stroke", "none");

    const onEdit = vi.fn();
    const html = renderToString(
      <PropertyPanel
        element={svg}
        structuralPath="html>body>svg"
        theme={mockTheme}
        onEdit={onEdit}
      />
    );

    expect(html).toBeTruthy();
    expect(html).toContain("svg");
  });

  it("renders PropertyPanel without crashing for an image element", () => {
    const img = document.createElement("img");
    img.src = "https://example.com/photo.jpg";
    img.alt = "Test photo";

    const onEdit = vi.fn();
    const html = renderToString(
      <PropertyPanel
        element={img}
        structuralPath="html>body>img"
        theme={mockTheme}
        onEdit={onEdit}
      />
    );

    expect(html).toBeTruthy();
    expect(html).toContain("img");
  });

  it("renders SelectionOverlay without crashing for selected element", () => {
    const iframe = document.createElement("iframe");

    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.left = "50px";
    div.style.top = "100px";
    div.style.width = "200px";
    div.style.height = "100px";

    const onEdit = vi.fn();
    const html = renderToString(
      <SelectionOverlay
        iframe={iframe}
        hoveredElement={null}
        selectedElement={div}
        structuralPath="html>body>div"
        theme={mockTheme}
        zoom={1}
        onEdit={onEdit}
      />
    );

    expect(html).toBeDefined();
  });
});
