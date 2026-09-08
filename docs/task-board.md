# Project Task Board — Visual HTML & Tailwind Editor

> **Tracking Rule:** This task board is continuously updated after every single implementation step.  
> **Current Sprint:** Sprint 10 — Framer UI Overhaul, Layer Dragging, Basic Blocks & 4-Sided Box Controls  
> **Overall Progress:** `[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓]` **100% Complete (42 / 42 Tasks Done)**

---

## 📊 Summary by Status

| Status | Count | Tasks |
| :--- | :---: | :--- |
| 🟢 **Done** | 42 | Tasks 1.1 — 10.5 |
| 🟡 **In Progress** | 0 | None |
| ⚪ **To Do** | 0 | None |
| 🔴 **Blocked** | 0 | None |

---

## 🏃 Sprint 1: Project Restructure & Astro Foundation

*Objective: Clean up obsolete Node server files and scaffold a unified, zero-server-cost Astro 5 + React 19 + Tailwind v4 project.*

- [x] **Task 1.1:** [SPRINT 1] Directory Cleanup & Monorepo Consolidation
  - *Files:* Clean obsolete `server/` files after safely extracting pure AST logic into new structure.
  - *Status:* 🟢 Done
- [x] **Task 1.2:** [SPRINT 1] Scaffold Astro 5.x Project with React & Tailwind Integrations
  - *Files:* `astro.config.mjs`, `package.json`, `tsconfig.json`
  - *Status:* 🟢 Done
- [x] **Task 1.3:** [SPRINT 1] Setup Core Global Styling & Theme System
  - *Files:* `src/styles/global.css`, `src/layouts/BaseLayout.astro`
  - *Status:* 🟢 Done
- [x] **Task 1.4:** [SPRINT 1] Establish Shared TypeScript Types & Contracts
  - *Files:* `src/types/index.ts`
  - *Status:* 🟢 Done

---

## ⚡ Sprint 2: 100% In-Browser AST & Splicing Engine

*Objective: Port all HTML AST parsing, character splicing, and Tailwind theme extraction to run 100% in the user's browser with 0ms network latency.*

- [x] **Task 2.1:** [SPRINT 2] In-Browser `parse5` Location Map & Path Resolver
  - *Files:* `src/lib/ast/build-location-map.ts`, `src/lib/ast/resolve-path.ts`
  - *Status:* 🟢 Done
- [x] **Task 2.2:** [SPRINT 2] Surgical Character Splicer & Style Attribute Merger
  - *Files:* `src/lib/ast/splice.ts`, `src/lib/ast/style-attr.ts`
  - *Status:* 🟢 Done
- [x] **Task 2.3:** [SPRINT 2] In-Browser Tailwind v3/v4 Theme & Token Detector
  - *Files:* `src/lib/tailwind/detect-mode.ts`, `src/lib/tailwind/theme-v3.ts`, `src/lib/tailwind/theme-v4.ts`
  - *Status:* 🟢 Done
- [x] **Task 2.4:** [SPRINT 2] CSS to Tailwind Forward-Mapping with OKLCH Color Snap (`culori`)
  - *Files:* `src/lib/tailwind/forward-map.ts`, `src/lib/tailwind/classify.ts`
  - *Status:* 🟢 Done
- [x] **Task 2.5:** [SPRINT 2] Comprehensive Unit Test Suite for In-Browser AST Engine
  - *Files:* `test/ast/*.test.ts`, `test/tailwind/*.test.ts` (12/12 passing)
  - *Status:* 🟢 Done

---

## 🎨 Sprint 3: Interactive Canvas & Visual Style Panels

*Objective: Mount the React Island editor inside Astro, wiring up the sandboxed iframe canvas, cursor overlay, and visual controls.*

- [x] **Task 3.1:** [SPRINT 3] Sandboxed Iframe Preview Canvas with DOM Adapter
  - *Files:* `src/components/editor/PreviewFrame.tsx`, `src/lib/dom/dom-adapter.ts`
  - *Status:* 🟢 Done
- [x] **Task 3.2:** [SPRINT 3] Non-Invasive Hover & Selection Overlay Engine
  - *Files:* `src/components/editor/SelectionOverlay.tsx`, `src/store/selection-store.ts`
  - *Status:* 🟢 Done
- [x] **Task 3.3:** [SPRINT 3] Typography Property Panel (Font size, weight, line-height, alignment)
  - *Files:* `src/components/editor/property-panel/TypographyGroup.tsx`
  - *Status:* 🟢 Done
- [x] **Task 3.4:** [SPRINT 3] Layout & Sizing Property Panel (Width, height, padding, margin)
  - *Files:* `src/components/editor/property-panel/LayoutGroup.tsx`
  - *Status:* 🟢 Done
- [x] **Task 3.5:** [SPRINT 3] Border & Radius Property Panel (Sided border width, style, radius)
  - *Files:* `src/components/editor/property-panel/BorderGroup.tsx`
  - *Status:* 🟢 Done
