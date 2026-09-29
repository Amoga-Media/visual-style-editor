# Visual Style Editor — Test Plan & Coverage Guide

> All tests run with: `npm test` (Vitest + jsdom)
> Individual file: `npm test -- test/path/to/file.test.ts`
> Watch mode: `npm test -- --watch`

---

## CURRENT TEST COVERAGE (Baseline)

```
test/
├── ast/                          # AST parser, splicer, path resolver
│   ├── apply-edits.test.ts       ✅ Existing
│   ├── build-location-map.test.ts ✅ Existing
│   ├── resolve-path.test.ts      ✅ Existing
│   ├── splice.test.ts            ✅ Existing
│   ├── structural-path.test.ts   ✅ Existing
│   └── style-attr.test.ts        ✅ Existing
├── editor/                       # Studio components, stores
│   ├── canvas-scale-and-resize.test.tsx ✅ Existing
│   ├── change-set-store.test.ts  ✅ Existing (needs structural edit tests added)
│   ├── element-classifier.test.ts ✅ Existing
│   └── responsive-cascade.test.ts ✅ Existing
└── tailwind/                     # Forward mapping, classification, theme
    ├── classify.test.ts          ✅ Existing
    ├── default-theme.test.ts     ✅ Existing
    └── forward-map.test.ts       ✅ Existing
```

**Current:** 298 tests across 42 files — all passing.

---

## TESTS TO ADD — PHASE 0 (Bug Fixes)

### Test File: `test/editor/change-set-store.test.ts`
**Add to existing file:**

```ts
// BUG-001 regression — structural edits must not overwrite each other
describe("structural edit accumulation (BUG-001)", () => {
  beforeEach(() => useChangeSetStore.setState({ edits: [] }));

  it("accumulates 2 insert edits on the same structural path", () => {
    const s = useChangeSetStore.getState();
    s.recordEdit({ kind: "insert", structuralPath: "#box", html: "<h1>A</h1>", position: "inside", timestamp: "t1" });
    s.recordEdit({ kind: "insert", structuralPath: "#box", html: "<p>B</p>", position: "inside", timestamp: "t2" });
    expect(useChangeSetStore.getState().edits).toHaveLength(2);
    expect(useChangeSetStore.getState().edits[0].kind).toBe("insert");
    expect(useChangeSetStore.getState().edits[1].kind).toBe("insert");
  });

  it("accumulates duplicate edits on the same path", () => {
    const s = useChangeSetStore.getState();
    s.recordEdit({ kind: "duplicate", structuralPath: "#card", timestamp: "t1" });
    s.recordEdit({ kind: "duplicate", structuralPath: "#card", timestamp: "t2" });
    expect(useChangeSetStore.getState().edits).toHaveLength(2);
  });

  it("accumulates delete edits on the same path", () => {
    const s = useChangeSetStore.getState();
    s.recordEdit({ kind: "delete", structuralPath: "#a", timestamp: "t1" });
    s.recordEdit({ kind: "delete", structuralPath: "#b", timestamp: "t2" });
    expect(useChangeSetStore.getState().edits).toHaveLength(2);
  });

  it("still deduplicates class edits on same path+property+viewport", () => {
    const s = useChangeSetStore.getState();
    const base = {
      kind: "class" as const,
      structuralPath: "#hero",
      property: "font-size" as const,
      oldClassList: ["text-sm"],
      newClassList: ["text-lg"],
      viewport: "desktop" as const,
      timestamp: "t1",
    };
    s.recordEdit(base);
    s.recordEdit({ ...base, newClassList: ["text-xl"], timestamp: "t2" });
    expect(useChangeSetStore.getState().edits).toHaveLength(1);
    expect(useChangeSetStore.getState().edits[0].newClassList).toEqual(["text-xl"]);
  });

  it("does NOT deduplicate class edits across different viewports", () => {
    const s = useChangeSetStore.getState();
    const base = { kind: "class" as const, structuralPath: "#p", property: "font-size" as const, oldClassList: [], newClassList: ["text-lg"], timestamp: "t1" };
    s.recordEdit({ ...base, viewport: "desktop" as const });
    s.recordEdit({ ...base, viewport: "mobile" as const, newClassList: ["text-sm"] });
    expect(useChangeSetStore.getState().edits).toHaveLength(2);
  });
});
```

---

### Test File: `test/editor/live-style-engine.test.ts` (NEW)

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";

