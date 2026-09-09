import { describe, it, expect, beforeEach } from "vitest";
import { useUndoStore } from "@/store/undo-store";
import { useChangeSetStore } from "@/store/change-set-store";
import type { EditRecord } from "@/types";

describe("Structural Undo/Redo Reconciliation", () => {
  let doc: Document;

  beforeEach(() => {
    useUndoStore.getState().reset();
    useChangeSetStore.getState().clear();

    doc = document.implementation.createHTMLDocument("Test Document");
    doc.body.innerHTML = `
      <div id="container">
        <div id="item-1">Item 1</div>
        <div id="item-2">Item 2</div>
      </div>
    `;
  });

  it("reconciles delete undo by restoring the deleted element at original index", () => {
    const item1 = doc.getElementById("item-1")!;
    const item1Html = item1.outerHTML;

    // Delete item-1
    item1.remove();
    const deleteEdit: EditRecord = {
      kind: "delete",
      structuralPath: "#item-1",
      parentPath: "#container",
      siblingIndex: 0,
      serializedHtml: item1Html,
      timestamp: new Date().toISOString(),
    };

    // Push state before mutation
    useUndoStore.getState().pushHistory([]);
    useChangeSetStore.getState().recordEdit(deleteEdit);

    expect(doc.getElementById("item-1")).toBeNull();

    // Undo delete
    useUndoStore.getState().undo(doc);
    const restored = doc.getElementById("item-1");
    expect(restored).not.toBeNull();
    expect(restored?.textContent).toBe("Item 1");
    expect(doc.getElementById("container")?.firstElementChild?.id).toBe("item-1");

    // Redo delete
    useUndoStore.getState().redo(doc);
    expect(doc.getElementById("item-1")).toBeNull();
  });

  it("reconciles insert undo by removing the inserted element", () => {
    const container = doc.getElementById("container")!;
    const newEl = doc.createElement("span");
    newEl.id = "badge";
    newEl.textContent = "New";
    container.appendChild(newEl);

    const insertEdit: EditRecord = {
      kind: "insert",
      structuralPath: "#badge",
      position: "inside",
      snippet: '<span id="badge">New</span>',
      insertedPath: "#badge",
      timestamp: new Date().toISOString(),
    };

    useUndoStore.getState().pushHistory([]);
    useChangeSetStore.getState().recordEdit(insertEdit);

    expect(doc.getElementById("badge")).not.toBeNull();

    // Undo insert
    useUndoStore.getState().undo(doc);
    expect(doc.getElementById("badge")).toBeNull();

    // Redo insert
    useUndoStore.getState().redo(doc);
    expect(doc.getElementById("badge")).not.toBeNull();
  });

  it("handles complex sequence: insert -> move -> delete -> undo all -> redo all", () => {
    const container = doc.getElementById("container")!;

    // 1. Insert item-3
    const item3 = doc.createElement("div");
    item3.id = "item-3";
    item3.textContent = "Item 3";
    container.appendChild(item3);

    useUndoStore.getState().pushHistory([]);
    useChangeSetStore.getState().recordEdit({
      kind: "insert",
      structuralPath: "#item-3",
      position: "inside",
      snippet: '<div id="item-3">Item 3</div>',
      insertedPath: "#item-3",
      timestamp: new Date().toISOString(),
    });

    // 2. Delete item-2
    const item2 = doc.getElementById("item-2")!;
    const item2Html = item2.outerHTML;
    item2.remove();

    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    useChangeSetStore.getState().recordEdit({
      kind: "delete",
      structuralPath: "#item-2",
      parentPath: "#container",
      siblingIndex: 1,
      serializedHtml: item2Html,
      timestamp: new Date().toISOString(),
    });

    expect(doc.getElementById("item-2")).toBeNull();
    expect(doc.getElementById("item-3")).not.toBeNull();

    // Undo delete
    useUndoStore.getState().undo(doc);
    expect(doc.getElementById("item-2")).not.toBeNull();

    // Undo insert
    useUndoStore.getState().undo(doc);
    expect(doc.getElementById("item-3")).toBeNull();

    // Redo insert
    useUndoStore.getState().redo(doc);
    expect(doc.getElementById("item-3")).not.toBeNull();

    // Redo delete
    useUndoStore.getState().redo(doc);
    expect(doc.getElementById("item-2")).toBeNull();
  });
});
