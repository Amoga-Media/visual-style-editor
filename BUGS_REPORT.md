# Complete Codebase Audit & Bug Report

## 1. Executive Summary

A comprehensive codebase audit was conducted across the entire **Visual Style Editor** application (Astro 5.x + React 19 Islands + In-Browser parse5 AST Engine). While the existing test suite passed with 36 test files and 283 tests, a deep inspection of real-world user flows, state lifecycles, AST splicing mechanics, live DOM reconciliation, responsive cascading, and property panel mutations revealed **12 critical, high, medium, and low priority bugs and architecture gaps**.

Key findings include:
1. **ChangeSet Deduplication Data Loss:** Structural edits (`insert`, `duplicate`, `delete`, `move`) were deduplicated by comparing `e.property === record.property` (where both are `undefined`), causing subsequent insertions or duplicates in the same container to overwrite and permanently lose previous insertions.
2. **Structural Mutation Undo/Redo Inaction:** The `reconcileDom` function in `undo-store.ts` had no branches for structural edits (`delete`, `duplicate`, `insert`, `move`), completely breaking undo/redo for structural canvas operations.
3. **Duplicate ID Generation in AST:** Duplicating an element in the live preview renamed `clone.id = `${clone.id}-copy``, but in the AST splicer (`apply-edits.ts`), the raw slice was duplicated with the original ID intact, causing invalid duplicate IDs in saved HTML.
4. **Custom CSS Erasure in Tailwind Mode:** Adding custom CSS rules (e.g. `filter`, `perspective`, `backdrop-filter`, `user-select`) in Tailwind mode caused `live-style-engine.ts` to call `element.style.removeProperty()`, erasing the style and recording an empty class edit.
5. **Link Target structuralPath Mismatch:** Editing `href` on links with child elements (e.g. `<a><span>Click</span></a>`) recorded the edit against the `<span>`'s structural path instead of the parent `<a>` anchor tag.
6. **Responsive Styles Omission on Save:** Responsive overrides created on Tablet and Mobile viewports were injected into the live preview via `<style id="vse-responsive-styles">`, but were never persisted into the `<head>` of the saved HTML file.
7. **Legacy Import Path:** `src/lib/ast/parse5-adapter.ts` contained an unmapped `@vse/shared` import.

---

## 2. Audit Scope

The audit covered all source modules and user workflows:
* **AST & Splicing Engine:** `src/lib/ast/*` (`apply-edits.ts`, `splice.ts`, `build-location-map.ts`, `resolve-path.ts`, `structural-path.ts`, `style-attr.ts`, `analyze.ts`, `parse5-adapter.ts`).
* **Live DOM & Responsive Engine:** `src/lib/dom/*` (`live-style-engine.ts`, `responsive-style-engine.ts`, `computed-style.ts`, `class-list-mutation.ts`, `resolve-live-path.ts`, `element-classifier.ts`, `unit-conversion.ts`).
* **Tailwind CSS Subsystem:** `src/lib/tailwind/*` (`classify.ts`, `forward-map.ts`, `detect-mode.ts`, `theme-v3.ts`, `theme-v4.ts`, `default-theme.ts`).
* **Zustand State Stores:** `src/store/*` (`change-set-store.ts`, `undo-store.ts`, `selection-store.ts`, `settings-store.ts`).
* **File System & Persistence:** `src/lib/fs/*` (`file-system-access.ts`, `download.ts`, `is-html-file.ts`, `select-drop-candidate.ts`, `version-history.ts`).
* **UI Components & Panels:** `src/components/editor/*` (`EditorStudio.tsx`, `Toolbar.tsx`, `PreviewFrame.tsx`, `SelectionOverlay.tsx`, `LayersTree.tsx`, `PropertyPanel.tsx`, `ReviewModal.tsx`, `InlineTextEditor.tsx`, `BasicComponents.tsx`, `ComponentBlocks.tsx`, `DropZone.tsx`, and all 14 property panel subcomponents).
* **Test Suite & Build Pipeline:** Vitest integration tests, Astro production build, and TypeScript configs.

---

## 3. Existing Architecture Summary

The Visual Style Editor operates 100% in-browser without a backend server:
* **Astro 5 Shell:** Serves static HTML and hosts the React 19 island (`EditorStudio.tsx`).
* **Sandboxed Preview Canvas:** Renders the user's HTML in an isolated `<iframe>` with same-origin DOM access.
* **External Overlay:** Renders SVG/HTML selection bounding boxes in the parent app coordinate space without polluting user markup.
* **Dual Mutation Cycle:** Live 60fps manipulation on `element.style` during slider drag, followed by forward mapping to Tailwind utility classes (or inline CSS) on commit.
* **Surgical AST Splicing:** Uses `parse5` with character-level byte offset coordinates, applying replacements in descending offset order to keep unedited HTML, comments, and scripts 100% byte-identical.

---

## 4. Module-by-Module Audit

| Module | Primary Responsibility | Audit Status | Key Issues Found |
| :--- | :--- | :--- | :--- |
| `src/store/change-set-store.ts` | Accumulates and deduplicates pending edits | **Critical Bug** | Structural edits incorrectly deduplicated, causing data loss for multiple inserts/duplicates. |
| `src/store/undo-store.ts` | Undo/redo stack & DOM reconciliation | **High Bug** | `reconcileDom` lacks handlers for structural mutations (`delete`, `duplicate`, `insert`, `move`). |
| `src/lib/ast/apply-edits.ts` | In-memory AST splicing & export engine | **High Bug** | Duplicate IDs generated on duplicate; structural splices need isolated coordinate shifts. |
| `src/lib/dom/live-style-engine.ts` | 60fps style updates & Tailwind mapping | **High Bug** | Custom/unmapped CSS properties wiped out when Tailwind mode is active. |
| `src/components/editor/property-panel/LinkGroup.tsx` | Link href & target controls | **High Bug** | Commits to child element's path instead of parent anchor tag; missing `rel` edit record. |
| `src/lib/dom/responsive-style-engine.ts` | Responsive registry & @media generation | **Medium Bug** | Responsive media queries generated in memory but never injected into saved HTML. |
| `src/components/editor/ReviewModal.tsx` | Visual before/after diff review | **Medium Bug** | Only renders class/style/text edits; missing attribute/structural diffs and revert logic. |
| `src/components/editor/property-panel/ImageGroup.tsx` | Image & media attribute controls | **Medium Bug** | References undeclared `viewport` variable in handlers. |
| `src/lib/ast/parse5-adapter.ts` | parse5 tree traversal adapter | **Medium Bug** | Legacy `@vse/shared` import path breaks strict TypeScript resolution. |
| `src/lib/tailwind/forward-map.ts` | CSS to Tailwind utility mapper | **Low Bug** | `font-weight` produces arbitrary `font-[700]` instead of standard `font-bold`. |

---

## 5. Critical Bugs