// BUG-004 regression — custom/unmapped CSS must not be wiped
describe("commitStyleChange — custom CSS fallback (BUG-004)", () => {
  it("preserves filter style and emits style edit in Tailwind mode", async () => {
    const dom = new JSDOM(`<div id="el" class="text-white"></div>`);
    const el = dom.window.document.getElementById("el") as HTMLElement;
    const edits: any[] = [];
    const { commitStyleChange } = await import("@/lib/dom/live-style-engine");
    commitStyleChange(el, "filter" as any, "grayscale(100%)", {
      structuralPath: "#el", viewport: "desktop",
      theme: { mode: "v3", colors: [], spacing: [], fontSizes: [], fontFamilies: [] },
      onEdit: (r: any) => edits.push(r),
    });
    expect(el.style.filter).toBe("grayscale(100%)");
    expect(edits).toHaveLength(1);
    expect(edits[0].kind).toBe("style");
    expect(edits[0].property).toBe("filter");
    expect(edits[0].newValue).toBe("grayscale(100%)");
  });

  it("preserves perspective style and emits style edit", async () => {
    const dom = new JSDOM(`<div id="el"></div>`);
    const el = dom.window.document.getElementById("el") as HTMLElement;
    const edits: any[] = [];
    const { commitStyleChange } = await import("@/lib/dom/live-style-engine");
    commitStyleChange(el, "perspective" as any, "500px", {
      structuralPath: "#el", viewport: "desktop",
      theme: { mode: "v3", colors: [], spacing: [], fontSizes: [], fontFamilies: [] },
      onEdit: (r: any) => edits.push(r),
    });
    expect(el.style.perspective).toBe("500px");
    expect(edits[0].kind).toBe("style");
  });

  it("does NOT wipe inline style and does NOT emit empty class edit", async () => {
    const dom = new JSDOM(`<div id="el" style="user-select: none"></div>`);
    const el = dom.window.document.getElementById("el") as HTMLElement;
    const edits: any[] = [];
    const { commitStyleChange } = await import("@/lib/dom/live-style-engine");
    commitStyleChange(el, "user-select" as any, "none", {
      structuralPath: "#el", viewport: "desktop",
      theme: { mode: "v3", colors: [], spacing: [], fontSizes: [], fontFamilies: [] },
      onEdit: (r: any) => edits.push(r),
    });
    expect(el.style.userSelect).toBe("none");
    const classEdits = edits.filter(e => e.kind === "class" && e.newClassList?.length === 0);
    expect(classEdits).toHaveLength(0);
  });
});
```

---

### Test File: `test/ast/apply-edits.test.ts`
**Add to existing file:**

```ts
// BUG-003 regression — duplicate elements must get unique IDs
describe("element duplication — unique ID generation (BUG-003)", () => {
  it("rewrites id attribute when duplicating an element with an id", () => {
    const html = `<div id="hero-card"><p>Hello</p></div>`;
    const result = applyEditsClientSide(html, [
      { kind: "duplicate", structuralPath: "div:nth-of-type(1)", timestamp: "t" },
    ]);
    expect(result).toContain('id="hero-card-copy"');
    const matches = result.match(/id="hero-card(?:-copy)?"/g) ?? [];
    expect(matches).toHaveLength(2);
  });

  it("handles elements with no id without errors", () => {
    const html = `<div class="card"><p>Hello</p></div>`;
    expect(() =>
      applyEditsClientSide(html, [
        { kind: "duplicate", structuralPath: "div:nth-of-type(1)", timestamp: "t" },
      ])
    ).not.toThrow();
  });

  it("handles multiple id attributes in nested children", () => {
    const html = `<section id="sec"><div id="inner"><p>Hi</p></div></section>`;
    const result = applyEditsClientSide(html, [
      { kind: "duplicate", structuralPath: "section:nth-of-type(1)", timestamp: "t" },
    ]);
    expect(result).toContain('id="sec-copy"');
    expect(result).toContain('id="inner-copy"');
  });
});
```

---

### Test File: `test/ast/apply-edits-responsive.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

