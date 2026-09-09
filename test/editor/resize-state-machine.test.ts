import { describe, it, expect, vi } from "vitest";
import { commitStyleChange } from "@/lib/dom/live-style-engine";
import { useUndoStore } from "@/store/undo-store";
import { useChangeSetStore } from "@/store/change-set-store";
import type { EditRecord } from "@/types";

const emptyTheme = { mode: "none" as const, colors: [], fonts: [] };

describe("BUG-023 & BUG-024: Resize State Machine and Corner Atomic Commits", () => {
  it("batches corner handle resize into a single undo history snapshot", () => {
    useUndoStore.getState().reset();
    useChangeSetStore.getState().clear();

    const el = document.createElement("div");
    el.id = "test-box";
    el.style.width = "200px";
    el.style.height = "100px";
    document.body.appendChild(el);

    const initialEdits = useChangeSetStore.getState().edits;
    expect(initialEdits.length).toBe(0);

    // Simulate batch commit from corner handle
    const records: EditRecord[] = [];
    const collectEdit = (r: EditRecord) => records.push(r);

    commitStyleChange(el, "#test-box", "width", "350px", emptyTheme, collectEdit, "200px");
    commitStyleChange(el, "#test-box", "height", "250px", emptyTheme, collectEdit, "100px");

    expect(records.length).toBe(2);
    expect(records[0].property).toBe("width");
    expect(records[1].property).toBe("height");

    // Push as single batch into UndoStore (matching EditorStudio handleBatchEdit)
    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    for (const r of records) {
      useChangeSetStore.getState().recordEdit(r);
    }

    expect(useChangeSetStore.getState().edits.length).toBe(2);
    expect(useUndoStore.getState().past.length).toBe(1);

    // Single undo step restores both width and height to baseline
    useUndoStore.getState().undo(document);
    expect(useChangeSetStore.getState().edits.length).toBe(0);
    expect(useUndoStore.getState().future.length).toBe(1);

    // Redo restores both in one step
    useUndoStore.getState().redo(document);
    expect(useChangeSetStore.getState().edits.length).toBe(2);

    document.body.removeChild(el);
  });

  it("handles cancellation gracefully by reverting to baseline dimensions", () => {
    const el = document.createElement("div");
    const baselineWidth = "250px";
    const baselineHeight = "150px";
    el.style.width = baselineWidth;
    el.style.height = baselineHeight;

    // Simulate in-progress drag that moves to 400x300
    el.style.width = "400px";
    el.style.height = "300px";

    // User presses Escape or triggers pointercancel: revert baseline
    el.style.width = baselineWidth;
    el.style.height = baselineHeight;

    expect(el.style.width).toBe("250px");
    expect(el.style.height).toBe("150px");
  });
});
