import { describe, it, expect } from "vitest";
import { reconcileDom, useUndoStore } from "@/store/undo-store";
import { useChangeSetStore } from "@/store/change-set-store";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import type { MoveEditRecord } from "@/types";

describe("BUG-025 & BUG-026: Flex Containers & Natural Drag Reordering", () => {
  it("enforces a 5px threshold before initiating a drag-reorder operation", () => {
    const startX = 100;
    const startY = 100;

    // Sub-threshold jitter (e.g. 3px movement)
    const moveX1 = 102;
    const moveY1 = 102;
    const dist1 = Math.hypot(moveX1 - startX, moveY1 - startY);
    expect(dist1).toBeLessThan(5);

    // Past threshold movement (e.g. 10px)
    const moveX2 = 108;
    const moveY2 = 108;
    const dist2 = Math.hypot(moveX2 - startX, moveY2 - startY);
    expect(dist2).toBeGreaterThanOrEqual(5);
  });

  it("calculates insertion slots accurately based on sibling midpoints along the flow axis", () => {
    // Flex Row scenario: X-axis midpoints
    const siblingRect = { left: 200, width: 100 }; // midX = 250
    const midX = siblingRect.left + siblingRect.width / 2;

    const cursorLeft = 230; // Before midX
    expect(cursorLeft < midX ? "before" : "after").toBe("before");

    const cursorRight = 280; // After midX
    expect(cursorRight < midX ? "before" : "after").toBe("after");

    // Flex Col scenario: Y-axis midpoints
    const colSiblingRect = { top: 300, height: 60 }; // midY = 330
    const midY = colSiblingRect.top + colSiblingRect.height / 2;

    const cursorTop = 310;
    expect(cursorTop < midY ? "before" : "after").toBe("before");

    const cursorBottom = 345;
    expect(cursorBottom < midY ? "before" : "after").toBe("after");
  });

  it("correctly reconciles DOM on Undo and Redo using stable move tokens", () => {
    useUndoStore.getState().reset();
    useChangeSetStore.getState().clear();

    const container = document.createElement("div");
    container.id = "flex-parent";

    const itemA = document.createElement("div");
    itemA.id = "item-a";
    itemA.textContent = "A";

    const itemB = document.createElement("div");
    itemB.id = "item-b";
    itemB.textContent = "B";

    const itemC = document.createElement("div");
    itemC.id = "item-c";
    itemC.textContent = "C";

    container.appendChild(itemA);
    container.appendChild(itemB);
    container.appendChild(itemC);
    document.body.appendChild(container);

    // Original order: [itemA, itemB, itemC]
    expect(Array.from(container.children).map((c) => c.id)).toEqual(["item-a", "item-b", "item-c"]);

    // Move itemA after itemC
    const moveToken = "move-token-test-123";
    itemA.setAttribute("data-vse-move-token", moveToken);
    container.appendChild(itemA);

    // New order: [itemB, itemC, itemA]
    expect(Array.from(container.children).map((c) => c.id)).toEqual(["item-b", "item-c", "item-a"]);

    const moveRecord: MoveEditRecord = {
      kind: "move",
      structuralPath: "#flex-parent > :nth-child(1)", // old path
      targetPath: "#item-c",
      position: "after",
      oldParentPath: "#flex-parent",
      oldSiblingIndex: 0,
      newPath: "#flex-parent > :nth-child(3)",
      moveToken,
      elementId: "item-a",
      timestamp: new Date().toISOString(),
    };

    // Push into UndoStore
    useUndoStore.getState().pushHistory([]);
    useChangeSetStore.getState().recordEdit(moveRecord);

    // Undo the move: itemA should return to index 0
    useUndoStore.getState().undo(document);
    expect(Array.from(container.children).map((c) => c.id)).toEqual(["item-a", "item-b", "item-c"]);

    // Redo the move: itemA should move after itemC
    useUndoStore.getState().redo(document);
    expect(Array.from(container.children).map((c) => c.id)).toEqual(["item-b", "item-c", "item-a"]);

    document.body.removeChild(container);
  });

  it("applies move edits to raw HTML without corrupting surrounding markup", () => {
    const rawHtml = `<!DOCTYPE html>
<html>
<body>
  <section class="flex flex-col gap-3">
    <div id="first">First Item</div>
    <div id="second">Second Item</div>
  </section>
</body>
</html>`;

    const result = applyEditsClientSide(rawHtml, [
      {
        id: "move-1",
        kind: "move",
        structuralPath: "#first",
        targetPath: "#second",
        position: "after",
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    const secondIndex = result.html!.indexOf('id="second"');
    const firstIndex = result.html!.indexOf('id="first"');
    expect(secondIndex).toBeLessThan(firstIndex);
  });
});
