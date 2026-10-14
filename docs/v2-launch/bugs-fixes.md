# Visual Style Editor — Bug Tracker & Fixes Log

> Living document. Update status and add new bugs as they are discovered.
> Priority: 🔴 Critical → 🟠 High → 🟡 Medium → 🟢 Low

---

## STATUS LEGEND

| Symbol | Meaning |
|---|---|
| 🔴 Confirmed | Bug is confirmed and unresolved |
| 🔧 In Progress | Currently being worked on |
| ✅ Fixed | Fix implemented and tested |
| 💀 Won't Fix | Intentionally not addressing |
| 🔮 Future Risk | Potential bug to watch as codebase grows |

---

## CRITICAL BUGS

### BUG-001 — ChangeSet Overwrites Multiple Structural Edits
**Status:** 🔴 Confirmed  
**Priority:** Critical  
**Affects:** `src/store/change-set-store.ts` lines 14–22  
**Symptom:** Insert 2+ components into the same container → only the last one is saved.  
**Root Cause:** Deduplication predicate `e.property === record.property` matches `undefined === undefined` for all structural edits, so each new insert replaces the previous one.  
**Fix:** Add `STRUCTURAL_KINDS = Set(["insert","duplicate","delete","move"])` — structural edits always append, never deduplicate.  
**Regression Test:** `test/editor/change-set-store.test.ts` — "accumulates multiple insert edits"  
**Prompt:** See `prompts-to-use.md` → Prompt 0-A  
**Fix Commit:** _(pending)_

---

## HIGH PRIORITY BUGS

### BUG-002 — Undo/Redo Broken for Structural Mutations
**Status:** 🔴 Confirmed  
**Priority:** High  
**Affects:** `src/store/undo-store.ts` — `reconcileDom` function lines 40–120  
**Symptom:** Delete an element → Ctrl+Z → element does NOT reappear on canvas.  
**Root Cause:** `reconcileDom` only handles `class`, `style`, `attribute`, and `text` edit kinds. `delete`, `duplicate`, `insert`, `move` are unhandled — the undo store rolls back the change-set but never updates the live iframe DOM.  
**Fix Strategy:** Store DOM snapshots (HTML string) before each structural mutation in undo-store. On undo, re-parse and re-render the snapshot. On redo, re-apply the mutation.  
**Regression Test:** `test/editor/undo-store.test.ts` — verify DOM restoration after delete undo  
**Prompt:** _(Phase 3 — complex, requires snapshot architecture)_  
**Fix Commit:** _(pending)_

### BUG-003 — Duplicate IDs Generated on Element Duplication
**Status:** 🔴 Confirmed  
**Priority:** High  
**Affects:** `src/lib/ast/apply-edits.ts` lines 187–195 (duplicate branch)  
**Symptom:** Duplicating `<div id="hero-card">` produces two elements with `id="hero-card"` in saved HTML.  
**Root Cause:** The duplicate branch takes a raw slice of the original HTML and inserts it verbatim — the `id` attribute is not rewritten.  
**Fix:** Use `.replace(/\bid="([^"]+)"/g, (_, id) => \`id="${id}-copy"\`)` on the slice before inserting.  
**Regression Test:** `test/ast/apply-edits.test.ts` — "rewrites id attribute on duplicated element"  
**Prompt:** See `prompts-to-use.md` → Prompt 0-F  
**Fix Commit:** _(pending)_

### BUG-004 — Custom CSS Properties Wiped in Tailwind Mode
**Status:** 🔴 Confirmed  
**Priority:** High  
**Affects:** `src/lib/dom/live-style-engine.ts` — `commitStyleChange` lines 320–338  
**Symptom:** Add `filter: grayscale(100%)` via AdvancedCssGroup → immediately deleted, not saved.  
**Root Cause:** When Tailwind mode is active, `forwardMap` returns `undefined` for unmapped properties. Instead of falling back to inline style, the engine calls `element.style.removeProperty()` and records a class edit with unchanged classes.  
**Fix:** Check `if (newClass === undefined)` → fall back to `element.style.setProperty()` + emit `kind: "style"` edit + early return.  
**Regression Test:** `test/editor/live-style-engine.test.ts` — "preserves inline style when forwardMap returns undefined"  
**Prompt:** See `prompts-to-use.md` → Prompt 0-B  
**Fix Commit:** _(pending)_

