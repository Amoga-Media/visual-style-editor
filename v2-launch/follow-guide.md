# Visual Style Editor V2 — Complete Follow Guide

> **This is the single source of truth for every agent, developer, or AI session working on this project.**
> Read this entire document before touching any code.
> Last Updated: 30 Sep 2026

---

## PART 1 — PROJECT IDENTITY

### What Is This

**Visual Style Editor** is a 100% in-browser, zero-login, zero-backend visual HTML and Tailwind CSS editor. Users drop any `.html` file, click elements on a live canvas, tweak styles with sliders and color pickers, and save the result back to disk — with byte-perfect precision (comments, GSAP scripts, custom attributes are never touched).

**Free forever. No account. No backend.**

### Who Uses It

| Persona | What They Do |
|---|---|
| Vibe Coders | Generate HTML with AI → tweak visually without more prompts |
| Designers | Verify responsive layout, adjust spacing and typography |
| Marketers | Edit headlines, CTAs, button links without touching code |
| Developers | Inspect and adjust Tailwind classes surgically |

### Core Promise

> *"Your file comes back exactly as you left it — except the styles you changed."*

Zero rewriting. Zero serialization. Only the exact bytes that changed are spliced into the original HTML.

---

## PART 2 — ARCHITECTURE (READ BEFORE WRITING CODE)

### Stack

| Layer | Technology | Version |
|---|---|---|
| Framework Shell | Astro | ^5.4.1 |
| Interactive Island | React + React-DOM | ^19.0.0 |
| Styling | Tailwind CSS v4 | ^4.0.9 |
| HTML Parser | parse5 | ^7.2.1 |
| Color Math | culori | ^4.0.2 |
| State | Zustand | ^5.0.3 |
| Icons | lucide-react | ^0.475.0 |
| Animation | framer-motion | ^12.4.7 |
| CSS Utils | clsx, tailwind-merge | ^2.1.1 / ^3.0.2 |
| Testing | Vitest + jsdom | ^3.0.7 / ^26.0.0 |
| Language | TypeScript strict | ^5.7.3 |

### How It Works (Data Flow)

```
User drops .html file
        ↓
FileSystemAccessAPI reads raw HTML string
        ↓
parse5 parses HTML into AST with sourceCodeLocationInfo: true
        (every node knows its exact byte start/end offset)
        ↓
EditorStudio renders HTML in sandboxed <iframe srcDoc={html}>
        ↓
User clicks element on canvas
        ↓
Message posted from iframe → parent React layer
        ↓
SelectionOverlay highlights element, PropertyPanel renders controls
        ↓
User changes a property (e.g. font-size → 24px)
        ↓
commitStyleChange() runs:
  → forwardMap() converts CSS value to Tailwind class
  → class-list-mutation applies class to live iframe element
  → edit record emitted to change-set-store (Zustand)
        ↓
User clicks "Review & Save"
        ↓
ReviewModal shows diff of all pending edits
        ↓
applyEditsClientSide(html, edits, options) called:
  → Traverses AST nodes in DESCENDING byte offset order (CRITICAL!)
  → Splices each change into the raw HTML string
  → Injects responsive CSS into <head> if present
  → Returns new HTML string
        ↓
FileSystemAccessAPI writes new HTML string back to disk
```

### Critical Architecture Rules

> ⚠️ **VIOLATING THESE WILL CORRUPT SAVED HTML**

1. **Descending byte offset order for splices** — When `applyEditsClientSide` applies multiple edits, it MUST process them from the highest byte offset (end of file) to the lowest (start of file). If you apply a splice near line 50, it shifts all offsets after it. Processing in descending order means earlier offsets are never invalidated.

2. **Never modify the raw HTML string directly** — All edits go through `change-set-store` → `applyEditsClientSide` → splice. Never use regex-replace or string manipulation on the raw source HTML inside a component.

3. **Structural edits (insert, delete, duplicate, move) always accumulate** — They are never deduplicated. Two inserts into the same container = two elements. Class/style edits deduplicate by `path + property + viewport`.

4. **parse5 must be called with `sourceCodeLocationInfo: true`** — Without this flag, AST nodes have no byte offsets and the splicer cannot function.

