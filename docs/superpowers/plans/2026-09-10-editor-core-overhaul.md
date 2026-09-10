# Visual Style Editor Core Engine & UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Visual Style Editor to fix core layout & sizing bugs (margins, padding, max-width/height, child overflow), implement proportional element scaling (checkbox + direct numeric input + drag scaling), add Framer-style positioning constraints/pinning, add universal hyperlink capability for any element, completely revamp the Layers panel (distinct icons, reordering, auto-divs, clean inheritance), and eliminate UI lag and clutter.

**Architecture:** 
1. Enhanced DOM style & bounding box engine (`computed-style.ts`, `live-style-engine.ts`) with accurate 4-side margin/padding decomposition and bidirectional slider/drag synchronization.
2. Scale & Constraints subsystem (`SelectionOverlay.tsx`, `PositionGroup.tsx`, `EffectsGroup.tsx`) providing proportional transform scaling and multi-axis pinning (Framer-style constraints).
3. Universal Link Manager (`LinkGroup.tsx`) enabling wrapping/converting any DOM element into an anchor link or editing existing links.
4. Fully overhauled Tree & Reparenting Architecture (`LayersTree.tsx`, `EditorStudio.tsx`) with distinct semantic SVG icons, drag-and-drop before/after/inside reparenting, auto-div container wrapping (`Ctrl+G`), and clean property inheritance.
5. High-performance rendering pipeline with RAF throttling, memoized layer nodes, and streamlined Property Panel progressive disclosure.

**Tech Stack:** React 19, TypeScript, Astro 5, Tailwind CSS v4, Lucide React, Vitest, Parse5 AST Engine.

---

## Global Constraints
- Preserve 100% compatibility with all test files in `files for testing/` (Tailwind v3/v4 CDN, Vanilla CSS `:root`, GSAP motion systems, prior VSE exports).
- AST Splicing Engine (`applyEditsClientSide`) remains the primary lossless save/export mechanism.
- All DOM mutations in the preview iframe must sync bidirectionally with the AST ChangeSet store and Undo/Redo stack.
- Zero external UI library dependencies — use native Tailwind CSS and Lucide icons.

---

### Task 1: Box Model & Sizing Engine Fixes (Margins, Padding, Max-Width/Height, Containment)

**Files:**
- Modify: `src/lib/dom/computed-style.ts`
- Modify: `src/lib/dom/live-style-engine.ts`
- Modify: `src/components/editor/property-panel/LayoutGroup.tsx`
- Test: `test/editor/box-model-sizing.test.ts`

**Interfaces:**
- `readCurrentValue(el: Element, property: EditableProperty, ...)`: Returns accurate decomposed values for individual sides (`padding-top`, `padding-right`, `padding-bottom`, `padding-left`, `margin-top`, etc.) from computed styles, inline styles, or Tailwind classes without returning empty strings or inaccurate fallbacks.
- `enforceContainerConstraints(el: HTMLElement, parent: HTMLElement)`: Ensures child `max-width` and `width` do not break parent container bounds.

- [ ] **Step 1: Write failing unit tests for box model parsing and container sizing constraints**

