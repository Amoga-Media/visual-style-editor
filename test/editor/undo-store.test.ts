import { describe, it, expect, beforeEach } from "vitest";
import type { EditRecord } from "@/types";
import { useUndoStore, reconcileDom } from "@/store/undo-store";
import { useChangeSetStore } from "@/store/change-set-store";

function classEdit(overrides: Partial<Extract<EditRecord, { kind: "class" }>>): EditRecord {
  return {
    kind: "class",
    structuralPath: "#a",
    property: "width",
    oldClassList: [],
    newClassList: [],
    timestamp: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function styleEdit(overrides: Partial<Extract<EditRecord, { kind: "style" }>>): EditRecord {
  return {
    kind: "style",
    structuralPath: "#a",
    property: "font-size",
    styleProperty: "font-size",
    oldStyleValue: "",
    newStyleValue: "",
    timestamp: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  useUndoStore.setState({ past: [], future: [] });
  useChangeSetStore.setState({ edits: [] });
});

describe("reconcileDom — class-kind", () => {
  it("applies the TARGET's new value for a key present in both from and to", () => {
    document.body.innerHTML = `<div id="a" class="w-32"></div>`;
    const el = document.getElementById("a") as HTMLElement;
    const from = [classEdit({ oldClassList: ["w-16"], newClassList: ["w-32"] })];
    const to = [classEdit({ oldClassList: ["w-16"], newClassList: ["w-64"] })];

    reconcileDom(from, to, document);
    expect(el.className).toBe("w-64");
  });

  it("reverts to the SOURCE's old value for a key removed by this step (undoing the first-ever commit)", () => {
    document.body.innerHTML = `<div id="a" class="w-32"></div>`;
    const el = document.getElementById("a") as HTMLElement;
    const from = [classEdit({ oldClassList: ["w-16"], newClassList: ["w-32"] })];
    const to: EditRecord[] = []; // the property's only edit is gone — revert to its pre-session value

    reconcileDom(from, to, document);
    expect(el.className).toBe("w-16");
  });

  it("a key only in `to` (redo re-adding a property) applies its new value", () => {
    document.body.innerHTML = `<div id="a"></div>`;
    const el = document.getElementById("a") as HTMLElement;
    const from: EditRecord[] = [];
    const to = [classEdit({ oldClassList: [], newClassList: ["w-64"] })];

    reconcileDom(from, to, document);
    expect(el.className).toBe("w-64");
  });

  it("a DIFFERENT property on the same element, untouched by this step, is left alone", () => {
    document.body.innerHTML = `<div id="a" class="w-32 text-lg"></div>`;
    const el = document.getElementById("a") as HTMLElement;
    const from = [
      classEdit({ property: "width", oldClassList: ["w-16"], newClassList: ["w-32"] }),
      classEdit({ property: "font-size", oldClassList: [], newClassList: ["text-lg"] }),
    ];
    const to = [classEdit({ property: "font-size", oldClassList: [], newClassList: ["text-lg"] })];

    // Undoing just the width edit: width reverts, font-size (untouched
    // between these two snapshots) is left exactly as `to` says: "text-lg".
    reconcileDom(from, to, document);
    expect(el.className).toBe("text-lg");
  });
});

describe("reconcileDom — style-kind", () => {
  it("applies the target's new style value", () => {
    document.body.innerHTML = `<div id="a" style="font-size: 20px;"></div>`;
    const el = document.getElementById("a") as HTMLElement;
    const from = [styleEdit({ oldStyleValue: "16px", newStyleValue: "20px" })];
    const to = [styleEdit({ oldStyleValue: "16px", newStyleValue: "28px" })];

    reconcileDom(from, to, document);
    expect(el.style.fontSize).toBe("28px");
  });

  it("removes the inline style property entirely when reverting and oldStyleValue is empty", () => {
    document.body.innerHTML = `<div id="a" style="font-size: 20px;"></div>`;
    const el = document.getElementById("a") as HTMLElement;
    const from = [styleEdit({ oldStyleValue: "", newStyleValue: "20px" })];

    reconcileDom(from, [], document);
    expect(el.style.getPropertyValue("font-size")).toBe("");
  });

  it("two different style properties on the same element are tracked independently", () => {
    document.body.innerHTML = `<div id="a" style="font-size: 20px; color: rgb(255, 0, 0);"></div>`;
    const el = document.getElementById("a") as HTMLElement;
    const from = [
      styleEdit({ property: "font-size", styleProperty: "font-size", oldStyleValue: "16px", newStyleValue: "20px" }),
      styleEdit({ property: "text-color", styleProperty: "color", oldStyleValue: "rgb(0, 0, 0)", newStyleValue: "rgb(255, 0, 0)" }),
    ];
    const to = [styleEdit({ property: "text-color", styleProperty: "color", oldStyleValue: "rgb(0, 0, 0)", newStyleValue: "rgb(255, 0, 0)" })];

    reconcileDom(from, to, document);
    expect(el.style.fontSize).toBe("16px"); // reverted — removed between from/to
    expect(el.style.color).toBe("rgb(255, 0, 0)"); // untouched, still present in `to`
  });
});

describe("useUndoStore", () => {
  it("undo pops the last snapshot, moves current onto future, and sets the change-set back", () => {
    document.body.innerHTML = `<div id="a"></div>`;

    // Simulate two sequential commits: push pre-commit history, THEN apply.
    useUndoStore.getState().pushHistory([]); // before commit #1
    useChangeSetStore.setState({ edits: [classEdit({ newClassList: ["w-32"] })] });

    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits); // before commit #2
    useChangeSetStore.setState({ edits: [classEdit({ newClassList: ["w-64"] })] });

    useUndoStore.getState().undo(document);

    expect(useChangeSetStore.getState().edits).toEqual([classEdit({ newClassList: ["w-32"] })]);
    expect(useUndoStore.getState().past).toHaveLength(1);
    expect(useUndoStore.getState().future).toHaveLength(1);
  });

  it("redo replays a future snapshot back onto the change-set", () => {
    useUndoStore.getState().pushHistory([]);
    useChangeSetStore.setState({ edits: [classEdit({ newClassList: ["w-32"] })] });
    useUndoStore.getState().undo(null);

    expect(useChangeSetStore.getState().edits).toEqual([]);

    useUndoStore.getState().redo(null);
    expect(useChangeSetStore.getState().edits).toEqual([classEdit({ newClassList: ["w-32"] })]);
  });

  it("a fresh commit (pushHistory) clears the future stack — no redo past a new edit", () => {
    useUndoStore.getState().pushHistory([]);
    useChangeSetStore.setState({ edits: [classEdit({ newClassList: ["w-32"] })] });
    useUndoStore.getState().undo(null); // future now has 1 entry

    expect(useUndoStore.getState().future).toHaveLength(1);

    useUndoStore.getState().pushHistory([]); // a brand-new commit happens
    expect(useUndoStore.getState().future).toHaveLength(0);
  });

  it("undo/redo on an empty stack is a safe no-op", () => {
    expect(() => useUndoStore.getState().undo(null)).not.toThrow();
    expect(() => useUndoStore.getState().redo(null)).not.toThrow();
  });

  it("reset() clears both stacks", () => {
    useUndoStore.getState().pushHistory([]);
    useUndoStore.setState({ future: [[]] });
    useUndoStore.getState().reset();

    expect(useUndoStore.getState().past).toEqual([]);
    expect(useUndoStore.getState().future).toEqual([]);
  });

  it("reconciles attribute changes (e.g. href, target, src) during undo and redo", () => {
    document.body.innerHTML = `<a id="cta" href="https://old.com" target="_self">Click</a>`;
    const el = document.getElementById("cta") as HTMLAnchorElement;

    const edit: EditRecord = {
      kind: "attribute",
      structuralPath: "#cta",
      property: "href",
      attributeName: "href",
      oldValue: "https://old.com",
      newValue: "https://new.com",
      timestamp: "2026-01-01T00:00:00.000Z",
    };

    // Before edit: push history
    useUndoStore.getState().pushHistory([]);
    useChangeSetStore.setState({ edits: [edit] });
    el.setAttribute("href", "https://new.com");

    expect(el.getAttribute("href")).toBe("https://new.com");

    // Undo: should revert href to https://old.com
    useUndoStore.getState().undo(document);
    expect(el.getAttribute("href")).toBe("https://old.com");
    expect(useChangeSetStore.getState().edits).toEqual([]);

    // Redo: should re-apply https://new.com
    useUndoStore.getState().redo(document);
    expect(el.getAttribute("href")).toBe("https://new.com");
    expect(useChangeSetStore.getState().edits).toEqual([edit]);
  });

  it("resolves elements via data-vse-path and applies responsive style undo/redo", () => {
    document.body.innerHTML = `<div data-vse-path="body > div:nth-child(1)">Hello</div>`;
    const el = document.querySelector('[data-vse-path="body > div:nth-child(1)"]') as HTMLElement;

    const edit: EditRecord = {
      kind: "style",
      structuralPath: "body > div:nth-child(1)",
      property: "font-size",
      styleProperty: "font-size",
      oldStyleValue: "16px",
      newStyleValue: "32px",
      viewport: "tablet",
      timestamp: "2026-01-01T00:00:00.000Z",
    };

    useUndoStore.getState().pushHistory([]);
    useChangeSetStore.setState({ edits: [edit] });

    // Reconcile DOM for apply
    reconcileDom([], [edit], document);
    let styleTag = document.getElementById("vse-responsive-styles");
    expect(styleTag?.textContent).toContain("font-size: 32px !important;");

    // Undo: should revert tablet font-size
    useUndoStore.getState().undo(document);
    styleTag = document.getElementById("vse-responsive-styles");
    expect(styleTag?.textContent).toContain("font-size: 16px !important;");
  });
});