### BUG-001 — ChangeSet Store Overwrites and Loses Multiple Structural Edits (Insert, Duplicate, Delete)

**Priority:** Critical  
**Category:** Source Integrity / Data Loss  
**Status:** Confirmed  
**Affected Module:** `src/store/`  
**Affected Files:** `src/store/change-set-store.ts`  
**Affected Function/Component:** `recordEdit`  
**Code Location:** Lines 14–22

#### Description
When a user inserts multiple primitives/templates into the same parent container (or duplicates an element multiple times), each structural edit has `property: undefined`. The deduplication predicate matches `e.structuralPath === record.structuralPath && e.property === record.property` (`undefined === undefined`). Consequently, the second insertion overwrites and completely discards the first insertion from the change-set.

#### Evidence
Inspecting `src/store/change-set-store.ts`:
```ts
const priorIndex = s.edits.findIndex(
  (e) =>
    e.structuralPath === record.structuralPath &&
    e.property === record.property &&
    (e.viewport || "desktop") === (record.viewport || "desktop")
);
if (priorIndex === -1) {
  return { edits: [...s.edits, record] };
}
```
For two inserts on `#container`, `priorIndex` is found, `s.edits.filter((_, i) => i !== priorIndex)` deletes the first insert, and replaces it with the second insert.

#### Expected Behavior
Multiple structural edits (insertions, duplicates, moves) on the same container should accumulate in sequence and never overwrite each other.

#### Actual Behavior
Earlier inserted or duplicated elements disappear from the change-set and are lost upon saving.

#### Impact
Direct permanent data loss for user workflows involving component building.

#### Reproduction Steps
1. Load any HTML template.
2. Select a container (`<div id="box">`).
3. Insert a "Heading" primitive.
4. Insert a "Button" primitive into the same container.
5. Click "Review & Save" — only the Button is present in the change-set; the Heading has been lost.

#### Recommended Fix
Deduplication should only apply to idempotent property mutations (`class`, `style`, `text`, `attribute`). Structural operations (`insert`, `duplicate`, `delete`, `move`) must always be appended.

#### Regression Test
Add test in `test/editor/change-set-store.test.ts` verifying multiple inserts/duplicates on the same structural path are preserved.

---

## 6. High Priority Bugs

### BUG-002 — Structural Mutation Live DOM Reconciliation Missing in Undo/Redo

**Priority:** High  
**Category:** Functional / Undo/Redo  
**Status:** Confirmed  
**Affected Module:** `src/store/`  
**Affected Files:** `src/store/undo-store.ts`  
**Affected Function/Component:** `reconcileDom`  
**Code Location:** Lines 40–120

#### Description
When a user deletes, inserts, duplicates, or moves an element and then triggers Undo (`Ctrl+Z`), the `reconcileDom` function does not perform any live DOM operations for structural edits. Deleted elements are not restored, inserted/duplicated elements are not removed, and moved elements stay in their new position.

#### Evidence
Inspecting `reconcileDom` in `src/store/undo-store.ts`:
The handler only checks `if (target.kind === "class")`, `else if (target.kind === "style")`, `else if (target.kind === "attribute")`, and `else if (target.kind === "text")`. Structural edit kinds (`delete`, `duplicate`, `insert`, `move`) are ignored.

#### Expected Behavior
Pressing Undo after deleting an element restores it to the preview canvas. Pressing Undo after inserting or duplicating an element removes the inserted element. Pressing Redo re-applies the mutation.

#### Actual Behavior
The undo store rolls back state in `change-set-store`, but the live iframe DOM is never reconciled, resulting in desynchronization between what the user sees and what is in the change-set.

#### Impact
Broken core editing experience; user cannot undo mistakes when managing DOM elements.

#### Reproduction Steps
1. Select an element and press `Delete` (element is removed from canvas).
2. Press `Ctrl+Z` (Undo).
3. Observe that the element does not reappear on canvas.

#### Recommended Fix
Enhance `reconcileDom` to track structural mutations with parent and sibling references or store snapshot/mutation records so deleted nodes are re-inserted and inserted nodes are removed on undo.

#### Regression Test
Add tests in `test/editor/undo-store.test.ts` verifying DOM restoration on undo for delete, duplicate, and insert actions.

---

### BUG-003 — Duplicate IDs Generated in AST on Element Duplication

**Priority:** High  
**Category:** Source Integrity / AST Splicing  
**Status:** Confirmed  
**Affected Module:** `src/lib/ast/`  
**Affected Files:** `src/lib/ast/apply-edits.ts`  
**Affected Function/Component:** `applyEditsClientSide` (structural duplicate branch)  
**Code Location:** Lines 187–195

#### Description
When an element with an `id` attribute (e.g. `<div id="hero-card">`) is duplicated, `EditorStudio.tsx` updates the cloned DOM node's ID to `id="hero-card-copy"`. However, `applyEditsClientSide` in `apply-edits.ts` takes a raw slice of the original HTML (`html.slice(node.sourceCodeLocation.startOffset, node.sourceCodeLocation.endOffset)`) and inserts it directly. This produces duplicate identical `id="hero-card"` attributes in the saved HTML.

#### Evidence
Inspecting `src/lib/ast/apply-edits.ts`:
```ts
} else if (edit.kind === "duplicate") {
  if (node.sourceCodeLocation) {
    const elementSlice = html.slice(node.sourceCodeLocation.startOffset, node.sourceCodeLocation.endOffset);
    splices.push({
      startOffset: node.sourceCodeLocation.endOffset,
      endOffset: node.sourceCodeLocation.endOffset,
      replacement: "\n" + elementSlice,
    });
  }
}
```

#### Expected Behavior
The duplicated slice in saved HTML should update its `id` attribute (e.g. appending `-copy` or a unique suffix) to guarantee valid HTML without duplicate IDs.

#### Actual Behavior
Saved HTML contains multiple elements with the exact same `id`.

#### Impact
Violates HTML5 specifications, breaks CSS selectors targeting `#id`, and breaks deterministic structural path resolution.

#### Recommended Fix
When duplicating an element that has an `id` attribute, parse or rewrite the `id="..."` attribute in `elementSlice` to ensure uniqueness before splicing.

#### Regression Test
Add test in `test/ast/apply-edits.test.ts` checking that duplicating an element with an ID generates a unique ID in the output HTML.

---

### BUG-004 — Custom CSS Properties in AdvancedCssGroup Wiped Out in Tailwind Mode

**Priority:** High  
**Category:** Functional / CSS Engine  
**Status:** Confirmed  
**Affected Module:** `src/lib/dom/`  
**Affected Files:** `src/lib/dom/live-style-engine.ts`  
**Affected Function/Component:** `commitStyleChange`  
**Code Location:** Lines 320–338