5. **iframe is sandboxed** — The canvas `<iframe>` has `sandbox="allow-scripts allow-same-origin"`. Never try to import/execute cross-origin scripts inside it. Selection events are posted via `window.postMessage`.

### Key Source Files

```
src/
├── components/editor/
│   ├── EditorStudio.tsx          ← Root React island. Owns all state wiring.
│   ├── Toolbar.tsx               ← Top bar: viewport, undo/redo, save, export
│   ├── PropertyPanel.tsx         ← Right panel: groups for selected element
│   ├── SelectionOverlay.tsx      ← Canvas overlay: highlights, drag handles
│   ├── ReviewModal.tsx           ← Diff view before saving to disk
│   ├── ExportStudioModal.tsx     ← Export: HTML copy, React JSX (planned)
│   └── property-panel/
│       ├── LayoutGroup.tsx       ← Width, height, display, padding, margin
│       ├── TypographyGroup.tsx   ← Font, size, weight, line-height, color
│       ├── EffectsGroup.tsx      ← Opacity, blur, shadow
│       ├── BorderGroup.tsx       ← Border width/color/radius
│       ├── FlexGridGroup.tsx     ← Flexbox and Grid controls
│       ├── ClassesGroup.tsx      ← Raw class list editor
│       ├── ColorGroup.tsx        ← Color pickers
│       ├── ImageGroup.tsx        ← src, alt, object-fit
│       ├── LinkGroup.tsx         ← href, target, rel
│       ├── PositionGroup.tsx     ← position, top, left, z-index
│       ├── AdvancedCssGroup.tsx  ← Raw CSS input (filter, perspective, etc.)
│       ├── DocumentInspector.tsx ← Shown when nothing is selected
│       ├── BoxModelVisualizer.tsx← Chrome DevTools-style box model
│       └── CollapsibleGroup.tsx  ← Wrapper for all group panels
│
├── store/
│   ├── change-set-store.ts      ← Zustand: pending edits array
│   ├── undo-store.ts            ← Zustand: past/future edit stacks
│   ├── selection-store.ts       ← Zustand: selected element + path
│   ├── settings-store.ts        ← Zustand: theme, viewport, snap, scale
│   └── workspace-store.ts       ← Zustand: multi-file workspace
│
├── lib/
│   ├── ast/
│   │   ├── apply-edits.ts       ← THE SPLICER: applies change-set to raw HTML
│   │   ├── structural-path.ts   ← CSS-like structural paths (#id, div:nth-of-type(1))
│   │   ├── parse5-adapter.ts    ← Wraps parse5 with typed NodeAdapter
│   │   └── build-location-map.ts← Maps structural paths to parse5 AST nodes
│   ├── dom/
│   │   ├── live-style-engine.ts ← Real-time style application in iframe
│   │   ├── computed-style.ts    ← Reads CSS from iframe elements
│   │   ├── responsive-style-engine.ts ← Manages @media breakpoint styles
│   │   ├── element-classifier.ts← Detects element type (button, container, text...)
│   │   └── class-list-mutation.ts ← DOM class list add/remove
│   ├── tailwind/
│   │   ├── forward-map.ts       ← CSS property value → Tailwind class
│   │   ├── classify.ts          ← Tailwind class → CSS property + value
│   │   ├── default-theme.ts     ← Tailwind v3/v4 default color/spacing scales
│   │   └── css-theme-parser.ts  ← Parses @theme blocks from user's CSS
│   ├── color/
│   │   └── palette-harmonizer.ts← (NEW in V2) Brand hex → full OKLCH palette
│   ├── presets/
│   │   ├── shadow-presets.ts    ← (NEW in V2) Box-shadow preset library
│   │   └── animation-presets.ts ← (NEW in V2) Tailwind animation/transition library
│   ├── fs/
│   │   └── auto-save.ts         ← (NEW in V2) localStorage debounced auto-save
│   └── templates/
│       └── template-registry.ts ← (NEW in V2) Template metadata registry
│
└── pages/
    ├── index.astro              ← (V2: Marketing landing page)
    ├── editor.astro             ← (V2: Editor, moved from index.astro)
    ├── support.astro            ← (V2: Donation/support page)
    └── templates.astro          ← (V2: Template library page)
```

### Store Patterns (Always Follow These)

Every Zustand store follows the pattern in `settings-store.ts`:

