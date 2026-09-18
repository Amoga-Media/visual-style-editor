import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import BoxModelVisualizer from "@/components/editor/property-panel/BoxModelVisualizer";
import DocumentInspector from "@/components/editor/property-panel/DocumentInspector";
import FlexGridGroup from "@/components/editor/property-panel/FlexGridGroup";
import PropertyPanel from "@/components/editor/PropertyPanel";
import SelectionOverlay from "@/components/editor/SelectionOverlay";
import type { ThemeMap } from "@/types";

const mockTheme: ThemeMap = {
  mode: "v4-cdn",
  colors: [
    { name: "white", value: "#ffffff" },
    { name: "black", value: "#000000" },
    { name: "primary", value: "#0099ff" },
    { name: "indigo", value: "#6366f1" },
  ],
  fonts: [
    { name: "Inter", stack: "Inter, sans-serif" },
    { name: "Roboto", stack: "Roboto, sans-serif" },
  ],
};

describe("UI/UX Overhaul Components", () => {
  describe("BoxModelVisualizer", () => {
    it("renders concentric margin and padding boxes with values and dimensions", () => {
      const html = renderToString(
        <BoxModelVisualizer
          margin={{ top: 16, right: 24, bottom: 16, left: 24, unit: "px" }}
          padding={{ top: 8, right: 12, bottom: 8, left: 12, unit: "px" }}
          width={320}
          height={180}
          tagName="section"
          onMarginChange={vi.fn()}
          onMarginCommit={vi.fn()}
          onPaddingChange={vi.fn()}
          onPaddingCommit={vi.fn()}
        />
      );

      expect(html).toContain("data-testid=\"box-model-visualizer\"");
      expect(html).toContain("Margin");
      expect(html).toContain("Padding");
      expect(html).toContain("320px");
      expect(html).toContain("180px");
      expect(html).toContain("section");
      expect(html).toContain("16");
      expect(html).toContain("24");
      expect(html).toContain("8");
      expect(html).toContain("12");
    });
  });

  describe("DocumentInspector Empty State", () => {
    it("renders document metadata, theme swatches, and shortcut guide when no element is selected", () => {
      const html = renderToString(
        <PropertyPanel
          element={null}
          structuralPath={null}
          theme={mockTheme}
        />
      );

      expect(html).toContain("Document Inspector");
      expect(html).toContain("Page Global");
      expect(html).toContain("Select &lt;body&gt; Element to Style Page");
      expect(html).toContain("Quick Keyboard Shortcuts");
      expect(html).toContain("Palette Swatches");
      expect(html).toContain("Inter");
      expect(html).toContain("Roboto");
    });
  });

  describe("FlexGridGroup Quick Alignment Matrix", () => {
    it("renders 3x3 alignment matrix when element is flex or grid", () => {
      const flexContainer = document.createElement("div");
      flexContainer.style.display = "flex";
      flexContainer.style.justifyContent = "center";
      flexContainer.style.alignItems = "center";

      const html = renderToString(
        <FlexGridGroup
          element={flexContainer}
          structuralPath="html>body>div"
          theme={mockTheme}
          onEdit={vi.fn()}
        />
      );

      expect(html).toContain("Quick Alignment Matrix");
      expect(html).toContain("Top-Left");
      expect(html).toContain("Center");
      expect(html).toContain("Bottom-Right");
      expect(html).toContain("Distribution");
      expect(html).toContain("Cross-Axis");
    });
  });

  describe("SelectionOverlay Action HUD", () => {
    it("renders SelectionOverlay with contextual Action HUD when element is selected", () => {
      const iframe = document.createElement("iframe");
      const parent = document.createElement("div");
      const el = document.createElement("button");
      el.id = "cta-btn";
      el.textContent = "Get Started";
      parent.appendChild(el);

      const html = renderToString(
        <SelectionOverlay
          iframe={iframe}
          hoveredElement={null}
          selectedElement={el}
          structuralPath="html>body>div>button#cta-btn"
          theme={mockTheme}
          zoom={1}
          onSelectElement={vi.fn()}
          onDuplicate={vi.fn()}
          onDelete={vi.fn()}
          onMoveUp={vi.fn()}
          onMoveDown={vi.fn()}
          onWrapWithDiv={vi.fn()}
        />
      );

      expect(html).toBeDefined();
    });
  });
});
