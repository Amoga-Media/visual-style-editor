# Visual Style Editor — Prompts to Use
> Copy-paste these prompts directly into a new AI chat session to implement each task.
> Each prompt is self-contained — the agent needs no prior context.

---

## HOW TO USE THIS FILE

1. Open a new chat with Antigravity (or Claude/GPT)
2. Copy the entire prompt block for the task you want
3. Paste it and hit Send
4. Review the output, then move to the next task

**Order matters for Phase 0 bugs** — fix Task 0-C (legacy imports) FIRST before running any other tasks, or TypeScript will error.

---

## ⚡ WORKFLOW SUPERPOWERS

Before any new feature session:
```
Use the `using-superpowers` skill. I need you to implement [TASK NAME] in the Visual Style Editor project at c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor
Read the implementation plan at docs/superpowers/plans/2026-09-30-visual-style-editor-v2.md and execute Task [TASK ID] step by step. Check off each checkbox as you complete it. Run the test commands exactly as written. Do not move to the next step without the current step's test passing.
```

---

## PHASE 0 — Bug Fixes

### Prompt 0-C: Quick Wins (Fix 4 bugs in 1 session) — DO THIS FIRST

```
You are working on the Visual Style Editor project located at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

This is an Astro 5 + React 19 + TypeScript project. Fix these 4 bugs in order:

**BUG-009 — Fix legacy import in parse5-adapter.ts**
File: src/lib/ast/parse5-adapter.ts
Change line 1 from:
  import type { NodeAdapter } from "@vse/shared";
To:
  import type { NodeAdapter } from "./structural-path";

**BUG-010 — Fix font-weight mapping in forward-map.ts**
File: src/lib/tailwind/forward-map.ts
Find the `case "font-weight":` block. Replace the entire case with:
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

**BUG-012 — SelectionOverlay drag missing viewport**
File: src/components/editor/SelectionOverlay.tsx
Find the two `applyLiveStyle(selectedElement, "left", ...)` and `applyLiveStyle(selectedElement, "top", ...)` calls inside the onPointerMove handler (around lines 194-195). Add `viewport: currentViewport` and `structuralPath: selectedPath ?? undefined` to both calls.

**BUG-011 — LinkGroup rel attribute not saved**
File: src/components/editor/property-panel/LinkGroup.tsx
Find `handleTargetToggle`. After `targetEl.setAttribute("rel", "noopener noreferrer")`, emit an edit record:
```ts
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

After all 4 fixes, run:
  npm test
Expected: All tests pass. Confirm with the output.
Then commit:
  git add -A && git commit -m "fix: BUG-009 import, BUG-010 font-weight, BUG-011 rel attr, BUG-012 drag viewport"
```

---

### Prompt 0-A: Fix BUG-001 — ChangeSet Structural Edit Data Loss (CRITICAL)

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Context:** BUG-001 is a critical data loss bug. When users insert 2+ components into the same container, only the last one is saved. The root cause is in src/store/change-set-store.ts — structural edits (insert, duplicate, delete, move) are being deduplicated using the same logic as idempotent class/style edits.

**Step 1 — Write failing test first:**
Open or create test/editor/change-set-store.test.ts. Add this test:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useChangeSetStore } from "@/store/change-set-store";

describe("structural edit accumulation", () => {
  beforeEach(() => useChangeSetStore.setState({ edits: [] }));

  it("accumulates multiple insert edits on the same path", () => {
    const s = useChangeSetStore.getState();
    s.recordEdit({ kind: "insert", structuralPath: "#box", html: "<h1>A</h1>", position: "inside", timestamp: "t1" });
    s.recordEdit({ kind: "insert", structuralPath: "#box", html: "<p>B</p>", position: "inside", timestamp: "t2" });
    expect(useChangeSetStore.getState().edits).toHaveLength(2);
  });

  it("still deduplicates class edits on same path+property", () => {
    const s = useChangeSetStore.getState();
    const base = { kind: "class" as const, structuralPath: "#h", property: "font-size" as const, oldClassList: ["text-sm"], newClassList: ["text-lg"], viewport: "desktop" as const, timestamp: "t1" };
    s.recordEdit(base);
    s.recordEdit({ ...base, newClassList: ["text-xl"] });
    expect(useChangeSetStore.getState().edits).toHaveLength(1);
    expect(useChangeSetStore.getState().edits[0].newClassList).toEqual(["text-xl"]);
  });
});
```

**Step 2 — Run test to confirm it fails:**
  npm test -- test/editor/change-set-store.test.ts

**Step 3 — Fix src/store/change-set-store.ts:**
At the top of the file, define:
```ts
const STRUCTURAL_KINDS = new Set(["insert", "duplicate", "delete", "move"]);
```
Then update the `recordEdit` action to return immediately for structural kinds without deduplication:
```ts
recordEdit: (record: EditRecord) => set((s) => {
  if (STRUCTURAL_KINDS.has(record.kind)) {
    return { edits: [...s.edits, record] };
  }
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

**Step 4 — Run all tests:**
  npm test
Expected: ALL tests pass.

**Step 5 — Commit:**
  git add src/store/change-set-store.ts test/editor/change-set-store.test.ts
  git commit -m "fix: BUG-001 structural edits accumulate instead of overwriting (critical data loss)"
```

