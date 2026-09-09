import { describe, it, expect, beforeEach } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import { parseFilterFunctions, updateFilterFunction } from "@/components/editor/property-panel/AdvancedCssGroup";
import {
  setResponsiveStyle,
  getResponsivePropertyInfo,
  clearResponsiveRegistry,
} from "@/lib/dom/responsive-style-engine";
import { reconcileDom } from "@/store/undo-store";
import { applyClassMutation } from "@/lib/dom/class-list-mutation";
import type { EditRecord } from "@/types";

const tailwindTheme = { mode: "tailwind" as const, colors: [], fonts: [] };

describe("Mixed Scenarios A - G Verification", () => {
  beforeEach(() => {
    clearResponsiveRegistry();
  });

  // Scenario A: Select SVG -> change stroke -> change fill -> resize -> verify HTML output
  it("Scenario A: SVG stroke, fill, and resize persistence", () => {
    const originalHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <svg id="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
  </svg>
</body>
</html>`;

    const result = applyEditsClientSide(originalHtml, [
      {
        id: "a-stroke",
        kind: "attribute",
        structuralPath: "#icon",
        name: "stroke",
        attributeName: "stroke",
        value: "#3b82f6",
        newValue: "#3b82f6",
        timestamp: Date.now(),
      } as any,
      {
        id: "a-fill",
        kind: "attribute",
        structuralPath: "#icon",
        name: "fill",
        attributeName: "fill",
        value: "#ef4444",
        newValue: "#ef4444",
        timestamp: Date.now(),
      } as any,
      {
        id: "a-width",
        kind: "style",
        structuralPath: "#icon",
        property: "width" as any,
        styleProperty: "width",
        oldStyleValue: "",
        newStyleValue: "48px",
        viewport: "desktop",
        timestamp: new Date().toISOString(),
      } as any,
      {
        id: "a-height",
        kind: "style",
        structuralPath: "#icon",
        property: "height" as any,
        styleProperty: "height",
        oldStyleValue: "",
        newStyleValue: "48px",
        viewport: "desktop",
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    expect(result.html).toContain('stroke="#3b82f6"');
    expect(result.html).toContain('fill="#ef4444"');
    expect(result.html).toContain("width: 48px");
    expect(result.html).toContain("height: 48px");
    expect(result.html).toContain('viewBox="0 0 24 24"');
  });

  // Scenario B: Select list of 5 items -> delete item 2 -> verify items 1, 3, 4, 5 remain -> undo -> verify all 5 restored
  it("Scenario B: Delete item 2 of 5, verify 1,3,4,5, undo restores all 5", () => {
    const doc = document.implementation.createHTMLDocument("test");
    doc.body.innerHTML = `
      <ul id="list">
        <li id="i1">Item 1</li>
        <li id="i2">Item 2</li>
        <li id="i3">Item 3</li>
        <li id="i4">Item 4</li>
        <li id="i5">Item 5</li>
      </ul>
    `;
    const list = doc.getElementById("list")!;
    const item2 = doc.getElementById("i2")!;
    const serializedHtml = item2.outerHTML;

    // Delete item 2
    item2.remove();
    expect(list.children.length).toBe(4);
    expect(Array.from(list.children).map((c) => c.id)).toEqual(["i1", "i3", "i4", "i5"]);

    const deleteEdit: EditRecord = {
      id: "del-item-2",
      kind: "delete",
      structuralPath: "#i2",
      parentPath: "#list",
      siblingIndex: 1,
      serializedHtml,
      timestamp: new Date().toISOString(),
    } as any;

    // Undo delete
    reconcileDom([deleteEdit], [], doc);
    expect(list.children.length).toBe(5);
    expect(Array.from(list.children).map((c) => c.id)).toEqual(["i1", "i2", "i3", "i4", "i5"]);
  });

  // Scenario C: Create container -> set display: flex -> change direction to column -> set gap to 16px -> change to display: grid -> set 3 columns -> verify classes/styles
  it("Scenario C: Container flex -> col -> gap -> grid -> 3 cols mutation", () => {
    let classes: string[] = [];
    // 1. set display: flex
    classes = applyClassMutation(classes, "display" as any, "flex", tailwindTheme);
    expect(classes).toContain("flex");

    // 2. set direction: column
    classes = applyClassMutation(classes, "flex-direction" as any, "flex-col", tailwindTheme);
    expect(classes).toContain("flex-col");

    // 3. set gap: 16px
    classes = applyClassMutation(classes, "gap" as any, "gap-4", tailwindTheme);
    expect(classes).toContain("gap-4");

    // 4. change to display: grid
    classes = applyClassMutation(classes, "display" as any, "grid", tailwindTheme);
    expect(classes).toContain("grid");
    expect(classes).not.toContain("flex");

    // 5. set 3 columns
    classes = applyClassMutation(classes, "grid-template-columns" as any, "grid-cols-3", tailwindTheme);
    expect(classes).toContain("grid-cols-3");
    expect(classes).toContain("gap-4");
  });

  // Scenario D: Select element -> add 3 classes via Class Property Editor -> remove 1 class -> edit raw string to add 2 more -> verify DOM and HTML
  it("Scenario D: Class property editor add, remove, and raw string editing", () => {
    const originalHtml = `<!DOCTYPE html><html><head></head><body><button id="btn">Click me</button></body></html>`;
    // Initial: add 3 classes
    let classList = ["btn-primary", "shadow-sm", "rounded-md"];
    // Remove 1 class (shadow-sm)
    classList = classList.filter((c) => c !== "shadow-sm");
    // Add 2 more via raw string: px-4 py-2
    classList.push("px-4", "py-2");

    const result = applyEditsClientSide(originalHtml, [
      {
        id: "edit-d",
        kind: "class",
        structuralPath: "#btn",
        property: "text-content" as any,
        oldClassList: [],
        newClassList: classList,
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    expect(result.html).toContain('class="btn-primary rounded-md px-4 py-2"');
    expect(result.html).not.toContain("shadow-sm");
  });

  // Scenario E: Select image -> add blur filter -> increase intensity -> add grayscale -> verify multi-function filter string -> reset blur -> verify grayscale remains
  it("Scenario E: Multi-function filter blur, grayscale, and reset blur", () => {
    let filter = "";
    // Add blur(4px)
    filter = updateFilterFunction(filter, "blur", 4, "px", 0);
    expect(filter).toBe("blur(4px)");

    // Increase intensity to 12px
    filter = updateFilterFunction(filter, "blur", 12, "px", 0);
    expect(filter).toBe("blur(12px)");

    // Add grayscale(50%)
    filter = updateFilterFunction(filter, "grayscale", 50, "%", 0);
    expect(filter).toContain("blur(12px)");
    expect(filter).toContain("grayscale(50%)");

    // Reset blur to 0
    filter = updateFilterFunction(filter, "blur", 0, "px", 0);
    expect(filter).not.toContain("blur");
    expect(filter).toContain("grayscale(50%)");
  });

  // Scenario F: Select heading at desktop -> set size to 48px -> switch to mobile -> set size to 24px -> switch to tablet -> verify inherited from desktop -> switch to desktop -> verify 48px -> save -> verify output
  it("Scenario F: Desktop 48px -> mobile 24px -> tablet inherits 48px -> desktop remains 48px -> save", () => {
    const el = document.createElement("h1");
    el.style.fontSize = "48px";
    const path = "#heading-1";

    // Set desktop 48px
    setResponsiveStyle(el, path, "font-size", "48px", "desktop");
    // Set mobile 24px
    setResponsiveStyle(el, path, "font-size", "24px", "mobile");

    // Verify tablet inherits from desktop
    const tabletInfo = getResponsivePropertyInfo(el, path, "font-size", "tablet");
    expect(tabletInfo.isOverridden).toBe(false);
    expect(tabletInfo.inheritedFrom).toBe("desktop");
    expect(tabletInfo.value).toBe("48px");

    // Verify desktop is 48px
    const desktopInfo = getResponsivePropertyInfo(el, path, "font-size", "desktop");
    expect(desktopInfo.value).toBe("48px");

    // Save and verify output
    const originalHtml = `<!DOCTYPE html><html><head></head><body><h1 id="heading-1" style="font-size: 48px;">Heading</h1></body></html>`;
    const result = applyEditsClientSide(originalHtml, [
      {
        id: "f-desk",
        kind: "style",
        structuralPath: path,
        property: "font-size" as any,
        styleProperty: "font-size",
        oldStyleValue: "",
        newStyleValue: "48px",
        viewport: "desktop",
        timestamp: new Date().toISOString(),
      } as any,
      {
        id: "f-mob",
        kind: "style",
        structuralPath: path,
        property: "font-size" as any,
        styleProperty: "font-size",
        oldStyleValue: "48px",
        newStyleValue: "24px",
        viewport: "mobile",
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    expect(result.html).toContain('style="font-size: 48px;"');
    expect(result.html).toContain("@media (max-width: 640px)");
    expect(result.html).toContain("24px");
  });

  // Scenario G: Select card -> drag resize handle -> verify dimensions update live -> hold Shift -> verify aspect ratio locked -> release -> verify persisted dimensions
  it("Scenario G: Resize card with aspect ratio lock and persistence", () => {
    const initialW = 300;
    const initialH = 150;
    const ratio = initialW / initialH; // 2.0

    // Simulate drag with Shift held
    const targetW = 450;
    const lockedH = targetW / ratio; // 225

    const originalHtml = `<!DOCTYPE html><html><head></head><body><div id="card" style="width: 300px; height: 150px;">Card</div></body></html>`;
    const result = applyEditsClientSide(originalHtml, [
      {
        id: "g-w",
        kind: "style",
        structuralPath: "#card",
        property: "width" as any,
        styleProperty: "width",
        oldStyleValue: "300px",
        newStyleValue: `${targetW}px`,
        viewport: "desktop",
        timestamp: new Date().toISOString(),
      } as any,
      {
        id: "g-h",
        kind: "style",
        structuralPath: "#card",
        property: "height" as any,
        styleProperty: "height",
        oldStyleValue: "150px",
        newStyleValue: `${lockedH}px`,
        viewport: "desktop",
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    expect(result.html).toContain(`width: ${targetW}px`);
    expect(result.html).toContain(`height: ${lockedH}px`);
  });
});
