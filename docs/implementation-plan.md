# Master Implementation Plan — Visual HTML & Tailwind Editor (Astro Web App)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Maintain and update [`docs/task-board.md`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/docs/task-board.md) after every step.

**Goal:** Transform the project into a modern, 100% in-browser, zero-server-cost **Astro 5 + React 19 + Tailwind v4** web application for visually editing HTML and Tailwind CSS files with instant preview, direct text editing, and native disk persistence.

**Architecture:** Astro 5 static site shell for SEO and landing pages + isolated interactive React Island (`client:only="react"`) housing the in-browser `parse5` AST engine, sandboxed iframe canvas, visual property panels, and File System Access API.

**Tech Stack:** Astro 5.x, React 19, Tailwind CSS v4, `parse5`, `culori`, `zustand`, `lucide-react`, `framer-motion`, `@jdevalk/astro-seo-graph`, `vitest`.

**Specifications:** 
- [Product Requirements Document (PRD)](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/docs/PRD-visual-html-editor.md)
- [Technical Requirements Document (TRD)](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/docs/TRD-visual-html-editor.md)
- [Task Board Tracker](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/docs/task-board.md)

---

## User Review Required

> [!IMPORTANT]
> **Directory Cleanup & Monorepo Unification:**  
> The previous architecture utilized a split Node.js Hono backend (`server/`), a Vite client (`client/`), and a `shared/` package. Because the AST engine now runs 100% client-side in the browser, the obsolete `server/` directory and multi-package workspaces will be cleaned up and unified into a single, clean Astro 5 repository. All working AST parsing, Tailwind classifiers, and UI panels are safely preserved and migrated.

> [!TIP]
> **Zero Hosting Cost Guarantee:**  
> This architecture requires **$0/month in hosting costs**. Because all computation occurs locally in the user's browser, the application builds into pure static assets (`dist/`) that can be hosted indefinitely for free on Cloudflare Pages, Vercel, or Netlify.

---

## Proposed Changes & Phased Execution

### Phase 1: Directory Cleanup & Astro 5 Scaffolding

Unify the workspace, clean obsolete server-side folders, and install Astro 5 with React and Tailwind v4 integrations.

- [DELETE] `server/` (Obsolete Node HTTP backend)
- [NEW] [`astro.config.mjs`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/astro.config.mjs)
- [NEW] [`tsconfig.json`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/tsconfig.json)
- [MODIFY] [`package.json`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/package.json)
- [NEW] [`src/layouts/BaseLayout.astro`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/layouts/BaseLayout.astro)
- [NEW] [`src/styles/global.css`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/styles/global.css)
- [NEW] [`src/types/index.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/types/index.ts)

---

### Phase 2: 100% In-Browser AST Engine & Splicer

Port `parse5` AST traversal, structural path resolution, surgical character splicing, and Tailwind v3/v4 token extraction to pure client-side modules.

- [NEW] [`src/lib/ast/build-location-map.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/ast/build-location-map.ts)
- [NEW] [`src/lib/ast/resolve-path.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/ast/resolve-path.ts)
- [NEW] [`src/lib/ast/splice.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/ast/splice.ts)
- [NEW] [`src/lib/ast/style-attr.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/ast/style-attr.ts)
- [NEW] [`src/lib/ast/apply-edits.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/ast/apply-edits.ts)
- [NEW] [`src/lib/tailwind/detect-mode.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/tailwind/detect-mode.ts)
- [NEW] [`src/lib/tailwind/theme-v3.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/tailwind/theme-v3.ts)
- [NEW] [`src/lib/tailwind/theme-v4.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/tailwind/theme-v4.ts)
- [NEW] [`src/lib/tailwind/forward-map.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/tailwind/forward-map.ts)
- [NEW] [`src/lib/tailwind/classify.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/tailwind/classify.ts)
- [NEW] [`test/ast.test.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/test/ast.test.ts)

---

### Phase 3: Interactive React Editor Island