---

### Prompt 0-B: Fix BUG-004 — Custom CSS Wiped in Tailwind Mode

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Context:** BUG-004 — When a user adds custom CSS (filter, perspective, backdrop-filter, user-select) via the AdvancedCssGroup panel while Tailwind mode is active, the style is immediately deleted because live-style-engine.ts calls element.style.removeProperty() even when forwardMap returns undefined.

**Step 1 — Write failing test:**
Create/open test/editor/live-style-engine.test.ts:
```ts
import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";

describe("commitStyleChange custom CSS fallback", () => {
  it("preserves inline style as style edit when forwardMap cannot map the property", async () => {
    const dom = new JSDOM(`<div id="el" class="text-white"></div>`);
    const el = dom.window.document.getElementById("el") as HTMLElement;
    const edits: any[] = [];
    const { commitStyleChange } = await import("@/lib/dom/live-style-engine");
    commitStyleChange(el, "filter" as any, "grayscale(100%)", {
      structuralPath: "#el",
      viewport: "desktop",
      theme: { mode: "v3", colors: [], spacing: [], fontSizes: [], fontFamilies: [] },
      onEdit: (r: any) => edits.push(r),
    });
    expect(el.style.filter).toBe("grayscale(100%)");
    expect(edits.length).toBe(1);
    expect(edits[0].kind).toBe("style");
  });
});
```

**Step 2 — Run to confirm failure:**
  npm test -- test/editor/live-style-engine.test.ts

**Step 3 — Fix src/lib/dom/live-style-engine.ts:**
Inside `commitStyleChange`, find where `forwardMap` is called. Immediately after:
```ts
const newClass = forwardMap(property, value, { snap, theme });
```
Add this guard BEFORE any class mutation code:
```ts
if (newClass === undefined) {
  // Property has no Tailwind equivalent — preserve as inline style
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
  return; // IMPORTANT: return early to skip class list mutation
}
```

**Step 4 — Run all tests:**
  npm test
Expected: ALL pass.

**Step 5 — Commit:**
  git add src/lib/dom/live-style-engine.ts test/editor/live-style-engine.test.ts
  git commit -m "fix: BUG-004 custom CSS properties preserved as style edits in Tailwind mode"
```

---

### Prompt 0-D: Fix BUG-005 — LinkGroup Records Edit on Wrong Element

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Context:** BUG-005 — When a user clicks a nested element inside an anchor (<a><span>Link</span></a>), and changes the href via the LinkGroup panel, the edit record is saved with the <span>'s structural path instead of the <a>'s path. On save, applyEditsClientSide tries to add href to the <span>, producing invalid HTML.

**Fix in src/components/editor/property-panel/LinkGroup.tsx:**

1. Add imports at the top of the file (if not already there):
```ts
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { buildDomAdapter } from "@/lib/dom/dom-adapter";
```

2. Inside the `commitAttribute` function, compute the anchor element's path:
```ts
function commitAttribute(name: string, value: string, oldValue: string) {
  targetEl.setAttribute(name, value);
  // Compute the anchor's path (not the selected child element's path)
  const iframeDoc = targetEl.ownerDocument;
  const adapter = buildDomAdapter(iframeDoc);
  const anchorPath = computeStructuralPath(targetEl, adapter);
  onEdit?.({
    kind: "attribute",
    structuralPath: anchorPath,  // <-- use anchor's path
    property: name,
    attributeName: name,
    oldValue,
    newValue: value,
    timestamp: new Date().toISOString(),
  });
}
```

Run tests:
  npm test
Commit:
  git add src/components/editor/property-panel/LinkGroup.tsx
  git commit -m "fix: BUG-005 LinkGroup uses anchor tag structural path for attribute edits"
```

---

### Prompt 0-E: Fix BUG-006 — Responsive Styles Not Saved

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Context:** BUG-006 — When users set tablet/mobile overrides (e.g., smaller font on mobile), these styles live only in the iframe's <style id="vse-responsive-styles"> tag during editing but are NEVER written to the saved HTML file. So when users re-open the saved file in a browser, all responsive styles are gone.

**Step 1 — Write failing test:**
Create test/ast/apply-edits-responsive.test.ts:
```ts
import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("responsive CSS persistence", () => {
  it("injects responsive CSS into <head> when responsiveCss option provided", () => {
    const html = `<!DOCTYPE html><html><head><title>T</title></head><body></body></html>`;
    const result = applyEditsClientSide(html, [], {
      responsiveCss: "@media (max-width: 768px) { p { font-size: 14px; } }",
    });
    expect(result).toContain('<style id="vse-responsive-styles">');
    expect(result).toContain("768px");
  });

  it("updates existing tag without creating duplicate", () => {
    const html = `<!DOCTYPE html><html><head><style id="vse-responsive-styles">/* old */</style></head><body></body></html>`;
    const result = applyEditsClientSide(html, [], { responsiveCss: "@media (max-width:640px){}" });
    expect((result.match(/vse-responsive-styles/g) ?? []).length).toBe(1);
    expect(result).not.toContain("/* old */");
  });
});
```

