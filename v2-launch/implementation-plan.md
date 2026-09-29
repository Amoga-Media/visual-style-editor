# Visual Style Editor V2 — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 11 major V2 features and fix all 9 confirmed bugs to bring Visual Style Editor to a production-ready public launch state.

**Architecture:** All features are 100% client-side (no backend, no login). New panels are React components mounted as property-panel sub-groups or standalone modal overlays. New pages (`/templates`, `/support`) are Astro static pages in `src/pages/`. State enhancements go into existing Zustand stores or new stores following the exact same pattern as `settings-store.ts`.

**Tech Stack:** Astro 5.x + React 19 Islands, Zustand 5, Tailwind CSS v4, culori (OKLCH), parse5, framer-motion, lucide-react, TypeScript strict, Vitest + jsdom

**Spec:** `PROJECT_OVERVIEW.md`, `BUGS_REPORT.md`, `UI_UX_IMPROVEMENT_PLAN.md`, `docs/features-and-improvements-roadmap.md`

## Global Constraints

- Zero backend — all logic must run inside the browser as standard Web APIs
- No new npm dependencies without explicit approval — use what's already installed
- All new components follow the existing dark-mode pattern: `dark:bg-[#090909]`, `dark:border-[#262626]`, `dark:text-zinc-200`
- All new stores use `zustand` `create<State>()` pattern identical to `settings-store.ts`
- All test files live in `test/` mirroring `src/` structure (e.g. `src/lib/foo.ts` → `test/lib/foo.test.ts`)
- Run tests with: `npm test` (Vitest under jsdom)
- Commits use conventional commits: `fix:`, `feat:`, `test:`, `docs:`

---

## PHASE 0 — Critical & High Bug Fixes

### Task 0-A: Fix BUG-001 — ChangeSet Store Structural Edit Data Loss

**Files:**
- Modify: `src/store/change-set-store.ts` (lines 14–22)
- Test: `test/editor/change-set-store.test.ts`

**Interfaces:**
- Consumes: `EditRecord` from `src/types/index.ts` — discriminated union with `.kind` field
- Produces: `recordEdit(record: EditRecord): void` — fixed to never overwrite structural edits

- [ ] **Step 1: Write the failing test**

```ts
// test/editor/change-set-store.test.ts — add these test cases
import { describe, it, expect, beforeEach } from "vitest";
import { useChangeSetStore } from "@/store/change-set-store";

describe("change-set-store structural edit accumulation", () => {
  beforeEach(() => useChangeSetStore.setState({ edits: [] }));

  it("accumulates multiple insert edits on the same structural path", () => {
    const store = useChangeSetStore.getState();
    store.recordEdit({
      kind: "insert",
      structuralPath: "#container",
      html: "<h1>First</h1>",
      position: "inside",
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    store.recordEdit({
      kind: "insert",
      structuralPath: "#container",
      html: "<button>Second</button>",
      position: "inside",
      timestamp: "2026-01-01T00:00:01.000Z",
    });
    const { edits } = useChangeSetStore.getState();
    expect(edits).toHaveLength(2);
    expect(edits[0].kind).toBe("insert");
    expect(edits[1].kind).toBe("insert");
  });

  it("still deduplicates class edits on the same path+property", () => {
    const store = useChangeSetStore.getState();
    const base = {
      kind: "class" as const,
      structuralPath: "#hero",
      property: "font-size" as const,
      oldClassList: ["text-base"],
      newClassList: ["text-lg"],
      viewport: "desktop" as const,
      timestamp: "2026-01-01T00:00:00.000Z",
    };
    store.recordEdit(base);
    store.recordEdit({ ...base, newClassList: ["text-xl"] });
    const { edits } = useChangeSetStore.getState();
    expect(edits).toHaveLength(1);
    expect(edits[0].newClassList).toEqual(["text-xl"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**
```bash
npm test -- test/editor/change-set-store.test.ts
```
Expected: FAIL — second insert overwrites first

- [ ] **Step 3: Implement the fix in `src/store/change-set-store.ts`**

```ts
const STRUCTURAL_KINDS = new Set(["insert", "duplicate", "delete", "move"]);

recordEdit: (record: EditRecord) =>
  set((s) => {
    // Structural edits always accumulate — never deduplicate
    if (STRUCTURAL_KINDS.has(record.kind)) {
      return { edits: [...s.edits, record] };
    }
    // Idempotent edits (class, style, text, attribute) deduplicate by path+property+viewport
    const priorIndex = s.edits.findIndex(
      (e) =>
        e.structuralPath === record.structuralPath &&
        (e as any).property === (record as any).property &&
        ((e as any).viewport || "desktop") === ((record as any).viewport || "desktop") &&
        !STRUCTURAL_KINDS.has(e.kind)
    );
    if (priorIndex === -1) return { edits: [...s.edits, record] };
    const updated = [...s.edits];
    updated[priorIndex] = record;
    return { edits: updated };
  }),
```

- [ ] **Step 4: Run tests — expect PASS**
```bash
npm test -- test/editor/change-set-store.test.ts
```

- [ ] **Step 5: Commit**
```bash
git add src/store/change-set-store.ts test/editor/change-set-store.test.ts
git commit -m "fix: BUG-001 structural edits now accumulate instead of overwriting"
```

---

### Task 0-B: Fix BUG-004 — Custom CSS Wiped in Tailwind Mode

**Files:**
- Modify: `src/lib/dom/live-style-engine.ts` (commitStyleChange, lines 320–338)
- Test: `test/editor/live-style-engine.test.ts`

**Interfaces:**
- Consumes: `forwardMap(property, value, options)` — returns `string | undefined` when no Tailwind equivalent exists
- Produces: `commitStyleChange()` — falls back to inline `style` edit if forwardMap returns undefined

- [ ] **Step 1: Write the failing test**

```ts
// test/editor/live-style-engine.test.ts
import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";

