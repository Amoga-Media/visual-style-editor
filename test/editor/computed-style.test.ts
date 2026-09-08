import { describe, it, expect } from "vitest";
import type { ThemeMap } from "@/types";
import { readCurrentValue } from "@/lib/dom/computed-style";

const emptyTheme: ThemeMap = { mode: "v3-cdn", colors: [], fonts: [] };

const customTheme: ThemeMap = {
  mode: "v4-cdn",
  colors: [{ name: "clifford", value: "#da373d" }],
  fonts: [{ name: "display", stack: "Fraunces, serif" }],
};

describe("readCurrentValue — governed by an existing class", () => {
  it("text-align: text-center -> 'center'", () => {
    document.body.innerHTML = `<p class="text-center">hi</p>`;
    const el = document.querySelector("p")!;
    expect(readCurrentValue(el, "text-align", ["text-center"], emptyTheme)).toBe("center");
  });

  it("font-family: font-display resolves through theme.fonts to the stack", () => {
    document.body.innerHTML = `<p class="font-display">hi</p>`;
    const el = document.querySelector("p")!;
    // classifyUtilityClass returns the class's own token as the suffix
    // (the display name), not the resolved font stack — font-family display
    // shows the token, matching how the color case shows a token for
    // default-palette colors that have no theme entry to expand into a hex.
    expect(readCurrentValue(el, "font-family", ["font-display"], customTheme)).toBe("display");
  });

  it("text-color: custom theme token resolves to its hex", () => {
    document.body.innerHTML = `<p class="text-clifford">hi</p>`;
    const el = document.querySelector("p")!;
    expect(readCurrentValue(el, "text-color", ["text-clifford"], customTheme)).toBe("#da373d");
  });

  it("text-color: default-palette token with no theme entry displays as itself", () => {
    document.body.innerHTML = `<p class="text-red-500">hi</p>`;
    const el = document.querySelector("p")!;
    expect(readCurrentValue(el, "text-color", ["text-red-500"], emptyTheme)).toBe("red-500");
  });

  it("border-width: numeric suffix maps directly to px (border scale, not the x4 spacing scale)", () => {
    document.body.innerHTML = `<div class="border-4"></div>`;
    const el = document.querySelector("div")!;
    expect(readCurrentValue(el, "border-width", ["border-4"], emptyTheme)).toBe("4px");
  });

  it("border-width: bare 'border' (no suffix) displays the browser's implied 1px default", () => {
    document.body.innerHTML = `<div class="border"></div>`;
    const el = document.querySelector("div")!;
    expect(readCurrentValue(el, "border-width", ["border"], emptyTheme)).toBe("1px");
  });
});

describe("readCurrentValue — per-corner border-radius scoping", () => {
  // Mirrors the per-side border-width scoping block below, extended to
  // corners — depends on classify.ts's corner-side fix (see
  // shared/test/classify.test.ts's "border-radius corner disambiguation").
  it("top-left corner: comes from rounded-tl-md, not the unscoped rounded-lg", () => {
    document.body.innerHTML = `<div class="rounded-lg rounded-tl-md"></div>`;
    const el = document.querySelector("div")!;
    const classList = ["rounded-lg", "rounded-tl-md"];
    expect(readCurrentValue(el, "border-radius", classList, emptyTheme, "top-left")).toBe("md");
  });

  it("bottom-right corner: no corner-specific class -> falls back to the unscoped rounded-lg", () => {
    document.body.innerHTML = `<div class="rounded-lg rounded-tl-md"></div>`;
    const el = document.querySelector("div")!;
    const classList = ["rounded-lg", "rounded-tl-md"];
    expect(readCurrentValue(el, "border-radius", classList, emptyTheme, "bottom-right")).toBe("lg");
  });

  it("an element with zero radius classes still shows its real computed corner radius", () => {
    document.body.innerHTML = `<div style="border-top-left-radius: 6px;"></div>`;
    const el = document.querySelector("div")!;
    expect(readCurrentValue(el, "border-radius", [], emptyTheme, "top-left")).toBe("6px");
  });
});