```ts
// ✅ CORRECT pattern
export const useMyStore = create<MyState>()((set, get) => ({
  myValue: initialValue,
  setMyValue: (v) => {
    try { localStorage.setItem("vse_mykey", JSON.stringify(v)); } catch {}
    set({ myValue: v });
  },
}));

// ❌ NEVER use external state management (Redux, Context API, signals)
// ❌ NEVER use React.useState for cross-component editor state
```

### Component Styling (Always Follow These)

All new components use the **existing dark mode token set**:

```tsx
// ✅ CORRECT dark-mode styling tokens
bg-[#090909]           // deep page background
bg-[#111114]           // card/panel background
bg-[#141414]           // input field background
bg-[#1c1c1c]           // hover state
border-[#262626]       // standard border
border-white/[0.08]    // subtle border
text-zinc-200          // primary text (light)
text-zinc-400          // secondary text (muted)
text-zinc-600          // placeholder/disabled text
text-[#0084FF]         // accent blue (actions)
text-[#0099ff]         // bright accent (active state)

// ❌ NEVER use plain colors like red-500, blue-300, green-600
// ❌ NEVER hardcode #fff or #000 without opacity modifier
```

---

## PART 3 — MANDATORY RULES FOR EVERY CODE SESSION

Read these before writing a single line of code.

### Rule 1 — Write Tests First (TDD)
Every task in this project follows TDD:
1. Write the failing test
2. Run `npm test` — confirm it FAILS
3. Write the minimum code to make it pass
4. Run `npm test` — confirm it PASSES
5. Commit

**Never skip step 2.** If the test passes before you write the fix, your test is wrong.

### Rule 2 — No New Dependencies Without Approval
All required libraries are already installed. The approved list is:
- `culori` — color math (OKLCH, hex parsing, interpolation)
- `parse5` — HTML AST parsing
- `zustand` — state management
- `framer-motion` — animations
- `lucide-react` — icons
- `clsx`, `tailwind-merge` — class composition

Before installing anything new: stop, ask the user.

### Rule 3 — Test File Mirrors Source File
```
src/lib/color/palette-harmonizer.ts  →  test/lib/palette-harmonizer.test.ts
src/lib/fs/auto-save.ts              →  test/lib/auto-save.test.ts
src/store/change-set-store.ts        →  test/editor/change-set-store.test.ts
src/lib/ast/apply-edits.ts           →  test/ast/apply-edits.test.ts
```

### Rule 4 — Conventional Commits
```
fix: short description     ← bug fixes
feat: short description    ← new features
test: short description    ← adding/fixing tests only
docs: short description    ← documentation only
refactor: short description ← no behavior change
```

### Rule 5 — Never Touch These Files
- `astro.config.mjs` — do not modify unless adding a new Astro page route
- `vitest.config.ts` — do not modify
- `tsconfig.json` — do not modify
- `package.json` / `package-lock.json` — do not add dependencies without approval
- Any file in `dist/` — this is build output, never edit manually

### Rule 6 — Run Full Tests Before Every Commit
```bash
npm test
```
Every test must be green before committing. Zero tolerance for committing with failing tests.

### Rule 7 — Dark Mode by Default
Every new component must work in both light and dark mode. Use `dark:` prefixes. Test in dark mode first (it is the default).

### Rule 8 — LocalStorage Key Naming
All localStorage keys follow the prefix pattern: `vse_<key_name>`

```ts
"vse_theme"        // app theme
"vse_ui_scale"     // UI scale
"vse_autosave_<fileId>"  // auto-save content
```

Never use bare keys like `"autosave"` or `"theme"`.

### Rule 9 — Structural Path Format
Structural paths follow CSS-like selectors anchored by id when available:

```
"#hero-section"                    // element with id
"div:nth-of-type(1)"              // first div in parent
"#hero > p:nth-of-type(2)"       // second p inside #hero
"section:nth-of-type(1) > div:nth-of-type(3)"  // nested path
```

Always compute paths using `computeStructuralPath(element, adapter)` — never build strings manually.

### Rule 10 — Property Panel Groups
New panel groups follow this component contract:

```tsx
interface MyGroupProps {
  element: HTMLElement | null;      // currently selected element
  structuralPath: string | null;    // element's structural path
  viewport: "desktop" | "tablet" | "mobile";
  onEdit: (record: EditRecord) => void; // called on every change
}
```