describe("commitStyleChange custom CSS fallback", () => {
  it("preserves inline style and emits style edit when forwardMap returns undefined", async () => {
    const dom = new JSDOM(`<div id="el" class="text-white"></div>`);
    const el = dom.window.document.getElementById("el") as HTMLElement;
    const edits: unknown[] = [];

    const { commitStyleChange } = await import("@/lib/dom/live-style-engine");
    commitStyleChange(
      el,
      "filter" as any,
      "grayscale(100%)",
      {
        structuralPath: "#el",
        viewport: "desktop",
        theme: { mode: "v3", colors: [], spacing: [], fontSizes: [], fontFamilies: [] },
        onEdit: (r: unknown) => edits.push(r),
      }
    );

    expect(el.style.filter).toBe("grayscale(100%)");
    expect(edits).toHaveLength(1);
    expect((edits[0] as any).kind).toBe("style");
    expect((edits[0] as any).property).toBe("filter");
  });
});
```

- [ ] **Step 2: Run to verify it fails**
```bash
npm test -- test/editor/live-style-engine.test.ts
```

- [ ] **Step 3: Fix in `src/lib/dom/live-style-engine.ts` — add fallback when `forwardMap` returns undefined**

```ts
const newClass = forwardMap(property, value, { snap, theme });
if (newClass === undefined) {
  if (isStyleableElement(element)) {
    element.style.setProperty(cssPropertyName(property), value);
  }
  onEdit?.({
    kind: "style",
    structuralPath,
    property,
    cssProperty: cssPropertyName(property),
    oldValue: element.style.getPropertyValue(cssPropertyName(property)) ?? "",
    newValue: value,
    viewport: viewport ?? "desktop",
    timestamp: new Date().toISOString(),
  });
  return; // Exit early — don't wipe the class list
}
// ...existing class mutation code continues
```

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Commit**
```bash
git add src/lib/dom/live-style-engine.ts test/editor/live-style-engine.test.ts
git commit -m "fix: BUG-004 custom CSS properties preserved as style edits in Tailwind mode"
```

---

### Task 0-C: Fix BUG-009, BUG-010, BUG-011, BUG-012 (Quick Wins)

**Files:**
- `src/lib/ast/parse5-adapter.ts` line 1 — BUG-009: `@vse/shared` → `./structural-path`
- `src/lib/tailwind/forward-map.ts` case "font-weight" — BUG-010: add standard weight map
- `src/components/editor/property-panel/LinkGroup.tsx` lines 60–65 — BUG-011: emit `rel` attribute edit
- `src/components/editor/SelectionOverlay.tsx` lines 194–195 — BUG-012: pass viewport+path to drag

- [ ] **Step 1: Fix BUG-009 — parse5-adapter legacy import**
```ts
// Change line 1 in src/lib/ast/parse5-adapter.ts:
// BEFORE: import type { NodeAdapter } from "@vse/shared";
// AFTER:
import type { NodeAdapter } from "./structural-path";
```

- [ ] **Step 2: Fix BUG-010 — font-weight mapping**

In `src/lib/tailwind/forward-map.ts`, replace the `case "font-weight"` block:
```ts
case "font-weight": {
  const WEIGHT_MAP: Record<string, string> = {
    "100": "font-thin", "200": "font-extralight", "300": "font-light",
    "400": "font-normal", "500": "font-medium", "600": "font-semibold",
    "700": "font-bold", "800": "font-extrabold", "900": "font-black",
    "bold": "font-bold", "normal": "font-normal",
    "lighter": "font-light", "bolder": "font-extrabold",
  };
  return WEIGHT_MAP[value.trim()] ?? `font-[${value}]`;
}
```

- [ ] **Step 3: Fix BUG-011 — emit rel attribute on "Open in New Tab" toggle**

In `src/components/editor/property-panel/LinkGroup.tsx`, in `handleTargetToggle`:
```ts
// After targetEl.setAttribute("rel", "noopener noreferrer"), add:
onEdit?.({
  kind: "attribute",
  structuralPath: anchorPath,
  property: "rel",
  attributeName: "rel",
  oldValue: targetEl.getAttribute("rel") ?? "",
  newValue: "noopener noreferrer",
  timestamp: new Date().toISOString(),
});
```

- [ ] **Step 4: Fix BUG-012 — SelectionOverlay drag passes viewport**

In `src/components/editor/SelectionOverlay.tsx`:
```ts
// Change these two applyLiveStyle calls to include viewport and structuralPath:
applyLiveStyle(selectedElement, "left", newLeft + "px", {
  viewport: currentViewport,
  structuralPath: selectedPath ?? undefined,
});
applyLiveStyle(selectedElement, "top", newTop + "px", {
  viewport: currentViewport,
  structuralPath: selectedPath ?? undefined,
});
```

- [ ] **Step 5: Run full test suite**
```bash
npm test
```
Expected: ALL PASS

- [ ] **Step 6: Commit**
```bash
git add src/lib/ast/parse5-adapter.ts src/lib/tailwind/forward-map.ts \
        src/components/editor/property-panel/LinkGroup.tsx \
        src/components/editor/SelectionOverlay.tsx
