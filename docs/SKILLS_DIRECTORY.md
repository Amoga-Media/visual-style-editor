# Agent Skills Directory & Capability Catalog

> **Purpose**: This directory serves as the master index for all available agent skills in this workspace (`.agents/skills/`). Whenever the agent needs to accomplish a specific task, it should consult this file to determine the best skill, its exact trigger conditions, and its location.

---

## Quick Navigation

1. [Frontend Design, UI Aesthetics & Craft (Anti-Slop)](#1-frontend-design-ui-aesthetics--craft)
2. [Tailwind CSS & Styling Architecture](#2-tailwind-css--styling-architecture)
3. [Motion, Animation & Micro-Interactions](#3-motion-animation--micro-interactions)
4. [Astro Web Framework](#4-astro-web-framework)
5. [Engineering Architecture, Planning & Execution](#5-engineering-architecture-planning--execution)
6. [Code Review, Quality Auditing & Pragmatism](#6-code-review-quality-auditing--pragmatism)
7. [Memory, Knowledge & Web Scraping](#7-memory-knowledge--web-scraping)
8. [AI Image Generation, Editing & Outpainting](#8-ai-image-generation-editing--outpainting)
9. [Icons, App Store Optimization & Toast Notifications](#9-icons-app-store-optimization--toast-notifications)

---

## 1. Frontend Design, UI Aesthetics & Craft

Use these skills whenever building, shaping, reviewing, or redesigning web interfaces to ensure an intentional, agency-grade look and eliminate generic "AI slop" (purple gradient blobs, copy-paste bento grids, and corporate filler text).

| Skill | Path | Best Used When... |
| :--- | :--- | :--- |
| **`frontend-design`** | [`.agents/skills/frontend-design/SKILL.md`](file:///.agents/skills/frontend-design/SKILL.md) | Creating distinctive, intentional visual design for new pages or components; avoiding templated defaults and picking bespoke aesthetic directions. |
| **`design-taste-frontend`** | [`.agents/skills/design-taste-frontend/SKILL.md`](file:///.agents/skills/design-taste-frontend/SKILL.md) | Building artisanal landing pages, portfolios, or app redesigns; enforces strict anti-slop rules, typographic hierarchy, and intentional design systems. |
| **`high-end-visual-design`** | [`.agents/skills/high-end-visual-design/SKILL.md`](file:///.agents/skills/high-end-visual-design/SKILL.md) | Designing like a luxury digital agency (Linear, Raycast, Vercel, Apple); defines card geometry, subtle borders, shadows, and spacing that feel premium. |
| **`impeccable`** | [`.agents/skills/impeccable/SKILL.md`](file:///.agents/skills/impeccable/SKILL.md) | Comprehensive UI/UX refinement, design audits, tokenization, spacing system audits, dark/light contrast validation, and micro-interaction polish. |
| **`redesign-existing-projects`** | [`.agents/skills/redesign-existing-projects/SKILL.md`](file:///.agents/skills/redesign-existing-projects/SKILL.md) | Modernizing an existing codebase or interface without breaking core functionality, state machines, or back-end connections. |
| **`design-principles-and-laws`** | [`.agents/skills/design-principles-and-laws/SKILL.md`](file:///.agents/skills/design-principles-and-laws/SKILL.md) | Applying formal UX laws and cognitive psychology: Hick's Law, Fitts's Law, Miller's Law, Gestalt grouping, concentric curvature, and the 60-30-10 color rule. |
| **`web-design-guidelines`** | [`.agents/skills/web-design-guidelines/SKILL.md`](file:///.agents/skills/web-design-guidelines/SKILL.md) | Checking compliance with Web Interface Guidelines, accessibility standards (WCAG), keyboard navigation, and responsive typography scales. |
| **`web-design-reviewer`** | [`.agents/skills/web-design-reviewer/SKILL.md`](file:///.agents/skills/web-design-reviewer/SKILL.md) | Visually reviewing local or deployed sites, finding layout breakages, margin inconsistencies, and fixing them at the source code level. |
| **`reui`** | [`.agents/skills/reui/SKILL.md`](file:///.agents/skills/reui/SKILL.md) | Discovering, installing, and assembling ReUI registry components (data-grids, kanbans, filter panels, motion icons). |

---

## 2. Tailwind CSS & Styling Architecture

Use these skills when writing, debugging, or upgrading Tailwind CSS code, especially around Tailwind CSS v4's new engine and CSS variable architecture.

| Skill | Path | Best Used When... |
| :--- | :--- | :--- |
| **`tailwind-4-docs`** | [`.agents/skills/tailwind-4-docs/SKILL.md`](file:///.agents/skills/tailwind-4-docs/SKILL.md) | Querying official Tailwind CSS v4 syntax, the `@theme` inline directive, `@utility` blocks, and migrating projects from v3 to v4. |
| **`tailwind-v4-shadcn`** | [`.agents/skills/tailwind-v4-shadcn/SKILL.md`](file:///.agents/skills/tailwind-v4-shadcn/SKILL.md) | Configuring Tailwind CSS v4 with React, Vite, CSS variables, and shadcn/ui components without style collisions or token leakage. |
| **`tailwindcss-responsive-darkmode`** | [`.agents/skills/tailwindcss-responsive-darkmode/SKILL.md`](file:///.agents/skills/tailwindcss-responsive-darkmode/SKILL.md) | Implementing dual-theme dark mode in Tailwind v4 (`@custom-variant dark`), preventing Flash of Unstyled Content (FOUC), and synchronizing `localStorage`. |
| **`tailwindcss-mobile-first`** | [`.agents/skills/tailwindcss-mobile-first/SKILL.md`](file:///.agents/skills/tailwindcss-mobile-first/SKILL.md) | Building fluid mobile-first layouts, responsive breakpoint ordering, container queries (`@container`), and notch / safe-area handling. |

---

## 3. Motion, Animation & Micro-Interactions

Use these skills for choreographing animations, smooth scrolling, physics-based UI motion, and 60fps performance profiling.

| Skill | Path | Best Used When... |
| :--- | :--- | :--- |
| **`awwwards-animations`** | [`.agents/skills/awwwards-animations/SKILL.md`](file:///.agents/skills/awwwards-animations/SKILL.md) | Creating award-winning interactions using GSAP, Framer Motion, Lenis, or Three.js; custom cursors, magnetic buttons, and page transitions. |
| **`motion-designer`** | [`.agents/skills/motion-designer/SKILL.md`](file:///.agents/skills/motion-designer/SKILL.md) | Designing comprehensive motion systems, animation curves, easings, duration hierarchies, and motion specifications for design teams. |
| **`gsap-core`** | [`.agents/skills/gsap-core/SKILL.md`](file:///.agents/skills/gsap-core/SKILL.md) | Implementing core GSAP tweens (`gsap.to`, `fromTo`), timelines, easing functions, and responsive animations (`gsap.matchMedia`). |
| **`gsap-timeline`** | [`.agents/skills/gsap-timeline/SKILL.md`](file:///.agents/skills/gsap-timeline/SKILL.md) | Sequencing complex multi-step animation timelines, positioning parameters, keyframe choreography, and playback controls. |
| **`gsap-scrolltrigger`** | [`.agents/skills/gsap-scrolltrigger/SKILL.md`](file:///.agents/skills/gsap-scrolltrigger/SKILL.md) | Building scroll-linked animations, pinned sections, scrubbed timelines, and trigger callbacks with GSAP ScrollTrigger. |
| **`gsap-framer-scroll-animation`** | [`.agents/skills/gsap-framer-scroll-animation/SKILL.md`](file:///.agents/skills/gsap-framer-scroll-animation/SKILL.md) | Implementing Apple-style scroll experiences, parallax cards, horizontal scroll panels, and Framer Motion `useScroll` transforms. |
| **`cinematic-gsap-lenis-motion-system`** | [`.agents/skills/cinematic-gsap-lenis-motion-system/SKILL.md`](file:///.agents/skills/cinematic-gsap-lenis-motion-system/SKILL.md) | High-end cinematic editorial websites combining Lenis smooth scrolling, staggered typography reveals, and mouse-reactive 3D depth. |
| **`cinematic-scroll-storytelling`** | [`.agents/skills/cinematic-scroll-storytelling/SKILL.md`](file:///.agents/skills/cinematic-scroll-storytelling/SKILL.md) | Building sticky card stacks, scroll-scrubbed narrative transitions, fullscreen preloaders, and scroll progress indicators. |
| **`scroll-animations`** | [`.agents/skills/scroll-animations/SKILL.md`](file:///.agents/skills/scroll-animations/SKILL.md) | Triggering clean entrance animations on scroll (fade-ups, slide-ins, sticky headers, and reading progress bars). |
| **`gsap-performance`** | [`.agents/skills/gsap-performance/SKILL.md`](file:///.agents/skills/gsap-performance/SKILL.md) | Eliminating animation jank, avoiding layout thrashing, enforcing transform-only tweens, and ensuring steady 60fps rendering. |
| **`optimize-web-animations`** | [`.agents/skills/optimize-web-animations/SKILL.md`](file:///.agents/skills/optimize-web-animations/SKILL.md) | Profiling memory leaks, pausing offscreen animations via `IntersectionObserver`, reducing CPU/GPU overhead during long browser sessions. |
| **`svg-animations`** | [`.agents/skills/svg-animations/SKILL.md`](file:///.agents/skills/svg-animations/SKILL.md) | Creating SVG graphics, line-drawing path animations, morphing vectors, animated loaders, and icons. |
| **`chart-animation`** | [`.agents/skills/chart-animation/SKILL.md`](file:///.agents/skills/chart-animation/SKILL.md) | Animated data visualizations, bar chart races, rolling number tickers, and interpolated value graphs. |
| **`hyperframes-animation`** | [`.agents/skills/hyperframes-animation/SKILL.md`](file:///.agents/skills/hyperframes-animation/SKILL.md) | Deterministic, seek-safe animation blueprints across 7 runtime adapters (GSAP, Lottie, Three.js, Anime.js, CSS Keyframes). |
| **`improve-animations`** | [`.agents/skills/improve-animations/SKILL.md`](file:///.agents/skills/improve-animations/SKILL.md) | Surveying an entire codebase's motion code and producing a prioritized motion audit and upgrade roadmap. |
| **`review-animations`** | [`.agents/skills/review-animations/SKILL.md`](file:///.agents/skills/review-animations/SKILL.md) | Reviewing animation pull requests for spring physics, accessibility (reduced-motion checks), and battery efficiency. |
| **`mobile-touch`** | [`.agents/skills/mobile-touch/SKILL.md`](file:///.agents/skills/mobile-touch/SKILL.md) | Designing touch interactions, swipe gestures, haptic feedback patterns, and native mobile interaction models. |
| **`motion-design`** | [`.agents/skills/motion-design/SKILL.md`](file:///.agents/skills/motion-design/SKILL.md) | Applying LottieFiles' UI motion principles, timing curves, Disney animation laws, and choreography across CSS, GSAP, Framer Motion, and Lottie. |
| **`design-motion-principles`** | [`.agents/skills/design-motion-principles/SKILL.md`](file:///.agents/skills/design-motion-principles/SKILL.md) | Expert UI interaction craft based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins; features Create mode and Motion Audit mode (with HTML reports). |
| **`framer-motion-animator`** | [`.agents/skills/framer-motion-animator/SKILL.md`](file:///.agents/skills/framer-motion-animator/SKILL.md) | Declarative Framer Motion animations: page transitions, gesture handling, scroll-linked transforms, variants, and choreographed sequences. |
| **`motion-patterns`** | [`.agents/skills/motion-patterns/SKILL.md`](file:///.agents/skills/motion-patterns/SKILL.md) | Production-ready React/Next.js animation recipes: buttons, cards, modals, toast, list staggers, `AnimatePresence` exits, and shared layout transitions. |

---

## 4. Astro Web Framework

Use these skills for Astro projects, static site generation, content collections, and server-side rendering architecture.

| Skill | Path | Best Used When... |
| :--- | :--- | :--- |
| **`astro`** | [`.agents/skills/astro/SKILL.md`](file:///.agents/skills/astro/SKILL.md) | Building Astro components (`.astro`), configuring SSR adapters, setting up Islands architecture (`client:*`), and routing. |
| **`astro-best-practices`** | [`.agents/skills/astro-best-practices/SKILL.md`](file:///.agents/skills/astro-best-practices/SKILL.md) | Enforcing accessibility, performance, and maintainable defaults across Astro pages and components. |
| **`astro-seo`** | [`.agents/skills/astro-seo/SKILL.md`](file:///.agents/skills/astro-seo/SKILL.md) | Auditing and generating automated SEO metadata, JSON-LD schemas, Open Graph tags, sitemaps, and IndexNow integrations. |

---

## 5. Engineering Architecture, Planning & Execution

Use these skills when organizing multi-step tasks, debugging bugs, orchestrating subagents, or creating new agent tools.

| Skill | Path | Best Used When... |
| :--- | :--- | :--- |
| **`writing-plans`** | [`.agents/skills/writing-plans/SKILL.md`](file:///.agents/skills/writing-plans/SKILL.md) | Formulating a rigorous, phased implementation plan with acceptance criteria before writing code. |
| **`executing-plans`** | [`.agents/skills/executing-plans/SKILL.md`](file:///.agents/skills/executing-plans/SKILL.md) | Executing an existing written implementation plan systematically with step-by-step verification gates. |
| **`subagent-driven-development`** | [`.agents/skills/subagent-driven-development/SKILL.md`](file:///.agents/skills/subagent-driven-development/SKILL.md) | Dispatching and coordinating independent subagent tasks to implement features in parallel. |
| **`systematic-debugging`** | [`.agents/skills/systematic-debugging/SKILL.md`](file:///.agents/skills/systematic-debugging/SKILL.md) | Diagnosing complex bugs, test failures, or runtime anomalies; investigating root causes before applying fixes. |
| **`debugging-and-error-recovery`** | [`.agents/skills/debugging-and-error-recovery/SKILL.md`](file:///.agents/skills/debugging-and-error-recovery/SKILL.md) | Structured triage and root-cause recovery when tests fail, builds break, or runtime behavior anomalies occur. |
| **`safe-debug`** | [`.agents/skills/safe-debug/SKILL.md`](file:///.agents/skills/safe-debug/SKILL.md) | Rigorous diagnosis and root-cause narrowing before applying patches, with human approval gates. |
| **`webapp-testing`** | [`.agents/skills/webapp-testing/SKILL.md`](file:///.agents/skills/webapp-testing/SKILL.md) | Interacting with and testing web applications using Playwright; verifying frontend functionality, UI behavior, and capturing screenshots. |
| **`verification-before-completion`** | [`.agents/skills/verification-before-completion/SKILL.md`](file:///.agents/skills/verification-before-completion/SKILL.md) | Running validation commands (typechecks, builds, test suites) to obtain concrete proof before claiming a task is done. |
| **`using-superpowers`** | [`.agents/skills/using-superpowers/SKILL.md`](file:///.agents/skills/using-superpowers/SKILL.md) | Agent orientation protocol for discovering and invoking specialized skills before responding to user prompts. |
| **`skill-development`** | [`.agents/skills/skill-development/SKILL.md`](file:///.agents/skills/skill-development/SKILL.md) | Authoring, structuring, and packaging new skills with proper YAML frontmatter and progressive disclosure documentation. |

---

## 6. Code Review, Quality Auditing & Pragmatism

Use these skills when evaluating pull requests, auditing codebases, eliminating bloat, or finding security flaws.

| Skill | Path | Best Used When... |
| :--- | :--- | :--- |
| **`code-review`** | [`.agents/skills/code-review/SKILL.md`](file:///.agents/skills/code-review/SKILL.md) | Reviewing code changes along two independent axes: Standards (project conventions) and Spec (did it satisfy the prompt?). |
| **`ponytail`** | [`.agents/skills/ponytail/SKILL.md`](file:///.agents/skills/ponytail/SKILL.md) | Senior dev pragmatism: delivers the smallest, cleanest, lowest-overhead solution that completely solves the problem. Anti-overengineering. |
| **`ponytail-audit`** | [`.agents/skills/ponytail-audit/SKILL.md`](file:///.agents/skills/ponytail-audit/SKILL.md) | Full-repository code quality audit: ranks bugs, security risks, slow code paths, dead abstractions, and items that should be deleted. |
| **`ponytail-review`** | [`.agents/skills/ponytail-review/SKILL.md`](file:///.agents/skills/ponytail-review/SKILL.md) | Surgical review of recent changes: verifies logic correctness, safety under real load, test coverage, and code simplicity. |
| **`ponytail-help`** | [`.agents/skills/ponytail-help/SKILL.md`](file:///.agents/skills/ponytail-help/SKILL.md) | Reference manual for Ponytail operational levels (`lite`, `full`, `ultra`) and command syntax. |
| **`ci-cd-security`** | [`.agents/skills/ci-cd-security/SKILL.md`](file:///.agents/skills/ci-cd-security/SKILL.md) | Auditing `.github/workflows/` YAML files for security flaws (pwn requests, unpinned actions, template injection, credential leakage). |

---

## 7. Memory, Knowledge & Web Scraping

Use these skills for long-term agent memory retention, knowledge base synthesis, and website reverse-engineering.

| Skill | Path | Best Used When... |
| :--- | :--- | :--- |
| **`deep-agents-memory`** | [`.agents/skills/deep-agents-memory/SKILL.md`](file:///.agents/skills/deep-agents-memory/SKILL.md) | Configuring agent memory backends (ephemeral StateBackend vs persistent StoreBackend and FilesystemMiddleware). |
| **`memory-merger`** | [`.agents/skills/memory-merger/SKILL.md`](file:///.agents/skills/memory-merger/SKILL.md) | Merging mature lessons from domain memory files into permanent instruction rulebooks. |
| **`karpathy-llm-wiki`** | [`.agents/skills/karpathy-llm-wiki/SKILL.md`](file:///.agents/skills/karpathy-llm-wiki/SKILL.md) | Maintaining a personal LLM-curated knowledge vault (ingesting, organizing, querying notes). |
| **`clone-website`** | [`.agents/skills/clone-website/SKILL.md`](file:///.agents/skills/clone-website/SKILL.md) | Reverse-engineering and cloning external web pages section-by-section with asset extraction. |
| **`firecrawl-website-design-clone`** | [`.agents/skills/firecrawl-website-design-clone/SKILL.md`](file:///.agents/skills/firecrawl-website-design-clone/SKILL.md) | Scraping any live website via Firecrawl to extract its design system tokens, typography, and palette into an agent-ready `DESIGN.md`. |

---

## 8. AI Image Generation, Editing & Outpainting

Use these skills for generating marketing visual assets, web & mobile UI concepts, localized inpainting, expanding image canvas (uncrop/outpaint), and routing image generation across top AI models (FLUX 2, Nano Banana, GPT Image 2, Seedream, Dreamina, Qwen) via RunComfy CLI.

| Skill | Path | Best Used When... |
| :--- | :--- | :--- |
| **`imagegen-frontend-web`** | [`.agents/skills/imagegen-frontend-web/SKILL.md`](file:///.agents/skills/imagegen-frontend-web/SKILL.md) | Generating elite, conversion-aware website design references and comps; strictly enforces 1 image per section, composition variety, and cohesive brand art direction. |
| **`imagegen-frontend-mobile`** | [`.agents/skills/imagegen-frontend-mobile/SKILL.md`](file:///.agents/skills/imagegen-frontend-mobile/SKILL.md) | Generating premium, app-native mobile UI screen concepts and multi-screen flows (iOS/Android) within realistic phone mockup frames with high-contrast typography. |
| **`ai-image-generation`** | [`.agents/skills/ai-image-generation/SKILL.md`](file:///.agents/skills/ai-image-generation/SKILL.md) | Smart-routing text-to-image and image-to-image requests across 11+ models (FLUX 2, Nano Banana 2/Pro, GPT Image 2, Seedream, Dreamina, Qwen, Wan) via the RunComfy CLI. |
| **`image-edit`** | [`.agents/skills/image-edit/SKILL.md`](file:///.agents/skills/image-edit/SKILL.md) | Intent-routed image editing; routes to Nano Banana (batch identity preservation), GPT Image 2 Edit (multilingual text rewrites), or FLUX Kontext Pro (single-ref precise edits). |
| **`image-inpainting`** | [`.agents/skills/image-inpainting/SKILL.md`](file:///.agents/skills/image-inpainting/SKILL.md) | Mask-driven and prose-described regional edits via RunComfy; removing unwanted objects, watermarks, blemishes, or replacing isolated image regions. |
| **`image-outpainting`** | [`.agents/skills/image-outpainting/SKILL.md`](file:///.agents/skills/image-outpainting/SKILL.md) | Expanding canvas borders beyond the original image frame (uncropping, expanding 1:1 to 16:9 widescreen or portrait to landscape) while preserving existing content. |

---

## 9. Icons, App Store Optimization & Toast Notifications

Use these skills when discovering vector icons across 200+ icon sets, packaging Xcode asset catalogs, optimizing app store icon conversion rates, or wiring up polished toast notifications.

| Skill | Path | Best Used When... |
| :--- | :--- | :--- |
| **`better-icons`** | [`.agents/skills/better-icons/SKILL.md`](file:///.agents/skills/better-icons/SKILL.md) | Searching across 200+ icon libraries (Iconify with 275k+ icons) and retrieving clean SVG icons via CLI (`better-icons search`, `better-icons get`) or agent MCP. |
| **`ios-icon-gen`** | [`.agents/skills/ios-icon-gen/SKILL.md`](file:///.agents/skills/ios-icon-gen/SKILL.md) | Generating production-ready iOS/macOS PNG imagesets (1x, 2x, 3x) for Xcode asset catalogs from Apple SF Symbols or Iconify open-source collections. |
| **`app-icon-optimization`** | [`.agents/skills/app-icon-optimization/SKILL.md`](file:///.agents/skills/app-icon-optimization/SKILL.md) | Auditing, designing, and A/B testing mobile app icons to maximize tap-through rate (TTR) and App Store search/browse conversion (small size legibility & contrast). |
| **`ask-sonner`** | [`.agents/skills/ask-sonner/SKILL.md`](file:///.agents/skills/ask-sonner/SKILL.md) | Authoritative reference for Emil Kowalski's Sonner React toast library; setup, single `<Toaster />` mounting, promise toasts, theme sync, and z-index fixes. |

---

## How Agents Should Use This File

1. **Before Starting a Task**: Scan the [Quick Navigation](#quick-navigation) categories to identify skills relevant to the user request.
2. **Read the Full Skill**: When a skill matches, view the corresponding `SKILL.md` file using `view_file` to review its specific rules, best practices, and recipes.
3. **Chain Complementary Skills**: Many tasks benefit from pairing (e.g., combining `frontend-design` for visual taste with `tailwindcss-responsive-darkmode` for theme architecture, followed by `verification-before-completion` before submitting changes).