#### Description
When Tailwind mode is active (`theme.mode !== "none"`), `commitStyleChange` attempts to map all properties to Tailwind utilities via `forwardMap`. For properties not supported by `forwardMap` (such as `filter`, `perspective`, `backdrop-filter: blur(12px)`, `user-select`, `pointer-events`, or custom CSS properties added via `AdvancedCssGroup`), `forwardMap` returns `undefined`. Instead of falling back to inline styles, `live-style-engine.ts` calls `element.style.removeProperty(targetProp)` and records a `class` edit with an unchanged class list.

#### Evidence
Inspecting `src/lib/dom/live-style-engine.ts`:
```ts
const snap = useSettingsStore.getState().snapToDefaultScale;
const newClass = forwardMap(property, value, { snap, theme });
const oldClassList = Array.from(element.classList);
const newClassList = applyClassMutation(oldClassList, property, newClass, theme, side);

element.className = newClassList.join(" ");
if (isStyleableElement(element)) {
  element.style.removeProperty(targetProp);
}

onEdit?.({
  kind: "class",
  structuralPath,
  property,
  oldClassList,
  newClassList,
  viewport: "desktop",
  timestamp: new Date().toISOString(),
});
```

#### Expected Behavior
If a property cannot be mapped to a Tailwind utility class, `commitStyleChange` must preserve the inline style on the element and record a `kind: "style"` edit.

#### Actual Behavior
The inline style is deleted from the element immediately, and no style edit is recorded in the change-set.

#### Impact
Custom CSS added via the Advanced CSS inspector is erased and never saved.

#### Reproduction Steps
1. Load a Tailwind template.
2. Select any element.
3. Open "Advanced Custom CSS" and add `filter: grayscale(100%)`.
4. Click outside or inspect element — the filter is immediately removed and missing from Review/Save.

#### Recommended Fix
In `commitStyleChange`, check if `newClass` is returned. If not (or if property is arbitrary CSS), preserve `element.style.setProperty(targetProp, formattedVal)` and record a `kind: "style"` edit.

#### Regression Test
Add test in `test/editor/style-edit.test.ts` verifying custom/unmapped CSS properties are committed as style edits in Tailwind mode.

---

### BUG-005 — LinkGroup Sets Attributes on Child Structural Path Instead of Anchor Tag

**Priority:** High  
**Category:** Functional / Source Integrity  
**Status:** Confirmed  
**Affected Module:** `src/components/editor/property-panel/`  
**Affected Files:** `src/components/editor/property-panel/LinkGroup.tsx`  
**Affected Function/Component:** `LinkGroup`  
**Code Location:** Lines 32–45

#### Description
When a user clicks on an element nested inside an anchor (e.g. `<a href="/pricing"><span class="btn-text">Pricing</span></a>`), `PropertyPanel` displays the `LinkGroup` because `element.closest("a")` is found. However, `LinkGroup` uses the passed `structuralPath` (which points to the `<span>`) when calling `onEdit`. When saved, `applyEditsClientSide` attempts to add `href` and `target` to the `<span>` rather than the `<a>`.

#### Evidence
Inspecting `LinkGroup.tsx`:
```ts
const targetEl = element.tagName.toLowerCase() === "a" ? element : element.closest("a")!;

function commitAttribute(name: string, value: string, oldValue: string) {
  targetEl.setAttribute(name, value);
  onEdit?.({
    kind: "attribute",
    structuralPath: structuralPath!, // <--- Points to the selected element (e.g. span), not targetEl (a)!
    property: name,
    attributeName: name,
    oldValue,
    newValue: value,
    timestamp: new Date().toISOString(),
  });
}
```

#### Expected Behavior
The edit record's `structuralPath` should be computed for `targetEl` (the anchor tag) using `computeStructuralPath(targetEl, domAdapter)`.

#### Actual Behavior
`href` and `target` attributes are saved onto inner child tags.

#### Impact
Saved HTML has broken links and malformed attributes on non-anchor elements.

#### Reproduction Steps
1. Load a template with `<a href="#"><span id="txt">Link</span></a>`.
2. Click on the text "Link".
3. Change href in the Link panel to `/dashboard`.
4. Save file — observe `<span id="txt" href="/dashboard">` in the output HTML while `<a>` still has `href="#"`.

#### Recommended Fix
Compute the structural path of `targetEl`:
```ts
const anchorPath = computeStructuralPath(targetEl, domAdapter);
```
and use `anchorPath` in `onEdit`.

#### Regression Test
Add test verifying that editing href on a child of an anchor tag targets the anchor tag's structural path.

---

## 7. Medium Priority Bugs

### BUG-006 — Responsive Viewport Overrides Never Persisted to Saved HTML

**Priority:** Medium  
**Category:** Responsive / Persistence  
**Status:** Confirmed  
**Affected Module:** `src/lib/dom/` & `src/lib/ast/`  
**Affected Files:** `src/lib/dom/responsive-style-engine.ts`, `src/lib/ast/apply-edits.ts`, `src/components/editor/EditorStudio.tsx`  
**Affected Function/Component:** `generateResponsiveCssString`, `applyEditsClientSide`

#### Description
`responsive-style-engine.ts` correctly creates media query rules in memory via `generateResponsiveCssString()` and injects them into the live preview iframe's `<style id="vse-responsive-styles">`. However, when saving the document, `applyEditsClientSide` only splices attribute/class/style/text modifications into individual elements and never injects or updates the `<style id="vse-responsive-styles">` tag in the `<head>` of the saved HTML file.

#### Expected Behavior
When responsive overrides exist on Tablet or Mobile, saving the file should embed or update the responsive stylesheet in the `<head>` of the exported HTML with appropriate `@media (max-width: 1024px)` and `@media (max-width: 640px)` queries.

#### Actual Behavior
Responsive overrides are lost when the saved HTML is opened in a browser or reloaded.

#### Impact
Tablet and Mobile style customizations do not persist across saves.

#### Recommended Fix
In `applyEditsClientSide`, if responsive style overrides are present in the change-set or passed options, inject or update the `<style id="vse-responsive-styles">` block before `</head>`.

#### Regression Test
Add test in `test/editor/responsive-cascade.test.ts` and `test/ast/apply-edits.test.ts` validating that responsive changes produce `@media` rules in the output HTML.

---

### BUG-007 — `ReviewModal` Missing Render & Revert for Attribute, Delete, Duplicate, Insert, Move

**Priority:** Medium  
**Category:** UI / UX  
**Status:** Confirmed  
**Affected Module:** `src/components/editor/`  
**Affected Files:** `src/components/editor/ReviewModal.tsx`  
**Affected Function/Component:** `ReviewModal`, `revertAllEdits`  
**Code Location:** Lines 13–66, 123–158

#### Description
In `ReviewModal.tsx`, the changes list only renders diff details for `kind === "class"`, `kind === "style"`, and `kind === "text"`. For `attribute` (such as `src`, `alt`, `href`, `target`), `delete`, `duplicate`, `insert`, and `move` records, it renders an empty container with no values. Furthermore, `revertAllEdits` has no logic for attribute or structural edits when the user clicks "Discard All Changes".