git commit -m "fix: BUG-009 import path, BUG-010 font-weight map, BUG-011 rel attr, BUG-012 drag viewport"
```

---

### Task 0-D: Fix BUG-005 — LinkGroup Targets Wrong Structural Path

**Files:**
- Modify: `src/components/editor/property-panel/LinkGroup.tsx` (lines 32–45)
- Test: `test/editor/link-group-path.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/editor/link-group-path.test.ts
import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { buildDomAdapter } from "@/lib/dom/dom-adapter";

describe("LinkGroup anchor path resolution", () => {
  it("resolves anchor path when child span is clicked", () => {
    const dom = new JSDOM(`<body><a href="#"><span id="txt">Link</span></a></body>`);
    const doc = dom.window.document;
    const span = doc.getElementById("txt") as HTMLElement;
    const anchor = span.closest("a") as HTMLElement;
    const adapter = buildDomAdapter(doc);
    const anchorPath = computeStructuralPath(anchor, adapter);
    expect(anchorPath).toContain("a:nth-of-type(1)");
    expect(anchorPath).not.toContain("span");
  });
});
```

- [ ] **Step 2: Run to verify**
```bash
npm test -- test/editor/link-group-path.test.ts
```

- [ ] **Step 3: Fix LinkGroup — use anchor's structural path in `commitAttribute`**

In `src/components/editor/property-panel/LinkGroup.tsx`:
```ts
// Add imports at top:
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { buildDomAdapter } from "@/lib/dom/dom-adapter";

// Inside commitAttribute, compute anchor's path:
const iframeDoc = targetEl.ownerDocument;
const adapter = buildDomAdapter(iframeDoc);
const anchorPath = computeStructuralPath(targetEl, adapter);

onEdit?.({
  kind: "attribute",
  structuralPath: anchorPath,  // <-- anchor's path, not selected child
  // ...rest of fields
});
```

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Commit**
```bash
git add src/components/editor/property-panel/LinkGroup.tsx test/editor/link-group-path.test.ts
git commit -m "fix: BUG-005 LinkGroup records edit on anchor tag path, not child element path"
```

---

### Task 0-E: Fix BUG-006 — Responsive Styles Not Persisted on Save

**Files:**
- Modify: `src/lib/ast/apply-edits.ts` (add `responsiveCss` option to `applyEditsClientSide`)
- Modify: `src/components/editor/EditorStudio.tsx` (pass responsive CSS on save)
- Test: `test/ast/apply-edits-responsive.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/ast/apply-edits-responsive.test.ts
import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("applyEditsClientSide responsive styles", () => {
  it("injects responsive CSS into <head> when responsiveCss option is provided", () => {
    const html = `<!DOCTYPE html><html><head><title>T</title></head><body><p>Hi</p></body></html>`;
    const result = applyEditsClientSide(html, [], {
      responsiveCss: "@media (max-width: 768px) { p { font-size: 14px; } }",
    });
    expect(result).toContain('<style id="vse-responsive-styles">');
    expect(result).toContain("max-width: 768px");
  });

  it("replaces existing vse-responsive-styles tag without duplication", () => {
    const html = `<!DOCTYPE html><html><head><style id="vse-responsive-styles">/* old */</style></head><body></body></html>`;
    const result = applyEditsClientSide(html, [], {
      responsiveCss: "@media (max-width: 640px) { p { font-size: 12px; } }",
    });
    const tagCount = (result.match(/id="vse-responsive-styles"/g) ?? []).length;
    expect(tagCount).toBe(1);
    expect(result).toContain("640px");
    expect(result).not.toContain("/* old */");
  });
});
```

- [ ] **Step 2: Run to verify it fails**
```bash
npm test -- test/ast/apply-edits-responsive.test.ts
```

- [ ] **Step 3: Update `applyEditsClientSide` in `src/lib/ast/apply-edits.ts`**

```ts
// Update function signature:
export function applyEditsClientSide(
  html: string,
  edits: SaveRequestEdit[],
  options?: { responsiveCss?: string }
): string {
  // ... existing splice logic to produce `result` ...
  let result = /* existing return value */;

  if (options?.responsiveCss?.trim()) {
    const tag = `<style id="vse-responsive-styles">\n${options.responsiveCss}\n</style>`;
    if (result.includes('id="vse-responsive-styles"')) {
      result = result.replace(
        /<style[^>]*id="vse-responsive-styles"[^>]*>[\s\S]*?<\/style>/,
        tag
      );
    } else {
      result = result.replace("</head>", `${tag}\n</head>`);
    }
  }
  return result;
}
```

- [ ] **Step 4: Wire in EditorStudio.tsx**

```ts
import { generateResponsiveCssString } from "@/lib/dom/responsive-style-engine";
// In save handler:
const responsiveCss = generateResponsiveCssString();
const saved = applyEditsClientSide(currentHtml, pendingEdits, { responsiveCss });
```

- [ ] **Step 5: Run full tests — expect PASS**
```bash
npm test
```
- [ ] **Step 6: Commit**
```bash
git add src/lib/ast/apply-edits.ts src/components/editor/EditorStudio.tsx test/ast/apply-edits-responsive.test.ts
git commit -m "fix: BUG-006 responsive @media styles now written into saved HTML <head>"
```

---

### Task 0-F: Fix BUG-003 — Duplicate IDs on Element Duplication

**Files:**
- Modify: `src/lib/ast/apply-edits.ts` (duplicate branch, lines 187–195)
- Test: `test/ast/apply-edits.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("rewrites id attribute when duplicating an element with an id", () => {
  const html = `<div id="hero-card"><p>Content</p></div>`;
  const result = applyEditsClientSide(html, [
    { kind: "duplicate", structuralPath: "div:nth-of-type(1)", timestamp: "2026-01-01T00:00:00.000Z" },
  ]);
  expect(result).toContain('id="hero-card-copy"');
  // Ensure no bare "hero-card" duplicate remains (original keeps its id)
  const matches = result.match(/id="hero-card(?:-copy)?"/g) ?? [];
  expect(matches).toHaveLength(2);
});
```

- [ ] **Step 2: Run to verify it fails**
- [ ] **Step 3: Fix duplicate branch in `apply-edits.ts`**

```ts
} else if (edit.kind === "duplicate") {
  if (node.sourceCodeLocation) {
    let slice = html.slice(
      node.sourceCodeLocation.startOffset,
      node.sourceCodeLocation.endOffset
    );
    // Rewrite id attributes to prevent HTML spec violation
    slice = slice.replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}-copy"`);
    splices.push({
      startOffset: node.sourceCodeLocation.endOffset,
      endOffset: node.sourceCodeLocation.endOffset,
      replacement: "\n" + slice,
    });
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Commit**
```bash
git add src/lib/ast/apply-edits.ts test/ast/apply-edits.test.ts
git commit -m "fix: BUG-003 duplicated elements get unique -copy id suffix"
```

---

## PHASE 1 — New Core Features

### Task 1-A: Local Storage Auto-Save

**Files:**
- Create: `src/lib/fs/auto-save.ts`
- Modify: `src/components/editor/EditorStudio.tsx` (wire auto-save on edit + recovery banner on load)
- Test: `test/lib/auto-save.test.ts`

**Interfaces:**
- Produces: `autoSave(fileId, html): void` — debounced 2s localStorage write
- Produces: `autoSaveSync(fileId, html): void` — immediate write (for tests)
- Produces: `restoreAutoSave(fileId): string | null`
- Produces: `clearAutoSave(fileId): void`

- [ ] **Step 1: Write the failing test**

```ts
// test/lib/auto-save.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { autoSaveSync, restoreAutoSave, clearAutoSave } from "@/lib/fs/auto-save";

describe("auto-save", () => {
  beforeEach(() => localStorage.clear());

  it("saves HTML to localStorage under vse_autosave_<fileId> key", () => {
    autoSaveSync("file-abc", "<html>test</html>");
    expect(localStorage.getItem("vse_autosave_file-abc")).toBe("<html>test</html>");
  });

  it("restores saved HTML by fileId", () => {
    localStorage.setItem("vse_autosave_xyz", "<p>restored</p>");
    expect(restoreAutoSave("xyz")).toBe("<p>restored</p>");
  });

  it("returns null when no autosave exists for fileId", () => {
    expect(restoreAutoSave("nonexistent")).toBeNull();
  });

  it("clearAutoSave removes the key from localStorage", () => {
    localStorage.setItem("vse_autosave_file1", "<p>data</p>");
    clearAutoSave("file1");
    expect(localStorage.getItem("vse_autosave_file1")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**
```bash
npm test -- test/lib/auto-save.test.ts
```

- [ ] **Step 3: Create `src/lib/fs/auto-save.ts`**

```ts
const PREFIX = "vse_autosave_";
const DEBOUNCE_MS = 2000;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function autoSaveSync(fileId: string, html: string): void {
  try { localStorage.setItem(`${PREFIX}${fileId}`, html); } catch {}
}

export function autoSave(fileId: string, html: string): void {
  const existing = timers.get(fileId);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    autoSaveSync(fileId, html);
    timers.delete(fileId);
  }, DEBOUNCE_MS);
  timers.set(fileId, t);
}