### BUG-005 — LinkGroup Records Edit on Child Element, Not Anchor Tag
**Status:** 🔴 Confirmed  
**Priority:** High  
**Affects:** `src/components/editor/property-panel/LinkGroup.tsx` lines 32–45  
**Symptom:** Click `<a><span>Link</span></a>` → change href → saved HTML has `href` on the `<span>` tag, not `<a>`.  
**Root Cause:** `commitAttribute` uses the passed `structuralPath` (which points to the clicked `<span>`) instead of computing the `<a>` anchor's own structural path.  
**Fix:** Import `computeStructuralPath` and `buildDomAdapter`. Compute `anchorPath = computeStructuralPath(targetEl, adapter)` and use it in the `onEdit` call.  
**Regression Test:** `test/editor/link-group-path.test.ts`  
**Prompt:** See `prompts-to-use.md` → Prompt 0-D  
**Fix Commit:** _(pending)_

---

## MEDIUM PRIORITY BUGS

### BUG-006 — Responsive Styles Never Persisted to Saved HTML
**Status:** 🔴 Confirmed  
**Priority:** Medium  
**Affects:** `src/lib/dom/responsive-style-engine.ts`, `src/lib/ast/apply-edits.ts`, `src/components/editor/EditorStudio.tsx`  
**Symptom:** Set font-size smaller on mobile → save → open saved file in browser → mobile style is gone.  
**Root Cause:** `generateResponsiveCssString()` generates the right CSS in memory and injects it into the iframe `<style id="vse-responsive-styles">`. But `applyEditsClientSide` never reads or injects this style tag into the output HTML string.  
**Fix:** Add optional `responsiveCss?: string` param to `applyEditsClientSide`. If present, inject/replace the `<style id="vse-responsive-styles">` block before `</head>`. In EditorStudio save handler, call `generateResponsiveCssString()` and pass it.  
**Regression Test:** `test/ast/apply-edits-responsive.test.ts`  
**Prompt:** See `prompts-to-use.md` → Prompt 0-E  
**Fix Commit:** _(pending)_

### BUG-007 — ReviewModal Shows Blank Rows for Attribute/Structural Edits
**Status:** 🔴 Confirmed  
**Priority:** Medium  
**Affects:** `src/components/editor/ReviewModal.tsx` lines 13–66, 123–158  
**Symptom:** In Review modal, edits for `attribute`, `insert`, `delete`, `duplicate`, `move` kinds show as blank rows with no diff information.  
**Root Cause:** The diff render only handles `class`, `style`, `text` kinds. All others render an empty container.  
**Fix:** Add render branches for each missing kind:
- `attribute`: show `attributeName: oldValue → newValue`
- `insert`: show `Inserted <tagName>` with first 40 chars of HTML
- `delete`: show `Deleted element at [path]`
- `duplicate`: show `Duplicated [path]`
- `move`: show `Moved [sourcePath] → [targetPath]`  
**Also fix:** `revertAllEdits` has no handling for these kinds — needs DOM reload/snapshot restore.  
**Regression Test:** Manual testing (no automated test yet)  
**Prompt:** _(Phase 3)_

### BUG-008 — ImageGroup References Undeclared `viewport` Variable
**Status:** 🔴 Confirmed  
**Priority:** Medium  
**Affects:** `src/components/editor/property-panel/ImageGroup.tsx` lines 98, 99, 104, 105  
**Symptom:** TypeScript strict mode error: `viewport` is not defined in `ImageGroupProps` or component scope.  
**Fix:** Add `viewport?: ViewportMode` to `ImageGroupProps`. Pass `viewport={viewport}` from `PropertyPanel.tsx` to `<ImageGroup />`.  
**Regression Test:** TypeScript build passes: `npm run build` (no TS errors)  
**Fix Commit:** _(pending — can be done as quick fix alongside 0-C)_