Always wrap in `<CollapsibleGroup title="..." icon={<Icon />} defaultOpen={false}>`.

---

## PART 4 — COMMANDS REFERENCE

```bash
# Development
npm run dev          # Start Astro dev server at http://localhost:4321

# Testing
npm test             # Run all Vitest tests once
npm test -- --watch  # Watch mode for active development
npm test -- test/lib/auto-save.test.ts   # Run single test file
npm test -- --coverage                  # Coverage report

# Building
npm run build        # Production build → dist/
npm run preview      # Preview production build locally

# Linting (TypeScript)
npx tsc --noEmit     # Type check without building
```

---

## PART 5 — V2 IMPLEMENTATION ORDER

Always do tasks in this exact order. Do not skip ahead.

```
STEP 1 → Task 0-C  [Prompt: 0-C]   Quick fixes (legacy import, font-weight, rel attr, drag viewport)
STEP 2 → Task 0-A  [Prompt: 0-A]   BUG-001: Critical data loss in ChangeSet store
STEP 3 → Task 0-B  [Prompt: 0-B]   BUG-004: Custom CSS wiped in Tailwind mode
STEP 4 → Task 0-D  [Prompt: 0-D]   BUG-005: LinkGroup wrong structural path
STEP 5 → Task 0-E  [Prompt: 0-E]   BUG-006: Responsive styles not saved to disk
STEP 6 → Task 0-F  [Prompt: 0-F]   BUG-003: Duplicate IDs on element duplication
          ↓ CHECKPOINT: All 298+ tests must pass before continuing ↓
STEP 7 → Task 1-A  [Prompt: 1-A]   Local Storage Auto-Save
STEP 8 → Task 1-B  [Prompt: 1-B]   Color Palette Harmonizer panel
STEP 9 → Task 1-C  [Prompt: 1-C]   Shadow & Glow Presets panel
STEP 10 → Task 1-D [Prompt: 1-D]   CSS Animation & Transition Builder panel
          ↓ CHECKPOINT: 360+ tests must pass before continuing ↓
STEP 11 → Task 2-A [Prompt: 2-A]   ♥ Support link + /support page
STEP 12 → Task 2-B [Prompt: 2-B]   Marketing landing page at / + editor at /editor
STEP 13 → Task 2-C [Prompt: 2-C]   Template library at /templates
          ↓ FINAL: npm run build — all 4 pages in dist/ ↓
```

**Why this order:**
- Phase 0 bugs must be fixed before adding features — they corrupt data and will make new features unreliable
- Task 0-C must be first — fixes a broken TypeScript import that causes compile errors in all other tasks
- Phase 1 features build on each other (auto-save is standalone, palette harmonizer can use culori which was verified in auto-save setup)
- Phase 2 pages are pure Astro/HTML — no risk to existing functionality, done last

---

## PART 6 — HOW TO START A NEW AI SESSION FOR ANY TASK

### The Prompt Template

```
You are working on the Visual Style Editor project at:
c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor

This is a 100% client-side Astro 5 + React 19 + Tailwind CSS v4 app.
No backend. No login. TypeScript strict mode. Vitest + jsdom for tests.

Before writing any code:
1. Read the follow-guide at: v2-launch/follow-guide.md
2. Read the implementation plan at: v2-launch/implementation-plan.md

Then execute Task [TASK ID] exactly as written in the plan.
Follow TDD: write failing test → run npm test to confirm failure → implement → run npm test to confirm pass → commit.
Do not proceed to the next step until npm test shows 0 failures.
```

### For Copying Pre-Written Prompts

All ready-to-use prompts (with full code and instructions) are in:
`v2-launch/prompts-to-use.md`

Copy the prompt for the task you want, paste into a new session, and the agent will have all context it needs.

---

## PART 7 — V2 FILES IN THIS FOLDER

| File | Purpose | When to Read |
|---|---|---|
| **`follow-guide.md`** ← you are here | Complete project reference | Start of every session |
| [`steps.md`](./steps.md) | Step-by-step execution checklist | To know what to do next |
| [`progress.md`](./progress.md) | Live status tracker | Update after each task |
| [`implementation-plan.md`](./implementation-plan.md) | Full TDD plan with exact code | During implementation |
| [`prompts-to-use.md`](./prompts-to-use.md) | Copy-paste AI prompts per task | To start a new session |
| [`test.md`](./test.md) | All test cases written out | When writing test files |
| [`bugs-fixes.md`](./bugs-fixes.md) | Bug tracker + root causes | When investigating bugs |