Mount the full visual studio inside an Astro React island with the sandboxed iframe canvas, hover/selection overlays, and visual property controls.

- [NEW] [`src/components/editor/EditorStudio.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/EditorStudio.tsx)
- [NEW] [`src/components/editor/DropZone.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/DropZone.tsx)
- [NEW] [`src/components/editor/PreviewFrame.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/PreviewFrame.tsx)
- [NEW] [`src/components/editor/SelectionOverlay.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/SelectionOverlay.tsx)
- [NEW] [`src/components/editor/Toolbar.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/Toolbar.tsx)
- [NEW] [`src/components/editor/PropertyPanel.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/PropertyPanel.tsx)
- [NEW] [`src/components/editor/property-panel/TypographyGroup.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/property-panel/TypographyGroup.tsx)
- [NEW] [`src/components/editor/property-panel/LayoutGroup.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/property-panel/LayoutGroup.tsx)
- [NEW] [`src/components/editor/property-panel/BorderGroup.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/property-panel/BorderGroup.tsx)
- [NEW] [`src/components/editor/property-panel/ColorGroup.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/property-panel/ColorGroup.tsx)

---

### Phase 4: Direct Text & Media Editing Engine

Empower non-developers to edit text copy on double-click and replace images with live preview.

- [NEW] [`src/components/editor/InlineTextEditor.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/InlineTextEditor.tsx)
- [NEW] [`src/components/editor/property-panel/ImageGroup.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/property-panel/ImageGroup.tsx)
- [NEW] [`src/lib/ast/text-splice.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/ast/text-splice.ts)

---

### Phase 5: Viewport Controls, Review Modal & File System Access API

Add device switching (Desktop/Tablet/Mobile), visual diff review modal, session version history, and native file saving.

- [NEW] [`src/components/editor/ViewportToolbar.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/ViewportToolbar.tsx)
- [NEW] [`src/components/editor/ReviewModal.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/ReviewModal.tsx)
- [NEW] [`src/components/editor/VersionHistory.tsx`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/editor/VersionHistory.tsx)
- [NEW] [`src/lib/fs/file-system-access.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/fs/file-system-access.ts)
- [NEW] [`src/lib/fs/download.ts`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/lib/fs/download.ts)

---

### Phase 6: SEO Marketing Pages, Template Library & Production Build

Build high-ranking Astro landing pages, JSON-LD structured schemas, free starter templates, and test the production build.

- [NEW] [`src/pages/index.astro`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/pages/index.astro)
- [NEW] [`src/pages/app.astro`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/pages/app.astro)
- [NEW] [`src/components/astro/Hero.astro`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/astro/Hero.astro)
- [NEW] [`src/components/astro/Features.astro`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/astro/Features.astro)
- [NEW] [`src/components/astro/SeoHead.astro`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/components/astro/SeoHead.astro)
- [NEW] [`src/pages/templates/index.astro`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/src/pages/templates/index.astro)
- [NEW] [`public/robots.txt`](file:///c:/Users/Zahid/Desktop/Apps/Design%20Editor/03%20Program/visual-style-editor/public/robots.txt)

---

## Verification Plan

### Automated Tests
* Run unit test suite: `npm test` (verifies `parse5` in-browser AST parsing, character splicing, style merging, and Tailwind classification).
* Run type check: `npx astro check`.
* Run production static build: `npm run build` (confirms 100% static output generation into `dist/`).

### Manual Verification
1. **File Ingestion:** Drag and drop an HTML file (or click "Choose File") and confirm instant preview in the iframe canvas.
2. **Visual Style Editing:** Select an element, adjust sliders/colors in the Typography, Layout, Border, and Color panels, and confirm instant 60fps canvas updates.
3. **Double-Click Text Editing:** Double-click a heading, change the copy, click away, and verify text is preserved.
4. **Responsive Viewport:** Switch between Desktop (1440px), Tablet (768px), and Mobile (375px) modes.
5. **Review & Save:** Open the Review Diff Modal, inspect changes, click Save, and verify direct disk persistence via File System Access API.