**Step 2 — Update src/lib/ast/apply-edits.ts:**
Add optional `options` parameter to `applyEditsClientSide`:
```ts
export function applyEditsClientSide(
  html: string,
  edits: SaveRequestEdit[],
  options?: { responsiveCss?: string }
): string {
  // ... existing implementation produces `result` ...
  
  // After existing logic, inject responsive CSS if provided:
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

**Step 3 — Update EditorStudio.tsx save handler:**
```ts
import { generateResponsiveCssString } from "@/lib/dom/responsive-style-engine";

// In the save/review flow, before calling applyEditsClientSide:
const responsiveCss = generateResponsiveCssString();
const saved = applyEditsClientSide(currentHtml, pendingEdits, { responsiveCss });
```

**Step 4 — Run all tests:**
  npm test
**Step 5 — Commit:**
  git add src/lib/ast/apply-edits.ts src/components/editor/EditorStudio.tsx test/ast/apply-edits-responsive.test.ts
  git commit -m "fix: BUG-006 responsive @media styles now embedded in saved HTML <head>"
```

---

### Prompt 0-F: Fix BUG-003 — Duplicate IDs on Element Duplication

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Context:** BUG-003 — When a user duplicates an element that has an id attribute (e.g. <div id="hero-card">), the AST splicer copies the raw HTML slice verbatim, producing two elements with the same id in the saved file. This breaks CSS selectors and HTML spec.

**Fix in src/lib/ast/apply-edits.ts, in the `else if (edit.kind === "duplicate")` branch:**

Find this code:
```ts
const elementSlice = html.slice(node.sourceCodeLocation.startOffset, node.sourceCodeLocation.endOffset);
splices.push({ startOffset: node.sourceCodeLocation.endOffset, endOffset: node.sourceCodeLocation.endOffset, replacement: "\n" + elementSlice });
```

Replace with:
```ts
let elementSlice = html.slice(node.sourceCodeLocation.startOffset, node.sourceCodeLocation.endOffset);
// Rewrite id attributes to prevent duplicate IDs in saved HTML
elementSlice = elementSlice.replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}-copy"`);
splices.push({ startOffset: node.sourceCodeLocation.endOffset, endOffset: node.sourceCodeLocation.endOffset, replacement: "\n" + elementSlice });
```

Add this test to test/ast/apply-edits.test.ts:
```ts
it("rewrites id attribute on duplicated element", () => {
  const html = `<div id="card"><p>Hi</p></div>`;
  const result = applyEditsClientSide(html, [{ kind: "duplicate", structuralPath: "div:nth-of-type(1)", timestamp: "t" }]);
  expect(result).toContain('id="card-copy"');
  const matches = result.match(/id="card(?:-copy)?"/g) ?? [];
  expect(matches).toHaveLength(2);
});
```

Run: npm test
Commit:
  git add src/lib/ast/apply-edits.ts test/ast/apply-edits.test.ts
  git commit -m "fix: BUG-003 duplicate elements get unique -copy id suffix"
```

---

## PHASE 1 — New Features

### Prompt 1-A: Local Storage Auto-Save

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Task:** Add localStorage auto-save so users don't lose work if they accidentally close the tab before saving to disk.

**Step 1 — Create src/lib/fs/auto-save.ts:**
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
  const t = setTimeout(() => { autoSaveSync(fileId, html); timers.delete(fileId); }, DEBOUNCE_MS);
  timers.set(fileId, t);
}

export function restoreAutoSave(fileId: string): string | null {
  try { return localStorage.getItem(`${PREFIX}${fileId}`); } catch { return null; }
}

export function clearAutoSave(fileId: string): void {
  try { localStorage.removeItem(`${PREFIX}${fileId}`); } catch {}
}

export function listAutoSaveKeys(): string[] {
  try { return Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).map(k => k.slice(PREFIX.length)); } catch { return []; }
}
```

**Step 2 — Write tests in test/lib/auto-save.test.ts:**
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { autoSaveSync, restoreAutoSave, clearAutoSave } from "@/lib/fs/auto-save";

describe("auto-save", () => {
  beforeEach(() => localStorage.clear());
  it("saves to localStorage", () => { autoSaveSync("f1", "<p>hi</p>"); expect(localStorage.getItem("vse_autosave_f1")).toBe("<p>hi</p>"); });
  it("restores saved html", () => { localStorage.setItem("vse_autosave_f2", "<b>x</b>"); expect(restoreAutoSave("f2")).toBe("<b>x</b>"); });
  it("returns null for missing key", () => { expect(restoreAutoSave("missing")).toBeNull(); });
  it("clears the key", () => { localStorage.setItem("vse_autosave_f3", "x"); clearAutoSave("f3"); expect(localStorage.getItem("vse_autosave_f3")).toBeNull(); });
});
```

**Step 3 — Wire into EditorStudio.tsx:**
Import: `import { autoSave, clearAutoSave, restoreAutoSave } from "@/lib/fs/auto-save";`