---

## PART 8 — FEATURE SPECIFICATIONS

### 1-A: Local Storage Auto-Save

**Location:** `src/lib/fs/auto-save.ts` (new file)

**Behavior:**
- Every time an edit is committed (via `onEdit` in PropertyPanel), call `autoSave(fileId, currentHtml)`
- `autoSave` is debounced — waits 2 seconds of inactivity before writing to `localStorage`
- Key format: `vse_autosave_<fileId>` where `fileId` is the workspace file ID
- On successful disk save (FileSystemAccessAPI write): call `clearAutoSave(fileId)` to remove the autosave
- On file load: check `restoreAutoSave(fileId)` — if truthy, show a recovery banner:
  ```
  ⚠️ Unsaved session recovered for [filename].html
  [Restore unsaved changes] [Discard and start fresh]
  ```
  - Restore → use `restoreAutoSave(fileId)` as the initial HTML content
  - Discard → call `clearAutoSave(fileId)` and load the file fresh from disk

**Size limit:** If `html.length > 400_000` (400KB), skip auto-save silently — localStorage has a 5MB total quota.

---

### 1-B: Color Palette Harmonizer

**Location:** `src/lib/color/palette-harmonizer.ts` + `src/components/editor/property-panel/PaletteHarmonizerGroup.tsx`

**Shown:** In `DocumentInspector.tsx` — the panel displayed when NO element is selected on canvas.

**Behavior:**
- User picks a brand hex color (color picker + text input)
- Clicks "Generate"
- Palette computed using `culori` OKLCH interpolation:
  - `primary` = the input hex
  - `secondary` = hue + 30°
  - `accent` = hue + 60°
  - `neutral` = same hue, 8% chroma, 50% lightness
  - `shades[0..8]` = 9 interpolated colors from light (100) to dark (900)
- Clicking a color role (primary/secondary/accent/neutral) copies the hex to clipboard
- Clicking a shade copies its hex to clipboard
- Invalid input → fallback to `#6366F1` (indigo)

---

### 1-C: Shadow & Glow Presets

**Location:** `src/lib/presets/shadow-presets.ts` + `src/components/editor/property-panel/ShadowPresetsGroup.tsx`

**Shown:** Inside `EffectsGroup.tsx` (or as its own collapsible group) — visible for `container`, `button`, `image`, `section` element types.

**Presets (12 total):**

| ID | Label | Category |
|---|---|---|
| none | None | none |
| soft-sm | Soft S | shadow |
| soft-md | Soft M | shadow |
| soft-lg | Soft L | shadow |
| hard | Hard | shadow |
| elev-1 | Elev 1 | shadow |
| elev-3 | Elev 3 | shadow |
| glow-blue | Blue Glow | glow |
| glow-purple | Purple Glow | glow |
| glow-green | Green Glow | glow |
| glow-amber | Amber Glow | glow |
| inset-sm | Inset S | inset |

**Behavior:** Clicking a preset calls `commitStyleChange(element, "box-shadow", preset.css, options)` which applies the shadow live and emits an edit record.

---

### 1-D: CSS Animation & Transition Builder

**Location:** `src/lib/presets/animation-presets.ts` + `src/components/editor/property-panel/AnimationBuilderGroup.tsx`

**Shown:** For ALL element types (below Effects or AdvancedCss group).

**Three tabs:**

**Transition tab** — applies base Tailwind transition classes:
- 8 presets: None, Smooth All, Colors, Fade, Transform, Shadow, Snappy, Bouncy
- Clicking removes all other transition preset classes, then adds new preset's classes

**Animation tab** — applies Tailwind animate-* classes:
- 5 presets: None, Spin, Ping, Pulse, Bounce

**Hover FX tab** — applies `hover:` prefixed classes:
- 6 presets: None, Scale Up (`hover:scale-105`), Press (`hover:scale-95`), Lift (`hover:-translate-y-1`), Brighten (`hover:brightness-110`), Dim (`hover:opacity-70`)
- Also adds base transition classes for smooth hover animation