// BUG-006 regression — responsive CSS must be written to saved HTML
describe("applyEditsClientSide — responsive style persistence (BUG-006)", () => {
  it("injects responsive CSS into <head> when responsiveCss option is provided", () => {
    const html = `<!DOCTYPE html><html><head><title>T</title></head><body><p>Hi</p></body></html>`;
    const result = applyEditsClientSide(html, [], {
      responsiveCss: "@media (max-width: 768px) { p { font-size: 14px; } }",
    });
    expect(result).toContain('<style id="vse-responsive-styles">');
    expect(result).toContain("max-width: 768px");
    expect(result).toContain("14px");
  });

  it("updates existing vse-responsive-styles tag without duplicating it", () => {
    const html = `<!DOCTYPE html><html><head><style id="vse-responsive-styles">/* old */</style></head><body></body></html>`;
    const result = applyEditsClientSide(html, [], {
      responsiveCss: "@media (max-width: 640px) { p { font-size: 12px; } }",
    });
    const tagCount = (result.match(/id="vse-responsive-styles"/g) ?? []).length;
    expect(tagCount).toBe(1);
    expect(result).toContain("640px");
    expect(result).not.toContain("/* old */");
  });

  it("does NOT inject anything when responsiveCss is empty", () => {
    const html = `<!DOCTYPE html><html><head><title>T</title></head><body></body></html>`;
    const result = applyEditsClientSide(html, [], { responsiveCss: "" });
    expect(result).not.toContain("vse-responsive-styles");
  });

  it("does NOT inject anything when responsiveCss option is omitted", () => {
    const html = `<!DOCTYPE html><html><head><title>T</title></head><body></body></html>`;
    const result = applyEditsClientSide(html, []);
    expect(result).not.toContain("vse-responsive-styles");
  });

  it("places style tag before </head>", () => {
    const html = `<!DOCTYPE html><html><head></head><body></body></html>`;
    const result = applyEditsClientSide(html, [], {
      responsiveCss: "@media(max-width:375px){}",
    });
    const headCloseIdx = result.indexOf("</head>");
    const styleIdx = result.indexOf('<style id="vse-responsive-styles">');
    expect(styleIdx).toBeGreaterThan(-1);
    expect(styleIdx).toBeLessThan(headCloseIdx);
  });
});
```

---

### Test File: `test/editor/link-group-path.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { buildDomAdapter } from "@/lib/dom/dom-adapter";

