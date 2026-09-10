# HTML Compatibility & High-Performance Output Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Visual Style Editor to seamlessly accept, inspect, edit, and deliver clean, non-breaking output for diverse real-world HTML files (Tailwind v3 CDN, Tailwind v4 runtime, Pure Vanilla CSS with `:root` tokens, GSAP/ScrollTrigger motion systems, interactive widgets, and complex multi-section landing pages) with 60fps rendering performance.

**Architecture:** 
1. **Pristine AST Splicing as Primary Output Engine**: Switch the save/export pipeline from live DOM serialization to pristine AST splicing so ephemeral script-driven runtime mutations (GSAP transforms, dynamic text splitting, state classes) are never baked into saved output.
2. **Vanilla CSS `:root` Harvester**: Automatically parse CSS custom properties from `<style>` blocks in Vanilla HTML files to populate the theme palette swatches.
3. **60fps Transform-Aware Selection Tracking**: Use a requestAnimationFrame loop in `SelectionOverlay` to track live-moving GSAP elements without desync.
4. **Canvas Mode Switch (Edit vs. Interact)**: Add a toolbar switch to toggle between visual styling and live widget testing (accordions, carousels, mobile menus).
5. **Script-Aware Component Exporter**: Polish React TSX, Next.js, and Astro exporters to handle embedded scripts and external CDN dependencies cleanly.

**Tech Stack:** React 19, TypeScript, Parse5 AST Engine, Acorn JS Parser, Vitest, Tailwind CSS v4, Lucide Icons, Zustand.

**Spec:** [HTML_TEST_FILES_ANALYSIS.md](../../../HTML_TEST_FILES_ANALYSIS.md)

## Global Constraints
- Preserve 100% in-browser zero-backend architecture.
- All existing 62 test suites and 378 unit/integration tests must continue passing.
- AST engine must remain idempotent and source-preserving (never altering unedited code or stripping comments).
- 60fps slider and color picker feedback must remain non-blocking.

---

### Task 1: AST-First Save & Export Pipeline (Preserving Clean Source Code)

**Files:**
- Modify: `src/components/editor/EditorStudio.tsx:533-630`
- Modify: `src/lib/ast/apply-edits.ts:38-110`
- Test: `test/ast/ast-first-persistence.test.ts`

**Interfaces:**
- Consumes: `applyEditsClientSide(html: string, edits: SaveRequestEdit[], options?: ApplyEditsOptions): SaveResponse` from `src/lib/ast/apply-edits.ts`
- Produces: `getCurrentExportHtml(): string` in `EditorStudio.tsx` prioritizing AST splices over live DOM serialization.

- [ ] **Step 1: Write failing unit test for AST-first persistence**

```typescript
// test/ast/ast-first-persistence.test.ts
import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import type { SaveRequestEdit } from "@/types";

describe("AST-first persistence with dynamic script mutations", () => {
  it("preserves original text and ignores ephemeral runtime DOM mutations when applying AST style edits", () => {
    const rawHtml = `<!DOCTYPE html><html><head></head><body><h1 id="title">Best Burgers</h1><script>document.getElementById("title").innerHTML = "<span>Mutated</span>";</script></body></html>`;
    const edits: SaveRequestEdit[] = [
      {
        kind: "style",
        structuralPath: "#title",
        styleProperty: "color",
        newStyleValue: "#ff0000",
        viewport: "desktop",
      },
    ];

    const result = applyEditsClientSide(rawHtml, edits);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.html).toContain('style="color: #ff0000;"');
      // Must preserve the original source text in markup, NOT the JS runtime mutation
      expect(result.html).toContain('Best Burgers');
      expect(result.html).toContain('<script>');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it passes/fails**

Run: `npx vitest run test/ast/ast-first-persistence.test.ts`  
Expected: PASS or initial validation.

- [ ] **Step 3: Update `getCurrentExportHtml` and `handleSave` in `EditorStudio.tsx`**

Refactor `getCurrentExportHtml` and `handleSave` to prioritize `applyEditsClientSide(openFile.content, edits.map(toSaveRequestEdit))` whenever edits exist on the loaded file, using `serializeCleanDocument(iframeEl.contentDocument)` ONLY if AST splicing produces a structural conflict or if brand new raw elements were dragged in without an AST path.

```typescript
// in src/components/editor/EditorStudio.tsx
function getCurrentExportHtml(): string {
  if (!openFile) return "";
  
  // 1. Prioritize pristine AST Splicing whenever edits exist
  if (edits.length > 0) {
    const saveEdits = edits.map(toSaveRequestEdit);
    const res = applyEditsClientSide(openFile.content, saveEdits);
    if (res.ok && res.html) {
      return res.html;
    }
  }

  // 2. If no edits recorded or AST failed, check clean DOM fallback
  if (iframeEl?.contentDocument) {
    try {
      const clean = serializeCleanDocument(iframeEl.contentDocument);
      if (clean && clean.trim().length > 0) {
        return clean;
      }
    } catch {}
  }

  return openFile.content;
}
```

- [ ] **Step 4: Run test suite to verify no regressions**

Run: `npm test`  
Expected: All 378+ tests pass.

---

### Task 2: Vanilla CSS `:root` Custom Properties Harvester

**Files:**
- Create: `src/lib/dom/css-variable-harvester.ts`
- Modify: `src/lib/tailwind/detect-mode.ts:1-12`
- Modify: `src/components/editor/EditorStudio.tsx:115-130`
- Test: `test/editor/css-variable-harvester.test.ts`

**Interfaces:**
- Consumes: Raw HTML or Document containing `<style>` tags with `:root { --color: ... }`
- Produces: `extractCssCustomProperties(html: string): { colors: ThemeColorToken[]; fonts: ThemeFontToken[] }`

- [ ] **Step 1: Write failing unit test for CSS variable harvesting**

```typescript
// test/editor/css-variable-harvester.test.ts
import { describe, it, expect } from "vitest";
import { extractCssCustomProperties } from "@/lib/dom/css-variable-harvester";