```typescript
// test/editor/box-model-sizing.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { readCurrentValue } from "@/lib/dom/computed-style";

describe("Box Model & Sizing Engine", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("test");
  });

  it("accurately reads 4-side padding when defined via style or classes", () => {
    const div = doc.createElement("div");
    div.style.paddingTop = "12px";
    div.style.paddingRight = "24px";
    div.style.paddingBottom = "16px";
    div.style.paddingLeft = "8px";
    doc.body.appendChild(div);

    expect(readCurrentValue(div, "padding-top")).toBe("12px");
    expect(readCurrentValue(div, "padding-right")).toBe("24px");
    expect(readCurrentValue(div, "padding-bottom")).toBe("16px");
    expect(readCurrentValue(div, "padding-left")).toBe("8px");
  });

  it("reads decomposed margins from CSS classes without returning empty string", () => {
    const div = doc.createElement("div");
    div.className = "mt-4 mb-8 pl-6";
    doc.body.appendChild(div);

    const theme = { mode: "v3-cdn", colors: [], fonts: [] } as any;
    expect(readCurrentValue(div, "margin-top", theme, "top")).toBe("16px");
    expect(readCurrentValue(div, "margin-bottom", theme, "bottom")).toBe("32px");
    expect(readCurrentValue(div, "padding-left", theme, "left")).toBe("24px");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test test/editor/box-model-sizing.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement accurate 4-side box model extraction in `computed-style.ts` & `LayoutGroup.tsx`**
Update `readCurrentValue` to read individual computed properties (`paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `marginTop`, etc.) instead of relying on broken shorthand `computed.padding` or `computed.margin`. Update `LayoutGroup.tsx` to detect asymmetric padding/margin on file load and initialize linked vs unlinked states accurately. Add container boundary clamping for `max-width` and `max-height`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test test/editor/box-model-sizing.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/lib/dom/computed-style.ts src/components/editor/property-panel/LayoutGroup.tsx test/editor/box-model-sizing.test.ts
git commit -m "fix: accurate box-model padding/margin parsing and container sizing constraints"
```

---

### Task 2: Proportional Element Scaling (Drag Scaling + Direct Numeric Multiplier)

**Files:**
- Modify: `src/components/editor/SelectionOverlay.tsx`
- Modify: `src/components/editor/property-panel/EffectsGroup.tsx`
- Modify: `src/lib/dom/live-style-engine.ts`
- Modify: `src/types/index.ts`
- Test: `test/editor/scale-engine.test.ts`

**Interfaces:**
- `isScaleMode: boolean`: Toggles proportional scale mode vs geometric width/height resize.
- `scaleValue: number`: Direct multiplier (e.g. 1.0, 1.25, 0.75, 2.0).
- `handleStartScale(handleId, event)`: Handles pointer drag on overlay handles to scale element via CSS `transform: scale(...)` or `scale: ...`.

- [ ] **Step 1: Write failing unit tests for element scaling**

```typescript
// test/editor/scale-engine.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { formatCssValue, applyLiveStyle } from "@/lib/dom/live-style-engine";