- [x] **Task 3.6:** [SPRINT 3] Color & Palette Swatch Group with Perceptual Snapping
  - *Files:* `src/components/editor/property-panel/ColorGroup.tsx`
  - *Status:* 🟢 Done

---

## ✍️ Sprint 4: Direct Content Editing (Text & Media)

*Objective: Enable non-developers to edit text copy and swap images directly on the canvas.*

- [x] **Task 4.1:** [SPRINT 4] Double-Click Inline Text Editing Overlay (`contenteditable`)
  - *Files:* `src/components/editor/InlineTextEditor.tsx`, `src/lib/ast/apply-edits.ts`
  - *Status:* 🟢 Done
- [x] **Task 4.2:** [SPRINT 4] Image & Media Inspector (URL swapping, alt-text, aspect ratio)
  - *Files:* `src/components/editor/PropertyPanel.tsx`
  - *Status:* 🟢 Done
- [x] **Task 4.3:** [SPRINT 4] Change-Set & Text Edit Deduplication Store
  - *Files:* `src/store/change-set-store.ts`, `src/lib/ast/apply-edits.ts`
  - *Status:* 🟢 Done

---

## 🔄 Sprint 5: Viewport Controls, Undo/Redo & Native Persistence

*Objective: Add responsive device switching, session history, diff review, and Chromium File System Access API saving.*

- [x] **Task 5.1:** [SPRINT 5] Responsive Device Switcher (Desktop 1440px / Tablet 768px / Mobile 375px)
  - *Files:* `src/components/editor/Toolbar.tsx`, `src/components/editor/EditorStudio.tsx`
  - *Status:* 🟢 Done
- [x] **Task 5.2:** [SPRINT 5] Undo / Redo Engine with Live DOM Reconciliation
  - *Files:* `src/store/undo-store.ts`
  - *Status:* 🟢 Done
- [x] **Task 5.3:** [SPRINT 5] Visual Review Diff Modal & Session Version History
  - *Files:* `src/components/editor/ReviewModal.tsx`, `src/components/editor/VersionHistory.tsx`
  - *Status:* 🟢 Done
- [x] **Task 5.4:** [SPRINT 5] File System Access API Direct Disk Save & Blob Fallback
  - *Files:* `src/lib/fs/file-system-access.ts`, `src/lib/fs/download.ts`
  - *Status:* 🟢 Done

---

## 🚀 Sprint 6: SEO Landing Page, Template Library & Launch Polish

*Objective: Build high-converting SEO marketing pages, structured JSON-LD data, curated templates, and production verification.*

- [x] **Task 6.1:** [SPRINT 6] High-Conversion Astro Landing Page with Live DropZone Hero
  - *Files:* `src/pages/index.astro`, `src/components/editor/DropZone.tsx`
  - *Status:* 🟢 Done
- [x] **Task 6.2:** [SPRINT 6] Curated Free Starter Templates Library (Hero, Pricing, SaaS, Newsletter)
  - *Files:* `src/components/editor/DropZone.tsx` (Pre-loaded Modern SaaS, Portfolio, Pricing, Newsletter templates)
  - *Status:* 🟢 Done
- [x] **Task 6.3:** [SPRINT 6] Complete SEO Stack: JSON-LD Graph, OpenGraph Cards, Sitemap & robots.txt
  - *Files:* `src/layouts/BaseLayout.astro`, `public/robots.txt`, `public/favicon.svg`
  - *Status:* 🟢 Done
- [x] **Task 6.4:** [SPRINT 6] End-to-End Test Suite & Zero-Cost Production Build Verification
  - *Commands:* `npm test` (25/25 suites, 190/190 tests passing), `npm run build` (Static bundle verified)
  - *Status:* 🟢 Done

---

## 💎 Sprint 7: Advanced Studio, Layers DOM Tree & Component Palette

*Objective: Deliver professional studio capabilities — DOM hierarchy explorer, direct numeric inputs, element duplication/deletion, component insertion, canvas zoom, and expanded starter library.*

- [x] **Task 7.1:** [SPRINT 7] Direct Numeric Inputs & Bidirectional Slider Synchronization (`ValueInput`)
  - *Files:* `src/components/editor/property-panel/ValueInput.tsx`, `LayoutGroup.tsx`, `TypographyGroup.tsx`, `BorderGroup.tsx`, `EffectsGroup.tsx`, `FlexGridGroup.tsx`
  - *Status:* 🟢 Done
- [x] **Task 7.2:** [SPRINT 7] Viewport Boundary Clamping & Authentic Device Frames
  - *Files:* `src/components/editor/SelectionOverlay.tsx`, `src/components/editor/EditorStudio.tsx`
  - *Status:* 🟢 Done
- [x] **Task 7.3:** [SPRINT 7] DOM Hierarchy Explorer (`LayersTree`) with Live Selection & Hover
  - *Files:* `src/components/editor/LayersTree.tsx`, `src/components/editor/Breadcrumbs.tsx`
  - *Status:* 🟢 Done
