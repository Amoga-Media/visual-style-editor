# Story, Showcase & Contact Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the confusing showcase and under-the-hood sections on the homepage, transform the "Our Story" page into an inspiring, high-conviction developer liberation manifesto, and create a production-grade `/contact` page with inquiry/bug/feature support.

**Architecture:** 
- Restructure `PossibilitiesShowcase.tsx` from "What you can build" into "What you can style & fix in seconds" with AI coding, client review, and offline developer scenarios.
- Restructure `AsymmetricBentoGrid.tsx` and the homepage "Under the Hood" section to highlight code protection and safety rather than academic compiler theory.
- Rewrite `our-story.astro` and `StoryManifestoInteractive.tsx` with high-conviction, inspiring prose celebrating developer sovereignty and the free open-source gift to the community.
- Create `src/pages/contact.astro` with an interactive multi-category form (bug reports, feature requests, partnerships, inquiries) and schema graph.
- Update `Navbar.astro` and `Footer.astro` to wire `/contact`.

**Tech Stack:** Astro 5.x SSG, React 19, Tailwind CSS, TypeScript, Vitest.

---

### Task 1: Revamp `PossibilitiesShowcase.tsx` (Screenshot 1)
**Files:**
- Modify: `src/components/marketing/PossibilitiesShowcase.tsx`

- [ ] **Step 1: Update Header and USE_CASES data**
  - Section title: "What you can style & fix in seconds"
  - Subtitle: "From fixing AI-generated layouts to live client polish sessions — see how Visual Style Editor saves hours of frustration."
  - 4 tabs:
    1. `Fix AI Code (Claude / Cursor)`
    2. `Tailwind v3 & v4 Colors`
    3. `Live Client Reviews`
    4. `Offline & Air-Gapped`

---

### Task 2: Revamp Homepage "Under the Hood" Section & `AsymmetricBentoGrid.tsx` (Screenshot 2)
**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/marketing/AsymmetricBentoGrid.tsx`

- [ ] **Step 1: Simplify section header on index.astro**
  - Title: "Engineered to Never Break Your Code"
  - Subtitle: "Traditional visual editors destroy comments and mangle indentation. Here is how Visual Style Editor keeps your code 100% pristine."
  - Retain `data-aeo-answer` and keywords for tests.

- [ ] **Step 2: Simplify copy in AsymmetricBentoGrid.tsx**
  - Emphasize safety, clean diffs, and smart colors.

---

### Task 3: Elevate "Our Story" into an Inspiring Developer Manifesto
**Files:**
- Modify: `src/pages/our-story.astro`
- Modify: `src/components/marketing/StoryManifestoInteractive.tsx`

- [ ] **Step 1: Rewrite our-story.astro hero & narrative**
  - Emphasize developer sovereignty, breaking free from SaaS rent-seeking, and providing a free open-source superpower to the web community.
- [ ] **Step 2: Update StoryManifestoInteractive.tsx**
  - High-conviction milestones and takeaways.

---

### Task 4: Create Dedicated Contact Us Page (`src/pages/contact.astro`)
**Files:**
- Create: `src/pages/contact.astro`
- Modify: `src/components/marketing/Navbar.astro`
- Modify: `src/components/marketing/Footer.astro`
- Create: `test/contact/contact-page.test.ts`

- [ ] **Step 1: Write test for Contact page**
- [ ] **Step 2: Create src/pages/contact.astro**
  - Multi-category inquiry form (Bug Report, Feature Request, Inquiry, Feedback)
  - Direct contact options (Email, GitHub Issues, Discussions)
  - ContactPage Schema.org JSON-LD
- [ ] **Step 3: Update Navbar and Footer links**

---

### Task 5: Full Test Suite & Static Build Gates
- [ ] **Step 1: Run vitest test suite (`npm test`)**
- [ ] **Step 2: Run production build (`npm run build`)**
- [ ] **Step 3: Verify output static files in `dist/`**
