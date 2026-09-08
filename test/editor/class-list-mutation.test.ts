import { describe, it, expect } from "vitest";
import type { ThemeMap } from "@/types";
import { applyClassMutation } from "@/lib/dom/class-list-mutation";

const emptyTheme: ThemeMap = { mode: "v3-cdn", colors: [], fonts: [] };

describe("applyClassMutation — per-side control", () => {
  it("replaces only the top border-width class, leaves bottom-width and unrelated classes untouched", () => {
    document.body.innerHTML = `<div class="border-t-4 border-b-2 text-lg"></div>`;
    const el = document.querySelector("div")!;

    applyClassMutation(el, "border-width", "border-t-[6px]", emptyTheme, "top");

    expect(el.className).toBe("border-b-2 text-lg border-t-[6px]");
  });

  it("a side-scoped mutation on a side with no existing class just appends the new one", () => {
    document.body.innerHTML = `<div class="border-b-2 text-lg"></div>`;
    const el = document.querySelector("div")!;

    applyClassMutation(el, "border-width", "border-t-[6px]", emptyTheme, "top");

    expect(el.className).toBe("border-b-2 text-lg border-t-[6px]");
  });
});

describe("applyClassMutation — per-corner control (border-radius)", () => {
  // Corner mutation depends on classify.ts actually reporting which corner
  // an existing rounded-* class governs (fixed while building Task 3.5 —
  // see shared/test/classify.test.ts's "border-radius corner
  // disambiguation" block for why this previously couldn't work at all).
  it("replaces only the top-left radius class, leaves the other corner and unrelated classes untouched", () => {
    document.body.innerHTML = `<div class="rounded-tl-md rounded-br-lg text-lg"></div>`;
    const el = document.querySelector("div")!;

    applyClassMutation(el, "border-radius", "rounded-tl-[6px]", emptyTheme, "top-left");

    expect(el.className).toBe("rounded-br-lg text-lg rounded-tl-[6px]");
  });

  it("a corner-scoped mutation on a corner with no existing class just appends the new one", () => {
    document.body.innerHTML = `<div class="rounded-br-lg"></div>`;
    const el = document.querySelector("div")!;

    applyClassMutation(el, "border-radius", "rounded-tl-[6px]", emptyTheme, "top-left");

    expect(el.className).toBe("rounded-br-lg rounded-tl-[6px]");
  });
});

describe("applyClassMutation — all-sides control", () => {
  it("clears every per-side class governing the property, not just an unprefixed one", () => {
    document.body.innerHTML = `<div class="border-t-4 border-b-2 text-lg"></div>`;
    const el = document.querySelector("div")!;

    applyClassMutation(el, "border-width", "border-[6px]", emptyTheme);

    // Both border-t-4 and border-b-2 governed border-width (on different
    // sides) — the all-sides control clears both, so the per-side and
    // all-sides controls never leave conflicting classes stacked together.
    expect(el.className).toBe("text-lg border-[6px]");
  });

  it("also clears a pre-existing unprefixed class governing the same property", () => {
    document.body.innerHTML = `<div class="border-2 text-lg"></div>`;
    const el = document.querySelector("div")!;

    applyClassMutation(el, "border-width", "border-[6px]", emptyTheme);

    expect(el.className).toBe("text-lg border-[6px]");
  });

  it("the all-corners radius control clears every per-corner class, the same way all-sides does for width", () => {
    document.body.innerHTML = `<div class="rounded-tl-md rounded-br-lg text-lg"></div>`;
    const el = document.querySelector("div")!;

    applyClassMutation(el, "border-radius", "rounded-[6px]", emptyTheme);

    expect(el.className).toBe("text-lg rounded-[6px]");
  });
});

describe("applyClassMutation — removal", () => {
  it("an empty newClass (e.g. border-style 'none') removes the governing class with nothing appended", () => {
    document.body.innerHTML = `<div class="border-dashed text-lg"></div>`;
    const el = document.querySelector("div")!;

    applyClassMutation(el, "border-style", "", emptyTheme);

    expect(el.className).toBe("text-lg");
  });
});

describe("applyClassMutation — unrelated properties are never touched", () => {
  it("mutating width leaves border and text classes exactly as they were", () => {
    document.body.innerHTML = `<div class="w-32 border-2 text-lg"></div>`;
    const el = document.querySelector("div")!;

    applyClassMutation(el, "width", "w-64", emptyTheme);

    expect(el.className).toBe("border-2 text-lg w-64");
  });
});