### BUG-009 — Legacy `@vse/shared` Import in parse5-adapter.ts
**Status:** 🔴 Confirmed  
**Priority:** Medium  
**Affects:** `src/lib/ast/parse5-adapter.ts` line 1  
**Symptom:** Unresolvable module `@vse/shared` — a remnant from pre-Astro monorepo era.  
**Fix:** Change to `import type { NodeAdapter } from "./structural-path";`  
**Prompt:** See `prompts-to-use.md` → Prompt 0-C (first fix in that session)  
**Fix Commit:** _(pending)_

---

## LOW PRIORITY BUGS

### BUG-010 — `forwardMap` Produces Arbitrary font-weight Classes
**Status:** 🔴 Confirmed  
**Priority:** Low  
**Affects:** `src/lib/tailwind/forward-map.ts` — `case "font-weight"` (~line 149)  
**Symptom:** Setting font-weight: 700 generates `font-[700]` instead of standard `font-bold`.  
**Fix:** Add `WEIGHT_MAP` lookup table mapping numeric and keyword weights to Tailwind classes.  
**Prompt:** See `prompts-to-use.md` → Prompt 0-C  
**Fix Commit:** _(pending)_

### BUG-011 — `rel="noopener noreferrer"` Set in DOM Without Being Saved
**Status:** 🔴 Confirmed  
**Priority:** Low  
**Affects:** `src/components/editor/property-panel/LinkGroup.tsx` — `handleTargetToggle` lines 60–65  
**Symptom:** Toggle "Open in New Tab" → saves `target="_blank"` but NOT `rel="noopener noreferrer"` in saved HTML.  
**Fix:** After `targetEl.setAttribute("rel", ...)`, emit an `AttributeEditRecord` for `rel`.  
**Prompt:** See `prompts-to-use.md` → Prompt 0-C  
**Fix Commit:** _(pending)_

### BUG-012 — SelectionOverlay Canvas Drag Ignores Active Viewport
**Status:** 🔴 Confirmed  
**Priority:** Low  
**Affects:** `src/components/editor/SelectionOverlay.tsx` — `handleStartDrag` → `onPointerMove` lines 194–195  
**Symptom:** Dragging an absolute-positioned element while on Tablet viewport records the position change as a Desktop edit.  
**Fix:** Pass `viewport: currentViewport` and `structuralPath: selectedPath ?? undefined` to `applyLiveStyle` calls.  
**Prompt:** See `prompts-to-use.md` → Prompt 0-C  
**Fix Commit:** _(pending)_

---

## WILL-COME BUGS (Anticipated)

These are bugs that are LIKELY to emerge as new features are added. Track them proactively.

### WILL-COME-001 — Auto-Save Race Condition on File Switch
**Status:** 🔮 Future Risk  
**Trigger:** If user switches to a different file while a debounced auto-save timer is still pending for the old file, the old file's timer might write stale HTML under the wrong fileId.  
**Prevention:** In `autoSave()`, always use `timers.get(fileId)` — each fileId has its own timer. On file switch, call `clearTimeout(timers.get(previousFileId))` before switching.  
**Where to watch:** `src/lib/fs/auto-save.ts` + `src/components/editor/EditorStudio.tsx` (file switch logic)

### WILL-COME-002 — Palette Harmonizer Infinite Recursion on FALLBACK Color Parse Failure
**Status:** 🔮 Future Risk  
**Trigger:** If `parse("#6366F1")` itself returns null (culori edge case), `generateHarmonizedPalette(FALLBACK)` recursively calls itself forever.  
**Prevention:** Add a depth guard: `function generateHarmonizedPalette(hex: string, depth = 0): HarmonizedPalette { if (depth > 1) return hardcodedFallbackPalette; ... }`  
**Where to watch:** `src/lib/color/palette-harmonizer.ts`