**Behavior:** Active preset is highlighted in blue (`border-[#0084FF]/60 bg-[#0084FF]/10`). Clicking "None" removes all preset classes.

---

### 2-A: Support Link + /support Page

**Toolbar link:** Subtle text link — NOT a button. Placed in the right zone before "Review & Save". Only shows on `sm:` screens and above:
```tsx
<a href="/support" target="_blank" rel="noopener noreferrer"
  className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 text-[11px] rounded-lg transition-all">
  <Heart className="w-3 h-3" />
  <span className="hidden md:inline">Support</span>
</a>
```

**Support page (`/support`):** Dark, minimal, premium. Four options:
1. ☕ Ko-fi — one-time donation
2. 📺 Watch an Ad — Carbon Ads slot (`id="support-ad"`)
3. ⭐ GitHub Sponsors — monthly
4. 🔗 Share — `navigator.share()` or Twitter intent fallback

---

### 2-B: Marketing Landing Page

**Route change:** Editor moves from `/` → `/editor`. Landing page lives at `/`.

**Landing page sections:**
1. `<nav>` — Logo + nav links + "Open Editor →" CTA
2. `<Hero>` — Headline + sub-headline + 2 CTAs + editor preview visual
3. `<Features>` — 6-card grid: Zero Setup, Tailwind-Aware, Surgical Save, Responsive, Privacy, Undo
4. `<HowItWorks>` — 3 steps: Drop HTML → Click & Edit → Save to Disk
5. `<CTA Banner>` — Full-width dark gradient with primary CTA
6. `<Footer>` — Logo, links, support link, copyright

**All CTAs link to `/editor`.** No JavaScript framework needed — pure Astro + CSS.

---

### 2-C: Template Library

**Route:** `/templates`

**Template registry:** `src/lib/templates/template-registry.ts` — array of `TemplateEntry` objects with `id`, `name`, `description`, `category`, `tags`.

**Template HTML files:** `public/templates/<id>.html` — standalone HTML files using Tailwind CDN. At least 3 real files needed for launch.

**Page features:**
- Search input (client-side, filters by name + description + tags)
- Category filter tabs: All / Landing / SaaS / Portfolio / Blog / Component
- 3-column responsive grid of template cards
- Each card: "Open in Editor →" → `/editor?template=<id>`

**EditorStudio handles `?template=` param:**
```ts
// On mount:
const templateId = new URLSearchParams(window.location.search).get("template");
if (templateId && TEMPLATE_REGISTRY.find(t => t.id === templateId)) {
  const html = await fetch(`/templates/${templateId}.html`).then(r => r.text());
  loadHtmlContent(html, `${templateId}.html`);
}
```

---

## PART 9 — BUG QUICK REFERENCE

| Bug ID | Symptom | Root Cause File | Fix |
|---|---|---|---|
| BUG-001 🔴 | Multiple inserts → only last saved | `change-set-store.ts` | Structural edits always append |
| BUG-002 🟠 | Undo doesn't restore deleted elements | `undo-store.ts` | Needs DOM snapshot architecture (Phase 3) |
| BUG-003 🟠 | Duplicate IDs in saved HTML | `apply-edits.ts` | Add `-copy` suffix on duplicate splice |
| BUG-004 🟠 | Custom CSS (filter, etc.) deleted instantly | `live-style-engine.ts` | Fallback to style edit when forwardMap=undefined |
| BUG-005 🟠 | Link href saved on `<span>` not `<a>` | `LinkGroup.tsx` | Use anchor's structural path in onEdit |
| BUG-006 🟡 | Responsive styles gone after saving | `apply-edits.ts` | Inject vse-responsive-styles into `<head>` |
| BUG-007 🟡 | ReviewModal shows blank rows | `ReviewModal.tsx` | Add render branches for all edit kinds |
| BUG-008 🟡 | ImageGroup TS error on `viewport` | `ImageGroup.tsx` | Add `viewport` to ImageGroupProps |
| BUG-009 🟡 | `@vse/shared` import broken | `parse5-adapter.ts` | Change to `./structural-path` |
| BUG-010 🟢 | `font-[700]` instead of `font-bold` | `forward-map.ts` | Add WEIGHT_MAP lookup table |
| BUG-011 🟢 | `rel` not saved on "New Tab" toggle | `LinkGroup.tsx` | Emit attribute edit record for rel |
| BUG-012 🟢 | Drag records wrong viewport | `SelectionOverlay.tsx` | Pass `viewport` to `applyLiveStyle` |

