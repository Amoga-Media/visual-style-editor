# Product Requirements Document (PRD) — Visual HTML & Tailwind Editor

> **Document Status:** APPROVED FOR IMPLEMENTATION  
> **Target Release:** v1.0.0 (Web Edition)  
> **Product Category:** Developer Tools / No-Code Visual Web Editor  
> **Business Model:** 100% Free Public Web App (Monetized via Tech Ads, Affiliates & Pro Add-ons)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
Building web interfaces has entered the "AI / Vibe-Coding" era. Millions of non-developers and developers prompt AI agents (Claude, ChatGPT, Cursor, v0, Bolt) to generate HTML and Tailwind CSS pages. However, once initial code is produced:
* **Prompt Fatigue & AI Latency:** Making micro-adjustments (*"make this button 4px more to the right"*, *"change font size to 24px"*, *"darken this purple"*) requires endless rounds of prompting, waiting 20–30 seconds per iteration, and risking AI hallucinations that break layouts.
* **Lack of Free, Modern Visual Tools:** Existing free online HTML editors are 10–15 years old (TinyMCE/CKEditor wrappers) covered in spam ads that corrupt modern CSS and do not understand Tailwind. Modern visual builders (Windframe, Webflow, Framer) are closed, expensive ($20–$50/mo), and lock users into proprietary platforms.

### 1.2 The Solution
**Visual HTML & Tailwind Editor** is a fast, beautiful, 100% free web application where users can drag and drop any HTML file (or choose a pre-built template), visually tweak styles, typography, colors, and copy in real-time, and save clean, surgical code directly back to their disk with **zero vendor lock-in and zero server tracking**.

---

## 2. User Personas

| Persona | Background | Pain Point | Core Need in Product |
| :--- | :--- | :--- | :--- |
| **"Vibe Coder" / Indie Builder** | Builds apps with AI prompts (Cursor/Claude). Non-expert in CSS. | Spends 50% of time prompting AI for trivial CSS tweaks. | Drop AI-generated HTML, visually slide colors/margins, save back in place. |
| **Marketer & Growth Hacker** | Manages landing pages, newsletters, and email templates. | Needs to update headlines, CTA buttons, and images without bugging devs. | Double-click text editing, image swapping, and 1-click export. |
| **UI/UX Designer & Freelancer** | Designs in Figma, exports HTML mockups for clients. | Tweaking client feedback in code is slow. | Visual style panel with exact Tailwind classes and live preview. |
| **Frontend Developer** | Writes React/Tailwind/HTML daily. | Inspecting computed CSS in DevTools doesn't persist classes back to code cleanly. | Clean AST splicing that preserves formatting and comments without code degradation. |

---

## 3. Core Value Propositions

1. **Zero Setup & Instant Entry:** No signups, no logins, no command lines. Open the website, drop an HTML file, and start editing in 1 second.
2. **Surgical AST Code Preservation:** Modifies **only** the touched attributes. Indentation, comments, custom scripts (GSAP, Swiper), and external libraries remain 100% untouched.
3. **Tailwind-First + Fallback CSS:** Automatically detects Tailwind CDN (v3/v4) and maps visual changes to clean utility classes (`text-indigo-600`, `w-[240px]`), falling back gracefully to inline CSS if Tailwind is absent.
4. **100% In-Browser Privacy & $0 Server Cost:** All parsing and editing happens inside the user's browser via WebAssembly/JS. Zero user data is uploaded to remote servers.
5. **Direct Disk Persistence:** In Chromium browsers (Chrome/Edge/Brave), saves directly back to the original file via the native File System Access API.

---

## 4. Functional Requirements (FR)

### FR-1: File Ingestion & Drag-and-Drop
* **FR-1.1:** Full-viewport drop zone accepting `.html` / `.htm` files.
* **FR-1.2:** "Choose File" button utilizing the browser's File System Access API.
* **FR-1.3:** Curated "Sample Templates" gallery (Agency Hero, Pricing Card, SaaS Dashboard, Newsletter) for instant exploration.
* **FR-1.4:** Multi-file drop handling with automatic HTML candidate selection.

### FR-2: Sandboxed Canvas & Selection Engine
* **FR-2.1:** Same-origin isolated `<iframe>` canvas supporting running JS (GSAP, CSS animations).
* **FR-2.2:** Real-time hover bounding box and click-selection overlay.
* **FR-2.3:** Deterministic `structuralPath` calculation (`#id` or `tag:nth-of-type(n)`) for reliable element targeting.
* **FR-2.4:** Breadcrumb hierarchy navigation (`body > section.hero > div.container > h1`).

### FR-3: Visual Property Panels (Styling Engine)
* **FR-3.1 (Typography):** Font size, font weight, line height, letter spacing, text alignment, font family.
* **FR-3.2 (Layout & Sizing):** Width, height, margin, padding, flexbox/grid quick alignment.
* **FR-3.3 (Borders & Radius):** Border width (all / per-side), border style, border radius (all / per-corner), border color.
* **FR-3.4 (Colors & Backgrounds):** Text color, background color, opacity, visual theme swatches with perceptual OKLCH snap.

### FR-4: Direct Content Editing (Text & Media)
* **FR-4.1:** Double-click on any text element (`h1-h6`, `p`, `span`, `button`, `a`) to activate inline text editing (`contenteditable`).
* **FR-4.2:** Image inspector allowing image URL replacement, aspect ratio control, and `alt` text editing.

### FR-5: Revision Control & Code Review
* **FR-5.1:** Instant Undo / Redo (`Cmd/Ctrl + Z`, `Cmd/Ctrl + Shift + Z`) with live DOM reconciliation.
* **FR-5.2:** Visual **Review Changes Diff Modal** showing before-and-after modifications.
* **FR-5.3:** Session **Version History** recording snapshots before every save with 1-click restore/download.

### FR-6: Persistence & Export
* **FR-6.1:** Direct in-place file write via `FileSystemFileHandle` (Chromium).
* **FR-6.2:** Automatic Blob download fallback (Firefox/Safari).
* **FR-6.3:** 1-click "Copy Clean HTML" and "Copy as React JSX/TSX" to clipboard.

---

## 5. Non-Functional Requirements (NFR)

* **NFR-1 (Performance):** Zero UI lag. Slider dragging operates at **60fps** by mutating `element.style` during live drag and committing AST classes on release.
* **NFR-2 (Page Load Speed):** Initial landing page loads in **< 1.0s** (Lighthouse score 95–100) powered by Astro static generation.
* **NFR-3 (Privacy & Security):** 100% client-side computation. Sandboxed iframe prevents parent document cross-script injection.
* **NFR-4 (SEO & Discoverability):** Complete JSON-LD schema (`SoftwareApplication`), dynamic OpenGraph images, canonical tags, and automated sitemaps.
* **NFR-5 (Cross-Browser Support):** Fully tested on Chrome, Edge, Brave, Safari, and Firefox.

---

## 6. Success Metrics & KPIs

1. **User Engagement:** Average session duration > 4 minutes; > 2.5 file saves per user session.
2. **SEO Performance:** Top 5 Google ranking for *"online visual html editor"* and *"free tailwind visual editor"* within 90 days.
3. **Zero Hosting Overhead:** $0.00 infrastructure bill on Cloudflare Pages / Vercel Edge.