export function restoreAutoSave(fileId: string): string | null {
  try { return localStorage.getItem(`${PREFIX}${fileId}`); } catch { return null; }
}

export function clearAutoSave(fileId: string): void {
  try { localStorage.removeItem(`${PREFIX}${fileId}`); } catch {}
}

export function listAutoSaveKeys(): string[] {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => k.slice(PREFIX.length));
  } catch { return []; }
}
```

- [ ] **Step 4: Wire into EditorStudio**

```ts
import { autoSave, clearAutoSave, restoreAutoSave } from "@/lib/fs/auto-save";

// On each edit commit — call autoSave:
autoSave(activeFileId, currentHtml);

// On successful disk save — clear autosave:
clearAutoSave(activeFileId);

// On file load — check for recovery:
const recovered = restoreAutoSave(fileId);
if (recovered) {
  // Show toast/banner: "Unsaved session found. Restore?" with [Restore] [Discard] buttons
  // On Restore: use recovered HTML
  // On Discard: clearAutoSave(fileId)
}
```

- [ ] **Step 5: Run tests — expect PASS**
```bash
npm test -- test/lib/auto-save.test.ts
```
- [ ] **Step 6: Commit**
```bash
git add src/lib/fs/auto-save.ts test/lib/auto-save.test.ts src/components/editor/EditorStudio.tsx
git commit -m "feat: localStorage auto-save with 2s debounce and session recovery banner"
```

---

### Task 1-B: Color Palette Harmonizer

**Files:**
- Create: `src/lib/color/palette-harmonizer.ts`
- Create: `src/components/editor/property-panel/PaletteHarmonizerGroup.tsx`
- Modify: `src/components/editor/PropertyPanel.tsx` (mount in document inspector or empty state)
- Test: `test/lib/palette-harmonizer.test.ts`

**Interfaces:**
- Produces: `generateHarmonizedPalette(brandHex: string): HarmonizedPalette`
- `HarmonizedPalette = { primary, secondary, accent, neutral: string; shades: string[] }`

- [ ] **Step 1: Write the failing test**

```ts
// test/lib/palette-harmonizer.test.ts
import { describe, it, expect } from "vitest";
import { generateHarmonizedPalette } from "@/lib/color/palette-harmonizer";

