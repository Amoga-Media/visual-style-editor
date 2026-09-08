import { describe, it, expect } from "vitest";
import type { EditRecord } from "@/types";
import { friendlyLabel, revertAllEdits } from "@/components/editor/ReviewModal";

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

describe("friendlyLabel", () => {
  it("shows an id-based path as-is", () => {
    expect(friendlyLabel("#hero-title")).toBe("#hero-title");
  });

  it("shows a chain path's last segment for elements with no id", () => {
    expect(friendlyLabel("html>body>section:nth-of-type(2)>div:nth-of-type(1)>h1")).toBe("h1");
  });
});

describe("revertAllEdits (Discard-all's revert step)", () => {
  it("restores each edited element's className to its recorded oldClassList", () => {
    document.body.innerHTML = `<div id="a" class="w-64 text-lg"></div><div id="b" class="rounded-lg"></div>`;
    const a = document.getElementById("a") as HTMLElement;
    const b = document.getElementById("b") as HTMLElement;

    const edits: EditRecord[] = [
      edit({ structuralPath: "#a", property: "width", oldClassList: ["w-32"], newClassList: ["w-64"] }),
      edit({ structuralPath: "#b", property: "border-radius", oldClassList: [], newClassList: ["rounded-lg"] }),
    ];

    revertAllEdits(edits, document);

    expect(a.className).toBe("w-32");
    expect(b.className).toBe(""); // oldClassList was empty — no border-radius class before
  });

  it("skips an edit whose element can no longer be resolved, without throwing, and still reverts the rest", () => {
    document.body.innerHTML = `<div id="a" class="w-64"></div>`;
    const a = document.getElementById("a") as HTMLElement;

    const edits: EditRecord[] = [
      edit({ structuralPath: "#a", oldClassList: ["w-32"], newClassList: ["w-64"] }),
      edit({ structuralPath: "#does-not-exist", oldClassList: ["h-32"], newClassList: ["h-64"] }),
    ];

    expect(() => revertAllEdits(edits, document)).not.toThrow();
    expect(a.className).toBe("w-32");
  });

  it("does nothing (and doesn't throw) when there is no iframe document yet", () => {
    expect(() => revertAllEdits([edit({})], null)).not.toThrow();
  });

  it("reverts a chain-path (non-id) element correctly, mirroring computeStructuralPath's own nth-of-type scheme", () => {
    document.body.innerHTML = `<div><p>one</p><p class="text-sm">two</p></div>`;
    const secondP = document.querySelectorAll("p")[1] as HTMLElement;

    // computeStructuralPath builds paths from <html> down; body's own
    // wrapping div here is body's first (and only) div, and the target
    // <p> is that div's second <p>.
    const path = "html>body:nth-of-type(1)>div:nth-of-type(1)>p:nth-of-type(2)";
    const edits: EditRecord[] = [
      edit({ structuralPath: path, property: "font-size", oldClassList: [], newClassList: ["text-sm"] }),
    ];

    revertAllEdits(edits, document);
    expect(secondP.className).toBe("");
  });

  // Task 6.1 (FR-9): style-kind edits revert via el.style, not className.
  it("reverts a style-kind edit by restoring the CSS property's old value via el.style", () => {
    document.body.innerHTML = `<p id="a" style="font-size: 24px;"></p>`;
    const a = document.getElementById("a") as HTMLElement;

    const edits: EditRecord[] = [styleEdit({ structuralPath: "#a", oldStyleValue: "16px", newStyleValue: "24px" })];
    revertAllEdits(edits, document);

    expect(a.style.fontSize).toBe("16px");
    expect(a.className).toBe(""); // never touched by a style-kind revert
  });

  it("removes the inline style entirely when the property wasn't set before this session (empty oldStyleValue)", () => {
    document.body.innerHTML = `<p id="a" style="font-size: 24px;"></p>`;
    const a = document.getElementById("a") as HTMLElement;

    const edits: EditRecord[] = [styleEdit({ structuralPath: "#a", oldStyleValue: "", newStyleValue: "24px" })];
    revertAllEdits(edits, document);

    expect(a.style.getPropertyValue("font-size")).toBe("");
  });

  it("two DIFFERENT style properties on the SAME element revert independently, unlike class-kind's single-className revert", () => {
    document.body.innerHTML = `<p id="a" style="font-size: 24px; color: rgb(255, 0, 0);"></p>`;
    const a = document.getElementById("a") as HTMLElement;

    const edits: EditRecord[] = [
      styleEdit({ structuralPath: "#a", property: "font-size", styleProperty: "font-size", oldStyleValue: "16px", newStyleValue: "24px" }),
      styleEdit({ structuralPath: "#a", property: "text-color", styleProperty: "color", oldStyleValue: "rgb(0, 0, 0)", newStyleValue: "rgb(255, 0, 0)" }),
    ];
    revertAllEdits(edits, document);

    expect(a.style.fontSize).toBe("16px");
    expect(a.style.color).toBe("rgb(0, 0, 0)");
  });
});
