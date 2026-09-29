# Visual Style Editor V2 — Steps Guide

> Read this to know what to do next, in order.
> Cross off a step only after tests pass and commit is done.

---

## THE GOLDEN RULE

> **Always run tests before moving to the next step.**
> `npm test` must show 0 failures before you proceed.

---

## STEP 1 — Quick Bug Fixes (Task 0-C) ← START HERE

**Why first?** These 4 fixes are tiny (1–5 lines each), zero risk of breaking anything, and one of them (BUG-009 legacy import) will cause TypeScript errors in later tasks if not fixed first.

**Prompt to use:** Copy "Prompt 0-C" from [`prompts-to-use.md`](./prompts-to-use.md)

**What gets fixed:**
- `parse5-adapter.ts` — broken import path → TypeScript will now compile cleanly
- `forward-map.ts` — font-weight now maps to `font-bold` instead of `font-[700]`
- `LinkGroup.tsx` — `rel="noopener noreferrer"` now gets saved to disk
- `SelectionOverlay.tsx` — drag-to-move now records the correct viewport

**Done when:**
- [ ] `npm test` → all tests pass (no new failures)
- [ ] Commit message: `fix: BUG-009 import, BUG-010 font-weight, BUG-011 rel attr, BUG-012 drag viewport`
- [ ] Update `progress.md` → mark all 4 Task 0-C items as ✅ Done

---

## STEP 2 — Critical Data Loss Fix (Task 0-A)

**Why second?** This is the most impactful bug. Users lose work silently. Fix it while the codebase is clean after Step 1.

**Prompt to use:** Copy "Prompt 0-A" from [`prompts-to-use.md`](./prompts-to-use.md)

**What gets fixed:**
- Inserting 2+ elements into the same container now saves ALL of them (not just the last one)
- The fix is a 10-line change in `src/store/change-set-store.ts`

**Done when:**
- [ ] New test added to `test/editor/change-set-store.test.ts`
- [ ] Test: "accumulates multiple insert edits on the same path" → PASS
- [ ] `npm test` → all tests pass
- [ ] Commit: `fix: BUG-001 structural edits accumulate instead of overwriting (critical data loss)`
- [ ] Update `progress.md`

---

## STEP 3 — Custom CSS Preserved (Task 0-B)

**Prompt to use:** Copy "Prompt 0-B" from [`prompts-to-use.md`](./prompts-to-use.md)

**What gets fixed:**
- Adding `filter`, `perspective`, `backdrop-filter`, or any CSS property with no Tailwind equivalent no longer deletes it immediately
- Falls back to an inline `style` edit which gets saved to disk correctly

**Done when:**
- [ ] New file: `test/editor/live-style-engine.test.ts`
- [ ] Test: "preserves inline style and emits style edit" → PASS
- [ ] `npm test` → all tests pass
- [ ] Commit: `fix: BUG-004 custom CSS properties preserved as style edits in Tailwind mode`
- [ ] Update `progress.md`

---

## STEP 4 — Link Attribute Fix (Task 0-D)

**Prompt to use:** Copy "Prompt 0-D" from [`prompts-to-use.md`](./prompts-to-use.md)

**What gets fixed:**
- Clicking `<a><span>Link</span></a>` and changing the href now correctly records the edit on the `<a>` tag, not the `<span>`

**Done when:**
- [ ] New file: `test/editor/link-group-path.test.ts`
- [ ] Tests pass
- [ ] `npm test` → all pass
- [ ] Commit: `fix: BUG-005 LinkGroup uses anchor tag structural path for attribute edits`
- [ ] Update `progress.md`

---

## STEP 5 — Responsive Styles Saved (Task 0-E)

**Prompt to use:** Copy "Prompt 0-E" from [`prompts-to-use.md`](./prompts-to-use.md)

**What gets fixed:**
- Mobile/tablet style overrides now get written into the saved HTML inside `<style id="vse-responsive-styles">` in the `<head>`
- Users can now share or deploy their saved file and responsive styles work correctly

**Done when:**
- [ ] New file: `test/ast/apply-edits-responsive.test.ts`
- [ ] 5 tests all pass
- [ ] `npm test` → all pass
- [ ] Commit: `fix: BUG-006 responsive @media styles now written into saved HTML <head>`
- [ ] Update `progress.md`

---

## STEP 6 — Duplicate ID Fix (Task 0-F)

**Prompt to use:** Copy "Prompt 0-F" from [`prompts-to-use.md`](./prompts-to-use.md)

**What gets fixed:**
- Duplicating `<div id="card">` now produces `<div id="card-copy">` — no more duplicate IDs in saved HTML

**Done when:**
- [ ] Regression test added to `test/ast/apply-edits.test.ts`
- [ ] `npm test` → all pass
- [ ] Commit: `fix: BUG-003 duplicated elements get unique -copy id suffix`
- [ ] Update `progress.md`

---

## ✅ CHECKPOINT — ALL PHASE 0 BUGS FIXED

Before moving to Phase 1, verify:

```bash
npm test
```