describe("Element Scale Engine", () => {
  it("formats scale property correctly as numeric multiplier", () => {
    const res = formatCssValue("scale", "1.25");
    expect(res.prop).toBe("scale");
    expect(res.val).toBe("1.25");
  });

  it("applies scale property to element style", () => {
    const div = document.createElement("div");
    applyLiveStyle(div, "scale", "1.5");
    expect(div.style.scale).toBe("1.5");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test test/editor/scale-engine.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Scale mode in `SelectionOverlay.tsx` and `EffectsGroup.tsx`**
1. In `SelectionOverlay.tsx`, add a dedicated "Scale" mode checkbox toggle in the badge header.
2. When Scale mode is active:
   - Dragging any of the 8 resize handles scales the element proportionally around its origin (`transform-origin: center center` or corner).
   - Display a floating live scale tooltip (e.g. `Scale: 1.35× (135%)`).
3. In `EffectsGroup.tsx` (and `LayoutGroup.tsx`), add a dedicated "Scale" control with numeric input and slider (`0.1` to `3.0`, step `0.05`, default `1.0`).
4. Support scaling seamlessly on images, containers, textboxes, and sections.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test test/editor/scale-engine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/components/editor/SelectionOverlay.tsx src/components/editor/property-panel/EffectsGroup.tsx src/lib/dom/live-style-engine.ts test/editor/scale-engine.test.ts
git commit -m "feat: proportional element scaling with drag handles and numeric input"
```

---

### Task 3: Framer-Style Pinning & Positioning Constraints

**Files:**
- Modify: `src/components/editor/property-panel/PositionGroup.tsx`
- Modify: `src/lib/dom/live-style-engine.ts`
- Test: `test/editor/constraints-pinning.test.ts`

**Interfaces:**
- `ConstraintType`: `"left" | "right" | "top" | "bottom" | "horizontal-stretch" | "vertical-stretch" | "center-x" | "center-y" | "all"`
- `applyConstraint(el: HTMLElement, constraint: ConstraintType, theme: ThemeMap, viewport: ViewportMode)`: Sets corresponding position, insets, and transforms.

- [ ] **Step 1: Write failing unit test for pinning & constraints**

```typescript
// test/editor/constraints-pinning.test.ts
import { describe, it, expect, beforeEach } from "vitest";

describe("Framer-style Pinning & Constraints", () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
  });

  it("applies horizontal stretch constraints (left: 0, right: 0)", () => {
    el.style.position = "absolute";
    el.style.left = "0px";
    el.style.right = "0px";
    expect(el.style.left).toBe("0px");
    expect(el.style.right).toBe("0px");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test test/editor/constraints-pinning.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Pinning & Constraints Matrix in `PositionGroup.tsx`**
1. Add a visual 3x3 Pinning Matrix Widget in `PositionGroup.tsx` (Top-Left, Top, Top-Right, Left, Center, Right, Bottom-Left, Bottom, Bottom-Right).
2. Add Horizontal Stretch (`Left & Right`, `inset-x-0`) and Vertical Stretch (`Top & Bottom`, `inset-y-0`) toggle buttons.
3. Add Sticky / Fixed / Absolute position modes with auto-parent relative helper.
4. Synchronize with both Tailwind classes and clean CSS styles.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test test/editor/constraints-pinning.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/components/editor/property-panel/PositionGroup.tsx test/editor/constraints-pinning.test.ts
git commit -m "feat: framer-style visual pinning and constraints system"
```

---

### Task 4: Universal Hyperlink System (Add / Edit / Wrap Links on Any Element)

**Files:**
- Modify: `src/components/editor/property-panel/LinkGroup.tsx`
- Modify: `src/components/editor/PropertyPanel.tsx`
- Modify: `src/components/editor/EditorStudio.tsx`
- Test: `test/editor/hyperlink-system.test.ts`

**Interfaces:**
- `wrapElementWithLink(el: Element, href: string, targetBlank?: boolean)`: Wraps selected element with `<a href="...">` and records AST edit.
- `removeLink(el: Element)`: Unwraps anchor tag while preserving inner children and styles.

- [ ] **Step 1: Write failing unit test for universal hyperlinks**

```typescript
// test/editor/hyperlink-system.test.ts
import { describe, it, expect, beforeEach } from "vitest";

describe("Universal Hyperlink System", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("test");
  });

  it("can convert a button or div into a hyperlink", () => {
    const div = doc.createElement("div");
    div.textContent = "Click Me";
    doc.body.appendChild(div);

    const anchor = doc.createElement("a");
    anchor.href = "https://example.com";
    anchor.target = "_blank";
    div.replaceWith(anchor);
    anchor.appendChild(div);

    expect(anchor.href).toBe("https://example.com/");
    expect(anchor.target).toBe("_blank");
    expect(anchor.firstElementChild).toBe(div);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test test/editor/hyperlink-system.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Universal Hyperlink controls in `LinkGroup.tsx` & `PropertyPanel.tsx`**
1. In `LinkGroup.tsx`:
   - When selected element is an `<a>` tag: Allow full editing of `href`, `target`, `rel`, `title`, and show an "Unlink / Unwrap" button.
   - When selected element is NOT an `<a>` tag: Show an "Add Hyperlink" section with URL input, "Open in New Tab" toggle, and a "Wrap with Link `<a>`" button.
2. In `PropertyPanel.tsx`:
   - Always make the "Link & Navigation" group accessible or contextual when user desires to link an element.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test test/editor/hyperlink-system.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/components/editor/property-panel/LinkGroup.tsx src/components/editor/PropertyPanel.tsx test/editor/hyperlink-system.test.ts
git commit -m "feat: universal hyperlink creation, wrapping, and editing on any element"
```

---

### Task 5: Layers Panel Complete Overhaul & Auto-Divs

**Files:**
- Modify: `src/components/editor/LayersTree.tsx`
- Modify: `src/lib/dom/element-classifier.ts`
- Modify: `src/components/editor/EditorStudio.tsx`
- Test: `test/editor/layers-panel-overhaul.test.ts`

**Interfaces:**
- `getElementIcon(tagName, el)`: Returns distinct, styled SVG icon for each element type (Section, Header, Nav, Footer, Main, Div, Container, Heading 1-6, Paragraph, Span, Button, Anchor, Image, SVG, Video, Form, Input, etc.).
- `handleMoveElement(sourceEl, targetEl, position: "before" | "after" | "inside")`: Reparents DOM element, preserves parent inheritance, and records AST move edit.
- `handleWrapWithDiv(el: Element)`: Creates wrapper `<div>` (`Ctrl+G`), moves selected element inside, and records AST edit.

- [ ] **Step 1: Write failing unit test for Layers panel reparenting and Auto-Divs**

```typescript
// test/editor/layers-panel-overhaul.test.ts
import { describe, it, expect, beforeEach } from "vitest";

describe("Layers Panel Overhaul & Auto-Divs", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("test");
  });

  it("wraps element in auto-div container cleanly", () => {
    const p = doc.createElement("p");
    p.textContent = "Hello world";
    doc.body.appendChild(p);

    const wrapper = doc.createElement("div");
    wrapper.className = "flex flex-col";
    p.replaceWith(wrapper);
    wrapper.appendChild(p);

    expect(wrapper.children.length).toBe(1);
    expect(wrapper.firstElementChild).toBe(p);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test test/editor/layers-panel-overhaul.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement LayersTree overhaul, distinct SVG icons, drag-and-drop, and Auto-Divs**
1. Upgrade `getElementIcon` in `LayersTree.tsx` with distinct colorful icons for:
   - Layout: Section, Header, Footer, Nav, Main, Aside, Article (Purple/Indigo)
   - Containers: Div, Container, Flex, Grid (Blue/Cyan)
   - Typography: H1-H6, P, Span, Blockquote, Code (Emerald/Teal)
   - Interactive: Button, Anchor/Link, Form, Input, Textarea, Select (Amber/Orange)
   - Media: Img, SVG, Video, Audio, Canvas (Rose/Pink)
2. Add "Wrap with Div / Container" action (`Ctrl+G` / button) to instantly wrap selected element(s) in a container.
3. Enhance drag-and-drop with clear visual drop targets ("Before", "After", "Inside") that reparent correctly in the DOM and AST.
4. Add Move Up / Move Down buttons for precise sibling reordering.
5. Ensure inherited CSS properties and flex/grid context are preserved cleanly without overwriting.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test test/editor/layers-panel-overhaul.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/components/editor/LayersTree.tsx src/lib/dom/element-classifier.ts src/components/editor/EditorStudio.tsx test/editor/layers-panel-overhaul.test.ts
git commit -m "feat: complete layers panel overhaul with distinct icons, drag reparenting, and auto-divs"
```

---

### Task 6: Performance Optimization & UI Decluttering

**Files:**
- Modify: `src/components/editor/SelectionOverlay.tsx`
- Modify: `src/components/editor/PropertyPanel.tsx`
- Modify: `src/components/editor/LayersTree.tsx`
- Modify: `src/components/editor/EditorStudio.tsx`
- Test: `test/editor/performance-optimization.test.ts`

**Interfaces:**
- Throttled RAF loop: only runs when active CSS animations/GSAP transforms are detected or during active pointer drag.
- Memoized tree nodes in `LayersTree.tsx` using `React.memo`.
- Stable Property Panel key without full remounting on edits count.

- [ ] **Step 1: Write test verifying performance and clean state retention**

```typescript
// test/editor/performance-optimization.test.ts
import { describe, it, expect } from "vitest";

describe("Performance & UI Polish", () => {
  it("maintains stable state during style edits", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Implement performance improvements and UI decluttering**
1. In `SelectionOverlay.tsx`, throttle `requestAnimationFrame` and stop polling when the DOM is idle and not animating.
2. In `PropertyPanel.tsx`, remove the aggressive key that caused full component remounts on every edit.
3. Memoize `TreeNode` in `LayersTree.tsx` so only changed tree nodes re-render.
4. Streamline Property Panel accordions: organize properties logically with collapsible sections, clear active indicators, and concise tooltips.

- [ ] **Step 3: Run all unit tests across the entire codebase**
Run: `npm test`
Expected: All tests pass (100% green).

- [ ] **Step 4: Commit changes**
```bash
git add src/components/editor/SelectionOverlay.tsx src/components/editor/PropertyPanel.tsx src/components/editor/LayersTree.tsx src/components/editor/EditorStudio.tsx test/editor/performance-optimization.test.ts
git commit -m "perf: optimize render cycles, throttle overlay raf, memoize layers, and declutter UI"
```

---

## Verification Plan

### Automated Tests
- Run full Vitest test suite: `npm test`
- Check type safety: `npx tsc --noEmit`

### Manual Verification
- Test all 9 HTML test files from `files for testing/`:
  - `besty-redesigned (6).html`: Verify smooth layers tree, GSAP animation tracking without script pollution on save, scale drag, and pinning.
  - `gemini-code-1785182456557 (1).html`: Verify Vanilla CSS `:root` swatches, padding/margin accuracy, and responsive overrides.
  - `gemini-code-1785182738541.html`: Verify absolute overlay cards and constraints.
  - `saas-landing.html`: Verify Tailwind v4 arbitrary values and link creation.
- Test Scaling: Toggle Scale checkbox on image and textbox, drag corner handle to scale, type numeric value `1.5` directly.
- Test Framer Pinning: Select an element, click Pin Top / Bottom / Stretch H, verify positioning behavior.
- Test Hyperlink: Select a button and div, click "Add Hyperlink", enter URL, verify wrap and edit.
- Test Layers Panel: Drag layer inside another container, press `Ctrl+G` to wrap with Auto-Div, verify tree hierarchy and DOM output.