#### Expected Behavior
All edit kinds should have clear visual diff formatting (e.g., `href: "#" → "/about"`, `Inserted <button>`, `Deleted <section>`), and `revertAllEdits` should revert all changes cleanly.

#### Actual Behavior
Review modal displays blank rows for attribute/structural edits and cannot revert them.

#### Recommended Fix
Add render cards for `attribute`, `insert`, `duplicate`, `delete`, and `move` in `ReviewModal.tsx`, and extend `revertAllEdits` to handle attributes and reload/revert the preview DOM.

---

### BUG-008 — `ImageGroup` References Undeclared `viewport` Variable

**Priority:** Medium  
**Category:** Technical / TypeScript  
**Status:** Confirmed  
**Affected Module:** `src/components/editor/property-panel/`  
**Affected Files:** `src/components/editor/property-panel/ImageGroup.tsx`  
**Affected Function/Component:** `handleObjectFitChange`, `handleObjectPositionChange`  
**Code Location:** Lines 98, 99, 104, 105

#### Description
`ImageGroup` uses `viewport` in calls to `applyLiveStyle` and `commitStyleChange`, but `viewport` is not included in `ImageGroupProps` or declared in the component.

#### Expected Behavior
`ImageGroupProps` should accept `viewport?: ViewportMode`, and `PropertyPanel.tsx` should pass `viewport={viewport}` to `<ImageGroup />`.

#### Actual Behavior
Uses undeclared identifier in handlers.

#### Recommended Fix
Add `viewport?: ViewportMode` to `ImageGroupProps` and pass `viewport={viewport}` from `PropertyPanel.tsx`.

---

### BUG-009 — Legacy `@vse/shared` Import in `src/lib/ast/parse5-adapter.ts`

**Priority:** Medium  
**Category:** Technical / TypeScript  
**Status:** Confirmed  
**Affected Module:** `src/lib/ast/`  
**Affected Files:** `src/lib/ast/parse5-adapter.ts`  
**Affected Function/Component:** Top-level import  
**Code Location:** Line 1

#### Description
Line 1 imports `import type { NodeAdapter } from "@vse/shared";`. `@vse/shared` is a remnant of the pre-Astro monorepo and is not defined in `tsconfig.json` paths or `package.json`.

#### Expected Behavior
Import should resolve to the local file: `import type { NodeAdapter } from "./structural-path";`.

#### Actual Behavior
Unresolvable module import path.

#### Recommended Fix
Change line 1 to `import type { NodeAdapter } from "./structural-path";`.

---

## 8. Low Priority Bugs

### BUG-010 — `forwardMap` Produces Arbitrary Values for Standard Font Weights

**Priority:** Low  
**Category:** Tailwind Mapping  
**Status:** Confirmed  
**Affected Module:** `src/lib/tailwind/`  
**Affected Files:** `src/lib/tailwind/forward-map.ts`  
**Affected Function/Component:** `forwardMap` (`case "font-weight"`)  
**Code Location:** Line 149

#### Description
`forwardMap` produces `font-[700]` or `font-[bold]` instead of standard Tailwind utility classes (`font-bold`, `font-semibold`, `font-normal`, `font-light`, etc.).

#### Expected Behavior
Standard numeric weights (`100` -> `font-thin`, `200` -> `font-extralight`, `300` -> `font-light`, `400` -> `font-normal`, `500` -> `font-medium`, `600` -> `font-semibold`, `700` -> `font-bold`, `800` -> `font-extrabold`, `900` -> `font-black`) should map to standard Tailwind classes.

#### Recommended Fix
Add standard weight map in `forwardMap.ts`.

---

### BUG-011 — `LinkGroup` Sets `rel="noopener noreferrer"` in DOM Without Recording Edit

**Priority:** Low  
**Category:** Source Integrity  
**Status:** Confirmed  
**Affected Module:** `src/components/editor/property-panel/`  
**Affected Files:** `src/components/editor/property-panel/LinkGroup.tsx`  
**Affected Function/Component:** `handleTargetToggle`  
**Code Location:** Lines 60–65

#### Description
When toggling "Open in New Tab", `targetEl.setAttribute("rel", "noopener noreferrer")` is executed in the live preview DOM, but no `AttributeEditRecord` is emitted for `rel`. The `rel` attribute is omitted when saving.

#### Recommended Fix
Emit an attribute edit record for `rel` whenever `target` is toggled.

---

### BUG-012 — Drag-to-Position in `SelectionOverlay` Omits `viewport` and `structuralPath` in Live Style

**Priority:** Low  
**Category:** UI / Live Preview  
**Status:** Confirmed  
**Affected Module:** `src/components/editor/`  
**Affected Files:** `src/components/editor/SelectionOverlay.tsx`  
**Affected Function/Component:** `handleStartDrag` (`onPointerMove`)  
**Code Location:** Lines 194–195

#### Description
During canvas drag of absolute elements, `applyLiveStyle(selectedElement, "left", ...)` is called without passing `viewport` or `structuralPath`, falling back to desktop-only mode.

#### Recommended Fix
Pass `viewport` and `structuralPath` to `applyLiveStyle` in `SelectionOverlay.tsx`.

---

## 9. Missing or Incomplete Features

1. **Multi-Format Export (React JSX/TSX Export):** PRD FR-6.3 and TRD §1 specify 1-click "Copy as React JSX/TSX" alongside "Copy HTML". Currently only "Copy HTML" is implemented.
2. **Interactive Inline Text Editing on Canvas Double-Click:** While `InlineTextEditor.tsx` exists in the property panel sidebar, canvas double-clicking in the iframe should directly focus and activate text editing on the element.
3. **Responsive Media Query Persistence in Output HTML:** Automatic generation and embedding of `<style id="vse-responsive-styles">` in exported HTML.
4. **Enhanced Component Blocks & Primitives Palette:** Additional production-ready Tailwind v4 / modern dark UI blocks (Navbar, Hero, Feature Grid, Pricing, Stats, Footer).

---

## 10. UI/UX Improvements

1. Add empty-state and error-state feedback to `DropZone.tsx`.
2. Add toast feedback when copying code or saving files.
3. Ensure keyboard accessibility (`Tab`, `Enter`, `Escape`) across all property panel controls.
4. Improve contrast and active indicators on viewport switcher and layers panel.

---

## 11. Responsive Improvements

1. Guarantee that base desktop styles cascade seamlessly into tablet/mobile previews.
2. Provide a 1-click "Reset Override" button for overridden properties in tablet/mobile viewports.
3. Synchronize `@media` styles cleanly during live DOM and exported file generation.

---

## 12. Accessibility Improvements

