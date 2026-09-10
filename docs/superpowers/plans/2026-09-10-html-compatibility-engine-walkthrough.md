# Walkthrough: HTML Compatibility Engine & Real-World Edge-Case Hardening

We have implemented and verified the complete **HTML Compatibility Engine** for Visual Style Editor. The editor can now faithfully load, visually edit, interact with, and export complex real-world HTML files—including Tailwind v3, Tailwind v4 runtime (`@tailwindcss/browser@4`), Pure Vanilla CSS `:root` systems, and high-intensity GSAP 3.12 / ScrollTrigger animation sites—without breaking runtime scripts or corrupting source ASTs.

---

## What Was Accomplished

### 1. AST-First Persistence Engine (No DOM Mutation Baking)
* **Problem**: Complex templates like `besty-redesigned (6).html` and `gemini-code-1785182456557 (1).html` use client-side JS (GSAP timelines, runtime word-splitting, magnetic buttons, tilt scripts) that dynamically inject `style="transform: translate3d(...); clip-path: ...;"`, mutate text into `<span class="word">` tags, and inject cursor elements. Serializing the live iframe DOM (`iframe.contentDocument.documentElement.outerHTML`) baked these runtime state mutations into the saved HTML, permanently breaking original layout and animation logic.
* **Solution**: Updated `src/components/editor/EditorStudio.tsx` (`getCurrentExportHtml` and `handleSave`). When edits exist on a loaded file, the engine runs client-side AST splicing via `applyEditsClientSide(openFile.content, saveEdits)` on the pristine source code, preserving untouched scripts, attributes, and styles 100% byte-for-byte.
* **Responsive Style Fix**: Fixed an issue in `src/lib/ast/apply-edits.ts` where opening a file with existing `<style id="vse-responsive-styles">` blocks previously removed them on empty edits; the AST engine now preserves existing responsive style blocks unless responsive style edits are explicitly performed.
* **Verified By**: `test/ast/ast-first-persistence.test.ts`.

---

### 2. Vanilla CSS `:root` Variable Harvester
* **Problem**: Files like `gemini-code-1785182456557 (1).html` and `gemini-code-1785182269955.html` use no Tailwind classes; instead, they define custom design tokens inside `:root { --bg-dark: #07090e; --accent-cyan: #00f2fe; --font-main: 'Outfit'; }`. Previously, the Theme Panel only extracted Tailwind config palettes, leaving Vanilla CSS swatches empty.
* **Solution**: Created `src/lib/dom/css-variable-harvester.ts` and integrated it into `src/lib/ast/analyze.ts`. It parses `<style>` tags for `:root` variable declarations, classifying colors (hex, rgb, hsl) into `theme.colors` and font families into `theme.fontFamily`.
* **Verified By**: `test/editor/css-variable-harvester.test.ts`.

---

### 3. 60fps Transform & Motion Boundary Tracking
* **Problem**: When selecting elements undergoing continuous GSAP animations (e.g. `gemini-code` hero glowing cards or floating icons), the bounding box overlay was either static or triggering unthrottled React re-renders on every frame even when elements were stationary.
* **Solution**: In `src/components/editor/SelectionOverlay.tsx`, added `rectsEqual` delta checking to the `requestAnimationFrame` loop. Stationary elements skip state updates entirely, while moving and animated elements smoothly update the selection box and resize handles at 60fps without layout thrashing.

---

### 4. Canvas Mode Switcher: "Edit" vs. "Interact" Mode
* **Problem**: Files with interactive elements (e.g., FAQ accordions, mobile burger menus, tab switchers, magnetic buttons in `besty-redesigned (6).html`) could not be toggled or tested inside the editor canvas because the selection capture layer intercepted all pointer events (`pointer-events: none` on iframe, capture overlay on top).
* **Solution**:
  - Added `canvasMode: "edit" | "interact"` and `setCanvasMode()` to `src/store/settings-store.ts`.
  - Added a segmented toggle control (`Edit` with pointer icon, `Interact` with play icon) in the canvas toolbar in `src/components/editor/Toolbar.tsx`.
  - Updated `src/components/editor/PreviewFrame.tsx` and `src/components/editor/EditorStudio.tsx` so in `interact` mode, iframe events pass directly to scripts (allowing accordion expanding, carousel clicking, and button interaction), while in `edit` mode the visual style inspection overlays remain active.
* **Verified By**: `test/editor/canvas-mode-switch.test.ts`.

---

### 5. Script-Aware Clean Exporter & JSX/Astro Transpiler
* **Problem**: Exporting complex HTML to JSX or Astro crashed or produced corrupt JSX tags when `<script>` tags contained unescaped operators (`<`, `&&`), or when self-closing `<script ... />` tags were duplicated by regular expressions.
* **Solution**: In `src/lib/export/html-to-jsx.ts`, implemented a two-phase placeholder replacement:
  - External scripts (`<script src="...">`) are transformed to `<script src="..." />`.
  - Inline scripts (`<script>...</script>`) are protected in `__VSE_SCRIPT_INLINE_*__` placeholders and rendered safely as `<script dangerouslySetInnerHTML={{ __html: \`...\` }} />` avoiding unescaped JSX token errors.
* **Verified By**: `test/export/script-aware-export.test.ts`.

---

### 6. Real-World Compatibility Suite (All 9 Test Files)
* Created `test/editor/real-world-html-files.test.ts` covering all 9 files in `files for testing/`:
  1. `pricing-matrix.html` (Tailwind v3 + VSE responsive styles)
  2. `saas-landing.html` (Tailwind v4 `@tailwindcss/browser@4`)
  3. `saas-landing (1).html` (Tailwind v4)
  4. `saas-landing (2).html` (Tailwind v4)
  5. `gemini-code-1785182738541.html` (Tailwind v3 + Google Fonts + overlays)
  6. `gemini-code-1785182456557 (1).html` (Vanilla CSS `:root` + GSAP)
  7. `gemini-code-1785182269955.html` (Vanilla CSS `:root` + GSAP)
  8. `besty-redesigned (6).html` (104KB Production GSAP ScrollTrigger site)
  9. `besty-redesigned (7).html` (104KB Production GSAP ScrollTrigger site)

For each file, the test suite verifies:
* **Framework detection & AST analysis**: Analyzes without throwing, extracting mode and tokens.
* **Theme extraction**: Harvests Tailwind swatches or Vanilla `:root` CSS variables.
* **Idempotent pass-through**: Zero-edit AST export produces 100% byte-for-byte identical output.
* **Non-destructive style editing**: Modifies inline styles/classes via AST splicing without corrupting other attributes or `<script>` tags.
* **Clean JSX export**: Converts full document to valid JSX without unescaped script tag parse errors.

---

## Verification Results

### 1. Automated Test Suite (Vitest)
Ran full test suite across the entire repository:
```
 Test Files  67 passed (67)
      Tests  431 passed (431)
   Duration  184.49s
```
* **67 of 67 test files passed** (0 failing, 0 skipped).
* **431 of 431 tests passed**.

### 2. TypeScript Static Analysis (`tsc`)
```bash
npx tsc --noEmit
# Exited with code 0 (0 errors)
```
Fixed type alignment in `src/types/index.ts` where `SaveRequestEdit`'s style union now accommodates `"all"` alongside `"desktop" | "tablet" | "mobile"`.