describe("readCurrentValue — named-scale suffix resolves to a real CSS length", () => {
  // Found while building Task 3.5's TypographyGroup — see the
  // resolveScaleSuffix comment in computed-style.ts. Without this, a slider
  // control that expects a parseable length (e.g. LayoutGroup's
  // parseAxisValue) would silently show 0 for any element whose class came
  // from the named scale instead of bracket syntax.
  it("w-64 resolves to 256px, not the raw scale name '64'", () => {
    document.body.innerHTML = `<div class="w-64"></div>`;
    const el = document.querySelector("div")!;
    expect(readCurrentValue(el, "width", ["w-64"], emptyTheme)).toBe("256px");
  });

  it("h-4 resolves to 16px", () => {
    document.body.innerHTML = `<div class="h-4"></div>`;
    const el = document.querySelector("div")!;
    expect(readCurrentValue(el, "height", ["h-4"], emptyTheme)).toBe("16px");
  });

  it("text-lg resolves to 18px, not the raw token 'lg'", () => {
    document.body.innerHTML = `<p class="text-lg">hi</p>`;
    const el = document.querySelector("p")!;
    expect(readCurrentValue(el, "font-size", ["text-lg"], emptyTheme)).toBe("18px");
  });

  it("bracket syntax (already a real length) passes through unchanged", () => {
    document.body.innerHTML = `<div class="w-[257px]"></div>`;
    const el = document.querySelector("div")!;
    expect(readCurrentValue(el, "width", ["w-[257px]"], emptyTheme)).toBe("257px");
  });
});

describe("readCurrentValue — no governing class, falls back to computed style", () => {
  it("an element with zero Tailwind classes still shows real computed values, not blank", () => {
    document.body.innerHTML = `<p style="text-align: right;">hi</p>`;
    const el = document.querySelector("p")!;
    const value = readCurrentValue(el, "text-align", [], emptyTheme);
    expect(value).toBe("right");
    expect(value).not.toBe("");
  });

  it("border-color with no class falls back to computed style, not the default palette", () => {
    document.body.innerHTML = `<div style="border-color: rgb(1, 2, 3);"></div>`;
    const el = document.querySelector("div")!;
    expect(readCurrentValue(el, "border-color", [], emptyTheme)).toBe("rgb(1, 2, 3)");
  });
});

describe("readCurrentValue — per-side border scoping (Phase 2 exit check)", () => {
  // border-t-4 border-red-500: border-t-4 carries a side letter (t), so it
  // ONLY governs the top side's width. border-red-500 carries no side
  // letter at all — it compiles to the plain `border-color` shorthand,
  // which is genuinely a top+right+bottom+left assignment in real CSS, not
  // a top-only one. So the true, non-bled reading is: width is side-scoped
  // (top=4px, other sides fall back to whatever's actually rendered there),
  // while color legitimately applies everywhere — showing "red-500" for
  // every side is the correct value, not bleed, since that IS what
  // border-red-500 renders on every side. Reporting some other color for
  // e.g. the left side here would be the actual "guess" PRD Acceptance
  // Criteria #4 warns against.
  document.body.innerHTML = `<div class="border-t-4 border-red-500" style="border-right-width: 2px;"></div>`;
  const el = document.querySelector("div")!;
  const classList = ["border-t-4", "border-red-500"];

  it("top side: width comes from border-t-4 -> 4px", () => {
    expect(readCurrentValue(el, "border-width", classList, emptyTheme, "top")).toBe("4px");
  });

  it("top side: color comes from border-red-500 -> 'red-500'", () => {
    expect(readCurrentValue(el, "border-color", classList, emptyTheme, "top")).toBe("red-500");
  });

  it("right side: width is NOT bled from border-t-4 — falls back to its own real computed style (2px, set independently)", () => {
    expect(readCurrentValue(el, "border-width", classList, emptyTheme, "right")).toBe("2px");
  });

  it("right side: color is still red-500 — border-red-500 has no side letter, so it truthfully governs every side, not just top", () => {
    expect(readCurrentValue(el, "border-color", classList, emptyTheme, "right")).toBe("red-500");
  });

  it("left side: width is NOT bled from border-t-4 — no width class governs the left side at all, so it falls back to computed style", () => {
    expect(readCurrentValue(el, "border-width", classList, emptyTheme, "left")).not.toBe("4px");
  });

  it("left side: color is still red-500, for the same reason as the right side", () => {
    expect(readCurrentValue(el, "border-color", classList, emptyTheme, "left")).toBe("red-500");
  });
});
