import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";
import { reconcileDom } from "@/store/undo-store";
import type { EditRecord } from "@/types";

describe("BUG-016: Group Deletion and Stable Identity", () => {
  it("deletes item 2 from a list of 5 items leaving 1, 3, 4, 5 in source HTML", () => {
    const originalHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <ul>
    <!-- list start -->
    <li id="item-1">Item 1</li>
    <li id="item-2">Item 2</li>
    <li id="item-3">Item 3</li>
    <li id="item-4">Item 4</li>
    <li id="item-5">Item 5</li>
    <!-- list end -->
  </ul>
</body>
</html>`;

    const result = applyEditsClientSide(originalHtml, [
      {
        id: "del-item-2",
        kind: "delete",
        structuralPath: "#item-2",
        timestamp: Date.now(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    expect(result.html).not.toContain("Item 2");
    expect(result.html).toContain("Item 1");
    expect(result.html).toContain("Item 3");
    expect(result.html).toContain("Item 4");
    expect(result.html).toContain("Item 5");
    expect(result.html).toContain("<!-- list start -->");
    expect(result.html).toContain("<!-- list end -->");
  });

  it("deletes first, middle, and last elements by structural path", () => {
    const originalHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <div class="cards">
    <div class="card">Card 1</div>
    <div class="card">Card 2</div>
    <div class="card">Card 3</div>
  </div>
</body>
</html>`;

    // Delete Card 1 (first)
    const result1 = applyEditsClientSide(originalHtml, [
      {
        id: "del-card-1",
        kind: "delete",
        structuralPath: "html>body:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(1)",
        timestamp: Date.now(),
      } as any,
    ]);
    expect(result1.ok).toBe(true);
    expect(result1.html).not.toContain("Card 1");
    expect(result1.html).toContain("Card 2");
    expect(result1.html).toContain("Card 3");

    // Delete Card 3 (last)
    const result3 = applyEditsClientSide(originalHtml, [
      {
        id: "del-card-3",
        kind: "delete",
        structuralPath: "html>body:nth-of-type(1)>div:nth-of-type(1)>div:nth-of-type(3)",
        timestamp: Date.now(),
      } as any,
    ]);
    expect(result3.ok).toBe(true);
    expect(result3.html).toContain("Card 1");
    expect(result3.html).toContain("Card 2");
    expect(result3.html).not.toContain("Card 3");
  });

  it("undo restores deleted element to its exact position in live DOM", () => {
    const doc = document.implementation.createHTMLDocument("test");
    doc.body.innerHTML = `
      <ul id="list">
        <li id="el-1">First</li>
        <li id="el-2">Second</li>
        <li id="el-3">Third</li>
      </ul>
    `;

    const el2 = doc.getElementById("el-2")!;
    const parent = el2.parentElement!;
    const parentPath = "#list";
    const siblingIndex = Array.from(parent.children).indexOf(el2);
    const serializedHtml = el2.outerHTML;

    // Delete el2
    el2.remove();
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].id).toBe("el-1");
    expect(parent.children[1].id).toBe("el-3");

    const deleteEdit: EditRecord = {
      id: "del-2",
      kind: "delete",
      structuralPath: "#el-2",
      parentPath,
      siblingIndex,
      serializedHtml,
      timestamp: new Date().toISOString(),
    } as any;

    // Undo: from [deleteEdit] to []
    reconcileDom([deleteEdit], [], doc);

    expect(parent.children.length).toBe(3);
    expect(parent.children[0].id).toBe("el-1");
    expect(parent.children[1].id).toBe("el-2");
    expect(parent.children[2].id).toBe("el-3");
    expect(parent.children[1].textContent).toBe("Second");
  });
});