describe("generateHarmonizedPalette", () => {
  it("returns palette with all required keys", () => {
    const p = generateHarmonizedPalette("#0084FF");
    expect(p).toHaveProperty("primary");
    expect(p).toHaveProperty("secondary");
    expect(p).toHaveProperty("accent");
    expect(p).toHaveProperty("neutral");
    expect(p.shades).toHaveLength(9);
  });

  it("all shades are valid 6-digit hex strings", () => {
    const p = generateHarmonizedPalette("#10B981");
    for (const shade of p.shades) {
      expect(shade).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("falls back to indigo on invalid input", () => {
    const p = generateHarmonizedPalette("notacolor");
    expect(p.primary).toBe("#6366F1");
  });
});
```

- [ ] **Step 2: Run to verify it fails**
```bash
npm test -- test/lib/palette-harmonizer.test.ts
```

- [ ] **Step 3: Create `src/lib/color/palette-harmonizer.ts`**

```ts
import { formatHex, parse, oklch, interpolate, samples } from "culori";

export interface HarmonizedPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  shades: string[]; // 9 shades 100–900
}

const FALLBACK = "#6366F1";

export function generateHarmonizedPalette(brandHex: string): HarmonizedPalette {
  const parsed = parse(brandHex);
  if (!parsed) return generateHarmonizedPalette(FALLBACK);
  const lch = oklch(parsed);
  if (!lch) return generateHarmonizedPalette(FALLBACK);

  const h = lch.h ?? 0;
  const c = lch.c;
  const l = lch.l;

  const toHex = (hue: number, chroma = c, lightness = l) =>
    formatHex(oklch({ mode: "oklch", l: lightness, c: chroma, h: hue % 360 })) ?? FALLBACK;

  const primary = formatHex(parsed) ?? FALLBACK;
  const secondary = toHex(h + 30);
  const accent = toHex(h + 60);
  const neutral = toHex(h, c * 0.08, 0.5);

  const interp = interpolate(
    [
      oklch({ mode: "oklch", l: 0.97, c: c * 0.15, h }),
      oklch({ mode: "oklch", l, c, h }),
      oklch({ mode: "oklch", l: 0.18, c: c * 0.6, h }),
    ],
    "oklch"
  );
  const shades = samples(9).map((t) => formatHex(interp(t)) ?? "#000000");

  return { primary, secondary, accent, neutral, shades };
}
```

- [ ] **Step 4: Create `PaletteHarmonizerGroup.tsx`**

```tsx
// src/components/editor/property-panel/PaletteHarmonizerGroup.tsx
import { useState } from "react";
import { Palette, Wand2 } from "lucide-react";
import { generateHarmonizedPalette, HarmonizedPalette } from "@/lib/color/palette-harmonizer";
import CollapsibleGroup from "./CollapsibleGroup";

interface Props {
  onApplyColor?: (role: string, hex: string) => void;
}

export default function PaletteHarmonizerGroup({ onApplyColor }: Props) {
  const [brandHex, setBrandHex] = useState("#0084FF");
  const [palette, setPalette] = useState<HarmonizedPalette | null>(null);

  return (
    <CollapsibleGroup title="Color Palette Harmonizer" icon={<Palette className="w-3.5 h-3.5" />} defaultOpen>
      <div className="space-y-3 p-2">
        <div className="flex gap-2 items-center">
          <input type="color" value={brandHex} onChange={(e) => setBrandHex(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-white/10" />
          <input type="text" value={brandHex} onChange={(e) => setBrandHex(e.target.value)}
            className="flex-1 text-xs bg-[#141414] border border-[#262626] rounded-lg px-2 py-1 text-zinc-200 font-mono"
            placeholder="#0084FF" />
          <button onClick={() => setPalette(generateHarmonizedPalette(brandHex))}
            className="px-2.5 py-1.5 rounded-lg bg-[#0084FF] hover:bg-[#0074E0] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
            <Wand2 className="w-3 h-3" /> Generate
          </button>
        </div>

        {palette && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {(["primary","secondary","accent","neutral"] as const).map((role) => (
                <button key={role} onClick={() => onApplyColor?.(role, palette[role])}
                  title={`${role}: ${palette[role]}`}
                  className="flex-1 flex flex-col items-center gap-1 p-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer">
                  <div className="w-full h-7 rounded-md" style={{ background: palette[role] }} />
                  <span className="text-[9px] text-zinc-500 font-mono capitalize">{role}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 rounded-lg overflow-hidden h-6">
              {palette.shades.map((shade, i) => (
                <button key={i} style={{ background: shade, flex: 1 }}
                  title={`Shade ${(i+1)*100}: ${shade}`}
                  onClick={() => navigator.clipboard.writeText(shade)}
                  className="cursor-pointer hover:scale-y-125 transition-transform origin-center" />
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 text-center">Click any shade to copy hex</p>
          </div>
        )}
      </div>
    </CollapsibleGroup>
  );
}
```

- [ ] **Step 5: Run tests — expect PASS**
```bash
npm test -- test/lib/palette-harmonizer.test.ts
```
- [ ] **Step 6: Commit**
```bash
git add src/lib/color/ src/components/editor/property-panel/PaletteHarmonizerGroup.tsx test/lib/palette-harmonizer.test.ts
git commit -m "feat: Color Palette Harmonizer panel using culori OKLCH interpolation"
```

---

### Task 1-C: Shadow & Glow Presets Panel

**Files:**
- Create: `src/lib/presets/shadow-presets.ts`
- Create: `src/components/editor/property-panel/ShadowPresetsGroup.tsx`
- Test: `test/lib/shadow-presets.test.ts`

**Interfaces:**
- Produces: `SHADOW_PRESETS: ShadowPreset[]`
- `ShadowPreset = { id, label, css, tailwindClass, category }`
- Produces: `getShadowPreset(id: string): ShadowPreset | undefined`

- [ ] **Step 1: Write the failing test**

```ts
// test/lib/shadow-presets.test.ts
import { describe, it, expect } from "vitest";
import { SHADOW_PRESETS, getShadowPreset } from "@/lib/presets/shadow-presets";

describe("shadow-presets", () => {
  it("exports at least 8 presets", () => {
    expect(SHADOW_PRESETS.length).toBeGreaterThanOrEqual(8);
  });
  it("each preset has id, label, css, tailwindClass, category", () => {
    for (const p of SHADOW_PRESETS) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("label");
      expect(p).toHaveProperty("css");
      expect(p).toHaveProperty("tailwindClass");
      expect(p).toHaveProperty("category");
    }
  });
  it("getShadowPreset returns preset by id", () => {
    const p = getShadowPreset("soft-md");
    expect(p).toBeDefined();
    expect(p?.css).toBeTruthy();
  });
  it("getShadowPreset returns undefined for unknown id", () => {
    expect(getShadowPreset("no-such-preset")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**
- [ ] **Step 3: Create `src/lib/presets/shadow-presets.ts`**

```ts
export interface ShadowPreset {
  id: string; label: string; css: string;
  tailwindClass: string; category: "shadow" | "glow" | "inset" | "none";
}

export const SHADOW_PRESETS: ShadowPreset[] = [
  { id: "none",        label: "None",        css: "none",              tailwindClass: "shadow-none",    category: "none"   },
  { id: "soft-sm",     label: "Soft S",      css: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)", tailwindClass: "shadow-sm",  category: "shadow" },
  { id: "soft-md",     label: "Soft M",      css: "0 4px 16px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)", tailwindClass: "shadow-md",  category: "shadow" },
  { id: "soft-lg",     label: "Soft L",      css: "0 10px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.12)", tailwindClass: "shadow-lg", category: "shadow" },
  { id: "hard",        label: "Hard",        css: "4px 4px 0px rgba(0,0,0,0.9)",  tailwindClass: "shadow-[4px_4px_0px_rgba(0,0,0,0.9)]", category: "shadow" },
  { id: "glow-blue",   label: "Blue Glow",   css: "0 0 20px rgba(0,132,255,0.6), 0 0 40px rgba(0,132,255,0.2)", tailwindClass: "shadow-[0_0_20px_rgba(0,132,255,0.6)]", category: "glow" },
  { id: "glow-purple", label: "Purple Glow", css: "0 0 20px rgba(139,92,246,0.6), 0 0 40px rgba(139,92,246,0.2)", tailwindClass: "shadow-[0_0_20px_rgba(139,92,246,0.6)]", category: "glow" },
  { id: "glow-green",  label: "Green Glow",  css: "0 0 20px rgba(16,185,129,0.6), 0 0 40px rgba(16,185,129,0.2)", tailwindClass: "shadow-[0_0_20px_rgba(16,185,129,0.6)]", category: "glow" },
  { id: "glow-amber",  label: "Amber Glow",  css: "0 0 20px rgba(245,158,11,0.6), 0 0 40px rgba(245,158,11,0.2)", tailwindClass: "shadow-[0_0_20px_rgba(245,158,11,0.6)]", category: "glow" },
  { id: "inset-sm",    label: "Inset S",     css: "inset 0 1px 4px rgba(0,0,0,0.2)", tailwindClass: "shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]", category: "inset" },
  { id: "elevation-1", label: "Elev 1",      css: "0 1px 2px rgba(0,0,0,0.05)",       tailwindClass: "shadow-xs", category: "shadow" },
  { id: "elevation-3", label: "Elev 3",      css: "0 20px 60px rgba(0,0,0,0.35)",      tailwindClass: "shadow-2xl", category: "shadow" },
];

export function getShadowPreset(id: string): ShadowPreset | undefined {
  return SHADOW_PRESETS.find((p) => p.id === id);
}
```

- [ ] **Step 4: Create `ShadowPresetsGroup.tsx`** — grid of preset cards by category (shadow / glow / inset / none). Each card previews the shadow on a small rounded box and clicks to apply `box-shadow` via `onApply(preset)`.

- [ ] **Step 5: Run tests — expect PASS**
```bash
npm test -- test/lib/shadow-presets.test.ts
```
- [ ] **Step 6: Commit**
```bash
git add src/lib/presets/shadow-presets.ts src/components/editor/property-panel/ShadowPresetsGroup.tsx test/lib/shadow-presets.test.ts
git commit -m "feat: Shadow & Glow Presets panel with 12 presets"
```

---

### Task 1-D: CSS Animation & Transition Builder

**Files:**
- Create: `src/lib/presets/animation-presets.ts`
- Create: `src/components/editor/property-panel/AnimationBuilderGroup.tsx`
- Test: `test/lib/animation-presets.test.ts`

**Interfaces:**
- Produces: `TRANSITION_PRESETS`, `ANIMATION_PRESETS`, `HOVER_EFFECT_PRESETS`
- Produces: `buildTransitionClasses(config: TransitionConfig): string`

- [ ] **Step 1: Write the failing test**

```ts
// test/lib/animation-presets.test.ts
import { describe, it, expect } from "vitest";
import { TRANSITION_PRESETS, ANIMATION_PRESETS, HOVER_EFFECT_PRESETS, buildTransitionClasses } from "@/lib/presets/animation-presets";

describe("animation-presets", () => {
  it("exports at least 5 transition presets", () => expect(TRANSITION_PRESETS.length).toBeGreaterThanOrEqual(5));
  it("exports at least 4 hover presets", () => expect(HOVER_EFFECT_PRESETS.length).toBeGreaterThanOrEqual(4));
  it("exports at least 4 animation presets", () => expect(ANIMATION_PRESETS.length).toBeGreaterThanOrEqual(4));
  it("buildTransitionClasses produces valid Tailwind string", () => {
    const cls = buildTransitionClasses({ duration: 300, easing: "ease-out", property: "all" });
    expect(cls).toContain("transition");
    expect(cls).toContain("duration-300");
    expect(cls).toContain("ease-out");
  });
  it("each preset has id, label, and classes array", () => {
    for (const p of [...TRANSITION_PRESETS, ...ANIMATION_PRESETS]) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("label");
      expect(Array.isArray(p.classes)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**
- [ ] **Step 3: Create `src/lib/presets/animation-presets.ts`**

```ts
export interface TransitionPreset { id: string; label: string; classes: string[]; }
export interface AnimationPreset  { id: string; label: string; classes: string[]; }
export interface HoverPreset      { id: string; label: string; hoverClasses: string[]; baseClasses?: string[]; }
export interface TransitionConfig { property: "all"|"colors"|"opacity"|"transform"|"shadow"; duration: 75|100|150|200|300|500|700|1000; easing: "linear"|"ease-in"|"ease-out"|"ease-in-out"; }

export const TRANSITION_PRESETS: TransitionPreset[] = [
  { id: "none",       label: "None",        classes: [] },
  { id: "smooth-all", label: "Smooth All",  classes: ["transition-all", "duration-300", "ease-out"] },
  { id: "colors",     label: "Colors",      classes: ["transition-colors", "duration-200", "ease-in-out"] },
  { id: "opacity",    label: "Fade",        classes: ["transition-opacity", "duration-300", "ease-in-out"] },
  { id: "transform",  label: "Transform",   classes: ["transition-transform", "duration-200", "ease-out"] },
  { id: "shadow",     label: "Shadow",      classes: ["transition-shadow", "duration-300", "ease-out"] },
  { id: "snappy",     label: "Snappy",      classes: ["transition-all", "duration-150", "ease-in"] },
  { id: "bouncy",     label: "Bouncy",      classes: ["transition-all", "duration-500", "ease-[cubic-bezier(0.34,1.56,0.64,1)]"] },
];

export const ANIMATION_PRESETS: AnimationPreset[] = [
  { id: "none",   label: "None",   classes: [] },
  { id: "spin",   label: "Spin",   classes: ["animate-spin"] },
  { id: "ping",   label: "Ping",   classes: ["animate-ping"] },
  { id: "pulse",  label: "Pulse",  classes: ["animate-pulse"] },
  { id: "bounce", label: "Bounce", classes: ["animate-bounce"] },
];

export const HOVER_EFFECT_PRESETS: HoverPreset[] = [
  { id: "none",       label: "None",     hoverClasses: [] },
  { id: "scale-up",   label: "Scale Up", hoverClasses: ["scale-105"],       baseClasses: ["transition-transform", "duration-200"] },
  { id: "scale-down", label: "Press",    hoverClasses: ["scale-95"],        baseClasses: ["transition-transform", "duration-200"] },
  { id: "lift",       label: "Lift",     hoverClasses: ["-translate-y-1"],  baseClasses: ["transition-transform", "duration-200"] },
  { id: "brighten",   label: "Brighten", hoverClasses: ["brightness-110"],  baseClasses: ["transition-all", "duration-200"] },
  { id: "dim",        label: "Dim",      hoverClasses: ["opacity-70"],      baseClasses: ["transition-opacity", "duration-200"] },
];

export function buildTransitionClasses(config: TransitionConfig): string {
  const propClass = config.property === "all" ? "transition-all" : `transition-${config.property}`;
  return [propClass, `duration-${config.duration}`, config.easing].join(" ");
}
```

- [ ] **Step 4: Create `AnimationBuilderGroup.tsx`** — 3-tab panel (Transition / Animation / Hover FX). Each tab shows a grid of preset buttons. Active preset highlighted in blue. Clicking applies/removes Tailwind classes via `onApplyClasses(add: string[], remove: string[])`.

- [ ] **Step 5: Run tests — expect PASS**
```bash
npm test -- test/lib/animation-presets.test.ts
```
- [ ] **Step 6: Commit**
```bash
git add src/lib/presets/animation-presets.ts src/components/editor/property-panel/AnimationBuilderGroup.tsx test/lib/animation-presets.test.ts
git commit -m "feat: CSS Animation & Transition Builder with Tailwind preset library"
```

---

## PHASE 2 — Pages & Infrastructure

### Task 2-A: Support Link in Toolbar + /support Page

**Files:**
- Modify: `src/components/editor/Toolbar.tsx` — add `Heart` link before "Review & Save"
- Create: `src/pages/support.astro`

- [ ] **Step 1: Add Heart link to Toolbar right zone**

In `Toolbar.tsx`, add `Heart` to lucide imports. Then in the right zone, before Review & Save:
```tsx
<a href="/support" target="_blank" rel="noopener noreferrer"
  className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 text-[11px] transition-all"
  title="Support this free tool">
  <Heart className="w-3 h-3" />
  <span className="hidden md:inline">Support</span>
</a>
```

- [ ] **Step 2: Create `src/pages/support.astro`** — premium dark page with 4 support options: Ko-fi, Watch Ad (Carbon Ads slot), GitHub Sponsors, and Share. No editor code on this page.

- [ ] **Step 3: Build and verify**
```bash
npm run build
```
Check that `dist/support/index.html` exists.

- [ ] **Step 4: Commit**
```bash
git add src/components/editor/Toolbar.tsx src/pages/support.astro
git commit -m "feat: Support link in toolbar + /support page with Ko-fi, ads, sponsors"
```

---

### Task 2-B: Marketing Landing Page + Editor at /editor

**Files:**
- Modify: `src/pages/index.astro` — replace with marketing landing page
- Create: `src/pages/editor.astro` — move EditorStudio here

- [ ] **Step 1: Create `src/pages/editor.astro`**
```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import EditorStudio from "@/components/editor/EditorStudio";
---
<BaseLayout title="Visual Style Editor — Free Visual HTML & Tailwind Editor" description="100% in-browser. No login. Drop your HTML and edit visually.">
  <EditorStudio client:only="react" />
</BaseLayout>
```

- [ ] **Step 2: Replace `src/pages/index.astro` with premium landing page**

Premium dark landing page including:
- `<Hero>`: Headline "The Fastest Way to Edit HTML & Tailwind — Visually." + CTA "Open Editor Free →" → `/editor`
- `<Features>`: 3-col grid: "Zero Login", "Tailwind-Aware", "Surgical Save"
- `<HowItWorks>`: 3 step cards: Drop HTML → Click to Edit → Save to Disk
- `<TemplatesPreview>`: 3 template thumbnails linking to `/templates`
- `<Footer>`: GitHub, Support link, `/editor` CTA

- [ ] **Step 3: Verify build**
```bash
npm run build && ls dist/ dist/editor/
```
Expected: both exist without errors.

- [ ] **Step 4: Commit**
```bash
git add src/pages/index.astro src/pages/editor.astro
git commit -m "feat: premium marketing landing page at / and editor at /editor"
```

---

### Task 2-C: Template Library at /templates

**Files:**
- Create: `src/lib/templates/template-registry.ts`
- Create: `src/pages/templates.astro`
- Create: `public/templates/` (placeholder HTML files)

- [ ] **Step 1: Create template registry**

```ts
// src/lib/templates/template-registry.ts
export interface TemplateEntry {
  id: string; name: string; description: string;
  category: "landing" | "portfolio" | "saas" | "blog" | "component";
  tags: string[];
}
export const TEMPLATE_REGISTRY: TemplateEntry[] = [
  { id: "hero-dark",     name: "Dark Hero",         description: "Full-screen gradient hero with CTA and badge",    category: "landing",   tags: ["hero","dark","tailwind"] },
  { id: "saas-pricing",  name: "SaaS Pricing",      description: "3-tier pricing table with toggle",                category: "saas",      tags: ["pricing","dark"] },
  { id: "portfolio",     name: "Portfolio",          description: "Minimal portfolio with project grid",             category: "portfolio", tags: ["portfolio","grid"] },
  { id: "landing-light", name: "Light Landing",      description: "Clean light-mode landing page",                  category: "landing",   tags: ["light","clean"] },
  { id: "blog-article",  name: "Blog Article",       description: "Readable article layout with sidebar",           category: "blog",      tags: ["blog","article"] },
  { id: "feature-grid",  name: "Feature Grid",       description: "4-column feature section with icons",            category: "component", tags: ["features","grid"] },
];
```

- [ ] **Step 2: Create `src/pages/templates.astro`** — searchable grid of template cards. Each card has name, category badge, description, and "Open in Editor →" link that passes the template ID as a URL param to `/editor?template=<id>`.

- [ ] **Step 3: Handle template param in EditorStudio**

In `EditorStudio.tsx`, on mount, check `new URLSearchParams(window.location.search).get("template")` — if a known template ID, load the template HTML from `public/templates/<id>.html`.

- [ ] **Step 4: Build and verify**
```bash
npm run build
```

- [ ] **Step 5: Commit**
```bash
git add src/lib/templates/ src/pages/templates.astro public/templates/ src/components/editor/EditorStudio.tsx
git commit -m "feat: /templates page with searchable gallery, category filters, and URL param loading"
```

---

## Self-Review Checklist

| Requirement | Task | Status |
|---|---|---|
| BUG-001 structural edit data loss | 0-A | Planned |
| BUG-003 duplicate IDs | 0-F | Planned |
| BUG-004 custom CSS wiped | 0-B | Planned |
| BUG-005 link path wrong | 0-D | Planned |
| BUG-006 responsive not saved | 0-E | Planned |
| BUG-009 legacy import | 0-C | Planned |
| BUG-010 font-weight | 0-C | Planned |
| BUG-011 rel attr | 0-C | Planned |
| BUG-012 drag viewport | 0-C | Planned |
| Local Storage Auto-Save | 1-A | Planned |
| Color Palette Harmonizer | 1-B | Planned |
| Shadow/Glow Presets | 1-C | Planned |
| CSS Animation Builder | 1-D | Planned |
| Support link + /support | 2-A | Planned |
| Landing page + /editor | 2-B | Planned |
| /templates page | 2-C | Planned |

**Phase 3 (next plan):** React JSX export, Floating Canvas HUD, Box Model Visualizer, Hover/Active state styler.

---

**Plan complete. Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task with two-stage review between tasks.

**2. Inline Execution** — Use `executing-plans` skill, batch execution with checkpoints.

**Which approach?**
