import { describe, it, expect, beforeEach } from "vitest";
import type { EditRecord } from "@/types";
import { useUndoStore, reconcileDom } from "@/store/undo-store";
import { useChangeSetStore } from "@/store/change-set-store";

beforeEach(() => {
  useUndoStore.setState({ past: [], future: [] });
  useChangeSetStore.setState({ edits: [] });
});

describe("Undo/Redo Stress and Stability Engine", () => {
  it("executes 25+ sequential edits, rewinds all the way back to initial, and re-applies to completion without throwing", () => {
    document.body.innerHTML = `
      <div id="container" class="p-4">
        <h1 id="title" class="text-xl">Original Title</h1>
        <p id="desc" class="text-gray-500">Original description text</p>
        <button id="btn" class="bg-blue-500 text-white">Click me</button>
        <ul id="list">
          <li id="item-1">Item 1</li>
          <li id="item-2">Item 2</li>
        </ul>
      </div>
    `;

    const titleEl = document.getElementById("title") as HTMLElement;
    const descEl = document.getElementById("desc") as HTMLElement;
    const btnEl = document.getElementById("btn") as HTMLElement;
    const listEl = document.getElementById("list") as HTMLElement;

    const editHistory: EditRecord[] = [];

    // 1-5. Sequential text and class changes
    for (let i = 1; i <= 5; i++) {
      const prevEdits = [...useChangeSetStore.getState().edits];
      useUndoStore.getState().pushHistory(prevEdits);
      const edit: EditRecord = {
        kind: "text",
        structuralPath: "/html/body/div[1]/h1[1]",
        property: "text-content",
        oldText: titleEl.textContent || "",
        newText: `Title Iteration ${i}`,
        timestamp: new Date().toISOString(),
      };
      titleEl.textContent = edit.newText;
      useChangeSetStore.getState().recordEdit(edit);
      editHistory.push(edit);
    }

    // 6-10. Style modifications on button
    for (let i = 1; i <= 5; i++) {
      const prevEdits = [...useChangeSetStore.getState().edits];
      useUndoStore.getState().pushHistory(prevEdits);
      const edit: EditRecord = {
        kind: "style",
        structuralPath: "/html/body/div[1]/button[1]",
        property: "padding",
        styleProperty: "padding",
        oldStyleValue: btnEl.style.padding,
        newStyleValue: `${i * 4}px`,
        timestamp: new Date().toISOString(),
      };
      btnEl.style.padding = edit.newStyleValue;
      useChangeSetStore.getState().recordEdit(edit);
      editHistory.push(edit);
    }

    // 11-15. Class modifications on container
    for (let i = 1; i <= 5; i++) {
      const prevEdits = [...useChangeSetStore.getState().edits];
      useUndoStore.getState().pushHistory(prevEdits);
      const edit: EditRecord = {
        kind: "class",
        structuralPath: "/html/body/div[1]",
        property: "padding",
        oldClassList: i === 1 ? ["p-4"] : [`p-${(i - 1) * 2}`],
        newClassList: [`p-${i * 2}`],
        timestamp: new Date().toISOString(),
      };
      document.getElementById("container")!.className = `p-${i * 2}`;
      useChangeSetStore.getState().recordEdit(edit);
      editHistory.push(edit);
    }

    // 16-20. Insert child elements
    for (let i = 1; i <= 5; i++) {
      const prevEdits = [...useChangeSetStore.getState().edits];
      useUndoStore.getState().pushHistory(prevEdits);
      const newLi = document.createElement("li");
      newLi.id = `item-dynamic-${i}`;
      newLi.textContent = `Dynamic item ${i}`;
      listEl.appendChild(newLi);

      const edit: EditRecord = {
        kind: "insert",
        structuralPath: "/html/body/div[1]/ul[1]",
        position: "inside",
        snippet: `<li id="item-dynamic-${i}">Dynamic item ${i}</li>`,
        insertedPath: `/html/body/div[1]/ul[1]/li[${2 + i}]`,
        timestamp: new Date().toISOString(),
      };
      useChangeSetStore.getState().recordEdit(edit);
      editHistory.push(edit);
    }

    // 21-25. Attribute updates
    for (let i = 1; i <= 5; i++) {
      const prevEdits = [...useChangeSetStore.getState().edits];
      useUndoStore.getState().pushHistory(prevEdits);
      const edit: EditRecord = {
        kind: "attribute",
        structuralPath: "/html/body/div[1]/button[1]",
        property: "data-step",
        attributeName: "data-step",
        oldValue: i === 1 ? undefined : `step-${i - 1}`,
        newValue: `step-${i}`,
        timestamp: new Date().toISOString(),
      };
      btnEl.setAttribute("data-step", `step-${i}`);
      useChangeSetStore.getState().recordEdit(edit);
      editHistory.push(edit);
    }

    expect(useUndoStore.getState().past.length).toBe(25);
    // ChangeSet coalesces successive edits on the same property/path into 9 active distinct diffs
    expect(useChangeSetStore.getState().edits.length).toBe(9);
    expect(titleEl.textContent).toBe("Title Iteration 5");
    expect(btnEl.getAttribute("data-step")).toBe("step-5");

    // Rewind all 25 steps via undo
    for (let i = 0; i < 25; i++) {
      useUndoStore.getState().undo(document);
    }

    expect(useUndoStore.getState().past.length).toBe(0);
    expect(useUndoStore.getState().future.length).toBe(25);
    expect(useChangeSetStore.getState().edits.length).toBe(0);

    // Replay all 25 steps via redo
    for (let i = 0; i < 25; i++) {
      useUndoStore.getState().redo(document);
    }

    expect(useUndoStore.getState().past.length).toBe(25);
    expect(useUndoStore.getState().future.length).toBe(0);
    expect(useChangeSetStore.getState().edits.length).toBe(9);
    expect(btnEl.getAttribute("data-step")).toBe("step-5");
  });

  it("handles missing or morphed elements during reconcileDom gracefully without throwing", () => {
    document.body.innerHTML = `<div><span id="target">Original</span></div>`;

    // Simulate an edit recorded for an element that got removed by another script or DOM change
    const fromEdits: EditRecord[] = [
      {
        kind: "text",
        structuralPath: "/html/body/div[1]/section[99]/p[1]", // Non-existent path
        property: "text-content",
        oldText: "Old",
        newText: "New",
        timestamp: new Date().toISOString(),
      },
      {
        kind: "style",
        structuralPath: "/html/body/div[1]/missing-table[1]", // Non-existent path
        property: "color",
        styleProperty: "color",
        oldStyleValue: "black",
        newStyleValue: "red",
        timestamp: new Date().toISOString(),
      },
    ];

    const toEdits: EditRecord[] = [];

    expect(() => {
      reconcileDom(fromEdits, toEdits, document);
    }).not.toThrow();
  });
});