- [x] **Task 7.4:** [SPRINT 7] Component & UI Blocks Insertion Palette
  - *Files:* `src/components/editor/ComponentBlocks.tsx`, `src/lib/ast/apply-edits.ts`
  - *Status:* 🟢 Done
- [x] **Task 7.5:** [SPRINT 7] Structural Mutations (Delete, Duplicate, Reorder, Insert) & AST Splicing
  - *Files:* `src/types/index.ts`, `src/lib/ast/apply-edits.ts`, `src/components/editor/property-panel/ElementActionsGroup.tsx`, `test/ast/apply-edits.test.ts`
  - *Status:* 🟢 Done
- [x] **Task 7.6:** [SPRINT 7] Canvas Zoom Controls, Keyboard Shortcuts Modal & 6 Curated Templates
  - *Files:* `src/components/editor/Toolbar.tsx`, `src/components/editor/KeyboardShortcutsModal.tsx`, `src/components/editor/DropZone.tsx`
  - *Status:* 🟢 Done

---

## 🚀 Sprint 9: Framer-Grade Layout, Dimensions & Positioning Controls

*Objective: Provide full Framer-like layout controls: Min/Max Width & Height constraints, Positioning modes (relative/absolute/fixed/sticky), Coordinate Pinning, Z-Index layering, Overflow clipping, Cursor styles, Glassmorphism backdrop blur, and Transforms.*

- [x] **Task 9.1:** [SPRINT 9] Extended Property Types & Tailwind Forward-Map/Classifier
  - *Files:* `src/types/index.ts`, `src/lib/tailwind/classify.ts`, `src/lib/tailwind/forward-map.ts`, `src/lib/dom/live-style-engine.ts`, `src/lib/dom/computed-style.ts`
  - *Status:* 🟢 Done
- [x] **Task 9.2:** [SPRINT 9] Min/Max Width & Height UI with Presets (`LayoutGroup.tsx`)
  - *Files:* `src/components/editor/property-panel/LayoutGroup.tsx`
  - *Status:* 🟢 Done
- [x] **Task 9.3:** [SPRINT 9] Framer-Style Position & Pinning Inspector (`PositionGroup.tsx`)
  - *Files:* `src/components/editor/property-panel/PositionGroup.tsx`, `src/components/editor/PropertyPanel.tsx`
  - *Status:* 🟢 Done
- [x] **Task 9.4:** [SPRINT 9] Glassmorphism Backdrop Blur, Cursor & Transform Controls (`EffectsGroup.tsx`)
  - *Files:* `src/components/editor/property-panel/EffectsGroup.tsx`
  - *Status:* 🟢 Done
- [x] **Task 9.5:** [SPRINT 9] Unit Tests & Static Build Verification
  - *Files:* `test/tailwind/forward-map.test.ts`, `test/tailwind/classify.test.ts` (204/204 passing)
  - *Status:* 🟢 Done

---

## 🎨 Sprint 10: Framer UI Overhaul, Layer Dragging, Basic Blocks & 4-Sided Box Controls

*Objective: Transform the entire editor into Framer's official design system, implement drag-and-drop layer reordering, basic building blocks (Container, Textarea, Inputs, Buttons, Grids), and 4-sided Visual Box Model controls for Padding, Margin, and Border Radius.*

- [x] **Task 10.1:** [SPRINT 10] Framer Design System Tokens & Global Shell Transformation
  - *Files:* `src/styles/global.css`, `src/components/editor/EditorStudio.tsx`, `src/components/editor/Toolbar.tsx`, `src/components/editor/Breadcrumbs.tsx`, `src/components/editor/PropertyPanel.tsx`
  - *Status:* 🟢 Done
- [x] **Task 10.2:** [SPRINT 10] Basic HTML Components & Primitives Palette (`BasicComponents.tsx`)
  - *Files:* `src/components/editor/BasicComponents.tsx`, `src/components/editor/ComponentBlocks.tsx`, `src/components/editor/EditorStudio.tsx`
  - *Status:* 🟢 Done
- [x] **Task 10.3:** [SPRINT 10] Drag & Drop Layer Reordering Engine (`LayersTree.tsx`, `apply-edits.ts`)
  - *Files:* `src/components/editor/LayersTree.tsx`, `src/lib/ast/apply-edits.ts`, `src/types/index.ts`, `src/components/editor/EditorStudio.tsx`
  - *Status:* 🟢 Done
- [x] **Task 10.4:** [SPRINT 10] 4-Sided Visual Box Model for Padding, Margin & Border Radius
  - *Files:* `src/components/editor/property-panel/LayoutGroup.tsx`, `src/components/editor/property-panel/BorderGroup.tsx`
  - *Status:* 🟢 Done
- [x] **Task 10.5:** [SPRINT 10] End-to-End Test Suite & Static Production Build Verification
  - *Files:* `test/ast/apply-edits.test.ts` (25 test suites, 205/205 tests passing), `npm run build`
  - *Status:* 🟢 Done