Full details + root cause analysis in [`bugs-fixes.md`](./bugs-fixes.md).

---

## PART 10 — CHECKPOINTS & VERIFICATION

### Before Each Phase

**Before Phase 1 (after all Phase 0 bugs):**
```bash
npm test
# Must show: All tests passing (298+ tests)
# Zero failures permitted
```

**Before Phase 2 (after all Phase 1 features):**
```bash
npm test
# Must show: 360+ tests passing
# Every new test file has 100% of tests passing
```

**Before Calling V2 Complete:**
```bash
# Tests
npm test

# Build
npm run build

# Verify all 4 pages exist in dist/
ls dist/                    # index.html (landing)
ls dist/editor/             # index.html (editor)
ls dist/support/            # index.html (support page)
ls dist/templates/          # index.html (template library)
```

### Manual Browser Verification

Open `npm run dev` and check each of these manually:

- [ ] `/` — Landing page loads, no console errors, CTA links to `/editor`
- [ ] `/editor` — Editor loads, file drop works, edit → review → save works
- [ ] `/editor?template=hero-dark` — Template loads automatically
- [ ] `/templates` — Search works, category filter works, cards link to editor
- [ ] `/support` — All 4 cards visible, no layout breaks
- [ ] Toolbar — ♥ Support link opens `/support` in new tab (not same tab)
- [ ] Auto-save — Make an edit, close tab without saving, reopen → recovery banner
- [ ] Palette Harmonizer — No element selected → panel visible → Generate → shades appear
- [ ] Shadow Preset — Select a div → "Blue Glow" → shadow appears on canvas immediately
- [ ] Animation Builder — Select button → "Smooth All" → `transition-all duration-300 ease-out` added to class list

---

## PART 11 — MONETIZATION PLAN (For Reference)

> The tool is free forever. These are ethical, developer-friendly monetization options on the /support page only. Nothing in the editor UI except the tiny ♥ Support link.

| Method | Implementation | Expected Revenue |
|---|---|---|
| **Carbon Ads** | `<script async src="//cdn.carbonads.com/carbon.js" id="_carbonads_js"></script>` in `/support` | $1–5 CPM, developer audience |
| **EthicalAds** | Apply at ethicalads.io — privacy-respecting ads for devs | Similar to Carbon |
| **Ko-fi / Buy Me a Coffee** | Simple link on `/support` | Occasional one-time tips |
| **GitHub Sponsors** | Enable on GitHub repo | Small recurring |
| **Affiliate (tools)** | Recommend Tailwind UI, Heroicons, paid Tailwind themes | 20–30% commission |

**What NOT to do:**
- No ads on the editor page
- No cookie banners (use privacy-safe ad networks)
- No email gates
- No "free tier limits"

---

## APPENDIX — GLOSSARY

| Term | Meaning |
|---|---|
| **Structural path** | CSS-like selector identifying a DOM node (e.g. `#hero > div:nth-of-type(2)`) |
| **Edit record** | A typed object in the change-set describing one change: `{ kind, structuralPath, ... }` |
| **Splice** | Replacing a specific byte range in the raw HTML string |
| **forwardMap** | Function that converts a CSS property+value pair to a Tailwind class |
| **classify** | Reverse of forwardMap — converts a Tailwind class to a CSS property+value |
| **ViewportMode** | `"desktop" \| "tablet" \| "mobile" \| "all"` — the active responsive preview |
| **OKLCH** | A perceptually uniform color space used by culori for color math |
| **Island** | A React component rendered client-side inside an Astro static page |
| **srcDoc** | The iframe attribute holding the full HTML string of the edited document |
| **AutoSave** | Debounced localStorage write of current HTML state — cleared on disk save |
| **ChangeSet** | The accumulated array of pending edits not yet written to disk |
| **Structural edit** | An edit that adds/removes/moves DOM elements (insert, delete, duplicate, move) |
| **Idempotent edit** | An edit that can be applied multiple times with the same result (class, style, text, attribute) |