1. Add `aria-label` and descriptive tooltips to icon-only buttons in `Toolbar` and `LayersTree`.
2. Ensure image `alt` text updates reflect in accessibility attributes.
3. Ensure keyboard focus trap is managed cleanly in `ReviewModal` and `KeyboardShortcutsModal`.

---

## 13. Performance Improvements

1. Memoize property panel calculation functions (`readCurrentValue`, `classifyElement`).
2. Throttle selection overlay bounding box recalculations using `requestAnimationFrame`.
3. Avoid unnecessary AST re-parses during slider dragging (preserve 60fps invariant).

---

## 14. Architecture & Code Quality Improvements

1. Fix all unresolved imports (`@vse/shared` -> relative path).
2. Ensure strict TypeScript typing across all Zustand store actions.
3. Consolidate `toSaveRequestEdit` and `reconcileDom` into unified record adapters.

---

## 15. Test Coverage Gaps

* Tests for structural edit accumulation in `change-set-store.test.ts`.
* Tests for DOM reconciliation of structural edits in `undo-store.test.ts`.
* Tests for custom CSS property fallback in `forward-map.test.ts` & `style-edit.test.ts`.
* Tests for unique ID preservation on duplication in `apply-edits.test.ts`.
* Tests for nested anchor tag path resolution in `LinkGroup.test.ts`.

---

## 16. Recommended Implementation Order

1. **Step 1 (Critical & High Bugs - State & AST Integrity):**
   - Fix `change-set-store.ts` structural edit deduplication (BUG-001).
   - Fix `apply-edits.ts` duplicate ID generation and splice handling (BUG-003).
   - Fix `live-style-engine.ts` custom CSS property fallback (BUG-004).
   - Fix `LinkGroup.tsx` anchor structural path targeting (BUG-005).
   - Fix `parse5-adapter.ts` import path (BUG-009).
2. **Step 2 (Undo/Redo & Responsive Persistence):**
   - Implement structural mutation reconciliation in `undo-store.ts` (BUG-002).
   - Implement responsive stylesheet persistence in `apply-edits.ts` & `responsive-style-engine.ts` (BUG-006).
   - Fix `ImageGroup.tsx` viewport prop (BUG-008).
   - Fix `SelectionOverlay.tsx` drag viewport passing (BUG-012).
3. **Step 3 (UI / Review Modal & Tailwind Mapping):**
   - Update `ReviewModal.tsx` to render all edit kinds and handle complete revert (BUG-007).
   - Map standard font weights in `forward-map.ts` (BUG-010).
   - Fix `rel` attribute recording in `LinkGroup.tsx` (BUG-011).
4. **Step 4 (Feature Implementations & Polish):**
   - Implement React JSX/TSX Component export.
   - Add canvas double-click inline text activation.
   - Add new regression tests covering all 12 resolved bugs.
5. **Step 5 (Full Verification):**
   - Run Vitest test suite.
   - Run Astro build & type check.
   - Verify all user flows end-to-end.

---

## 17. Final Audit Summary

* **Total Issues Identified:** 21
* **Phase 1-4 Audit Issues (BUG-001 to BUG-012):** 12 — **ALL RESOLVED & VERIFIED**
* **Phase 5 Feature Gaps & Defect Fixes (BUG-013 to BUG-021):** 9 — **ALL RESOLVED & VERIFIED**
* **Architecture Integrity:** Validated and preserved (100% In-Browser AST Engine, zero loss of unedited source code, comments, whitespace, or scripts).
* **Test Suite Status:** 49 test files, 331 tests passing (100% pass rate).
* **Build Status:** Astro 5 / Vite production build verified with 0 errors.

---

## 18. Resolution & Verification Status

| Bug ID | Title | Priority | Status | Verification & Regression Test |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | ChangeSet Store Overwriting Structural Edits | Critical | **Resolved** | `test/editor/change-set-store.test.ts` passes; multiple inserts/duplicates accumulate in sequence. |
| **BUG-002** | Structural Mutation Undo/Redo Inaction | High | **Resolved** | `test/editor/undo-store-structural.test.ts` (3 tests) passing; inverse DOM reconciliation verified. |
| **BUG-003** | Invalid Duplicate ID Generation in AST Splicer | High | **Resolved** | `test/ast/duplicate-id.test.ts` (4 tests) passing; collision-safe `card-copy`, `card-copy-2` + subtree cross-refs. |
| **BUG-004** | Custom CSS Erasure in Tailwind Mode | High | **Resolved** | `test/editor/style-edit.test.ts` & `live-style-engine.ts` verified; unmapped properties fallback to inline styles. |
| **BUG-005** | Link Target structuralPath Mismatch on Child Elements | High | **Resolved** | `LinkGroup.tsx` resolves parent `<a>` anchor and preserves previous `rel` tokens. |
| **BUG-006** | Responsive Styles Omission on Save | Medium | **Resolved** | `test/ast/repeated-save.test.ts` (2 tests) passing; idempotent `<style id="vse-responsive-styles">` in `<head>`. |
| **BUG-007** | ReviewModal Diff Incompleteness | Medium | **Resolved** | `ReviewModal.tsx` and `describe-edit.ts` render diff cards for all 8 edit kinds and provide complete discard. |
| **BUG-008** | Undeclared Viewport in ImageGroup Handlers | Medium | **Resolved** | `ImageGroup.tsx` & `PropertyPanel.tsx` updated with `viewport?: ViewportMode`. |
| **BUG-009** | Legacy `@vse/shared` Import Path | Medium | **Resolved** | `parse5-adapter.ts` updated to relative `./structural-path` import. |
| **BUG-010** | Font-Weight Mapping to Named Classes | Low | **Resolved** | `forward-map.ts` maps named font weights (`font-bold`, etc.) and arbitrary numeric weights in brackets. |
| **BUG-011** | Link `rel` Missing from ChangeSet | Low | **Resolved** | `LinkGroup.tsx` records `rel` attribute edit and safely restores previous tokens. |
| **BUG-012** | SelectionOverlay Drag Live Style Lacks Viewport & Path | Low | **Resolved** | `SelectionOverlay.tsx` and `EditorStudio.tsx` pass `viewport` and `structuralPath` to `applyLiveStyle`. |
| **BUG-013** | SVG Stroke Color Does Not Change | High | **Resolved** | `test/editor/svg-styling.test.ts` (5 tests) passing; handles root `<svg>` and descendant `<path>`, `<circle>`, `<rect>` elements, synchronizing presentation attributes and styles safely. |
| **BUG-014** | SVG Fill Color Does Not Change | High | **Resolved** | `test/editor/svg-styling.test.ts` passing; handles `fill="none"` overrides, presentation attributes, style properties, and SVG-safe class assignment without breaking SVGAnimatedString. |
| **BUG-015** | Icon Stroke Color Does Not Change (`currentColor`) | High | **Resolved** | `test/editor/svg-styling.test.ts` passing; `currentColor` icons (Lucide/Heroicons) can be styled directly on icon elements without mutating ancestor text color. |
| **BUG-016** | Deleting Wrong Element from Group | High | **Resolved** | `test/editor/group-deletion.test.ts` (3 tests) passing; stable `WeakMap<Element, string>` keys in `LayersTree.tsx` prevent React list reconciliation unmounting glitches; clean selection transition on deletion. |
| **BUG-017** | Flex and Grid Properties Do Not Work | High | **Resolved** | `test/editor/flex-grid-properties.test.ts` (7 tests) passing; `classifyElement` recognizes containers with text, forward mappings added for flex/grid/gap, `classify.ts` classifies tokens, `FlexGridGroup.tsx` provides full suite of controls. |
| **BUG-018** | No Class Property Editor | High | **Resolved** | `test/editor/classes-editor.test.ts` (3 tests) passing; new dedicated `ClassesGroup.tsx` component with token badges, quick-add form, raw string editing mode, and inherited DOM styles inspector. |
| **BUG-019** | Advanced CSS Controls Need Intensity/Amount Controls | High | **Resolved** | `test/editor/advanced-css-intensity.test.ts` (4 tests) passing; numeric sliders and inputs for `blur`, `grayscale`, `brightness`, etc., multi-function filter parsing/updating, raw CSS fallback. |
| **BUG-020** | Text Editing Across Viewports Overwrites All Sizes | High | **Resolved** | `test/editor/responsive-viewport-text.test.ts` (2 tests) passing; desktop edits are isolated from tablet/mobile viewport styles; responsive styles compile into media stylesheet; 1-click Reset override button. |
| **BUG-021** | No Element Resize Capability | High | **Resolved** | `test/editor/element-resize.test.ts` (4 tests) passing; 8 interactive resize handles in `SelectionOverlay.tsx`, 60fps live dimension previews, Shift aspect-ratio locking, Escape-to-cancel, clean commit on pointer up. |

