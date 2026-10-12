# Visual Style Editor: Full-Website Redesign & Motion Revamp Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire Visual Style Editor marketing and application website into an Awwwards-caliber, agency-grade digital experience using ShadcnSpace and ReUI MCP blocks, GSAP + ScrollTrigger animations, interactive pixel canvas physics, and a dark luxury visual architecture across all 10 pages.

**Architecture:** 
- **Design System & Foundations:** Modern OLED dark aesthetic (`#060608`), subtle cyber-luminescence, concentric "double-bezel" (Doppelrand) card framing, and typography pairing (`Plus Jakarta Sans`, `Geist`, `JetBrains Mono`).
- **Motion & Interactive Layer:** GSAP 3 + ScrollTrigger for scroll-linked reveals, magnetic pills, kinetic counter tickers, and a high-performance 60fps interactive pixel/particle canvas backdrop.
- **Component & Block Architecture:** Reusable marketing components inspired by ReUI and ShadcnSpace patterns (Bento grid, feature spotlights, interactive preview sandbox, pricing comparison, FAQ interactive cascade, testimonial wall, and fluid floating glass navigation).
- **Page Revamp:** Complete overhaul of all 10 pages (`index`, `features`, `how-it-works`, `templates`, `why-we-do-what-we-do`, `our-story`, `support`, `privacy`, `terms`, and `editor`).

**Tech Stack:** Astro 5, React 19, Tailwind CSS v4, GSAP 3 + ScrollTrigger, Lucide Icons, ReUI & ShadcnSpace MCP Registry Blocks.

---

## Global Constraints
- Framework: Preserve existing Astro 5 + React 19 + Tailwind CSS v4 stack.
- Performance: 60fps animations using GPU-accelerated `transform` and `opacity` only; no layout thrashing (`top`, `left`, `width`, `height`).
- Responsive: Fluid mobile-first collapse for all asymmetrical bento grids, sticky sidebars, and full-screen hero sections (`min-h-[100dvh]`).
- Visual Quality: Zero generic AI patterns — no flat gray borders, no basic 3-column equal boxes, no Inter-only typography, no pure black `#000000` without depth.

---

## Task Breakdown

### Phase 1: Core Dependencies & Motion Foundation
- [ ] **Task 1: Install GSAP & Animation Dependencies**
  - Add `gsap` to dependencies.
  - Setup GSAP registration, ScrollTrigger utilities, and reduced-motion guardrails in `src/lib/motion.ts`.
- [ ] **Task 2: Design System & Pixel Canvas Background**
  - Upgrade `src/styles/global.css` with luxury surface tokens, concentric curvature utilities, and glow effects.
  - Create `src/components/effects/PixelCanvas.astro` — an interactive 60fps mouse-reactive pixel/starfield canvas component that responds to cursor velocity without impacting main-thread performance.
- [ ] **Task 3: Redesign Global Layout Shell (`BaseLayout.astro`)**
  - Integrate PixelCanvas background, smooth font imports, dark theme metadata, and GSAP page-load coordinator.

### Phase 2: Shared Navigation & Conversion Elements
- [ ] **Task 4: Fluid Island Navbar (`Navbar.astro`)**
  - Transform top nav into a floating glass capsule (`backdrop-blur-xl`, double-bezel border, dynamic active page pill).
  - Add GSAP hover micro-interactions, template count badge, and animated mobile full-screen slide-over menu with staggered link reveals.
- [ ] **Task 5: Conversion Banner & Rich Footer (`CtaBanner.astro` & `Footer.astro`)**
  - Overhaul `CtaBanner` with illuminated spotlight borders, nested CTA buttons with arrow micro-physics, and live live-code badge.
  - Revamp `Footer` into an editorial bento footer with system status indicator, keyboard shortcut hints, newsletter pulse, and social links.

### Phase 3: High-Converting Landing Page (`index.astro`)
- [ ] **Task 6: Agency Hero with Live Interactive Mini-Editor Preview**
  - Asymmetric hero with dynamic floating badges, ambient radial mesh glow, and an interactive live CSS tweak sandbox.
- [ ] **Task 7: ShadcnSpace Bento Feature Grid & ReUI Cards**
  - Implement a 5-cell asymmetric Bento Grid featuring live AST parsing metrics, Tailwind v3/v4 toggle switch visualizer, and local file access speed benchmark.
- [ ] **Task 8: Interactive Workflow & Social Proof Wall**
  - GSAP ScrollTrigger scrubbing pipeline for the 3-step workflow (Import -> Tweak -> Save Clean Code).
  - Testimonial marquee / masonry wall featuring verified developer quotes and performance stats.

### Phase 4: Core Marketing & Story Pages
- [ ] **Task 9: Features Matrix (`features.astro`)**
  - Deep-dive feature showcase with interactive tabbed panels, live visual style previewers (Color picker, Spacing ruler, Typography scales, Shadow generator).
- [ ] **Task 10: How It Works Interactive Guide (`how-it-works.astro`)**
  - Step-by-step visual animation showing AST manipulation under the hood (AST before vs AST after diffing).
- [ ] **Task 11: Template Showcase Gallery (`templates.astro`)**
  - Filterable template grid with live iframe preview modal, category tabs (Landing, Dashboard, E-commerce, Portfolio), and 1-click "Open in Editor" action.
- [ ] **Task 12: Mission & Origin Story (`why-we-do-what-we-do.astro` & `our-story.astro`)**
  - Editorial luxury typography layout, manifesto cards with subtle noise texture, interactive timeline of the visual editor's creation.

### Phase 5: Support, Legal, and Editor Polish
- [ ] **Task 13: Support & Help Hub (`support.astro`)**
  - Searchable FAQ accordion with instant client-side filtering, keyboard shortcut cheat-sheet, and interactive issue reporting card.
- [ ] **Task 14: Polished Legal Pages (`privacy.astro` & `terms.astro`)**
  - Clean reading layout with sticky sidebar table of contents, reading progress indicator, and clear highlighted summaries.
- [ ] **Task 15: Visual Editor Integration & Verification (`editor.astro`)**
  - Ensure seamless transition from marketing pages into the Studio Editor workspace.
  - Run full build verification and smoke-test across all routes.