Expected output:
```
✓ test/editor/change-set-store.test.ts    (X tests)
✓ test/editor/live-style-engine.test.ts   (3 tests) ← new
✓ test/ast/apply-edits.test.ts            (X tests)
✓ test/ast/apply-edits-responsive.test.ts (5 tests) ← new
✓ test/editor/link-group-path.test.ts     (3 tests) ← new
... (all others passing)
Test Files: X passed
Tests: 300+ passed
```

If anything fails — stop here and fix before continuing.

---

## STEP 7 — Auto-Save (Task 1-A)

**Prompt to use:** Copy "Prompt 1-A" from [`prompts-to-use.md`](./prompts-to-use.md)

**What it does:**
- Creates `src/lib/fs/auto-save.ts` — debounced 2s localStorage write
- Wires into EditorStudio so every edit triggers an auto-save
- On file load, shows a recovery banner if unsaved session found: "Unsaved session recovered. [Restore] [Discard]"
- On disk save, clears the autosave entry

**Done when:**
- [ ] New file: `src/lib/fs/auto-save.ts`
- [ ] New test: `test/lib/auto-save.test.ts` — 8 tests pass
- [ ] EditorStudio wired up — auto-save triggers on edit, recovery banner on load
- [ ] `npm test` → all pass
- [ ] Open editor in browser, make a change, close without saving, reopen → banner appears
- [ ] Commit: `feat: localStorage auto-save with 2s debounce and session recovery banner`
- [ ] Update `progress.md`

---

## STEP 8 — Color Palette Harmonizer (Task 1-B)

**Prompt to use:** Copy "Prompt 1-B" from [`prompts-to-use.md`](./prompts-to-use.md)

**What it does:**
- New `PaletteHarmonizerGroup` panel in the Document Inspector (visible when nothing is selected)
- Pick a brand hex → click Generate → get 4 role colors + 9 shades
- Click any color role to copy hex. Click shade strip to copy that shade.

**Done when:**
- [ ] New file: `src/lib/color/palette-harmonizer.ts`
- [ ] New test: `test/lib/palette-harmonizer.test.ts` — 8 tests pass
- [ ] Panel visible in Document Inspector when no element selected
- [ ] Generate works, shades look correct
- [ ] `npm test` → all pass
- [ ] Commit: `feat: Color Palette Harmonizer with OKLCH interpolation and 9-shade generation`
- [ ] Update `progress.md`

---

## STEP 9 — Shadow & Glow Presets (Task 1-C)

**Prompt to use:** Copy "Prompt 1-C" from [`prompts-to-use.md`](./prompts-to-use.md)

**What it does:**
- New `ShadowPresetsGroup` panel in the property panel Effects section
- 12 presets: Soft S/M/L, Hard, Blue/Purple/Green/Amber Glow, Inset, Elevation 1/3
- Category filter tabs: shadow / glow / inset / none
- Click a preset → applies `box-shadow` as CSS to selected element live + saves edit

**Done when:**
- [ ] New file: `src/lib/presets/shadow-presets.ts`
- [ ] New test: `test/lib/shadow-presets.test.ts` — 7 tests pass
- [ ] Panel visible in Effects section for container/button/image elements
- [ ] Clicking preset applies shadow visually in the canvas
- [ ] `npm test` → all pass
- [ ] Commit: `feat: Shadow & Glow Presets panel with 12 presets and live CSS preview`
- [ ] Update `progress.md`

---

## STEP 10 — Animation Builder (Task 1-D)

**Prompt to use:** Copy "Prompt 1-D" from [`prompts-to-use.md`](./prompts-to-use.md)

**What it does:**
- New `AnimationBuilderGroup` with 3 tabs: Transition / Animation / Hover FX
- Transition: 8 presets (Smooth All, Colors, Fade, Transform, Shadow, Snappy, Bouncy, None)
- Animation: 5 presets (Spin, Ping, Pulse, Bounce, None)
- Hover FX: 6 presets (Scale Up, Press, Lift, Brighten, Dim, None)
- Click a preset → applies/removes Tailwind classes immediately

**Done when:**
- [ ] New file: `src/lib/presets/animation-presets.ts`
- [ ] New test: `test/lib/animation-presets.test.ts` — 10 tests pass
- [ ] Panel visible for all element types
- [ ] All 3 tabs work, active preset highlighted in blue
- [ ] `npm test` → all pass
- [ ] Commit: `feat: Animation & Transition Builder with Tailwind preset library`
- [ ] Update `progress.md`

---

## ✅ CHECKPOINT — ALL PHASE 1 FEATURES DONE

```bash
npm test
```

Expected: 360+ tests passing. If anything fails — fix before Phase 2.

Also do a quick browser check:
- [ ] Open `/editor` → property panel shows Palette Harmonizer when nothing selected
- [ ] Select a div → Shadow Presets panel visible under Effects
- [ ] Select a button → Animation Builder panel visible
- [ ] Select a button → Add "Smooth All" transition → class appears in Classes group

---

## STEP 11 — Support Link + /support Page (Task 2-A)

**Prompt to use:** Copy "Prompt 2-A" from [`prompts-to-use.md`](./prompts-to-use.md)