### WILL-COME-003 — Shadow Preset Applied as Inline Style Conflicts with Tailwind Mode
**Status:** 🔮 Future Risk  
**Trigger:** Shadow presets apply `box-shadow` as an inline style. In Tailwind mode, if the user later removes it via the property panel, BUG-004 (custom CSS wipe) might delete it silently.  
**Prevention:** Fix BUG-004 first (Prompt 0-B). Shadow presets should emit a `kind: "style"` edit with `property: "box-shadow"` so the undo store and review modal handle them correctly.  
**Where to watch:** `src/components/editor/property-panel/ShadowPresetsGroup.tsx` + `live-style-engine.ts`

### WILL-COME-004 — Template URL Param XSS Risk
**Status:** 🔮 Future Risk  
**Trigger:** `/editor?template=../../etc` or any path traversal. If `EditorStudio` blindly fetches `fetch(`/templates/${templateId}.html`)`, a crafted URL could attempt to fetch arbitrary paths.  
**Prevention:** Validate `templateId` against `TEMPLATE_REGISTRY` IDs before fetching: `if (!TEMPLATE_REGISTRY.find(t => t.id === templateId)) return;`  
**Where to watch:** `src/components/editor/EditorStudio.tsx` — template URL param handler

### WILL-COME-005 — Animation Preset Classes Conflict with Existing Responsive Classes
**Status:** 🔮 Future Risk  
**Trigger:** Applying `transition-all duration-300` globally via AnimationBuilderGroup on an element that has `sm:transition-none` or similar responsive override — the apply logic removes all transition classes including the responsive prefix variants.  
**Prevention:** When removing "all other preset classes", only remove unprefixed variants. Leave `sm:`, `md:`, `lg:`, `hover:`, etc. untouched.  
**Where to watch:** `src/components/editor/property-panel/AnimationBuilderGroup.tsx` — class removal logic

### WILL-COME-006 — localStorage Quota Exhaustion on Large HTML Files
**Status:** 🔮 Future Risk  
**Trigger:** Auto-save stores HTML in localStorage. For very large HTML files (>500KB), combined with multiple open files, localStorage (5MB limit) can be exhausted, silently failing the save.  
**Prevention:** Already handled by `try/catch` in `autoSaveSync`. Consider adding a size check: `if (html.length > 300_000) return; // too large, skip autosave`  
**Where to watch:** `src/lib/fs/auto-save.ts`

### WILL-COME-007 — Support Page Ad Slot Blocked by Ad Blockers
**Status:** 🔮 Future Risk  
**Trigger:** Users with uBlock Origin, Brave shields, or similar will block Carbon Ads / AdSense scripts. The support page shows a blank area where the ad should be.  
**Prevention:** Add a fallback inside the ad container: if the ad slot element is empty after 2 seconds (ad blocked), show a friendly message: "Looks like you're using an ad blocker. Consider a Ko-fi donation instead ☕"  
**Where to watch:** `src/pages/support.astro` — `#support-ad` div

### WILL-COME-008 — Templates Page Filter State Lost on Browser Back
**Status:** 🔮 Future Risk  
**Trigger:** User filters by "SaaS" category on `/templates`, opens a template in the editor, hits browser Back — filter state is reset to "All".  
**Prevention:** Store active category filter in URL: `?category=saas`. Read it on mount with `URLSearchParams`.  
**Where to watch:** `src/pages/templates.astro` — filter tab client script

---

## BUGS FIXED (Archive)

_(Move bugs here when their fix commit is merged)_

| Bug ID | Description | Fixed In | Commit |
|---|---|---|---|
| _(none yet)_ | | | |

---

## HOW TO ADD A NEW BUG

Copy this template and paste it into the appropriate priority section:

```markdown
### BUG-XXX — [Short Title]
**Status:** 🔴 Confirmed  
**Priority:** Critical / High / Medium / Low  
**Affects:** `path/to/file.ts` — function/component name, line numbers  
**Symptom:** What the user experiences  
**Root Cause:** Why it happens  
**Fix:** How to fix it  
**Regression Test:** test file and test description  
**Prompt:** Link to prompt in prompts-to-use.md if available  
**Fix Commit:** _(pending)_
```