a) In the `onEdit` callback (called after every panel edit commits), add: `autoSave(activeFileId, currentHtml);`

b) After successful disk save, add: `clearAutoSave(activeFileId);`

c) When a file is loaded, check: 
```ts
const recovered = restoreAutoSave(fileId);
if (recovered) {
  // Show a banner at the top of the editor:
  // "⚠️ Unsaved session recovered for [filename]. [Restore] [Discard]"
  // Restore → use recovered HTML as the initial content
  // Discard → clearAutoSave(fileId) and use fresh file
}
```

**Step 4 — Run tests:**
  npm test -- test/lib/auto-save.test.ts
Expected: All 4 tests pass.

**Step 5 — Commit:**
  git add src/lib/fs/auto-save.ts test/lib/auto-save.test.ts src/components/editor/EditorStudio.tsx
  git commit -m "feat: localStorage auto-save with 2s debounce and session recovery banner"
```

---

### Prompt 1-B: Color Palette Harmonizer

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Task:** Build a Color Palette Harmonizer panel that takes a brand hex color and generates a full harmonized palette (primary, secondary, accent, neutral + 9 shades) using culori (already installed).

**Step 1 — Create src/lib/color/palette-harmonizer.ts:**
```ts
import { formatHex, parse, oklch, interpolate, samples } from "culori";

export interface HarmonizedPalette {
  primary: string; secondary: string; accent: string; neutral: string;
  shades: string[]; // 9 values, shade 100 to 900
}

const FALLBACK = "#6366F1";

export function generateHarmonizedPalette(brandHex: string): HarmonizedPalette {
  const parsed = parse(brandHex);
  if (!parsed) return generateHarmonizedPalette(FALLBACK);
  const lch = oklch(parsed);
  if (!lch) return generateHarmonizedPalette(FALLBACK);
  const { h = 0, c, l } = lch;

  const toHex = (hue: number, chroma = c, lightness = l) =>
    formatHex(oklch({ mode: "oklch", l: lightness, c: chroma, h: hue % 360 })) ?? FALLBACK;

  const primary = formatHex(parsed) ?? FALLBACK;
  const secondary = toHex(h + 30);
  const accent = toHex(h + 60);
  const neutral = toHex(h, c * 0.08, 0.5);

  const interp = interpolate([
    oklch({ mode: "oklch", l: 0.97, c: c * 0.15, h }),
    oklch({ mode: "oklch", l, c, h }),
    oklch({ mode: "oklch", l: 0.18, c: c * 0.6, h }),
  ], "oklch");
  const shades = samples(9).map(t => formatHex(interp(t)) ?? "#000000");

  return { primary, secondary, accent, neutral, shades };
}
```

**Step 2 — Write tests in test/lib/palette-harmonizer.test.ts:**
```ts
import { describe, it, expect } from "vitest";
import { generateHarmonizedPalette } from "@/lib/color/palette-harmonizer";