// BUG-005 regression — link edits must target anchor tag, not child
describe("LinkGroup anchor path resolution (BUG-005)", () => {
  it("resolves to anchor tag path, not span child path", () => {
    const dom = new JSDOM(`<body><a href="#"><span id="txt">Link</span></a></body>`);
    const doc = dom.window.document;
    const span = doc.getElementById("txt") as HTMLElement;
    const anchor = span.closest("a") as HTMLElement;
    const adapter = buildDomAdapter(doc);
    const anchorPath = computeStructuralPath(anchor, adapter);
    const spanPath = computeStructuralPath(span, adapter);
    expect(anchorPath).not.toBe(spanPath);
    expect(anchorPath).toContain("a:");
    expect(spanPath).toContain("span:");
  });

  it("anchor path from nested button child does not include button tag", () => {
    const dom = new JSDOM(`<body><a href="/page"><button>Go</button></a></body>`);
    const doc = dom.window.document;
    const btn = doc.querySelector("button") as HTMLElement;
    const anchor = btn.closest("a") as HTMLElement;
    const adapter = buildDomAdapter(doc);
    const anchorPath = computeStructuralPath(anchor, adapter);
    expect(anchorPath).toContain("a:");
    expect(anchorPath).not.toContain("button");
  });

  it("handles anchor that is directly selected (no child elements)", () => {
    const dom = new JSDOM(`<body><a href="/home">Home</a></body>`);
    const doc = dom.window.document;
    const anchor = doc.querySelector("a") as HTMLElement;
    const adapter = buildDomAdapter(doc);
    const path = computeStructuralPath(anchor, adapter);
    expect(path).toContain("a:");
  });
});
```

---

### Test File: `test/tailwind/forward-map.test.ts`
**Add to existing file:**

```ts
// BUG-010 regression — font-weight must map to standard Tailwind classes
describe("font-weight forward mapping (BUG-010)", () => {
  it("maps numeric weights to standard Tailwind classes", () => {
    const opts = { snap: true, theme: emptyTheme };
    expect(forwardMap("font-weight", "700", opts)).toBe("font-bold");
    expect(forwardMap("font-weight", "400", opts)).toBe("font-normal");
    expect(forwardMap("font-weight", "600", opts)).toBe("font-semibold");
    expect(forwardMap("font-weight", "300", opts)).toBe("font-light");
    expect(forwardMap("font-weight", "900", opts)).toBe("font-black");
    expect(forwardMap("font-weight", "100", opts)).toBe("font-thin");
    expect(forwardMap("font-weight", "200", opts)).toBe("font-extralight");
    expect(forwardMap("font-weight", "500", opts)).toBe("font-medium");
    expect(forwardMap("font-weight", "800", opts)).toBe("font-extrabold");
  });

  it("maps keyword weights", () => {
    const opts = { snap: true, theme: emptyTheme };
    expect(forwardMap("font-weight", "bold", opts)).toBe("font-bold");
    expect(forwardMap("font-weight", "normal", opts)).toBe("font-normal");
    expect(forwardMap("font-weight", "lighter", opts)).toBe("font-light");
  });

  it("uses arbitrary class for non-standard values", () => {
    const opts = { snap: true, theme: emptyTheme };
    expect(forwardMap("font-weight", "450", opts)).toBe("font-[450]");
  });
});
```

---

## TESTS TO ADD — PHASE 1 (New Features)

### Test File: `test/lib/auto-save.test.ts` (NEW)

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { autoSaveSync, autoSave, restoreAutoSave, clearAutoSave, listAutoSaveKeys } from "@/lib/fs/auto-save";

describe("auto-save", () => {
  beforeEach(() => localStorage.clear());

  it("autoSaveSync stores HTML under correct localStorage key", () => {
    autoSaveSync("file-abc", "<html>test</html>");
    expect(localStorage.getItem("vse_autosave_file-abc")).toBe("<html>test</html>");
  });

  it("autoSaveSync overwrites previous entry for same fileId", () => {
    autoSaveSync("f1", "<p>v1</p>");
    autoSaveSync("f1", "<p>v2</p>");
    expect(localStorage.getItem("vse_autosave_f1")).toBe("<p>v2</p>");
  });

  it("restoreAutoSave returns stored HTML", () => {
    localStorage.setItem("vse_autosave_xyz", "<b>restored</b>");
    expect(restoreAutoSave("xyz")).toBe("<b>restored</b>");
  });

  it("restoreAutoSave returns null for unknown fileId", () => {
    expect(restoreAutoSave("missing-file")).toBeNull();
  });

  it("clearAutoSave removes the entry", () => {
    localStorage.setItem("vse_autosave_f2", "data");
    clearAutoSave("f2");
    expect(localStorage.getItem("vse_autosave_f2")).toBeNull();
  });

  it("clearAutoSave is safe on non-existent key", () => {
    expect(() => clearAutoSave("no-such-key")).not.toThrow();
  });

  it("listAutoSaveKeys returns all autosave fileIds", () => {
    autoSaveSync("file-1", "a");
    autoSaveSync("file-2", "b");
    autoSaveSync("file-3", "c");
    const keys = listAutoSaveKeys();
    expect(keys).toContain("file-1");
    expect(keys).toContain("file-2");
    expect(keys).toContain("file-3");
  });

  it("autoSave (debounced) does not write immediately", () => {
    vi.useFakeTimers();
    autoSave("d-file", "<p>debounced</p>");
    expect(localStorage.getItem("vse_autosave_d-file")).toBeNull();
    vi.runAllTimers();
    expect(localStorage.getItem("vse_autosave_d-file")).toBe("<p>debounced</p>");
    vi.useRealTimers();
  });

  it("autoSave cancels previous timer when called again within debounce window", () => {
    vi.useFakeTimers();
    autoSave("d-file", "<p>first</p>");
    vi.advanceTimersByTime(1000); // not yet
    autoSave("d-file", "<p>second</p>");
    vi.runAllTimers();
    expect(localStorage.getItem("vse_autosave_d-file")).toBe("<p>second</p>");
    vi.useRealTimers();
  });
});
```

---

### Test File: `test/lib/palette-harmonizer.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { generateHarmonizedPalette } from "@/lib/color/palette-harmonizer";

