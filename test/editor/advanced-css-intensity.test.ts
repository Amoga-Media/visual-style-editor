import { describe, it, expect } from "vitest";
import { parseFilterFunctions, updateFilterFunction } from "@/components/editor/property-panel/AdvancedCssGroup";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("BUG-019: Advanced CSS Controls & Intensity", () => {
  it("parses compound filter and backdrop-filter strings", () => {
    const compound = "blur(12px) grayscale(50%) brightness(120%)";
    const parsed = parseFilterFunctions(compound);

    expect(parsed.blur).toEqual({ amount: 12, unit: "px" });
    expect(parsed.grayscale).toEqual({ amount: 50, unit: "%" });
    expect(parsed.brightness).toEqual({ amount: 120, unit: "%" });
  });

  it("updates an individual filter function without corrupting other functions", () => {
    const initial = "blur(4px) grayscale(30%)";
    // Change blur from 4px to 10px
    const updated = updateFilterFunction(initial, "blur", 10, "px", 0);

    expect(updated).toContain("blur(10px)");
    expect(updated).toContain("grayscale(30%)");
  });

  it("removes filter function when set to its default amount (0 or 100)", () => {
    const initial = "blur(4px) grayscale(30%)";
    // Reset blur to 0
    const updated = updateFilterFunction(initial, "blur", 0, "px", 0);

    expect(updated).not.toContain("blur");
    expect(updated).toContain("grayscale(30%)");
  });

  it("splices compound filter and custom CSS properties into source HTML style attribute", () => {
    const originalHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <!-- card element -->
  <div id="card" style="padding: 20px;">
    Card Content
  </div>
</body>
</html>`;

    const result = applyEditsClientSide(originalHtml, [
      {
        id: "edit-filter",
        kind: "style",
        structuralPath: "#card",
        property: "filter" as any,
        styleProperty: "filter",
        oldStyleValue: "",
        newStyleValue: "blur(8px) contrast(110%)",
        viewport: "desktop",
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    expect(result.html).toContain("filter: blur(8px) contrast(110%)");
    expect(result.html).toContain("padding: 20px");
    expect(result.html).toContain("<!-- card element -->");
  });
});