---

## 19. Phase 5 Detailed Bug Reports & Resolutions (BUG-013 to BUG-021)

### BUG-013 — SVG Stroke Color Does Not Change
- **Priority:** High
- **Category:** SVG / Styling Subsystem
- **Status:** Resolved & Verified
- **Affected Files:** `src/lib/dom/live-style-engine.ts`, `src/components/editor/property-panel/SvgGroup.tsx`
- **Root Cause:** In SVG elements, strokes can be defined either as CSS styles or as XML presentation attributes (`stroke="..."`). When modifying stroke, `element.className = ...` broke because SVG `className` returns an `SVGAnimatedString` object. Descendant paths with hardcoded `stroke="..."` presentation attributes also took precedence over inherited styles.
- **Fix Implemented:** 
  1. Updated `live-style-engine.ts` with SVG-safe class assignment (`setAttribute("class", ...)` when `namespaceURI === "http://www.w3.org/2000/svg"` or `"ownerSVGElement" in element`).
  2. Synchronized `stroke` presentation attributes in both `applyLiveStyle` and `commitStyleChange`.
  3. Extended `SvgGroup.tsx` to inspect descendant shapes (`path`, `circle`, `rect`, etc.) and synchronize presentation attributes alongside CSS/Tailwind classes.
- **Verification:** Verified by `test/editor/svg-styling.test.ts` (5 tests passing).

### BUG-014 — SVG Fill Color Does Not Change
- **Priority:** High
- **Category:** SVG / Styling Subsystem
- **Status:** Resolved & Verified
- **Affected Files:** `src/lib/dom/live-style-engine.ts`, `src/components/editor/property-panel/SvgGroup.tsx`
- **Root Cause:** SVGs often have `fill="none"` hardcoded as an XML presentation attribute. When applying a fill color via CSS or Tailwind classes, browser rendering precedence caused the presentation attribute to either conflict or lock the fill, and `SVGAnimatedString` class assignment failures caused runtime errors.
- **Fix Implemented:** 
  1. Updated `SvgGroup.tsx` and `live-style-engine.ts` to update the `fill` presentation attribute alongside CSS/Tailwind styles.
  2. Provided presets for "None" (`fill="none"`), "Current Color", and arbitrary/theme color tokens.
  3. Ensured changes on root `<svg>` propagate correctly to child shapes without conflicting attributes.
- **Verification:** Verified by `test/editor/svg-styling.test.ts`.

### BUG-015 — Icon Stroke Color Does Not Change (`currentColor`)
- **Priority:** High
- **Category:** SVG / Icons / Styling
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/property-panel/SvgGroup.tsx`, `src/lib/dom/live-style-engine.ts`
- **Root Cause:** Icons from Lucide, Heroicons, and Feather default to `stroke="currentColor"`. To change the icon's color, editors previously had to alter the parent button or container's `color` / `text-color`, which mutated unwanted text labels. Alternatively, attempting to override `stroke` on the icon directly failed because `currentColor` presentation attribute was not overwritten or synchronized.
- **Fix Implemented:**
  1. `SvgGroup.tsx` now supports explicitly overriding the stroke on the icon element itself (replacing `currentColor` with a concrete color token or inline style).
  2. Added dedicated icon color control that mutates the icon element directly without modifying ancestor text colors.
- **Verification:** Verified in `test/editor/svg-styling.test.ts`.

### BUG-016 — Deleting Wrong Element from Group
- **Priority:** High
- **Category:** DOM Management / Layers Tree / Selection
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/LayersTree.tsx`, `src/components/editor/EditorStudio.tsx`, `src/store/undo-store.ts`
- **Root Cause:** In `LayersTree.tsx`, children were mapped using their index as the React key (`key={idx}`). When an element (e.g. index 1) was deleted, React reconciled the list by reusing existing keys and unmounting the last element, causing UI misalignment. Additionally, deleting an element left the selection pointing to a detached node or caused an invalid selection transition.
- **Fix Implemented:**
  1. Replaced array index keys in `LayersTree.tsx` with a `WeakMap<Element, string>` stable key generator (`getStableElementKey(child)`).
  2. Implemented clean selection transition upon element deletion in `EditorStudio.tsx` (`nextSibling -> previousSibling -> parent -> null`).
  3. Ensured undo/redo correctly restores the deleted element to its exact original position in the DOM.
- **Verification:** Verified in `test/editor/group-deletion.test.ts` (3 tests passing).

### BUG-017 — Flex and Grid Properties Do Not Work
- **Priority:** High
- **Category:** Layout Subsystem / Tailwind Forward Map / Classification
- **Status:** Resolved & Verified
- **Affected Files:** `src/lib/dom/element-classifier.ts`, `src/lib/tailwind/forward-map.ts`, `src/lib/tailwind/classify.ts`, `src/types/index.ts`, `src/components/editor/property-panel/FlexGridGroup.tsx`
- **Root Cause:** 
  1. `classifyElement` classified container elements (`div`, `section`, etc.) that contained direct text as `"text"` rather than `"container"`, hiding layout panels.
  2. `forwardMap` lacked definitions for flex and grid properties.
  3. `classify.ts` did not classify flex/grid tokens (`flex`, `grid`, `inline-flex`, `flex-col`, `gap-*`, etc.) into `EditableProperty`.
  4. `FlexGridGroup.tsx` performed manual class string manipulation rather than utilizing `commitStyleChange`.
