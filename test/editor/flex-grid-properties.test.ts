import { describe, it, expect } from "vitest";
import { classifyElement } from "@/lib/dom/element-classifier";
import { classifyUtilityClass } from "@/lib/tailwind/classify";
import { forwardMap } from "@/lib/tailwind/forward-map";
import { applyClassMutation } from "@/lib/dom/class-list-mutation";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

const emptyTheme = { mode: "none" as const, colors: [], fonts: [] };
const tailwindTheme = { mode: "tailwind" as const, colors: [], fonts: [] };

describe("BUG-017: Flex and Grid Subsystem", () => {
  it("classifyElement enables flexGrid for container tags even with direct text content", () => {
    const div = document.createElement("div");
    div.textContent = "Some direct text content";
    const classification = classifyElement(div);

    expect(classification.category).toBe("container");
    expect(classification.visiblePanels.flexGrid).toBe(true);
  });

  it("classifyElement enables flexGrid dynamically if element has flex or grid classes", () => {
    const p = document.createElement("p");
    p.className = "flex items-center gap-2";
    const classification = classifyElement(p);

    expect(classification.visiblePanels.flexGrid).toBe(true);
  });

  it("classifies flex and grid utility classes correctly", () => {
    expect(classifyUtilityClass("flex", tailwindTheme)?.property).toBe("display");
    expect(classifyUtilityClass("grid", tailwindTheme)?.property).toBe("display");
    expect(classifyUtilityClass("inline-flex", tailwindTheme)?.property).toBe("display");
    expect(classifyUtilityClass("block", tailwindTheme)?.property).toBe("display");
    expect(classifyUtilityClass("hidden", tailwindTheme)?.property).toBe("display");

    expect(classifyUtilityClass("flex-row", tailwindTheme)?.property).toBe("flex-direction");
    expect(classifyUtilityClass("flex-col", tailwindTheme)?.property).toBe("flex-direction");
    expect(classifyUtilityClass("flex-wrap", tailwindTheme)?.property).toBe("flex-wrap");
    expect(classifyUtilityClass("flex-nowrap", tailwindTheme)?.property).toBe("flex-wrap");

    expect(classifyUtilityClass("justify-start", tailwindTheme)?.property).toBe("justify-content");
    expect(classifyUtilityClass("justify-center", tailwindTheme)?.property).toBe("justify-content");
    expect(classifyUtilityClass("justify-between", tailwindTheme)?.property).toBe("justify-content");

    expect(classifyUtilityClass("items-center", tailwindTheme)?.property).toBe("align-items");
    expect(classifyUtilityClass("items-start", tailwindTheme)?.property).toBe("align-items");

    expect(classifyUtilityClass("grid-cols-3", tailwindTheme)?.property).toBe("grid-template-columns");
    expect(classifyUtilityClass("grid-rows-2", tailwindTheme)?.property).toBe("grid-template-rows");
    expect(classifyUtilityClass("grid-flow-col", tailwindTheme)?.property).toBe("grid-auto-flow");

    expect(classifyUtilityClass("grow", tailwindTheme)?.property).toBe("flex-grow");
    expect(classifyUtilityClass("shrink", tailwindTheme)?.property).toBe("flex-shrink");
    expect(classifyUtilityClass("gap-y-4", tailwindTheme)?.property).toBe("row-gap");
    expect(classifyUtilityClass("gap-x-4", tailwindTheme)?.property).toBe("column-gap");
  });

  it("forwardMaps flex and grid values accurately", () => {
    expect(forwardMap("display" as any, "flex", { snap: false, theme: emptyTheme })).toBe("flex");
    expect(forwardMap("display" as any, "grid", { snap: false, theme: emptyTheme })).toBe("grid");
    expect(forwardMap("display" as any, "inline-flex", { snap: false, theme: emptyTheme })).toBe("inline-flex");

    expect(forwardMap("flex-direction" as any, "column", { snap: false, theme: emptyTheme })).toBe("flex-col");
    expect(forwardMap("flex-direction" as any, "row-reverse", { snap: false, theme: emptyTheme })).toBe("flex-row-reverse");

    expect(forwardMap("flex-wrap" as any, "wrap", { snap: false, theme: emptyTheme })).toBe("flex-wrap");
    expect(forwardMap("justify-content" as any, "between", { snap: false, theme: emptyTheme })).toBe("justify-between");
    expect(forwardMap("align-items" as any, "center", { snap: false, theme: emptyTheme })).toBe("items-center");

    expect(forwardMap("grid-template-columns" as any, "3", { snap: false, theme: emptyTheme })).toBe("grid-cols-3");
    expect(forwardMap("grid-template-rows" as any, "2", { snap: false, theme: emptyTheme })).toBe("grid-rows-2");
    expect(forwardMap("grid-auto-flow" as any, "col", { snap: false, theme: emptyTheme })).toBe("grid-flow-col");
  });

  it("applyClassMutation mutates display between flex and grid without leaving stale classes", () => {
    const initialClasses = ["flex", "flex-row", "p-4"];
    const mutated = applyClassMutation(initialClasses, "display" as any, "grid", tailwindTheme);

    expect(mutated).toContain("grid");
    expect(mutated).not.toContain("flex");
    expect(mutated).toContain("flex-row");
    expect(mutated).toContain("p-4");
  });

  it("applyClassMutation replaces justify-content cleanly", () => {
    const initialClasses = ["flex", "justify-start", "items-center"];
    const mutated = applyClassMutation(initialClasses, "justify-content" as any, "justify-between", tailwindTheme);

    expect(mutated).toContain("justify-between");
    expect(mutated).not.toContain("justify-start");
    expect(mutated).toContain("items-center");
  });

  it("splices flex/grid class mutations into source HTML cleanly", () => {
    const originalHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <!-- Container with flex -->
  <div id="box" class="flex flex-row gap-4 p-6">
    <span>Item 1</span>
  </div>
</body>
</html>`;

    const result = applyEditsClientSide(originalHtml, [
      {
        id: "edit-grid",
        kind: "class",
        structuralPath: "#box",
        property: "display" as any,
        oldClassList: ["flex", "flex-row", "gap-4", "p-6"],
        newClassList: ["grid", "grid-cols-3", "gap-4", "p-6"],
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    expect(result.html).toContain('class="grid grid-cols-3 gap-4 p-6"');
    expect(result.html).toContain("<!-- Container with flex -->");
  });
});
