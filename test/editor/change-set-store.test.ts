import { describe, it, expect, beforeEach } from "vitest";
import type { EditRecord } from "@/types";
import { useChangeSetStore } from "@/store/change-set-store";

beforeEach(() => {
  // The store is a module-level singleton (same instance across every test
  // in this file, and every other test file that imports it) — reset
  // explicitly so an earlier test's edits can't leak into this one.
  useChangeSetStore.setState({ edits: [] });
});

function edit(overrides: Partial<Extract<EditRecord, { kind: "class" }>>): EditRecord {
  return {
    kind: "class",
    structuralPath: "#hero-title",
    property: "width",
    oldClassList: ["w-32"],
    newClassList: ["w-64"],
    timestamp: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function styleEdit(overrides: Partial<Extract<EditRecord, { kind: "style" }>>): EditRecord {
  return {
    kind: "style",
    structuralPath: "#hero-title",
    property: "font-size",
    styleProperty: "font-size",
    oldStyleValue: "16px",
    newStyleValue: "24px",
    timestamp: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useChangeSetStore", () => {
  it("THE dedup rule: re-committing the same (path, property) collapses to one entry, keyed on the FIRST old value and the LATEST new value", () => {
    const first = edit({
      oldClassList: ["w-32"], // 256px equivalent placeholder — true "before" value
      newClassList: ["w-64"], // 256px
    });
    const second = edit({
      // If recordEdit were (incorrectly) implemented to just use whatever
      // oldClassList the caller passes, this would be "w-64" here — the
      // whole point of this test is to catch exactly that regression.
      oldClassList: ["w-64"],
      newClassList: ["w-[300px]"], // 300px
    });

    useChangeSetStore.getState().recordEdit(first);
    useChangeSetStore.getState().recordEdit(second);

    const { edits } = useChangeSetStore.getState();
    expect(edits).toHaveLength(1);
    expect(edits[0].kind).toBe("class");
    if (edits[0].kind === "class") {
      expect(edits[0].oldClassList).toEqual(["w-32"]); // FIRST edit's old value, not second's
      expect(edits[0].newClassList).toEqual(["w-[300px]"]); // SECOND (most recent) edit's new value
    }
  });

  it("collapses a THIRD re-commit of the same property the same way — old value never drifts forward", () => {
    useChangeSetStore.getState().recordEdit(edit({ oldClassList: ["w-32"], newClassList: ["w-40"] }));
    useChangeSetStore.getState().recordEdit(edit({ oldClassList: ["w-40"], newClassList: ["w-48"] }));
    useChangeSetStore.getState().recordEdit(edit({ oldClassList: ["w-48"], newClassList: ["w-64"] }));

    const { edits } = useChangeSetStore.getState();
    expect(edits).toHaveLength(1);
    expect(edits[0].kind).toBe("class");
    if (edits[0].kind === "class") {
      expect(edits[0].oldClassList).toEqual(["w-32"]); // still the very first value
      expect(edits[0].newClassList).toEqual(["w-64"]); // still the most recent value
    }
  });

  it("a DIFFERENT property on the same element coexists as its own entry", () => {
    const widthEdit = edit({ property: "width", oldClassList: ["w-32"], newClassList: ["w-64"] });
    const heightEdit = edit({ property: "height", oldClassList: ["h-32"], newClassList: ["h-48"] });

    useChangeSetStore.getState().recordEdit(widthEdit);
    useChangeSetStore.getState().recordEdit(heightEdit);

    const { edits } = useChangeSetStore.getState();
    expect(edits).toHaveLength(2);
    expect(edits.find((e) => e.property === "width")).toEqual(widthEdit);
    expect(edits.find((e) => e.property === "height")).toEqual(heightEdit);
  });

  it("the same property on a DIFFERENT element also coexists as its own entry", () => {
    const first = edit({ structuralPath: "#hero-title", newClassList: ["w-64"] });
    const second = edit({ structuralPath: "#card-1", newClassList: ["w-48"] });

    useChangeSetStore.getState().recordEdit(first);
    useChangeSetStore.getState().recordEdit(second);

    expect(useChangeSetStore.getState().edits).toHaveLength(2);
  });

  it("clear() empties the change-set", () => {
    useChangeSetStore.getState().recordEdit(edit({}));
    expect(useChangeSetStore.getState().edits).toHaveLength(1);

    useChangeSetStore.getState().clear();
    expect(useChangeSetStore.getState().edits).toHaveLength(0);
  });

  // Task 6.1 (FR-9): the non-Tailwind fallback records StyleEditRecords
  // instead of ClassEditRecords — the same carry-forward dedup rule has to
  // hold for oldStyleValue the same way it holds for oldClassList above.
  it("style-kind dedup rule: carries forward the FIRST oldStyleValue, keeps the LATEST newStyleValue", () => {
    const first = styleEdit({ oldStyleValue: "16px", newStyleValue: "20px" });
    const second = styleEdit({ oldStyleValue: "20px", newStyleValue: "24px" });

    useChangeSetStore.getState().recordEdit(first);
    useChangeSetStore.getState().recordEdit(second);

    const { edits } = useChangeSetStore.getState();
    expect(edits).toHaveLength(1);
    expect(edits[0].kind).toBe("style");
    if (edits[0].kind === "style") {
      expect(edits[0].oldStyleValue).toBe("16px");
      expect(edits[0].newStyleValue).toBe("24px");
    }
  });

  it("a style edit and a class edit on different properties of the same element coexist independently", () => {
    const classEdit = edit({ property: "width", oldClassList: ["w-32"], newClassList: ["w-64"] });
    const styleEditRecord = styleEdit({ property: "font-size", oldStyleValue: "16px", newStyleValue: "24px" });

    useChangeSetStore.getState().recordEdit(classEdit);
    useChangeSetStore.getState().recordEdit(styleEditRecord);

    const { edits } = useChangeSetStore.getState();
    expect(edits).toHaveLength(2);
    expect(edits.find((e) => e.property === "width")).toEqual(classEdit);
    expect(edits.find((e) => e.property === "font-size")).toEqual(styleEditRecord);
  });
});