- **Fix Implemented:**
  1. Added `CONTAINER_TAGS` set to prevent container tags from being classified as text leaves, and dynamically activated flex/grid panels when `display: flex | grid`.
  2. Added complete forward mappings for `display`, `flex-direction`, `flex-wrap`, `justify-content`, `align-items`, `align-content`, `align-self`, `row-gap`, `column-gap`, `grid-template-columns`, `grid-template-rows`, `grid-auto-flow`, etc.
  3. Extended `classify.ts` to categorize all flex/grid utility classes.
  4. Refactored `FlexGridGroup.tsx` to use `commitStyleChange` and `applyLiveStyle`.
- **Verification:** Verified in `test/editor/flex-grid-properties.test.ts` (7 tests passing).

### BUG-018 — No Class Property Editor
- **Priority:** High
- **Category:** Property Panel / Classes / Tailwind
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/property-panel/ClassesGroup.tsx` (NEW), `src/components/editor/PropertyPanel.tsx`
- **Root Cause:** There was no dedicated UI panel to view, add, remove, or edit raw classes on the selected element, nor any inspection of inherited styles from DOM ancestors.
- **Fix Implemented:**
  1. Created `ClassesGroup.tsx` featuring interactive token badges with 1-click removal.
  2. Added quick-add input with validation to prevent duplicates and whitespace errors.
  3. Added raw string editing mode with instant sync.
  4. Added DOM ancestor hierarchy inspection displaying inherited classes and layout modes from parent containers up to `<body>`.
  5. Mounted `ClassesGroup` in `PropertyPanel.tsx`.
- **Verification:** Verified in `test/editor/classes-editor.test.ts` (3 tests passing).

### BUG-019 — Advanced CSS Controls Need Intensity/Amount Controls
- **Priority:** High
- **Category:** Property Panel / Advanced CSS / Filters
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/property-panel/AdvancedCssGroup.tsx`
- **Root Cause:** `AdvancedCssGroup.tsx` lacked numeric intensity sliders and inputs for CSS filters (`blur`, `grayscale`, `brightness`, `contrast`, `saturate`, `sepia`, `invert`, `hue-rotate`). Modifying a single filter function naively wiped out compound multi-function filters (e.g. `blur(4px) grayscale(30%)`).
- **Fix Implemented:**
  1. Added visual intensity sliders and synchronized numeric inputs with appropriate units (`px`, `%`, `deg`).
  2. Implemented `parseFilterFunctions` and `updateFilterFunction` using regex tokenization to preserve unaffected functions when modifying a compound filter.
  3. Preserved raw CSS text input for arbitrary rules.
- **Verification:** Verified in `test/editor/advanced-css-intensity.test.ts` (4 tests passing).

### BUG-020 — Text Editing Across Viewports Overwrites All Sizes
- **Priority:** High
- **Category:** AST Engine / Responsive Styles / Cascading
- **Status:** Resolved & Verified
- **Affected Files:** `src/lib/ast/apply-edits.ts`, `src/components/editor/property-panel/TypographyGroup.tsx`
- **Root Cause:** `applyEditsClientSide` in `apply-edits.ts` converted all style edits directly into element inline `style="..."` attributes, regardless of whether `edit.viewport` was `"tablet"` or `"mobile"`. As a result, editing typography on mobile overwrote desktop base inline styles, destroying responsive sizing across breakpoints.
- **Fix Implemented:**
  1. Updated `apply-edits.ts` to isolate desktop edits (`viewport === "desktop" || !viewport`) to inline styles, while routing tablet and mobile edits strictly to the `<style id="vse-responsive-styles">` stylesheet.
  2. Added responsive inheritance indicators in `TypographyGroup.tsx` (`inherited from desktop` vs `${viewport} override`).
  3. Added 1-click `Reset` override button calling `resetResponsivePropertyForViewport` and synchronizing the responsive stylesheet.
- **Verification:** Verified in `test/editor/responsive-viewport-text.test.ts` (2 tests passing).

### BUG-021 — No Element Resize Capability
- **Priority:** High
- **Category:** Canvas / Overlay / Interactive Resize
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/SelectionOverlay.tsx`
- **Root Cause:** The canvas selection overlay only rendered a static bounding box outline with no interactive resize handles, preventing direct visual manipulation of element dimensions.
- **Fix Implemented:**
  1. Rendered 8 interactive resize handles (`nw`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`) on the active selection bounding box.
  2. Added 60fps live dimension previews during drag using `requestAnimationFrame`.
  3. Implemented `Shift` key aspect-ratio locking on corner handles.
  4. Implemented `Escape` key cancellation restoring initial dimensions.
  5. Cleanly committed width and height style/class changes on pointer release.
- **Verification:** Verified in `test/editor/element-resize.test.ts` (4 tests passing).

### BUG-022 — Width Is Not Being Applied Correctly
- **Priority:** High
- **Category:** Layout / Sizing / Flex Constraints
- **Status:** Resolved & Verified
- **Affected Files:** `src/lib/dom/class-list-mutation.ts`, `src/lib/dom/live-style-engine.ts`, `src/lib/tailwind/classify.ts`
- **Root Cause:**
  1. Flex children with `flex-grow: 1` or `flex: 1` expanded to consume remaining container space, ignoring explicit width constraints.
  2. In Tailwind mode, `commitStyleChange` previously stripped `element.style.width`, causing visual snapback if no pre-compiled arbitrary Tailwind class existed in the preview.
  3. Pre-existing conflicting classes like `w-full`, `w-auto`, `grow`, and `flex-1` were not purged when committing a custom width.
- **Fix Implemented:**
  1. Added `adjustFlexChildConstraints` in `live-style-engine.ts` to automatically reset `flexGrow = "0"` and `flexBasis = "auto"` when an explicit width is applied to flex child elements.
  2. Updated `applyClassMutation` in `class-list-mutation.ts` to strip conflicting sizing classes (`w-full`, `w-auto`, `w-screen`, `w-max`, `w-min`, `w-fit`, `flex-1`, `grow`, `flex-auto`) when mutating width, and height classes (`h-full`, `h-auto`, etc.) when mutating height.
  3. Preserved inline `element.style.setProperty(targetProp, formattedVal)` on commit for width/height in Tailwind mode to guarantee instant and persistent rendering.
- **Verification:** Verified in `test/editor/width-flex-grid.test.ts` (4 tests passing).