describe("CSS Custom Properties Harvester", () => {
  it("extracts hex, rgb, rgba, and hsl color tokens from :root blocks", () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          :root {
            --bg: #09090b;
            --ink: #fafafa;
            --accent: #3b82f6;
            --card: rgba(24, 24, 27, 0.65);
            --font-main: 'Inter', sans-serif;
          }
        </style>
      </head>
      <body></body>
      </html>
    `;

    const tokens = extractCssCustomProperties(html);
    expect(tokens.colors).toEqual([
      { name: "--bg", value: "#09090b" },
      { name: "--ink", value: "#fafafa" },
      { name: "--accent", value: "#3b82f6" },
      { name: "--card", value: "rgba(24, 24, 27, 0.65)" },
    ]);
    expect(tokens.fonts).toEqual([
      { name: "--font-main", stack: "'Inter', sans-serif" },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/editor/css-variable-harvester.test.ts`  
Expected: FAIL ("extractCssCustomProperties is not defined")

- [ ] **Step 3: Implement `src/lib/dom/css-variable-harvester.ts`**

```typescript
// src/lib/dom/css-variable-harvester.ts
import type { ThemeColorToken, ThemeFontToken } from "@/types";

const COLOR_REGEX = /#(?:[0-9a-fA-F]{3,8})|rgba?\([^)]+\)|hsla?\([^)]+\)/i;

export function extractCssCustomProperties(html: string): {
  colors: ThemeColorToken[];
  fonts: ThemeFontToken[];
} {
  const colors: ThemeColorToken[] = [];
  const fonts: ThemeFontToken[] = [];
  
  const styleTagRe = /<style(?![^>]*\bid=["']vse-)[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;

  while ((match = styleTagRe.exec(html))) {
    const css = match[1];
    const rootRe = /:root\s*\{([\s\S]*?)\}/gi;
    let rootMatch: RegExpExecArray | null;

    while ((rootMatch = rootRe.exec(css))) {
      const declarations = rootMatch[1].split(";");
      for (const decl of declarations) {
        const colonIdx = decl.indexOf(":");
        if (colonIdx === -1) continue;
        const rawKey = decl.slice(0, colonIdx).trim();
        const rawVal = decl.slice(colonIdx + 1).trim();

        if (rawKey.startsWith("--") && rawVal) {
          if (COLOR_REGEX.test(rawVal)) {
            colors.push({ name: rawKey, value: rawVal });
          } else if (rawKey.includes("font") || rawVal.includes("sans") || rawVal.includes("serif") || rawVal.includes("mono")) {
            fonts.push({ name: rawKey, stack: rawVal });
          }
        }
      }
    }
  }

  return { colors, fonts };
}
```

- [ ] **Step 4: Integrate harvester into `EditorStudio.tsx` theme loading**

When loading an HTML file in `EditorStudio.tsx`, merge `extractCssCustomProperties(file.content)` into the document `ThemeMap` colors and fonts.

- [ ] **Step 5: Run tests to verify it passes**

Run: `npx vitest run test/editor/css-variable-harvester.test.ts`  
Expected: PASS

---

### Task 3: 60fps Dynamic Transform Tracking for Animated Selection Highlights

**Files:**
- Modify: `src/components/editor/SelectionOverlay.tsx:50-130`
- Test: `test/editor/selection-transform-tracking.test.tsx`

**Interfaces:**
- Consumes: `selectedElement: Element | null`, `iframeDocument: Document | null`
- Produces: Smooth 60fps bounding rect synchronization for animated/transforming elements (`gsap.to()`, `@keyframes`, `transform: translate3d`).

- [ ] **Step 1: Write failing unit test for dynamic rect tracking**

```typescript
// test/editor/selection-transform-tracking.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import SelectionOverlay from "@/components/editor/SelectionOverlay";
import React from "react";

describe("SelectionOverlay dynamic tracking", () => {
  it("renders selection rect overlay when an element is provided", () => {
    const dummyEl = document.createElement("div");
    dummyEl.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      left: 100,
      width: 200,
      height: 50,
      right: 300,
      bottom: 150,
    });

    const { container } = render(
      <SelectionOverlay
        selectedElement={dummyEl}
        hoveredElement={null}
        dropTargetInfo={null}
        iframeDocument={document}
      />
    );

    const overlay = container.querySelector("[data-vse-overlay='selected']");
    expect(overlay).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement RAF Tracking in `SelectionOverlay.tsx`**

When `selectedElement` is present, attach a light `requestAnimationFrame` loop that checks if `getBoundingClientRect()` values have changed (e.g. Due to GSAP continuous yoyo or mousemove tweens) and updates state smoothly:

```typescript
// in src/components/editor/SelectionOverlay.tsx
useEffect(() => {
  if (!selectedElement) return;

  let animId: number;
  let lastRect = selectedElement.getBoundingClientRect();

  function checkRect() {
    if (!selectedElement || !selectedElement.isConnected) return;
    const newRect = selectedElement.getBoundingClientRect();
    if (
      Math.abs(newRect.top - lastRect.top) > 0.5 ||
      Math.abs(newRect.left - lastRect.left) > 0.5 ||
      Math.abs(newRect.width - lastRect.width) > 0.5 ||
      Math.abs(newRect.height - lastRect.height) > 0.5
    ) {
      lastRect = newRect;
      updateBounds();
    }
    animId = requestAnimationFrame(checkRect);
  }

  animId = requestAnimationFrame(checkRect);
  return () => cancelAnimationFrame(animId);
}, [selectedElement]);
```

- [ ] **Step 3: Run tests to verify**

Run: `npx vitest run test/editor/selection-transform-tracking.test.tsx`  
Expected: PASS

---

### Task 4: Canvas Mode Switch (Edit Mode vs. Interactive Preview Mode)

**Files:**
- Modify: `src/store/settings-store.ts:1-35`
- Modify: `src/components/editor/Toolbar.tsx:60-120`
- Modify: `src/components/editor/PreviewFrame.tsx:78-120`
- Test: `test/editor/canvas-mode-switch.test.ts`

**Interfaces:**
- Consumes: `canvasMode: "edit" | "interact"` in `useSettingsStore`
- Produces: Instant toggle between Visual Styling Mode (click to select) and Interactive Mode (click to open accordions, mobile hamburger menus, carousels).

- [ ] **Step 1: Write failing test for canvas mode state**

```typescript
// test/editor/canvas-mode-switch.test.ts
import { describe, it, expect } from "vitest";
import { useSettingsStore } from "@/store/settings-store";

describe("Canvas Mode Switch", () => {
  it("defaults to edit mode and toggles to interact mode", () => {
    expect(useSettingsStore.getState().canvasMode).toBe("edit");
    useSettingsStore.getState().setCanvasMode("interact");
    expect(useSettingsStore.getState().canvasMode).toBe("interact");
    useSettingsStore.getState().setCanvasMode("edit");
  });
});
```

- [ ] **Step 2: Add `canvasMode` to `src/store/settings-store.ts`**

```typescript
export interface SettingsState {
  snapToDefaultScale: boolean;
  canvasMode: "edit" | "interact";
  setSnapToDefaultScale: (snap: boolean) => void;
  setCanvasMode: (mode: "edit" | "interact") => void;
}
```

- [ ] **Step 3: Add Mode Toggle in `Toolbar.tsx` and adjust `PreviewFrame.tsx`**

In `Toolbar.tsx`, render a segmented control: `[🖌️ Edit] [⚡ Interact]`.  
In `PreviewFrame.tsx`, if `canvasMode === "interact"`, skip `e.preventDefault()` / `e.stopPropagation()` in click handlers so buttons, accordions, and links trigger natural JS events.

- [ ] **Step 4: Run tests to verify**

Run: `npx vitest run test/editor/canvas-mode-switch.test.ts`  
Expected: PASS

---

### Task 5: Script-Aware & CDN-Preserving Component Exporter

**Files:**
- Modify: `src/lib/export/html-to-jsx.ts:80-160`
- Modify: `src/lib/export/html-to-astro.ts:1-35`
- Modify: `src/components/editor/ExportStudioModal.tsx:45-120`
- Test: `test/export/script-aware-export.test.ts`

**Interfaces:**
- Consumes: HTML string containing `<script>`, `<link rel="stylesheet">`, and `<style>` blocks.
- Produces: Valid React TSX (with scripts safely isolated in `useEffect` or commented) and Astro component files.

- [ ] **Step 1: Write failing unit test for script-aware TSX export**

```typescript
// test/export/script-aware-export.test.ts
import { describe, it, expect } from "vitest";
import { exportAsReactComponent } from "@/lib/export/html-to-jsx";

describe("Script-Aware Component Exporter", () => {
  it("safely handles embedded script tags without creating invalid JSX tags", () => {
    const html = `
      <div class="hero">
        <h1>Welcome</h1>
        <script>
          console.log("init gsap");
        </script>
      </div>
    `;

    const tsx = exportAsReactComponent(html, { componentName: "HeroComponent", typescript: true });
    expect(tsx).toContain("export const HeroComponent");
    // Should comment or handle script block safely instead of producing invalid raw <script> JSX
    expect(tsx).not.toMatch(/<script>\s*console\.log/);
  });
});
```

- [ ] **Step 2: Update `convertHtmlToJsx` in `src/lib/export/html-to-jsx.ts`**

In `convertHtmlToJsx`, strip or transform raw `<script>` blocks into React-safe comment blocks `{/* Client Script: ... */}` or `dangerouslySetInnerHTML`.

- [ ] **Step 3: Run test to verify**

Run: `npx vitest run test/export/script-aware-export.test.ts`  
Expected: PASS

---

### Task 4: Full Integration Test & Verification with all 9 Test Files

**Files:**
- Create: `test/editor/real-world-html-files.test.ts`

- [ ] **Step 1: Write comprehensive integration test iterating over all 9 test files**

```typescript
// test/editor/real-world-html-files.test.ts
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { detectTailwindMode } from "@/lib/tailwind/detect-mode";
import { parseV3Theme } from "@/lib/tailwind/theme-v3";
import { extractCssCustomProperties } from "@/lib/dom/css-variable-harvester";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("Real-world test files compatibility suite", () => {
  const testDir = path.resolve(__dirname, "../../files for testing");
  const files = fs.readdirSync(testDir).filter((f) => f.endsWith(".html"));

  it("loads and analyzes all 9 test files without throwing", () => {
    expect(files.length).toBeGreaterThanOrEqual(9);

    for (const file of files) {
      const content = fs.readFileSync(path.join(testDir, file), "utf-8");
      const mode = detectTailwindMode(content);
      expect(["v3-cdn", "v4-cdn", "none"]).toContain(mode);

      // Verify AST engine can process idempotent pass-through without data corruption
      const res = applyEditsClientSide(content, []);
      expect(res.ok).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run full test suite**

Run: `npm test`  
Expected: All 63+ test files pass cleanly (100% green).

---

## Verification Plan

### Automated Tests
- Run complete test suite: `npm test`
- Verify real-world test file batch execution: `npx vitest run test/editor/real-world-html-files.test.ts`

### Manual Verification in Studio
1. Open `saas-landing.html` (Tailwind v4) -> verify classes and styles apply seamlessly.
2. Open `gemini-code-1785182456557 (1).html` (Vanilla CSS with GSAP) -> verify `:root` colors populate in color swatches and GSAP floating cards track highlights accurately.
3. Open `besty-redesigned (6).html` (104KB Tailwind v3 + GSAP + ScrollTrigger) -> toggle `[Interact]` mode to test the accordion and carousel, switch back to `[Edit]` mode to style headlines, save file, and verify zero script-baking or formatting loss in output.