describe("generateHarmonizedPalette", () => {
  it("returns all required keys", () => {
    const p = generateHarmonizedPalette("#0084FF");
    ["primary","secondary","accent","neutral"].forEach(k => expect(p).toHaveProperty(k));
    expect(p.shades).toHaveLength(9);
  });
  it("all shades are valid hex", () => {
    generateHarmonizedPalette("#10B981").shades.forEach(s => expect(s).toMatch(/^#[0-9a-fA-F]{6}$/));
  });
  it("falls back to indigo on invalid input", () => {
    expect(generateHarmonizedPalette("bad").primary).toBe("#6366F1");
  });
});
```

**Step 3 — Create src/components/editor/property-panel/PaletteHarmonizerGroup.tsx:**
A React component with:
- A row containing: color picker input + hex text input + "Generate" button (Wand2 icon)
- When generated: 4 role swatches (primary, secondary, accent, neutral) as clickable cards
- A strip of 9 shade swatches — clicking any shade copies hex to clipboard
- All styled dark: bg-[#141414], border-[#262626], text-zinc-200
- Wrapped in CollapsibleGroup (import from "./CollapsibleGroup")

**Step 4 — Mount PaletteHarmonizerGroup in PropertyPanel.tsx:**
Add it to the Document Inspector section (shown when no element is selected). Import and render:
```tsx
<PaletteHarmonizerGroup onApplyColor={(role, hex) => {
  // Apply hex as a CSS variable or copy to clipboard — handle as you see fit
  navigator.clipboard.writeText(hex);
}} />
```

**Step 5 — Run tests:**
  npm test -- test/lib/palette-harmonizer.test.ts
Expected: 3 tests pass.

**Step 6 — Commit:**
  git add src/lib/color/ src/components/editor/property-panel/PaletteHarmonizerGroup.tsx src/components/editor/PropertyPanel.tsx test/lib/palette-harmonizer.test.ts
  git commit -m "feat: Color Palette Harmonizer with OKLCH interpolation and 9-shade generation"
```

---

### Prompt 1-C: Shadow & Glow Presets Panel

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Task:** Add a Shadow & Glow Presets panel to the property inspector. Users click a preset to apply it as box-shadow to the selected element.

**Step 1 — Create src/lib/presets/shadow-presets.ts:**
```ts
export interface ShadowPreset {
  id: string; label: string; css: string; tailwindClass: string;
  category: "shadow" | "glow" | "inset" | "none";
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
  { id: "elev-1",      label: "Elev 1",      css: "0 1px 2px rgba(0,0,0,0.05)",       tailwindClass: "shadow-xs",  category: "shadow" },
  { id: "elev-3",      label: "Elev 3",      css: "0 20px 60px rgba(0,0,0,0.35)",      tailwindClass: "shadow-2xl", category: "shadow" },
];
export function getShadowPreset(id: string) { return SHADOW_PRESETS.find(p => p.id === id); }
```

**Step 2 — Write tests in test/lib/shadow-presets.test.ts:**
```ts
import { describe, it, expect } from "vitest";
import { SHADOW_PRESETS, getShadowPreset } from "@/lib/presets/shadow-presets";
describe("shadow-presets", () => {
  it("exports 12+ presets", () => expect(SHADOW_PRESETS.length).toBeGreaterThanOrEqual(8));
  it("each has id/label/css/tailwindClass/category", () => {
    SHADOW_PRESETS.forEach(p => {
      ["id","label","css","tailwindClass","category"].forEach(k => expect(p).toHaveProperty(k));
    });
  });
  it("getShadowPreset finds by id", () => expect(getShadowPreset("soft-md")).toBeDefined());
  it("getShadowPreset returns undefined for unknown id", () => expect(getShadowPreset("x")).toBeUndefined());
});
```

**Step 3 — Create src/components/editor/property-panel/ShadowPresetsGroup.tsx:**
Build a component that:
- Has 4 category filter tabs (shadow / glow / inset / none) styled as pill buttons
- Shows a 3-column grid of preset cards. Each card shows:
  - A small rounded rectangle with the boxShadow applied as a live CSS preview on a dark background
  - The preset label below it
- Clicking a card calls `onApply(preset)` 
- Active preset highlighted with blue border
- Props: `{ element: HTMLElement | null; onApply: (p: ShadowPreset) => void; activePresetId?: string }`
- Wrapped in CollapsibleGroup

**Step 4 — Mount in PropertyPanel.tsx:**
Add ShadowPresetsGroup to the Effects section (show for Container, Button, Image, and Section elements). Pass:
```tsx
<ShadowPresetsGroup
  element={selectedElement}
  onApply={(preset) => {
    commitStyleChange(selectedElement, "box-shadow", preset.css, { ... });
  }}
/>
```

**Step 5 — Run tests:**
  npm test -- test/lib/shadow-presets.test.ts
Expected: 4 tests pass.

**Step 6 — Commit:**
  git add src/lib/presets/shadow-presets.ts src/components/editor/property-panel/ShadowPresetsGroup.tsx src/components/editor/PropertyPanel.tsx test/lib/shadow-presets.test.ts
  git commit -m "feat: Shadow & Glow Presets panel with 12 presets and live CSS preview"
```

---

### Prompt 1-D: CSS Animation & Transition Builder

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Task:** Build a 3-tab Animation Builder panel (Transition / Animation / Hover FX) that lets users apply Tailwind animation classes with 1 click.

**Step 1 — Create src/lib/presets/animation-presets.ts:**
```ts
export interface TransitionPreset { id: string; label: string; classes: string[]; }
export interface AnimationPreset  { id: string; label: string; classes: string[]; }
export interface HoverPreset      { id: string; label: string; hoverClasses: string[]; baseClasses?: string[]; }
export interface TransitionConfig { property: "all"|"colors"|"opacity"|"transform"|"shadow"; duration: 75|100|150|200|300|500|700|1000; easing: "linear"|"ease-in"|"ease-out"|"ease-in-out"; }

export const TRANSITION_PRESETS: TransitionPreset[] = [
  { id: "none",       label: "None",        classes: [] },
  { id: "smooth-all", label: "Smooth All",  classes: ["transition-all","duration-300","ease-out"] },
  { id: "colors",     label: "Colors",      classes: ["transition-colors","duration-200","ease-in-out"] },
  { id: "opacity",    label: "Fade",        classes: ["transition-opacity","duration-300","ease-in-out"] },
  { id: "transform",  label: "Transform",   classes: ["transition-transform","duration-200","ease-out"] },
  { id: "shadow",     label: "Shadow",      classes: ["transition-shadow","duration-300","ease-out"] },
  { id: "snappy",     label: "Snappy",      classes: ["transition-all","duration-150","ease-in"] },
  { id: "bouncy",     label: "Bouncy",      classes: ["transition-all","duration-500","ease-[cubic-bezier(0.34,1.56,0.64,1)]"] },
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
  { id: "scale-up",   label: "Scale Up", hoverClasses: ["scale-105"],      baseClasses: ["transition-transform","duration-200"] },
  { id: "scale-down", label: "Press",    hoverClasses: ["scale-95"],       baseClasses: ["transition-transform","duration-200"] },
  { id: "lift",       label: "Lift",     hoverClasses: ["-translate-y-1"], baseClasses: ["transition-transform","duration-200"] },
  { id: "brighten",   label: "Brighten", hoverClasses: ["brightness-110"], baseClasses: ["transition-all","duration-200"] },
  { id: "dim",        label: "Dim",      hoverClasses: ["opacity-70"],     baseClasses: ["transition-opacity","duration-200"] },
];
export function buildTransitionClasses(cfg: TransitionConfig): string {
  return [`transition-${cfg.property === "all" ? "all" : cfg.property}`, `duration-${cfg.duration}`, cfg.easing].join(" ");
}
```

**Step 2 — Write tests in test/lib/animation-presets.test.ts:**
```ts
import { describe, it, expect } from "vitest";
import { TRANSITION_PRESETS, ANIMATION_PRESETS, HOVER_EFFECT_PRESETS, buildTransitionClasses } from "@/lib/presets/animation-presets";
describe("animation-presets", () => {
  it("≥5 transition presets", () => expect(TRANSITION_PRESETS.length).toBeGreaterThanOrEqual(5));
  it("≥4 animation presets", () => expect(ANIMATION_PRESETS.length).toBeGreaterThanOrEqual(4));
  it("≥4 hover presets", () => expect(HOVER_EFFECT_PRESETS.length).toBeGreaterThanOrEqual(4));
  it("buildTransitionClasses output is valid", () => {
    const cls = buildTransitionClasses({ property: "all", duration: 300, easing: "ease-out" });
    expect(cls).toContain("transition");
    expect(cls).toContain("duration-300");
    expect(cls).toContain("ease-out");
  });
  it("each preset has id, label, classes array", () => {
    [...TRANSITION_PRESETS, ...ANIMATION_PRESETS].forEach(p => {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(Array.isArray(p.classes)).toBe(true);
    });
  });
});
```

**Step 3 — Create src/components/editor/property-panel/AnimationBuilderGroup.tsx:**
3-tab component (Transition / Animation / Hover FX).
- Tab switcher styled as pill segments (bg-[#111], rounded-lg)
- Each tab shows a 2-column grid of preset buttons
- Active preset highlighted with blue border (border-[#0084FF]/60 bg-[#0084FF]/10)
- Transition tab shows class name in small mono text below label
- Hover FX tab applies `hover:` prefix to hoverClasses when building class strings
- Props: `{ onApplyClasses: (add: string[], remove: string[]) => void; currentClasses: string[] }`
- Clicking removes all other preset classes first, then adds new preset's classes
- Wrapped in CollapsibleGroup

**Step 4 — Mount in PropertyPanel.tsx:**
Add AnimationBuilderGroup for all element types. Pass the current element's class list and the commit handler.

**Step 5 — Run tests:**
  npm test -- test/lib/animation-presets.test.ts

**Step 6 — Commit:**
  git add src/lib/presets/animation-presets.ts src/components/editor/property-panel/AnimationBuilderGroup.tsx src/components/editor/PropertyPanel.tsx test/lib/animation-presets.test.ts
  git commit -m "feat: Animation & Transition Builder panel with Tailwind preset library"
```

---

## PHASE 2 — Pages & Infrastructure

### Prompt 2-A: Support Link in Toolbar + /support Page

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Task:** Add a subtle "♥ Support" link to the toolbar and create a beautiful /support page.

**Step 1 — Add Heart link to Toolbar.tsx:**
1. Add `Heart` to the lucide-react imports at the top of src/components/editor/Toolbar.tsx
2. In the right zone of the toolbar, BEFORE the "Review & Save" button, add:
```tsx
<a
  href="/support"
  target="_blank"
  rel="noopener noreferrer"
  className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 text-[11px] transition-all cursor-pointer"
  title="Support this free tool"
>
  <Heart className="w-3 h-3" />
  <span className="hidden md:inline">Support</span>
</a>
```

**Step 2 — Create src/pages/support.astro:**
A premium dark page (matching the editor's dark aesthetic: bg-[#09090B]) with:

Hero:
- Large heart emoji icon in a rose gradient circle
- h1: "Support Visual Style Editor"
- Subtext: "This tool is 100% free, no login, no paywall — forever. If it saved you time, consider supporting its development."

4 Support Option Cards (each is a large rounded card, bg-[#111114], border border-white/[0.08], hover glow effect):
1. ☕ Ko-fi — "Buy me a coffee" — "One-time donation via Ko-fi — any amount" — links to https://ko-fi.com (update with real URL later)
2. 📺 Watch an Ad — "Ad revenue helps keep this tool free" — contains a placeholder div for Carbon Ads / Google AdSense (id="support-ad")
3. ⭐ GitHub Sponsors — "Monthly support — cancel anytime" — links to GitHub Sponsors
4. 🔗 Share — "Help others discover this tool" — calls navigator.share() or opens Twitter intent

Footer: "← Back to Editor" link to /

Layout: BaseLayout.astro, centered single-column max-w-lg, space-y-8

**Step 3 — Build to verify:**
  npm run build
Check that dist/support/index.html exists and has no errors.

**Step 4 — Commit:**
  git add src/components/editor/Toolbar.tsx src/pages/support.astro
  git commit -m "feat: ♥ Support link in toolbar and premium /support page"
```

---

### Prompt 2-B: Premium Marketing Landing Page + /editor Route

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Task:** Create a premium dark marketing landing page at / and move the editor to /editor.

**Step 1 — Create src/pages/editor.astro:**
```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import EditorStudio from "@/components/editor/EditorStudio";
---
<BaseLayout
  title="Visual Style Editor — Free Visual HTML & Tailwind CSS Editor"
  description="100% in-browser, no login. Drop your HTML file and edit typography, layout, colors, and responsive styles visually. Export clean Tailwind code."
>
  <EditorStudio client:only="react" />
</BaseLayout>
```

**Step 2 — Replace src/pages/index.astro with a premium landing page:**

Design requirements:
- Background: #09090B (deep obsidian)
- Font: Inter (already loaded in BaseLayout)
- Accent: #0084FF (electric blue)

Sections to implement in this exact order:

**NAV:**
- Logo (gradient spark icon + "Visual Style Editor" text)
- Links: Features | Templates | Support
- CTA button: "Open Editor →" → /editor (bg-[#0084FF])

**HERO:**
- Eyebrow badge: "✨ 100% Free • Zero Login • In-Browser"
- h1: "The Fastest Way to Edit<br/><span class="text-[#0084FF]">HTML & Tailwind</span> — Visually."
- Subtext: "Drop any HTML file. Click any element. Adjust styles with sliders, see changes live, and save back to your exact file — no backend, no lock-in."
- 2 CTAs: "Open Editor Free →" (primary, /editor) + "Browse Templates →" (ghost, /templates)
- Editor screenshot placeholder (a dark rounded box with a gradient border, showing fake editor UI as text art or screenshot)

**FEATURES (3-col grid):**
1. ⚡ "Zero Setup" — No install. No account. Works in Chrome/Safari/Firefox. Drop a file and start editing.
2. 🎨 "Tailwind-Aware" — Detects Tailwind v3/v4. Maps styles to utility classes. Preserves your Tailwind theme.
3. 💾 "Surgical Save" — Saves only what you changed. Comments, GSAP, Swiper, and indentation stay 100% intact.
4. 📱 "Responsive Editing" — Desktop, Tablet, Mobile viewports. Add Tailwind breakpoint classes in real-time.
5. 🔒 "Your Code, Your Files" — Zero telemetry. Zero tracking. Files never leave your browser.
6. ↩️ "Undo Anything" — Multi-level undo/redo with live DOM reconciliation.

**HOW IT WORKS (3-step):**
1. "Drop Your HTML" — Drag any .html file onto the editor
2. "Click & Edit Visually" — Click any element. Adjust typography, colors, layout with sliders
3. "Save to Disk" — One click writes directly back to your file. Clean Tailwind output.

**CTA BANNER:**
Dark gradient banner: "Start editing for free — no account needed."
Button: "Open Visual Style Editor →" → /editor

**FOOTER:**
- Logo + tagline
- Links: Editor | Templates | Support | GitHub
- "Made with ♥ — Free forever"

All sections should have subtle animations using CSS (not JS): fade-in on scroll using @keyframes + animation-delay.

**Step 3 — Build and verify both routes:**
  npm run build
Verify: dist/index.html (landing) and dist/editor/index.html (editor) both exist.

**Step 4 — Commit:**
  git add src/pages/index.astro src/pages/editor.astro
  git commit -m "feat: premium dark marketing landing page at / and editor moved to /editor"
```

---

### Prompt 2-C: Template Library at /templates

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

**Task:** Build a searchable template library page at /templates.

**Step 1 — Create src/lib/templates/template-registry.ts:**
```ts
export interface TemplateEntry {
  id: string; name: string; description: string;
  category: "landing" | "portfolio" | "saas" | "blog" | "component";
  tags: string[];
}
export const TEMPLATE_REGISTRY: TemplateEntry[] = [
  { id: "hero-dark",     name: "Dark Hero",         description: "Full-screen gradient hero with animated badge and CTA",      category: "landing",   tags: ["hero","dark","gradient"] },
  { id: "saas-pricing",  name: "SaaS Pricing",      description: "3-tier pricing table with monthly/yearly toggle",           category: "saas",      tags: ["pricing","billing"] },
  { id: "portfolio",     name: "Portfolio Grid",    description: "Minimal portfolio with responsive project card grid",       category: "portfolio", tags: ["grid","cards","minimal"] },
  { id: "landing-light", name: "Clean Landing",     description: "Light-mode landing page with features and testimonials",    category: "landing",   tags: ["light","clean"] },
  { id: "blog-article",  name: "Blog Article",      description: "Readable article layout with sidebar and TOC",             category: "blog",      tags: ["blog","article","sidebar"] },
  { id: "feature-grid",  name: "Feature Section",   description: "4-column feature grid with icons and descriptions",        category: "component", tags: ["features","icons"] },
];
```

**Step 2 — Create public/templates/ directory and add placeholder HTML files for each template ID.**
Each file should be a valid, standalone Tailwind HTML file. Use the Tailwind v3 CDN:
`<script src="https://cdn.tailwindcss.com"></script>`

For hero-dark.html, create:
- Dark gradient hero section with headline, subtext, CTA button, floating badge
- Realistic-looking, production-quality code

For saas-pricing.html:
- 3-column pricing cards (Free, Pro, Enterprise) with feature lists

Create at least 3 real template files. The others can be minimal placeholders.

**Step 3 — Create src/pages/templates.astro:**
Page layout: BaseLayout.astro. Dark design matching index.astro.

Content:
- Hero: "Free Tailwind HTML Templates" + "Browse starter templates. Click any to open in the editor."
- Search input (live filter by name/description/tag using JavaScript)
- Category filter pills: All | Landing | SaaS | Portfolio | Blog | Component
- Template grid (3 columns on desktop, 2 on tablet, 1 on mobile):
  - Each card: dark bg, template name, category badge, description, tags
  - "Open in Editor →" button that links to `/editor?template=<id>`
- Use TEMPLATE_REGISTRY to generate cards at build time (Astro SSG)

**Step 4 — Handle template URL param in EditorStudio.tsx:**
In the component's mount useEffect, add:
```ts
const params = new URLSearchParams(window.location.search);
const templateId = params.get("template");
if (templateId) {
  fetch(`/templates/${templateId}.html`)
    .then(r => r.text())
    .then(html => {
      // Load as if the user dropped this file
      loadHtmlContent(html, `${templateId}.html`);
    })
    .catch(() => console.warn(`Template ${templateId} not found`));
}
```

**Step 5 — Build and verify:**
  npm run build
Check dist/templates/index.html exists.

**Step 6 — Commit:**
  git add src/pages/templates.astro src/lib/templates/ public/templates/ src/components/editor/EditorStudio.tsx
  git commit -m "feat: /templates page with searchable gallery and URL param template loading"
```

---

## PHASE 3 (FUTURE) — Advanced Features

Use these prompts in a future session after Phase 0-2 are complete.

### Prompt 3-A: React JSX Export

```
Task for future session: Add React JSX/TSX export to the Export Studio modal.
Context: Currently only "Copy HTML" is implemented. The PRD requires "Copy as React JSX" too.
Files to touch:
- src/lib/export/html-to-jsx.ts (NEW — implement HTML to JSX transformer)
- src/components/editor/ExportStudioModal.tsx (ADD tab for React JSX)
Key logic: Convert HTML attributes (class → className, for → htmlFor), void elements, and inline event handlers to JSX format.
Write tests first in test/lib/html-to-jsx.test.ts.
```

### Prompt 3-B: Floating Canvas HUD

```
Task for future session: Add contextual action capsule above the selected element on canvas.
Context: When an element is selected, show a floating pill with: tag name, Duplicate (⌘D), Delete (⌫), Move Up/Down, and Text Edit (T) buttons — directly above the selection bounding box.
Files to touch: src/components/editor/SelectionOverlay.tsx (add HUD above bounding box)
Reference: UI_UX_IMPROVEMENT_PLAN.md section 3.2
```

### Prompt 3-C: Hover/Focus/Active State Styler

```
Task for future session: Add pseudo-state toggle to the property panel.
Context: Users should be able to style :hover, :focus, and :active states by toggling a tab in the panel header. Selecting "Hover" mode causes style edits to use `hover:` prefix on Tailwind classes.
Files to touch: src/components/editor/PropertyPanel.tsx (add state toggle), src/lib/dom/live-style-engine.ts (prepend hover: prefix when state !== "default")
```

---

## QUICK REFERENCE

| Task | File(s) Changed | Test Command |
|---|---|---|
| 0-A BUG-001 | change-set-store.ts | `npm test -- test/editor/change-set-store.test.ts` |
| 0-B BUG-004 | live-style-engine.ts | `npm test -- test/editor/live-style-engine.test.ts` |
| 0-C BUG-009,010,011,012 | 4 files | `npm test` |
| 0-D BUG-005 | LinkGroup.tsx | `npm test -- test/editor/link-group-path.test.ts` |
| 0-E BUG-006 | apply-edits.ts, EditorStudio.tsx | `npm test -- test/ast/apply-edits-responsive.test.ts` |
| 0-F BUG-003 | apply-edits.ts | `npm test -- test/ast/apply-edits.test.ts` |
| 1-A Auto-Save | auto-save.ts (NEW) | `npm test -- test/lib/auto-save.test.ts` |
| 1-B Palette | palette-harmonizer.ts (NEW) | `npm test -- test/lib/palette-harmonizer.test.ts` |
| 1-C Shadows | shadow-presets.ts (NEW) | `npm test -- test/lib/shadow-presets.test.ts` |
| 1-D Animation | animation-presets.ts (NEW) | `npm test -- test/lib/animation-presets.test.ts` |
| 2-A Support | Toolbar.tsx, support.astro (NEW) | `npm run build` |
| 2-B Landing | index.astro, editor.astro (NEW) | `npm run build` |
| 2-C Templates | templates.astro (NEW) | `npm run build` |