**What it does:**
- Tiny `♥ Support` text link in the toolbar right zone (before "Review & Save")
- Opens `/support` in a new tab — nothing distracting in the editor itself
- `/support` page: premium dark page with Ko-fi, Watch Ad, GitHub Sponsors, Share options

**Done when:**
- [ ] Heart icon link visible in toolbar on `sm:` and above
- [ ] `/support` page loads cleanly with all 4 support option cards
- [ ] `npm run build` → `dist/support/index.html` exists, 0 build errors
- [ ] Commit: `feat: ♥ Support link in toolbar and premium /support page`
- [ ] Update `progress.md`

---

## STEP 12 — Marketing Landing Page (Task 2-B)

**Prompt to use:** Copy "Prompt 2-B" from [`prompts-to-use.md`](./prompts-to-use.md)

**What it does:**
- Full premium dark marketing page at `/` — hero, features, how-it-works, CTA
- Editor moves to `/editor`
- All internal links updated

**⚠️ IMPORTANT:** After this step, the editor is at `/editor`, not `/`. Update any bookmarks.

**Done when:**
- [ ] `/` shows landing page (not the editor)
- [ ] `/editor` shows the editor
- [ ] `npm run build` → both `dist/index.html` and `dist/editor/index.html` exist
- [ ] "Open Editor Free →" CTA on landing page works
- [ ] Commit: `feat: premium marketing landing page at / and editor moved to /editor`
- [ ] Update `progress.md`

---

## STEP 13 — Template Library (Task 2-C)

**Prompt to use:** Copy "Prompt 2-C" from [`prompts-to-use.md`](./prompts-to-use.md)

**What it does:**
- `/templates` page with searchable, filterable template cards
- Category filter: All / Landing / SaaS / Portfolio / Blog / Component
- Each card: "Open in Editor →" link to `/editor?template=<id>`
- EditorStudio handles the `?template=` URL param and loads the HTML automatically
- At least 3 real template HTML files in `public/templates/`

**Done when:**
- [ ] `/templates` loads with at least 6 template cards
- [ ] Search input filters cards live (client-side JS)
- [ ] Category filter tabs work
- [ ] Clicking "Open in Editor →" loads the template in the editor
- [ ] `npm run build` → `dist/templates/index.html` exists
- [ ] Commit: `feat: /templates page with searchable gallery and URL param template loading`
- [ ] Update `progress.md`

---

## ✅ FINAL CHECKPOINT — V2 COMPLETE

### Run full build + test:

```bash
npm test && npm run build
```

Expected:
```
✓ All test files
Tests: 360+ passed
...
build complete
dist/index.html        ← Landing page
dist/editor/index.html ← Editor
dist/support/index.html ← Support page
dist/templates/index.html ← Template library
```

### Browser smoke test (do this manually):

- [ ] `/` — Landing page loads, CTA links work, no console errors
- [ ] `/editor` — Editor loads, can drop a file, edit, save
- [ ] `/editor?template=hero-dark` — Template loads automatically
- [ ] `/templates` — All cards show, search + filter work
- [ ] `/support` — All 4 support cards visible
- [ ] Toolbar — ♥ Support link visible and opens new tab
- [ ] Auto-save: Make an edit, close tab, reopen → recovery banner shows
- [ ] Palette Harmonizer: No element selected → panel visible → Generate works
- [ ] Shadow Presets: Select div → click "Blue Glow" → glow appears on canvas
- [ ] Animation Builder: Select button → "Smooth All" → class `transition-all` added

### Mark V2 complete in progress.md

Update the overall status to:
```
Phase 0 — Bug Fixes      [ 9 / 9 ]  ████████████████████  100%
Phase 1 — New Features   [ 4 / 4 ]  ████████████████████  100%
Phase 2 — Pages          [ 3 / 3 ]  ████████████████████  100%
─────────────────────────────────────────────────────
Total                    [16 / 16]  ████████████████████  100%
```

---

## PHASE 3 — WHAT COMES NEXT (After V2 Ships)

These are the bigger features. Each needs its own plan session:

| Feature | Complexity | Prompt |
|---|---|---|
| React JSX/TSX Export | Medium | `prompts-to-use.md` → Prompt 3-A |
| Floating Canvas HUD | High | `prompts-to-use.md` → Prompt 3-B |
| Hover/Focus/Active state styler | High | `prompts-to-use.md` → Prompt 3-C |
| Box Model Visualizer | Medium | _(future plan needed)_ |
| Undo for structural mutations (BUG-002) | Very High | _(future plan needed — needs DOM snapshot architecture)_ |

---

## REFERENCE LINKS

| File | Purpose |
|---|---|
| [`implementation-plan.md`](./implementation-plan.md) | Full TDD plan with exact code and test commands |
| [`prompts-to-use.md`](./prompts-to-use.md) | Copy-paste AI prompts for each task |
| [`test.md`](./test.md) | All test cases written out |
| [`bugs-fixes.md`](./bugs-fixes.md) | Bug tracker with root causes and fix notes |
| [`progress.md`](./progress.md) | Live progress tracker — update after each task |