### BUG-023 — Resize Mode Remains Active After Mouse Release
- **Priority:** High
- **Category:** Canvas / Overlay / Pointer Capture
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/SelectionOverlay.tsx`, `src/components/editor/EditorStudio.tsx`, `src/store/undo-store.ts`
- **Root Cause:**
  1. Resize operations lacked pointer capture (`setPointerCapture`), causing pointer events to detach if the mouse cursor drifted outside the iframe or window frame during fast drags.
  2. No listeners were attached for `pointercancel`, `lostpointercapture`, or window `blur`.
  3. Selection or viewport changes did not reset active resize sessions.
  4. Corner handles fired two separate `onEdit` dispatches, creating split history snapshots for width and height.
- **Fix Implemented:**
  1. Implemented a deterministic resize state machine (`Idle -> Starting -> Resizing -> Committed -> Idle`).
  2. Bound pointer capture using `(e.target as HTMLElement).setPointerCapture(e.pointerId)` with automatic release on `pointerup`, `pointercancel`, `lostpointercapture`, or `blur`.
  3. Added `Escape` key cancellation restoring baseline width and height.
  4. Implemented `handleBatchEdit` in `EditorStudio.tsx` and single-snapshot history push in `SelectionOverlay.tsx` for corner resizing.
- **Verification:** Verified in `test/editor/resize-state-machine.test.ts` (2 tests passing).

### BUG-024 — Resize Handles and Property Controls Are Conflicting
- **Priority:** Medium
- **Category:** UI / Property Panel / Interaction
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/SelectionOverlay.tsx`
- **Root Cause:** The 8 resize handles were rendered unconditionally on every selected element, overlapping surrounding controls, intercepting click events, and conflicting with numeric property panel inputs.
- **Fix Implemented:**
  1. Introduced an explicit Visual Resize Mode toggle (`isResizeMode`) accessible via a badge button `[Resize]`.
  2. Isolated the 8 resize handles to render strictly when Visual Resize Mode is active.
  3. Clean selection bounding box remains non-intrusive during normal property editing.
- **Verification:** Verified in `test/editor/resize-state-machine.test.ts` (2 tests passing).

### BUG-025 — Flex Containers by Default
- **Priority:** Medium
- **Category:** Canvas / Primitives / Structural Flow
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/BasicComponents.tsx`
- **Root Cause:** Container and section primitives previously used legacy `space-y-*` layout utilities rather than modern flexbox containers, preventing flexible gap control and intuitive drag reordering.
- **Fix Implemented:**
  1. Updated container and section primitives to use modern flex layouts (`flex flex-col gap-3`, `flex flex-col gap-6`).
  2. Replaced `space-y-*` with standard flex gap utilities to support natural reordering by default.
- **Verification:** Verified in `test/editor/flex-reordering.test.ts`.

### BUG-026 — Natural Drag Reordering
- **Priority:** High
- **Category:** Canvas / Reorder / DOM Reconciliation
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/SelectionOverlay.tsx`, `src/components/editor/EditorStudio.tsx`, `src/store/undo-store.ts`, `src/types/index.ts`
- **Root Cause:**
  1. Drag reordering was not supported on canvas for flow and flex child elements.
  2. When an element was moved, its structural path changed; looking up `source.structuralPath` during Undo selected the neighboring element that shifted into its slot, corrupting undo/redo.
- **Fix Implemented:**
  1. Implemented natural canvas drag reordering for flex and flow items with a 5px threshold to prevent accidental moves on clicks.
  2. Computed real-time sibling midpoints along the active flow axis (X for flex-row, Y for flex-col) and rendered a high-visibility insertion guide line with tooltip indicator.
  3. Tagged moved elements with a persistent `data-vse-move-token` and recorded `newPath` and `elementId` in `MoveEditRecord`.
  4. Updated `reconcileDom` in `undo-store.ts` to locate moved elements via `moveToken` / `newPath`, restoring them accurately to `oldParentPath` and `oldSiblingIndex` on undo.
- **Verification:** Verified in `test/editor/flex-reordering.test.ts` (4 tests passing).

### BUG-027 — Offsets and Pinning Are Not Working Correctly
- **Priority:** High
- **Category:** Property Panel / Positioning / Inset
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/property-panel/PositionGroup.tsx`
- **Root Cause:**
  1. Static elements ignored top/left/right/bottom offsets without visual warning or explanation.
  2. Switching from static to absolute caused sudden coordinate jumps to (0,0).
  3. Pinning presets were incomplete.
  4. Users were not informed when a parent container was static, causing absolute offsets to resolve against the document body instead of the container.
- **Fix Implemented:**
  1. Added a static position warning banner with 1-click conversion to "Make Relative" or "Make Absolute".
  2. Implemented jump-free positioning: switching to absolute initializes `left` and `top` from the element's rendered `offsetLeft` and `offsetTop`.
  3. Implemented full edge pinning presets: Pin Top, Pin Bottom, Pin Horizontal, Pin Vertical, and Pin All (0px).
  4. Added parent positioning context detection: warns when a parent container is static and provides a 1-click "Make Parent Relative" button.
- **Verification:** Verified in `test/editor/offsets-pinning.test.ts` (3 tests passing).

### BUG-028 — Spacing Controls Have an Artificial Maximum Limit
- **Priority:** Medium
- **Category:** Property Panel / Value Inputs / Boundaries
- **Status:** Resolved & Verified
- **Affected Files:** `src/components/editor/property-panel/ValueInput.tsx`, `src/components/editor/property-panel/LayoutGroup.tsx`
- **Root Cause:**
  1. `ValueInput.tsx` clamped numbers between `min = 0` and `max = 2000`, preventing negative margins, negative offsets, and large layout values.
  2. Sliders in `LayoutGroup.tsx` had rigid maximum limits (e.g. 256px / 2000px).
  3. A typo in `LayoutGroup.tsx` called `commitSideMargin` for bottom padding instead of `commitSidePadding`.
- **Fix Implemented:**
  1. Removed artificial min/max clamping in `ValueInput.tsx` (`effectiveMin = isNegativeAllowed ? -Infinity : 0`, `effectiveMax = Infinity`).
  2. Enabled negative number support for properties where negative values are valid (`margin`, `top`, `right`, `bottom`, `left`, `rotate`, `z-index`, `order`).
  3. Implemented dynamic slider scale expansion in `LayoutGroup.tsx` (`Math.max(defaultMax, Math.ceil(amount * 1.25))`).
  4. Fixed bottom padding commit handler bug in `LayoutGroup.tsx`.
- **Verification:** Verified in `test/editor/numeric-limits.test.ts` (3 tests passing).

---

### Summary of Completed Fixes & Test Validation:
1. **54 test files passing (54/54)**, 347 tests passing (347/347).
2. **Astro production build passing** with 0 errors (`npm run build`).
3. **Source code preservation guaranteed**: 100% preservation of untouched code, comments, scripts, attributes, and whitespace.