describe("generateHarmonizedPalette", () => {
  it("returns object with all required keys", () => {
    const p = generateHarmonizedPalette("#0084FF");
    expect(p).toHaveProperty("primary");
    expect(p).toHaveProperty("secondary");
    expect(p).toHaveProperty("accent");
    expect(p).toHaveProperty("neutral");
    expect(p).toHaveProperty("shades");
  });

  it("returns exactly 9 shades", () => {
    expect(generateHarmonizedPalette("#0084FF").shades).toHaveLength(9);
  });

  it("all shades are valid 6-digit hex strings", () => {
    const { shades } = generateHarmonizedPalette("#10B981");
    shades.forEach(shade => expect(shade).toMatch(/^#[0-9a-fA-F]{6}$/));
  });

  it("primary, secondary, accent, neutral are all valid hex strings", () => {
    const p = generateHarmonizedPalette("#FF6B35");
    ["primary","secondary","accent","neutral"].forEach(key => {
      expect((p as any)[key]).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it("falls back to indigo #6366F1 on invalid input", () => {
    expect(generateHarmonizedPalette("notacolor").primary).toBe("#6366F1");
    expect(generateHarmonizedPalette("").primary).toBe("#6366F1");
    expect(generateHarmonizedPalette("#ZZZZZZ").primary).toBe("#6366F1");
  });

  it("generates different palettes for different hues", () => {
    const blueP = generateHarmonizedPalette("#0084FF");
    const greenP = generateHarmonizedPalette("#10B981");
    expect(blueP.primary).not.toBe(greenP.primary);
    expect(blueP.secondary).not.toBe(greenP.secondary);
  });

  it("secondary is hue-shifted from primary", () => {
    // Just verify they are not identical
    const p = generateHarmonizedPalette("#0084FF");
    expect(p.secondary).not.toBe(p.primary);
  });

  it("shades go from light to dark (first shade is lighter than last)", () => {
    const { shades } = generateHarmonizedPalette("#0084FF");
    // Parse luminance from first and last shade — first (100) should be lighter
    // Simple check: first shade should have high R+G+B sum vs last
    function brightness(hex: string) {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return r + g + b;
    }
    expect(brightness(shades[0])).toBeGreaterThan(brightness(shades[8]));
  });
});
```

---

### Test File: `test/lib/shadow-presets.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { SHADOW_PRESETS, getShadowPreset } from "@/lib/presets/shadow-presets";

describe("shadow-presets", () => {
  it("exports at least 8 presets", () => {
    expect(SHADOW_PRESETS.length).toBeGreaterThanOrEqual(8);
  });

  it("each preset has required fields: id, label, css, tailwindClass, category", () => {
    SHADOW_PRESETS.forEach(p => {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.css).toBeTruthy();
      expect(p.tailwindClass).toBeTruthy();
      expect(["shadow","glow","inset","none"]).toContain(p.category);
    });
  });

  it("all ids are unique", () => {
    const ids = SHADOW_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getShadowPreset returns the correct preset by id", () => {
    const p = getShadowPreset("soft-md");
    expect(p).toBeDefined();
    expect(p?.label).toBeTruthy();
  });

  it("getShadowPreset returns undefined for unknown id", () => {
    expect(getShadowPreset("i-do-not-exist")).toBeUndefined();
  });

  it("has at least one preset in each category", () => {
    const categories = new Set(SHADOW_PRESETS.map(p => p.category));
    expect(categories.has("shadow")).toBe(true);
    expect(categories.has("glow")).toBe(true);
    expect(categories.has("none")).toBe(true);
  });

  it("glow presets use rgba in their css", () => {
    SHADOW_PRESETS.filter(p => p.category === "glow").forEach(p => {
      expect(p.css).toContain("rgba");
    });
  });

  it("the 'none' preset has css === 'none'", () => {
    const nonePreset = getShadowPreset("none");
    expect(nonePreset?.css).toBe("none");
  });
});
```

---

### Test File: `test/lib/animation-presets.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import {
  TRANSITION_PRESETS, ANIMATION_PRESETS, HOVER_EFFECT_PRESETS,
  buildTransitionClasses, TransitionConfig,
} from "@/lib/presets/animation-presets";

describe("animation-presets", () => {
  it("TRANSITION_PRESETS has at least 5 entries", () => {
    expect(TRANSITION_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it("ANIMATION_PRESETS has at least 4 entries", () => {
    expect(ANIMATION_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it("HOVER_EFFECT_PRESETS has at least 4 entries", () => {
    expect(HOVER_EFFECT_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it("every transition preset has id, label, and classes[]", () => {
    TRANSITION_PRESETS.forEach(p => {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(Array.isArray(p.classes)).toBe(true);
    });
  });

  it("every animation preset has id, label, and classes[]", () => {
    ANIMATION_PRESETS.forEach(p => {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(Array.isArray(p.classes)).toBe(true);
    });
  });

  it("every hover preset has id, label, and hoverClasses[]", () => {
    HOVER_EFFECT_PRESETS.forEach(p => {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(Array.isArray(p.hoverClasses)).toBe(true);
    });
  });

  it("buildTransitionClasses — all=300=ease-out produces valid Tailwind string", () => {
    const cfg: TransitionConfig = { property: "all", duration: 300, easing: "ease-out" };
    const cls = buildTransitionClasses(cfg);
    expect(cls).toContain("transition");
    expect(cls).toContain("duration-300");
    expect(cls).toContain("ease-out");
  });

  it("buildTransitionClasses — colors=200=ease-in-out", () => {
    const cls = buildTransitionClasses({ property: "colors", duration: 200, easing: "ease-in-out" });
    expect(cls).toContain("transition-colors");
    expect(cls).toContain("duration-200");
    expect(cls).toContain("ease-in-out");
  });

  it("buildTransitionClasses — opacity=150=linear", () => {
    const cls = buildTransitionClasses({ property: "opacity", duration: 150, easing: "linear" });
    expect(cls).toContain("transition-opacity");
    expect(cls).toContain("duration-150");
    expect(cls).toContain("linear");
  });

  it("transition preset ids are unique", () => {
    const ids = TRANSITION_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hover preset 'none' has empty hoverClasses array", () => {
    const none = HOVER_EFFECT_PRESETS.find(p => p.id === "none");
    expect(none?.hoverClasses).toHaveLength(0);
  });

  it("scale-up hover preset includes scale-105 class", () => {
    const scaleUp = HOVER_EFFECT_PRESETS.find(p => p.id === "scale-up");
    expect(scaleUp?.hoverClasses).toContain("scale-105");
  });
});
```

---

## RUNNING THE COMPLETE TEST SUITE

```bash
# Run all tests
npm test

# Run all tests with coverage report
npm test -- --coverage

# Run only bug fix regression tests
npm test -- test/editor/change-set-store.test.ts test/editor/live-style-engine.test.ts test/ast/apply-edits.test.ts test/ast/apply-edits-responsive.test.ts test/editor/link-group-path.test.ts

# Run only new feature tests
npm test -- test/lib/auto-save.test.ts test/lib/palette-harmonizer.test.ts test/lib/shadow-presets.test.ts test/lib/animation-presets.test.ts

# Watch mode for active development
npm test -- --watch test/lib/palette-harmonizer.test.ts
```

---

## TEST COVERAGE TARGETS

| Module | Current | Target After V2 |
|---|---|---|
| `src/store/change-set-store.ts` | Partial | Add structural edit accumulation tests |
| `src/lib/dom/live-style-engine.ts` | None | Add custom CSS fallback test |
| `src/lib/ast/apply-edits.ts` | Partial | Add duplicate ID + responsive persistence tests |
| `src/lib/fs/auto-save.ts` | None (new file) | Full coverage — 8+ tests |
| `src/lib/color/palette-harmonizer.ts` | None (new file) | Full coverage — 8+ tests |
| `src/lib/presets/shadow-presets.ts` | None (new file) | Full coverage — 7+ tests |
| `src/lib/presets/animation-presets.ts` | None (new file) | Full coverage — 10+ tests |
| `src/lib/tailwind/forward-map.ts` | Partial | Add font-weight mapping tests |

---

## TEST WRITING PRINCIPLES (For This Codebase)

1. **TDD: Write the failing test first, then implement** — never skip this step.
2. **One assertion per test** — each `it()` block tests exactly one behavior.
3. **Use `beforeEach(() => localStorage.clear())` in any test touching localStorage.**
4. **Use `vi.useFakeTimers()` for debounce tests** — then `vi.runAllTimers()` to advance.
5. **Import stores directly** — Zustand stores are singletons; reset with `storeInstance.setState({})`.
6. **Use JSDOM for DOM tests** — `new JSDOM('<html>...</html>')` gives a real DOM in Node.
7. **Dynamic imports with `await import()`** — required when the module has side effects or accesses `window`.
8. **Test the output HTML string** — for AST tests, just check `result.toContain(...)`. Don't parse the result back.
9. **Test file path mirrors source path** — `src/lib/color/palette-harmonizer.ts` → `test/lib/palette-harmonizer.test.ts`.
10. **After every bug fix, add a regression test** — every bug in `bugs-fixes.md` should have a corresponding test.
