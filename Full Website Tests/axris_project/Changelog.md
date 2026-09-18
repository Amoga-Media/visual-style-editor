# Changelog

## Session 11 — Accessibility (WCAG 2.1 AA) pass

Scope: dedicated accessibility session — keyboard navigation, ARIA
correctness, focus order, `prefers-reduced-motion`, semantic HTML,
screen-reader compatibility. Not a redesign; nothing visual changed
except the footer copyright text getting very slightly lighter (a
contrast fix, see below) and two icons/labels gaining "(opens in a new
tab)" screen-reader-only text. Full detail on every finding, including
what was deliberately not touched and why, lives in
`ACCESSIBILITY_REPORT.md`, written this session — read that first if
you're picking this up.

### Fixed a long-standing tracked issue: missing desktop `<h1>` on 4 pages
- `Notes.md`'s Session 3, 8, and 9 addenda each independently called this
  out as "the single most-repeated open issue in the project": on
  `about-us.html`, `case-studies.html`, `contact.html`, and
  `services.html`, the real `<h1>` was `display: none` at desktop widths
  (Tailwind's `md:hidden`) while the visible large desktop heading was a
  `<p aria-hidden="true">` — meaning desktop screen-reader visitors got
  **zero** accessible top-level heading on any of these four pages, not
  a duplicate. Fixed by converting the desktop `<p>` into a real `<h1>`
  on all four (mutually exclusive with the mobile `<h1>` by breakpoint,
  same fix pattern already accepted and shipped for the homepage hero
  back in Session 2). See `ACCESSIBILITY_REPORT.md` §2.1 for why this
  specific fix was chosen over the homepage's later, more aggressive
  single-fluid-`<h1>` simplification (short version: preserves the
  letter-by-letter reveal animation on desktop without a unilateral call
  to drop it).

### Keyboard access
- **Desktop "Services" nav dropdown was keyboard-unreachable.**
  `:hover`-only reveal + `visibility: hidden` closed-state meant the 8
  links inside were skipped entirely by Tab. Added `:focus-within`
  alongside the existing `:hover` in `navbar.css` — pure CSS, no JS.
- **Contact-page success/error modals had no focus management at all**
  despite `role="dialog" aria-modal="true"`. `pages/contact.js` now has
  a `makeDialogController()` factory giving both modals the same
  focus-trap / initial-focus / Escape-to-close / backdrop-click /
  return-focus-on-close behavior `ui/mobile-nav.js` already implements
  for the mobile menu — that was already the reference pattern in this
  codebase, just not applied here yet.
- **Legal-page table-of-contents links scrolled but never moved focus.**
  `ui/toc.js` now sets `tabindex="-1"` + `.focus({ preventScroll: true })`
  on the target `.legal-section` once the scroll (Lenis or native)
  completes, so a keyboard user's next Tab continues from the section
  they just jumped to.

### ARIA / semantic correctness
- **Homepage `<details>` FAQ was lying about its own state to AT.**
  `initDetailsFAQ()` has to permanently force the native `open` attribute
  true (so the grid-track expand/collapse animation has something
  rendered to measure) — but that also means the browser's automatic
  aria-expanded-from-`<details>` inference was permanently wrong. Added
  an explicit `aria-expanded` on the `<summary>`, kept in sync with the
  real visual state, which overrides the incorrect native inference.
- **Service-page FAQ buttons (`.faq-btn`) had no ARIA state at all.**
  `initFAQ()` now wires `id`/`aria-controls` between each button and its
  panel and toggles `aria-expanded` in the existing click handler.
- **Both Google Maps iframes had no `title`** (`about-us.html`,
  `contact.html`) — added one.
- **Duplicate marquee logos were announced twice** — `aria-hidden="true"`
  on the second (seamless-scroll-only) copy; the first still announces.
- **173 decorative icon SVGs, 0 with `aria-hidden`, across all 16 pages.**
  Checked first that none carried real meaning (no `aria-label`/`role`/
  `<title>` on any of them) and that no icon-only control would be left
  nameless by hiding its icon (none found) — then batch-added
  `aria-hidden="true" focusable="false"` to all 173.
- **Cookie-consent banner had no landmark or accessible name** —
  `role="region" aria-label="Cookie consent"` added (non-modal, doesn't
  steal focus — it's a genuinely non-blocking banner), decorative 🍪
  emoji hidden.

### Color contrast
- **Footer copyright line failed contrast** (`text-gray-600` on the dark
  footer background — 2.6:1, needs 4.5:1) while the line directly below
  it already correctly used `text-gray-400` (7.85:1). Matched it.
- Computed real contrast ratios for the project's actual color tokens
  (`tailwind.config.js`'s `stone`-aliased-to-`gray` palette) rather than
  eyeballing — see `ACCESSIBILITY_REPORT.md` §2.10 for the table. Broader
  sweep of the other 291 `gray-500`/`gray-600` usages and `text-brand`
  as solid text **flagged, not done** — needs a rendered page or an
  automated contrast tool to know which usages actually sit on which
  background; not guessed at blind.

### Verified
- `npm run build` completes cleanly (fresh `npm install`, full
  `build:css`/`build:js`/`version-assets`).
- `node --check` on every hand-edited JS file (syntax-valid).
- Structural HTML sanity pass across all 16 pages + both shared
  components: balanced tags (Python `html.parser`, stack-based check —
  zero mismatches), every `<h1>` open/close pair balanced on the 4 pages
  touched in §1, zero remaining `<svg>` without `aria-hidden`, zero
  remaining `<img>` without `alt`.
- **Did not run `scripts/smoke-test.js`** or `npm run serve` — out of
  scope for this session per the request. Run before deploying, same
  flag Session 9 and 10 both left for their own changes.

## Session 10 — Performance & Core Web Vitals pass

Scope: dedicated performance session — LCP, CLS, INP, TTFB, JS payload,
image weight, paint cost, caching correctness. Not a redesign; nothing
visual changed except image sharpness (strictly up, see below) and the
brief absence of a "flash of no nav" on slow connections. Full detail on
every measurement and the items considered but deliberately *not* done
(with reasoning) lives in `PERFORMANCE_REPORT.md`, written this session —
read that first if you're picking this up.

### Images
- **Logo (`logo.png`, every page via `navbar.html`)**: was shipping a
  2312×1071 source for a 130px display width — a ~17x oversample. Resized
  to 400×185 (real retina headroom, not zero headroom) and added a WebP
  sibling via `<picture>`. 52.9KB → 11.4KB PNG fallback / 7.4KB WebP.
  Same fix applied to the footer's `logo-white.png` (725×344 → 360×171;
  87.9KB → 22.4KB PNG / 13.8KB WebP) and the mobile-menu's second `<img>`
  reference to the same oversized source. `logo-white2.png` is unreferenced
  anywhere in the codebase (checked every `.html`/`.js`/`.css`/`.xml`) —
  left in place rather than deleted, but flagged as dead weight.
- **Hero.jpeg (homepage LCP element) + the 8 scroll-story stage images**
  (`strategy`, `optimization`, `mapping`, `conversion`, `impact`, `launch`,
  `Execution` — `outreach` excluded, see below): added WebP siblings via
  `<picture>`, ~28-50% smaller than the existing JPEGs at equivalent
  visual quality. The homepage's `<link rel="preload" as="image">` for the
  LCP element now points at `Hero.webp` with `type="image/webp"` so the
  preload actually matches what the `<picture>` element will pick in
  ~99% of browsers, rather than preloading a JPEG the page won't use.
  **`outreach.jpeg` was deliberately left alone** — its WebP re-encode
  came out *larger* than the existing JPEG at every quality level tested
  (60-80); shipping a "modern format" that's bigger than the original
  would be optimization theater, not optimization.
- Did **not** touch the ~50+ hotlinked Unsplash/Pexels/pravatar/pinimg
  images — self-hosting them is still blocked by this sandbox's network
  allowlist, exactly as Session 2's addendum already documented. Not
  re-litigated here; see `PERFORMANCE_REPORT.md` for what a future
  session with that access should do.

### JS
- **`pages/contact.js` split into `contact.js` (5KB) + a new
  `contact-submit.js` (209KB, all of it `@supabase/supabase-js`)**. The
  Supabase client used to be a static import, meaning all ~190KB of it
  was parsed/evaluated as part of contact.html's critical initial script
  even though it's only ever used at the moment someone submits the
  form. `contact-submit.js` is now its own `build.js` entry point, loaded
  via a runtime-injected `<script>` tag during idle time (`requestIdle
  Callback`, `contact.js`'s `prefetchSubmitChunk()`) rather than bundled
  — ready by the time a real visitor finishes the form, off the critical
  path for everyone else. Submission contract (Supabase URL/key, table/
  column names) is untouched — see `file-ownership.md` Responsibility 10.
- GSAP/ScrollTrigger triple-bundling (`architecture.md` §7.1) was
  **already fixed before this session** (the `externalGlobalPlugin` in
  `build.js`) — confirmed via `esbuild.analyzeMetafileSync`, not
  re-verified by assumption. Nothing to do here.
- Considered lazy-loading `Draggable`/`InertiaPlugin` (~34KB of every
  page's `main.js`, used only for the mobile-nav swipe-to-dismiss and the
  draggable marquee) out of the critical bundle. **Deliberately not
  done** — Session 9's own changelog documents two real, subtle bugs
  already found in this exact code path (Draggable's baseline-caching
  behavior), and this sandbox has no way to visually or interactively
  re-verify a change to it. Flagged in `PERFORMANCE_REPORT.md` as a real
  opportunity for whoever can test it properly.

### Loading strategy
- **`<link rel="preload" as="fetch" crossorigin>` for `navbar.html` and
  `footer.html`**, added to all 16 pages. These were already fetched at
  runtime by `core/components-loader.js` (unchanged, still the actual
  injection mechanism) but only once `main.js` had parsed and started
  executing; the browser's preload scanner now discovers and starts
  these two requests immediately, in parallel with CSS/fonts, well before
  `main.js` is even done downloading — shortens the "flash of no nav"
  window without touching the injection logic itself. Confirmed nav is
  `position: fixed` and footer is append-only, so neither was actually
  contributing measured CLS before this — this is a perceived-load /
  time-to-interactive-nav fix, not a CLS fix.
- **Asset cache-busting** (`scripts/version-assets.js`, new — wired into
  `npm run build` after `build:css`/`build:js`). `.htaccess` now sends
  `Cache-Control: public, max-age=31536000, immutable` for CSS/JS/images,
  which is only safe on a *stable filename* if that filename changes
  whenever the content does. It didn't before this session — a returning
  visitor could've been served a stale `main.js` for up to a year after a
  real deploy. Every CSS/JS reference across all 16 pages now carries a
  `?v=<content-hash>` query string, computed at build time and idempotent
  across repeated builds with no source changes.
- Added a Brotli compression block to `.htaccess` alongside the existing
  gzip one (`<IfModule mod_brotli.c>` — no-op, not a risk, on hosts
  without the module).

### Verified
- `npm run build` completes cleanly (fresh install, clean rebuild from
  deleted `assets/css`/`assets/js`, confirmed reproducible).
- `node --check` on every built JS bundle (syntax-valid).
- Structural HTML sanity pass (BeautifulSoup) across all 16 pages:
  every `<picture>` has exactly one `<img>`, every page has both new
  preload links, every CSS/JS reference carries a version query string.
- **Did not run `scripts/smoke-test.js`** (the real jsdom + live-server
  regression check) — explicitly out of scope for this session per the
  request. Run it before deploying, same as Session 9 flagged for its own
  changes: `npm run serve` in one terminal, `npm test` in another.

## Session 9 — Mobile experience redesign ("mobile deserves its own experience")

Scope: stop treating mobile as "desktop, shrunk." Retuned typography and
section-rhythm spacing specifically for phone-width viewports (not just
reused desktop values below a breakpoint), replaced the hover-based
interaction language with real touch feedback, gave the homepage's
4-stage process section its own bespoke mobile scroll-story instead of
its previous static fallback, and closed out several real mobile-specific
bugs found during testing — one pre-existing, several introduced and
caught by this session's own new code before shipping. Full
`npm install` + build + Playwright-driven mobile-viewport smoke test
across 7 pages this session — see Verified below.

### New — mobile scroll-story (homepage, `#horizontal-services-mobile`)
- `src/js/motion/mobile-story.js` (new) + `mobile/mobile-experience.css`
  §6 (new) — animation-system.md flagged this section as duplicating the
  desktop horizontal-pinned-timeline markup into a second, static,
  motion-free block for mobile, with every stage visible at once and no
  scroll-communicated relationship between them. This gives mobile its
  own equivalent set piece instead: a slim progress rail stays sticky
  just below the mobile nav for the section's duration, its fill bar
  scrubbing to overall scroll progress and its "01 / 04 · Data
  Intelligence"-style index/label crossfading to match whichever stage
  is centered, while each stage card gets a scale+fade entrance (owned
  entirely by this new module — added `[data-mobile-story-card]` to
  `reveal.js`'s `EXCLUDE_SELECTOR` list, same reasoning as the existing
  `.ht-track` entry, so the generic auto-reveal pass doesn't also
  independently animate the same card's heading/paragraph and produce a
  doubled, uncoordinated entrance).
  - Deliberately **not** a GSAP-pinned scroll-jack: pinning each of the
    4 cards in sequence would mean four back-to-back scroll-hijacked
    holds, which fights momentum scrolling and reads as laggy on touch —
    the exact reason `scroll-story.js`'s own desktop timeline uses
    `position: sticky` over `pin: true`. This mirrors that same
    judgment rather than introducing a second, heavier convention for
    mobile specifically.
  - Uses `ScrollTrigger.matchMedia` (rather than this codebase's usual
    static `isMobileViewport` read — see its own doc comment in
    `core.js` for why a static read is normally the right call here)
    specifically because this feature has real teardown/setup work to
    hand back on a breakpoint crossing (killing triggers, clearing an
    inline `scaleX`), which `matchMedia` provides for free.
  - Swapped the section's 4 hotlinked Unsplash/Pexels images for the
    same self-hosted `/assets/images/{strategy,conversion,outreach,
    optimization}.jpeg` the desktop timeline already uses — one fewer
    third-party origin in the request waterfall on mobile specifically,
    and removes a reliability dependency `design-system.md` had already
    flagged.
  - Considered adding `data-parallax` to each card's image alongside its
    `image-wipe` reveal for a persistent drift effect; didn't ship it.
    `image-wipe`'s own reveal timeline animates the image back down to
    `scale: 1` (exactly filling its frame) once the entrance finishes,
    so a continuous parallax translateY afterward would have exposed a
    sliver of empty edge with no persistent overscan margin to move
    within. Fixable by giving the image a permanent (not one-time) scale
    buffer, but that changes `reveal.js`'s shared `image-wipe` primitive
    for every other image using it site-wide — out of scope for a
    mobile-only pass; noted here for a future session.

### New — dedicated mobile CSS layer
- `src/css/mobile/mobile-experience.css` (new, imported last in
  `main.css` — see that file's own comment on why load order here is
  load-bearing, not incidental) — typography, spacing, touch
  interactions, forms, and performance, organized as one file with its
  own section-by-section header rather than scattered edits across
  every component file. Full rationale for each piece lives in the
  file itself; summary:
  1. **Typography** — `base/typography.css`'s fluid clamps were tuned
     against the full 320→1536px range at once, which leaves the low
     end (the only end a phone ever renders) conservative — `.text-
     fluid-h1` sits barely above its own floor at a 375px viewport.
     Retuned the mobile-only low end of `.text-fluid-h1/h2/h3` to start
     bolder and hit their own (lower) ceiling sooner, rather than still
     reaching for a 5rem desktop target it'll never get close to below
     768px. Desktop's clamp is completely untouched above that width.
  2. **Spacing rhythm** — `design-system.md` documents `py-16/20/24/32`
     (± matching `pt-`/`pb-` halves) as one recurring section-rhythm
     recipe used identically 77 times across all 16 pages, which is
     exactly what makes it safe and high-leverage to retune centrally:
     fixed once here, inherited everywhere, no per-page markup edits and
     no risk of missing an instance. ~35–40% tighter across the board,
     proportionally, only below 768px — a phone is short; a rhythm
     tuned to feel spacious on a 1440px desktop viewport just reads as
     "a lot of empty space to scroll through" on a 6" screen.
  3. **Touch interactions** — `@media (hover: none)` neutralizes the
     desktop hover-transform lift on cards/buttons/logo (mobile browsers
     fake `:hover` on tap and hold it until the next unrelated tap
     elsewhere, so a tapped card could visibly "stick" mid-lift) and
     replaces it with a real `:active` press-scale instead — a distinct
     touch interaction language rather than a broken version of the
     desktop one. (`hover: none` rather than a width query on purpose:
     this is about input capability, so a touch laptop correctly gets
     the same treatment.)
  4. **Forms** — `pages/contact.html`'s fields use `text-sm` (14px)
     below `md`. Below 16px, iOS Safari zooms the whole viewport in on
     input focus — meaning, on this specific site, every mobile visitor
     who tapped into the lead-gen contact form got an unrequested zoom
     the moment they started filling it out. Scoped the fix to `#contact-
     form` by ID rather than a blanket `input` selector.
  5. **Performance** — `atmosphere.css`'s fixed, full-viewport film-grain
     layer (`body::after`) combines `position: fixed` with
     `mix-blend-mode`, which forces the browser to keep isolating and
     re-compositing that layer against everything beneath it on every
     scroll frame — a real cost on mobile GPUs for a texture too subtle
     to notice missing at arm's length on a phone screen. Disabled below
     768px. Also trimmed the two `blur-3xl` decorative glow circles
     (contact page, CTA band) from a 64px to a 28px blur radius on
     mobile — same category of cost, smaller effect.

### Fixed — mobile navigation (`ui/mobile-nav.js`, `components/navbar.css`)
1. **No focus trap.** The menu is a `role="dialog" aria-modal="true"`
   element, but Tab could previously escape into the page content
   sitting behind it — a real keyboard-trap failure for anything marked
   as modal. Added a standard first/last-focusable Tab-wrap, recomputed
   on every keydown (not cached once) since the services accordion
   opening/closing changes what's actually focusable inside the panel.
2. **Focus dropped to `<body>` on close.** Now explicitly returned to
   the hamburger button that opened the dialog.
3. **New — swipe-down-to-dismiss**, via a dedicated grab-handle element
   (not the whole panel, so an ordinary scroll/tap inside the link list
   is never mistaken for a dismiss gesture) and the same `gsap/
   Draggable` already bundled for the marquee (`motion/drag.js`) — one
   drag engine for the whole site rather than hand-rolled touch
   listeners. **Two real bugs found and fixed while building and testing
   this, before it shipped, both via a Playwright mobile-viewport
   harness rather than eyeballing it:**
   - `.ax-header-wrapper`'s `z-index: 10001` sat *above* `#ax-mobile-
     menu`'s `z-index: 10000` — a pre-existing inversion, unrelated to
     this session's own additions, that meant a tap anywhere in the top
     ~80px of the screen while the mobile menu was open (including its
     own close button, and now this new drag handle) was actually
     landing on the always-present fixed header sitting invisibly on
     top of it. Confirmed via `document.elementFromPoint()` at the
     handle's own coordinates returning `.ax-nav-classic` instead of the
     handle itself. Fixed by raising the open dialog's z-index to
     10010 — strictly above the header whenever it's open.
   - Even after that fix, Draggable didn't track drags correctly: it
     caches its own internal x/y baseline once, at `Draggable.create()`
     time, which happens on page load while the panel is still in its
     closed (`translateY(-100%)`) state. Every open/close after that is
     driven by `navbar.css`'s `.ax-menu--open` class — entirely outside
     Draggable's own knowledge — so by the time a user actually opened
     the menu normally and then tried to swipe it, Draggable's internal
     tracking was still referenced to the stale closed-state position,
     producing wildly wrong deltas (confirmed by instrumenting `onDrag`
     directly: reported `this.y` values around −800 immediately on
     press, on a panel that was visually sitting at `y: 0`). `gsap.set(
     mobileMenu, { y: 0 })` alone only fixes the *visual* position, not
     Draggable's own bookkeeping — the actual fix is `this.update(true)`
     in `onPress`, which tells Draggable to re-read the current
     rendered transform as its new baseline before any drag math runs.
   - The panel's open/close transform stays fully owned by `navbar.css`'s
     `.ax-menu--open` class at rest; the drag only ever writes a
     temporary inline transform while physically in progress, and always
     clears it afterward (`clearProps: "transform"`) so the two systems
     never contest authority once a gesture ends.
4. **Safe-area insets** — `padding-top: env(safe-area-inset-top)` on
   `#ax-mobile-menu`, `padding-bottom: calc(2rem + env(safe-area-inset-
   bottom))` on `.ax-mobile-footer`. Without these, `inset: 0` alone
   put the drag handle/close button under the notch on notched phones,
   and the primary CTA button's tap target partly behind the home-
   indicator bar on iPhones. `env()` resolves to `0` on devices without
   a safe-area concept, so this is a no-op everywhere else.

### Fixed — sticky hover / wasted listeners on touch (`motion/micro.js`)
`initHoverLift()` and `initImageHoverReveal()` were attaching
`mouseenter`/`mouseleave` (and, in the case-study preview variant,
`mousemove`) listeners to every card/image site-wide unconditionally,
including on phones — unlike `cursor-magnetic.js`'s `initCustomCursor`/
`initMagneticButtons`/`initCardTilt`, which were already correctly
gated behind `isTouch`. Two real problems, not one: mobile browsers fire
a synthetic `mouseenter` on tap but frequently never fire the matching
`mouseleave` until the user taps a completely different element (so a
tapped card could lift and visibly stay lifted after the tap — a "stuck
hover" that reads as a bug), and it was pure wasted listener registration
+ GSAP tween setup for an interaction metaphor that doesn't exist on a
touchscreen. Gated all three functions behind the same `isTouch` check
the cursor/magnetic/tilt functions already use; touch devices get real
`:active` tap feedback instead, defined in the new mobile CSS layer
above.

### Changed — auto-reveal cost on mobile (`motion/reveal.js`, `core.js`)
- New `isMobileViewport` flag in `core.js`, alongside the existing
  `isTouch` — deliberately a different question (`core.js`'s own
  comment explains why a touch laptop and a 375px phone need different
  answers here). `initAutoReveals()`'s *automatic* heading detection
  (anything not explicitly hand-authored with its own `data-reveal`)
  now downgrades from `letter-by-letter` to `fade-up` on mobile
  viewports. Letter-splitting creates one individually-tweened `<span>`
  per character plus a 3D `rotateX` per span (`utils/text-split.js`) —
  cheap for the handful of desktop hero moments that explicitly opt
  into it, genuinely expensive applied automatically to *every*
  undecorated heading on weaker phone hardware. Hand-authored `data-
  reveal="letter-by-letter"` markup (a deliberate per-page choice, e.g.
  `hero.js`'s own single-headline choreography) is untouched — this
  only changes the "nobody annotated this, so auto-tag it" path.
  Paragraph word-splitting is left as-is on mobile; word-level splitting
  is already far cheaper (tens of words vs. 100+ characters) and the
  auto-heading path was the actual worst offender.

### Fixed — the site's two remaining legacy duplicate-hero-heading
pages were left alone this session
`pages/about-us.html` and `pages/case-studies.html` still carry the
pre-Session-8 `hidden md:block` desktop `<h1>` /
`block md:hidden` mobile `<h1>` pattern (Session 8 only fixed the
homepage's version of this same bug). Their *mobile* heading already
renders correctly and accessibly today — this is a desktop
accessibility gap, not a mobile-experience one — so fixing it was kept
out of this session's scope rather than pulled in opportunistically.
Noted here so it isn't lost; see `design-system.md` for the fuller
unification `about-us.html`'s own version of this fix would need.

### Known pre-existing issue, confirmed out of scope
`pages/case-studies.html` throws `Cannot read properties of undefined
(reading 'registerPlugin')` in this session's Playwright smoke-test
harness. **Confirmed present in the untouched original session-8
project** (tested against a completely fresh extraction of the
uploaded zip, before any of this session's changes) — not introduced by
anything here. Left as-is; a general page-load-ordering bug, not a
mobile-specific one, and outside this session's brief.

---

## Files touched this session

```
src/css/mobile/mobile-experience.css   (new)
src/js/motion/mobile-story.js          (new)
src/css/main.css                       (one import line, last)
src/js/motion/core.js                  (isMobileViewport flag)
src/js/motion/reveal.js                (mobile heading downgrade, EXCLUDE_SELECTOR entry)
src/js/motion/micro.js                 (isTouch guards on hover-lift/image-hover/case-study preview)
src/js/main.js                         (registered initMobileStory)
src/js/ui/mobile-nav.js                (focus trap, focus return, swipe-to-dismiss)
src/css/components/navbar.css          (drag-handle styles, z-index fix, safe-area insets)
assets/components/navbar.html          (drag-handle markup)
index.html                             (#horizontal-services-mobile section only —
                                         progress rail markup, self-hosted images,
                                         data-mobile-story-card/-label attributes)
```

## Verified
- `npm install` + `npm run build` (CSS + JS) complete with no errors.
- Custom classes in the new `mobile/mobile-experience.css` (`.mobile-
  story-rail*`) confirmed present in the built `assets/css/main.css`
  after Tailwind's build, not purged.
- Playwright, 390×844 mobile viewport + touch emulation, across
  `index.html`, `about-us.html`, `services.html`, `contact.html`,
  `case-studies.html`, `lead-gen.html`, `appointment-setting.html`, each
  with and without `prefers-reduced-motion: reduce` — all clean except
  the pre-existing `case-studies.html` issue noted above (confirmed via
  a side-by-side run against a fresh, unmodified extraction of the
  session-8 zip).
- Mobile scroll-story rail: scroll-tested end to end — index/label
  advance 01→04 correctly, fill bar reaches a full `scaleX(1)` at the
  section's end.
- Mobile nav: open/close, `Escape` handling, focus trap entry point, and
  focus-return to the hamburger on close all confirmed via direct DOM
  assertions (not just visual screenshots). Swipe-to-dismiss confirmed
  both for a full swipe (closes) and a short sub-threshold drag (snaps
  back, panel remains open, functions normally afterward).
- Contact form input `font-size` confirmed 16px on a 390px viewport
  (was 14px) and unchanged at 1440px (already 16px there via the
  existing `md:text-base`, so no regression).



Scope: cursor, hover, click, focus, drag, buttons, links, cards, images,
forms — a direct-manipulation coverage pass across the existing engine,
not a new visual system. Audited every interactive surface against the
brief's explicit list and found two real, pre-existing bugs (not just
gaps) alongside the missing coverage, plus built the site's first actual
drag interaction. `npm install` + full build/test cycle run this
session — see Verified below.

### New file — the site's first real drag interaction
- `src/js/motion/drag.js` — the homepage logo marquee is now
  grab-and-throw, via `gsap/Draggable` + `gsap/InertiaPlugin` (both free
  in the installed gsap 3.14.2, confirmed by inspecting
  `node_modules/gsap` directly before relying on them). Full design
  rationale is in the file's own header comment; the short version:
  - `motion/marquee.js` keeps owning the *ambient* auto-scroll (a plain
    per-frame decrement in core.js's shared ticker); `drag.js` only
    takes over while a press/throw is actually live
    (`raf.marqueePaused`), then hands `raf.marqueeX` back so the ambient
    scroll resumes from wherever the user let go instead of snapping.
  - Infinite drag-loop via the standard GSAP pattern (mutate `this.x`
    with `gsap.utils.wrap()` inside `onDrag`/`onThrowUpdate`), reading
    `raf.marqueeTotalWidth` live rather than captured at setup so a
    post-resize re-measure is honored immediately.
  - **A real race condition found and fixed before shipping**: an
    earlier draft used a flat `setTimeout(resume, 500)` in `onRelease`
    as a fallback for "released with ~zero velocity, no throw tween
    ever fires." That fallback would also fire mid-coast on any throw
    lasting longer than 500ms, yanking control back from InertiaPlugin's
    still-running tween. Fixed by checking `this.tween` (verified via
    the installed `gsap/Draggable.js` source that Draggable sets this
    synchronously, before dispatching `onRelease`, whenever a throw was
    actually created) — deterministic instead of guessed timing.
  - Reduced motion: a physics throw is exactly the category of motion
    this preference asks to remove, but a 1:1 user-driven position
    change isn't the same thing — so under
    `prefers-reduced-motion: reduce` the marquee becomes a plain native
    `overflow-x: auto` strip (momentum-free) instead of losing
    interactivity outright. This incidentally fixed a smaller
    pre-existing issue: `marquee.js` already fully no-ops under reduced
    motion, which left those visitors with a clipped, first-screenful-
    only strip and no way to reach the rest of the logos at all.
  - Touch gets the same `Draggable` instance (default
    `allowNativeTouchScrolling` lets vertical page scroll pass through
    while horizontal drags are captured) — previously touch visitors
    had zero interactive control over the marquee, only the ambient
    auto-scroll to watch.

### New cursor state
- `cursor.css` + `cursor-magnetic.js` — a horizontal pill ring
  (`.ax-cursor--drag`) auto-applied via `[data-cursor="drag"]`, which
  `drag.js` sets on the marquee track at init (same "promote via JS, no
  markup change" convention `initMagneticButtons()` already uses for
  `.btn-magnetic`). A tighter `.ax-cursor--dragging` variant shows while
  actually held, via two new custom events (`ax:marquee-grab`/
  `-release`) `drag.js` dispatches independent of plain mouseover/out.
  Checked drag-zone hover first and exclusively in the hover-detection
  logic — otherwise the marquee's `<img>` children would also match the
  generic `img` hover selector and show both ring states at once.

### Fixed — pre-existing bugs found during the audit (not introduced this session)
1. **`initHoverLift()` / `initImageHoverReveal()` (`micro.js`) had no
   `prefers-reduced-motion` guard.** Both set an inline `transform` via
   GSAP, which — being inline — wins the cascade over `cards.css`'s own
   `@media (prefers-reduced-motion: reduce) { transform: none }` block
   on any element both systems touch, silently defeating a guard that
   was itself written correctly. The bug was invisible because nothing
   had compared the two systems side by side before. Fixed by adding
   the same `if (prefersReducedMotion) return;` guard every other
   direct-manipulation function in the engine already has.
2. **`cookie-consent.css` had `cursor: none !important` on the banner's
   link and buttons** — the one place on the site that hid the native
   cursor unconditionally, with nothing to replace it for touch,
   reduced-motion, or no-JS visitors (`initCustomCursor` is skipped in
   all three of those cases). Every other clickable element on the site
   keeps its native cursor visible alongside the optional ring overlay;
   removed the two declarations so the banner now matches.
3. **Case-study quick-browse hover preview (`case-studies.html`) had a
   real mouse/keyboard parity gap.** `focus` already swapped the
   preview `<img>`'s `src`, but nothing ever set the preview box's
   opacity/scale, so a sighted keyboard user tabbing through the list
   got the underlying content change with none of the visible reveal a
   mouse user gets. Fixed with a dedicated `focus`/`blur` show/hide
   pair, positioned from the focused link's own bounding rect since
   there's no pointer coordinate to follow for keyboard input.

### Extended — click/press feedback (previously had none)
- `accordion.css` — FAQ/service-page accordion triggers now have a real
  `:active` press response; folded into the file's one existing
  `prefers-reduced-motion` block rather than adding a second.
- `navbar.css` — the mobile hamburger button now dims on hover and
  scales on press; previously had zero tactile response beyond its own
  open/close line morph.
- `cookie-consent.css` — banner buttons gained `:active` press feedback
  and `:focus-visible` (had neither before), alongside the cursor fix
  above.

### Extended — keyboard focus parity
- `cursor-magnetic.js`'s `initCardTilt()` — `focusin`/`focusout` now
  apply a fixed gentle tilt+lift as the keyboard equivalent of the
  mouse-position-driven hover tilt (which has no keyboard analog by
  nature). Previously a Tab-only visitor got zero motion feedback on
  any `[data-tilt]` card.
- `micro.js`'s `initHoverLift()` / `initImageHoverReveal()` — added
  `focusin`/`focusout` alongside `mouseenter`/`mouseleave` (not
  `focus`/`blur`, so cards that wrap a link/button rather than being
  focusable themselves still lift — matches `cards.css`'s own
  `:focus-within` convention).
- **12 HTML files, 64 classes** — every `group-hover:UTILITY` class
  site-wide now has a matching `group-focus-within:UTILITY` sibling.
  Done with a small one-off script
  (`add_focus_within.py`, not shipped — same "scratch tool, not part of
  the deliverable" treatment this project's earlier `migrate_tokens.py`
  got) rather than by hand, because `group-focus-within` is a strict
  superset of `group-focus` (`:focus-within` matches an element that
  itself has focus, *or* contains a focused descendant) — so one
  variant, added as a sibling of every `group-hover:` class it mirrors,
  is always correct regardless of whether the `.group` element is
  itself the link or wraps one, and is provably never a regression: on
  a `.group` with no focusable descendant anywhere, the added rule is
  simply inert. Pure text-level regex against the raw files (not a
  DOM parse/reserialize), for the same zero-reformatting-risk reason
  `migrate_tokens.py` used one. Touched: `index.html`,
  `pages/contact.html`, `pages/services.html`,
  `pages/case-studies.html`, and 8 service-page templates.

### Forms — activated CSS that was already shipped waiting for this
`forms.css` (Session 5) already had an `[aria-invalid="true"]` error
state and a `.form-error-text` style with a comment saying explicitly
this was "an error-state hook forms.js can toggle" — nothing had ever
toggled it. `pages/contact.html`'s form relied entirely on native
browser constraint validation (default tooltips) for its four required
fields.
- `pages/contact.html` — added `novalidate` to `#contact-form`, so this
  page's validation gets the same crafted, on-brand treatment as its
  already-custom success/error modals instead of the browser default.
- `src/js/pages/contact.js` — new validation layer: required-field +
  email-format checks on blur, live re-validation on input once a field
  is marked invalid (so a fix clears the error immediately rather than
  waiting for the next blur), and a pre-flight check on submit that
  focuses the first invalid field and gives it a brief GSAP shake
  (skipped under reduced motion — the `[aria-invalid]` border/glow
  color change from `forms.css` still applies) instead of ever reaching
  the network call. `form.reset()` on success now also clears the
  custom error state, since `reset()` only clears field values.
- `forms.css` — a quick, tasteful fade/slide-in for the error text
  (`@keyframes ax-error-in`, disabled under reduced motion) instead of
  the message popping in abruptly; `:empty` variant removes the row's
  margin when there's no message so a validated-clean field doesn't
  carry a permanent empty gap underneath it.

### Files touched this session
- New: `src/js/motion/drag.js`
- JS: `src/js/motion/core.js`, `src/js/motion/cursor-magnetic.js`,
  `src/js/motion/micro.js`, `src/js/main.js`,
  `src/js/pages/contact.js`
- CSS: `src/css/components/cursor.css`, `accordion.css`, `navbar.css`,
  `cookie-consent.css`, `forms.css`
- HTML: `pages/contact.html` (one attribute), plus 12 files for the
  mechanical `group-focus-within:` pass (see above)
- Build output: `assets/css/main.css`, `assets/js/main.js`,
  `assets/js/pages/contact.js`

### Verified
- `npm install` clean (270 packages, 0 vulnerabilities) — this session
  started from a fresh checkout with no `node_modules`.
- `npm run build` (CSS + JS) clean throughout every round of edits, not
  just at the end.
- `npm test` (jsdom smoke test, server on :8080) — all 16 pages pass
  with zero JS errors, re-run after every structurally-significant
  change (new module import, core.js's shared-state changes, the
  contact.js rewrite).
- Brace-balance sanity check (`{` count vs `}` count) on every edited
  CSS file as a second signal alongside the build itself compiling
  clean.
- Spot-diffed the mechanical `group-focus-within:` pass output against
  the pre-pass files before rebuilding, to confirm the script only ever
  appended a class token and never touched anything else in the
  attribute.
- Read the installed `gsap/Draggable.js` source directly to confirm the
  `onRelease`/`this.tween` ordering the pause/resume handoff depends on
  — jsdom has no real pointer-drag/physics engine, so this couldn't be
  verified by the smoke test the way the rest of the session was;
  flagged here rather than assumed.

### What this session deliberately did not do
- **Did not extend drag to any other surface.** The case-studies
  quick-browse list is a vertical list, not horizontal; the pinned hero
  timeline is already scroll-scrubbed, and layering a second,
  independent drag gesture over an active `pin: true` ScrollTrigger is
  a materially riskier change than this session's scope justified. The
  marquee was the one clear, low-risk, already-continuously-moving
  candidate.
- **Did not add touchstart-based `:active` shims** for the new
  press-feedback rules (hamburger, FAQ triggers, cookie buttons) to
  work around iOS Safari's known `:active`-without-a-touch-listener
  quirk — plain CSS `:active`, consistent with how every other button
  on the site already handles press feedback.
- **Did not touch `pricing.css` / `testimonials.css`** — still
  unplaced, real-copy-pending components per Session 6/7's notes,
  unchanged this session.
- **Did not add `group-focus` distinctions** — see the
  `group-focus-within` rationale above for why the superset property
  makes that unnecessary.

### What's still open (unchanged from Session 7 unless noted above)
- Everything in Session 7's "still open" list is untouched by this
  session — pricing/testimonials components still unplaced pending real
  copy, imagery self-hosting still blocked on network access, the
  hero-image mask-feather idea still flagged as a follow-up.

## Session 7 — Atmosphere & cinematic depth system

Scope: purely visual/atmospheric — "responsible for atmosphere: depth,
lighting, textures, layering, background systems, noise, masks, blurs,
gradients, visual hierarchy... cinematic... nothing flat... don't overdo
glassmorphism... subtle realism, premium depth only." No animation,
copy, or information-architecture changes; no HTML touched at all this
session (confirmed by diff against the pre-session delivery — the only
files that changed are two CSS source files, the compiled CSS output,
and this documentation).

### New file
- `src/css/components/atmosphere.css` — the depth system, in eight
  parts (full rationale in the file's own header comment):
  1. **Site-wide cinematic grain** — a single fixed, full-viewport
     `body::after` layer built from an inline SVG fractal-noise filter
     (no extra image asset), blended via `mix-blend-mode: overlay` at
     ~3.5% opacity. Sits above ordinary page content but below the
     floating nav / cursor / cookie banner / page-transition curtain
     (all already ≥ 9999 in the existing z-index system), so UI chrome
     stays crisp. Static, not animated — cheaper, and nothing to gate
     behind `prefers-reduced-motion`. Explicitly disabled under
     `prefers-reduced-transparency: reduce`, `prefers-contrast: more`,
     and `@media print`.
  2. **Dark-surface ambient light** — two soft radial blooms
     (brand-blue key light upper-left, warm accent fill-light
     lower-right) plus a top "seam" shadow, on every `bg-dark` panel
     that's also `overflow-hidden` (sections, bento cards, CTA blocks),
     plus the footer specifically.
  3. **Brand-surface dimensional shading** — a soft top highlight
     falling off to a deeper edge, on every `bg-brand` structural panel
     (vision panel, services.html's brand bento cards, homepage final
     CTA) — same selector-safety logic as #2.
  4. **Light/white section depth** — a near-imperceptible top-anchored
     radial wash, scoped strictly to `<section>` (both `bg-light` and
     `bg-white` are also used on form inputs and small chips site-wide,
     which must not get a section-scale effect).
  5. **Card depth** — extends cards.css's own bordered-white-card
     selector with a hairline value-shift + faint brand-tinted top
     glow, additive via `background-image` only (never touches
     `background-color`, so it can't collide with cards.css regardless
     of import order).
  6. **Full-bleed photo vignette** — two-layer `inset box-shadow` on
     the actual `<img>` elements (story-timeline photos + hero
     portrait), tight edge + broad falloff, same "contact + ambient"
     logic as the site's existing two-layer boxShadow tokens.
  7. **Navbar lift** — `.ax-nav-classic`'s flat single shadow replaced
     with the site's own layered, ink-tinted shadow language (matches
     `tailwind.config.js`'s `boxShadow.lg` values) — no blur, no
     transparency change, still a solid white pill.
  8. Motion/accessibility guardrails, documented as a deliberate no-op
     since nothing above animates.

### A deliberate non-change, flagged rather than silently skipped
Considered adding `mask-image` edge-feathering to the hero portrait
image (a nice-to-have from the "masks" part of this session's brief)
but did not: the hero image's wrapper has no background color of its
own, so feathering it would reveal whatever's behind the wrapper
(currently the section's `bg-light`) — fine on the homepage as shipped,
but not something to blind-ship as a reusable pattern without checking
every page that might reuse this hero markup with a different section
background behind it. Worth a small dedicated pass if wanted; flagging
explicitly rather than shipping a mask that could silently break on a
future page.

### Why every technique here is safe on all 16 pages without an HTML pass
Audited all 93 `<section>` elements site-wide before writing anything:
only 20 combine `relative`+`overflow-hidden`. A decorative-layer
technique built on `::before`/`::after` positioned *behind* text via
z-index would have silently broken (glow painting over copy, or
escaping the section) on the other 73. Every rule above uses either
`background-image` (always painted behind an element's own content,
always clipped to its own box, regardless of that element's own
`position`/`overflow`) or `box-shadow: inset` directly on the specific
element it decorates (a paint effect of that element's own box,
independent of siblings' z-index). Full reasoning + the actual audit
numbers are in the CSS file's header comment for whoever picks this up
next.

### Extended
- `src/css/main.css` — one new import line, deliberately last (needs to
  win the one property, `.ax-nav-classic`'s `box-shadow`, it
  intentionally overrides).

### Verified
- `npm run build` (CSS + JS) — clean, no errors, from a clean
  `npm install`.
- Spot-checked the compiled `assets/css/main.css` directly for every
  new rule: the grain filter, the `bg-dark`/`bg-brand`/`bg-light`/
  `bg-white` ambient rules, the card gradient, the image vignette, and
  the navbar shadow override are all present post-build (colors appear
  as cssnano's `hsla()` renormalization of the rgba values this file
  was authored in — expected, not a bug).
- `npm test` (jsdom smoke test) — all 16 pages pass with zero JS errors.
- Diffed the whole project against the pre-session delivery: the only
  files that changed are `src/css/components/atmosphere.css` (new),
  `src/css/main.css` (one import line), `assets/css/main.css` (build
  output), and this changelog. Zero HTML/JS files touched.

### What's still open (unchanged from Session 6 unless noted above)
- Everything in Session 6's "still open" list is untouched by this
  session — pricing/testimonials components still unplaced pending
  real copy, imagery self-hosting still blocked on network access.
- The hero-image mask-feather idea above, if wanted as a follow-up.

## Session 6 — Component library completion

Scope: "rebuild every component" — cards, accordions, buttons, forms,
pricing, testimonials, tables, lists, navigation, footer — with
craftsmanship-level hover/focus states, better accessibility, better
responsiveness. Sessions 1–5 had already done real work on several of
these (buttons.css, cards.css, forms.css, navbar.css migration, the
FAQ engine unification in `motion/faq.js`), so this session's job was
to (a) finish the pieces that were still plain, unstyled markup —
accordion visuals, footer link/social hover, form control states the
original pass didn't cover — and (b) build the components that don't
exist on any page yet (pricing, testimonials, data tables, checklist/
feature lists) as real, documented, ready-to-use CSS so the capability
exists before a page needs it — same "build ahead of the specific page"
convention `implementation-order.md` Phase 1 already established.

### New files
- `src/css/components/accordion.css` — one shared visual language for
  both FAQ DOM shapes (`.faq-item` on 10 pages, native `<details>` in
  `.faq-index` on the homepage): left accent bar on open, hover wash,
  spring-eased icon rotation, `:focus-visible` rings on both the button
  and the native `<summary>`. The JS engine was already unified in
  Session 5's `motion/faq.js`; this closes the matching visual gap
  `component-map.md` flagged.
- `src/css/components/lists.css` — `.list-check` (checklist/deliverables
  rows, replaces bare bullet styling with a filled brand-colored check
  glyph and a hover pop) and `.list-feature` (compact single-line rows
  for card/pricing contents, with a `data-unavailable` strikethrough
  state for comparison use).
- `src/css/components/tables.css` — `.table-scroll` + `.table-premium`
  (+ `--dark` variant): a real data-table primitive with a horizontal-
  scroll wrapper for mobile instead of a squeezed grid. No page ships a
  `<table>` yet (architecture.md's page inventory confirms), so this is
  infrastructure, not a retrofit.
- `src/css/components/pricing.css` — `.pricing-grid` / `.pricing-card` /
  `.pricing-card--featured` / `.pricing-badge`. Axris sells via
  discovery call, not a self-serve pricing page, so there's nothing to
  retrofit today — this ships ready for whenever that changes.
- `src/css/components/testimonials.css` — `.testimonial-card` (+
  `--on-dark` variant): quote glyph, avatar, attribution block. Real
  client-quote copy needs to come from Axris directly, not be invented
  here — same reasoning as pricing.css. Case-study PDFs remain the
  site's actual proof-of-work mechanism for now.
- `src/css/components/footer-polish.css` — targets the recurring
  `hover:text-white` link recipe and the social-icon `rounded-full`
  recipe already in `footer.html` (same "recipe, not markup rewrite"
  technique `cards.css`/`buttons.css` established) to add an animated
  underline and a spring-eased icon lift, both mirrored on
  `:focus-visible` so keyboard users get equal feedback to mouse hover.

### Extended existing files
- `navbar.css` — added a `:focus-visible` pass across every interactive
  element (nav links, logo, hamburger, mobile sublinks). This had *no*
  focus styling at all before now — hover/active states existed, but a
  keyboard user tabbing through the floating pill nav had nothing
  visible to track, which is a real accessibility gap on the one
  component that renders on all 16 pages.
- `forms.css` — added checkbox/radio accent-color styling, a disabled-
  field state, and an `[aria-invalid="true"]` error-state hook contact.js
  can toggle without introducing a second class name that has to stay
  in sync with the `aria-invalid` attribute screen readers already read.

### A build-pipeline lesson worth flagging explicitly
Tailwind's JIT build purges any selector inside `@layer components { }`
whose literal class name doesn't appear in a scanned content file
(`tailwind.config.js`'s `content` globs). `accordion.css` and
`footer-polish.css` survived because `.faq-item`/`#global-footer` etc.
already exist in shipped HTML — but the first draft of `lists.css`,
`tables.css`, `pricing.css`, and `testimonials.css` used `@layer
components` too, and since none of those class names exist in any page
yet, the production build silently deleted all four files' rules with
no error. Fixed by dropping the `@layer` wrapper on those four files
(plain CSS, same as `buttons.css`/`cards.css` already do) — Tailwind
only tree-shakes what's inside its own layers, not arbitrary CSS.
**Confirmed post-fix**: `table-premium`, `pricing-card`,
`testimonial-card`, and `list-check` all present in the built
`assets/css/main.css`. Flagging this so whoever adds the *next*
not-yet-used component doesn't lose a session rediscovering it.

### Verified
- `npm run build` — clean, no errors.
- `npm test` (jsdom smoke test) — all 16 pages pass with zero JS errors.
  (Session 1's notes flagged not being able to run `npm run serve` +
  `npm test` together in a sandbox; that worked fine this session.)
- No HTML files were touched this session — every change is additive
  CSS targeting existing class/attribute recipes, so nothing above
  requires a markup migration across the 16 pages to take effect.

### Follow-up pass, same session: closing the "still feels generic" gaps
A second look at `.btn-magnetic` and `.rounded-card` — the two most-used
components on the entire site — found they still had no `:focus-visible`
state at all (real accessibility gap, not a style nitpick) and that their
only hover signature was "lift + shadow," which is a fine baseline but
reads as competent, not crafted. Addressed both, additively, no markup
changes:
- **`.btn-magnetic`** — added a one-time diagonal sheen sweep across the
  button on hover (a masked gradient pseudo-element, clipped to the pill
  shape), tuned separately for the brand-fill vs. white-fill variants so
  it's visible on both. Added a real `:focus-visible` ring (site-wide —
  every CTA on every page gets this for free).
- **`.rounded-card`** — the corner-mark dot now grows into a short accent
  line on hover instead of staying static, plus a deeper ambient shadow.
  Added `:focus-within` for any card that wraps a link.
- **Navbar logo** — added a restrained hover scale; it was the one
  interactive-looking element in the nav with zero feedback of any kind.
- `pricing-card` / `testimonial-card` — added matching `:focus-within`.
- Re-verified: `npm run build` clean, `npm test` — all 16 pages still pass.

### What's still open (unchanged scope from prior sessions unless noted)
- Pricing and testimonials components exist now but aren't placed on
  any page — that's a content decision (real pricing tiers, real client
  quotes), not a styling one. Flag when you have copy and I'll wire the
  markup into the relevant page(s).
- `design-system.md`'s imagery item (hotlinked Unsplash/Pexels/pravatar
  images) is still open — untouched this session, out of scope for a
  component pass.
- Everything else in `Notes.md`'s "what's left" list from Session 5 is
  still accurate; nothing this session changes that sequencing.

## Session 3 — Full visual-language redesign

Scope: this session's brief was explicitly visual, not architectural or
animation-related — "redesign the entire visual language," not the
information architecture, copy, or motion system (both already stable
from Sessions 1–2). Everything below is scoped accordingly: typography,
scale, spacing rhythm, cards, buttons, inputs, shadows, borders, icons,
color hierarchy, and CSS architecture. No animation code, page structure,
or copy was touched.

### Starting point

Sessions 1–2 had already resolved the two biggest structural issues
`design-system.md` flagged: the `tailwind.config.js` vs. actual-render
color split (site now genuinely runs on the configured `brand`/`dark`/
`light` tokens, verified — zero remaining `blue-600`/`gray-900` usage
across all 16 pages) and the `rounded-3xl`/`rounded-[2rem]`/
`rounded-[2.5rem]` three-way radius split (now one `rounded-card` token).
That meant this session could spend its budget on actual visual
craftsmanship instead of re-doing token plumbing — but it also meant the
site was tokenized and *safe*, not yet distinctive: right structure,
default-feeling execution. That's the gap this session closes.

### 1. Color — warm neutral scale + a real second accent

- **`gray` is no longer Tailwind's stock cool-blue scale.** It's now
  Tailwind's own `stone` ramp (a real, contrast-tested warm-neutral
  scale — not a hand-guessed palette), assigned to the `gray` key in
  `tailwind.config.js`. Every one of the ~950 existing `gray-*` utility
  classes across all 16 pages (`border-gray-200` ×222, `text-gray-600`
  ×229, etc.) re-tunes automatically toward the brand's warm paper/ink
  identity. **Zero markup changes** — this is the single highest-leverage
  color move available, and it's the main reason default Tailwind gray is
  such a recognizable "tell": almost every Tailwind site never touches it.
- **Formalized the site's second accent color.** The hover-cursor and
  cookie-banner "accept" button were hardcoding `#f97316` (stock Tailwind
  orange) directly in two different CSS files, independent of the token
  system (flagged in `design-system.md` as "not formally tokenized
  anywhere"). Retuned to a warmer clay/terracotta (`#C2542E`) and given a
  real token: `accent` in `tailwind.config.js`. Both usages now reference
  it via `theme()` instead of a repeated raw hex.
- **Swept every remaining hardcoded hex left over from the pre-Session-1
  palette:** the `:focus-visible` ring (`reset-and-a11y.css`), the legal-
  page scrollbar thumb + active TOC link (`scrollbar-toc.css`), and the
  cookie banner's background/link colors (was slate-900 + an unrelated
  blue, now the real `dark`/`brand` tokens). `theme-color` meta tags on
  all 16 pages updated from the old pre-migration blue (`#2563EB`) to the
  real brand hex (`#0EA5E9`).

### 2. Typography — a real bespoke scale, not Tailwind defaults

`tailwind.config.js`'s `fontSize` scale is now fully overridden (not just
extended). Sizes stay at Tailwind's stock rem values on purpose — every
page's existing responsive stacking (`text-4xl md:text-5xl` etc.) keeps
working exactly as before — but every step now carries a hand-tuned
line-height + letter-spacing pairing instead of Tailwind's flat defaults:
tight, slightly negative tracking on large display sizes (editorial,
premium feel) opening up to more generous leading on body copy. This
restyles every heading and paragraph on all 16 pages with **no HTML
changes**.

Also added (`typography.css`):
- `.eyebrow` — a real, reusable small-caps kicker-label component
  (uppercase, wide tracking, a short leading rule), replacing the several
  slightly-different hand-authored "uppercase tracking-widest" label
  variants scattered across the homepage. Available for section headers
  going forward; not force-migrated onto every existing instance this
  session since several live on dark/brand backgrounds where the
  light-surface default color would need a per-instance override — flagged
  for a follow-up pass rather than risked as a blind sitewide swap.
- `.prose a` / `.legal-content a` — a quiet on-brand underline treatment
  for inline links in long-form copy, replacing default unstyled/browser-
  blue fallbacks.

### 3. Shadows — tinted, layered, "handcrafted" instead of flat black-alpha

`boxShadow.sm/DEFAULT/md/lg/xl/2xl` in `tailwind.config.js` are fully
redefined: every one is now a two-layer shadow (a tight contact shadow +
a diffuse ambient one, ink-tinted rather than pure black-alpha) instead
of Tailwind's stock flat single-layer shadow — one of the most
recognizable "default Tailwind" visual tells. All ~380 existing
`shadow-*` usages across the site upgrade automatically.

### 4. Buttons — a real two-variant component, not hand-authored-per-instance

`design-system.md` documented exactly two recurring button recipes,
never owned by an actual component. New `src/css/components/buttons.css`
targets `.btn-magnetic` (already present on every CTA site-wide as the
JS hook `magnetic-buttons.js` uses — a free, zero-markup-change anchor)
combined with the existing `bg-brand` / `bg-white` / `bg-dark` utility
classes already on each button to add real tactile weight: a hover lift
+ press-down, a crafted hairline edge (darker-brand border on primary,
ink-tinted border on secondary), and two-layer colored ambient shadows
replacing the flat single `shadow-brand/20` every instance previously
hand-set. `prefers-reduced-motion` respected (keeps the color/border
feedback, drops the lift).

### 5. Cards — a signature motif instead of a plain white box

New `src/css/components/cards.css` targets the recurring "bordered
content card" recipe (`rounded-card` + `bg-white` + `border-gray-*` —
verified via `design-system.md`'s audit to be exclusively the card role,
never an image container, which uses `overflow-hidden` instead of a
border) via attribute-contains selectors, so it applies without
depending on hand-authored class order across all 16 pages:
- A small brand-colored corner mark — the one recurring handcrafted
  detail tying every card on the site back to the same visual language.
- A hover lift + border tint shift toward brand instead of a static box.
- A separate, mark-free lift treatment for the `bg-dark`/`bg-brand` card
  variants (a light dot on a brand-blue card would read as a bug, not a
  detail).
- Pills/badges (`rounded-full` + `border-gray-*` + `bg-white`, the
  "eyebrow chip" pattern used for hero badges and stat labels) get a
  matching hairline refinement, explicitly excluding `.btn-magnetic` so
  secondary buttons — which share the same base recipe — are never
  double-styled by both files.

### 6. Form fields — real focus/hover states, not just Tailwind's ring utility

New `src/css/components/forms.css`, scoped to `#contact-form` (the only
real form on the site) via ID selector — specific enough to win over the
fields' own utility classes without `!important` anywhere in the file.
Adds a subtle inset shadow (tactile, not flat), a real hover state
(previously fields only responded to focus), and a softer, single-layer
brand focus glow replacing the default Tailwind ring utility look.

### 7. Icons — one consistent stroke weight

`stroke-width` was inconsistently `"2"` (134 instances), `"3"` (42),
`"2.5"` (3), and `"1"` (1) for what's visually the same icon family
site-wide (`design-system.md` flagged this explicitly). Normalized to a
single `"1.75"` across all 16 pages + both shared components — a
mechanical, purely cosmetic regex pass, verified against the original
files afterward to confirm **zero structural changes**, only the
attribute value.

### 8. CSS architecture

Three new component partials (`buttons.css`, `cards.css`, `forms.css`),
each following the existing `src/css/components/` convention and each
documenting in its own header comment exactly which HTML recipe it
targets and why. Wired into `main.css` as a new, explicitly-commented
final import group — deliberately last in the post-Tailwind order so
these rules reliably win specificity ties against the inline Tailwind
utility classes they're re-skinning, without a single `!important`
anywhere in any of the three files. This matches the project's existing
"order matters" convention (see the comment block at the top of
`main.css`) rather than introducing a new one.

## Files touched this session

```
tailwind.config.js                    (full rewrite: colors, fontSize, boxShadow)
src/css/main.css                      (new import group)
src/css/base/typography.css           (.eyebrow, .prose/.legal-content a)
src/css/base/reset-and-a11y.css       (focus-ring token fix)
src/css/components/scrollbar-toc.css  (token fixes)
src/css/components/cursor.css         (accent token)
src/css/components/cookie-consent.css (dark/brand/accent token fixes)
src/css/components/buttons.css        (new)
src/css/components/cards.css          (new)
src/css/components/forms.css          (new)

+ mechanical stroke-width normalization ("2"/"2.5"/"3" → "1.75") and
  theme-color meta fix (#2563EB → #0EA5E9) across all 16 HTML pages and
  both assets/components/*.html partials — attribute-value-only changes,
  diffed against the pre-session files afterward to confirm no structural
  drift.
```

## Verified

- `npm run build` (CSS + JS) completes with no errors from a clean
  `npm install`.
- Spot-checked the compiled `assets/css/main.css` directly: `.text-5xl`,
  `.shadow-lg`, `.rounded-card`, `.text-gray-600`, and `.border-gray-200`
  all resolve to the new token values, not the old defaults.
- Diffed every one of the 16 edited HTML files against the pre-session
  originals with attribute-level normalization applied: **zero
  unexpected structural differences** — only the intended stroke-width
  and theme-color attribute values changed.
- `node --check` passes on every file under `src/js/` (unmodified this
  session, confirmed not incidentally broken by the CSS-only work).
- Full `npm test` (jsdom smoke test) was **not** run this session — per
  Notes.md, it needs a second running process (`npm run serve`) and hangs
  in this sandboxed environment. Run it yourself before deploying.

## What this session deliberately did not do

- **No animation changes.** Out of scope per this session's brief.
- **No copy or information-architecture changes.**
- **`.eyebrow` not force-migrated onto every existing uppercase-label
  instance** — see §2 above for why; a few live on dark/brand
  backgrounds where a blind regex swap risked an unreadable label color.
- **The homepage-hero-only accessibility heading fix from Session 2 was
  not extended to the other 15 pages this session** — still open, see
  Session 2's entry below and `Notes.md`. Not a visual-language item, so
  out of this session's explicit scope, but worth flagging again since
  it's the most-repeated known issue in the project.
- **Imagery self-hosting (`design-system.md` §Imagery) is still open,**
  for the same network-access reason Session 2 documented in `Notes.md`.

---

## Session 2 — Full re-audit + continued roadmap.md implementation

Scope: re-read every markdown doc and the entire repository from scratch,
audited every change from Session 1 against them, then continued
implementing `roadmap.md`'s ranked gap list (items not already closed in
Session 1).

### Audit of Session 1 — what held up, what needed fixing

I re-read `roadmap.md` and `README.md` in full for the first time this
session (Session 1 worked from the other six docs only) and used them as
an additional check. Verdict: no functional regressions found, but three
real issues were worth fixing rather than leaving:

1. **`tailwind.config.js` had CRLF line endings; every other file in the
   repo uses LF.** Not a bug, but a real inconsistency — normalized to LF.
   (Checked for mixed line-endings within the file first, in case a
   previous edit had partially converted it — it hadn't; the whole file
   was consistently CRLF, so this was pre-existing, not something Session
   1 introduced.)
2. **The `magnetic-buttons.js` fix was correct but under-verified.**
   Re-confirmed by rebuilding: the button auto-detection heuristic now
   matches `bg-brand`/`bg-dark` instead of the retired `bg-blue-6`/
   `bg-gray-9` string-prefix check.
3. **Rebuilt the whole project from a clean `npm install`** to confirm
   Session 1's build was reproducible, not just "worked once in that
   session." It was — `npm run build` completes with no errors, and the
   compiled CSS/JS were spot-checked (see "Verified" below) rather than
   just trusted from the build log.

Everything else from Session 1 — the color-token migration, the GSAP
external-global fix, the navbar CSS migration, the FAQ consolidation, the
hero accessibility fix, the hero entrance motion — held up under a fresh
read against the source docs and is kept as-is.

### Continued roadmap.md implementation

`roadmap.md` item numbers below refer to its "What's actually holding the
site back" ranked list.

**Item 7 — Card corner-radius inconsistency, resolved.**
Audited every single use of `rounded-3xl` sitewide (16 pages): all of them
turned out to be the identical role — a padded card (`p-6`/`p-8`/`p-10`)
with a border/shadow — interchangeably alongside the arbitrary
`rounded-[2rem]`/`rounded-[2.5rem]` values used for the same role
elsewhere. Rather than pick one of the three arbitrary values and
find-and-replace, added two named tokens to `tailwind.config.js`:
`rounded-card` (2rem) and `rounded-card-lg` (2.5rem, the larger step
already used at bigger breakpoints, e.g. `case-studies.html`'s
`rounded-card md:rounded-card-lg`). Migrated all 46 instances across 16
files. Compound corner-overrides (`rounded-tl-none` etc.) were left
untouched and verified they still compose correctly with the new base
token.

**Item 8 — SVG stroke-width inconsistency, audited, one real case fixed.**
Checked every stroke-width value sitewide against the icon role it
belongs to:
- **Checkmarks** (8 service-page deliverable lists + Contact's success/
  error state icons): all consistently `stroke-width="3"` already, scaled
  appropriately for their two different icon sizes (20px inline vs. 40px
  badge icons). Not actually inconsistent on closer inspection — no
  change needed.
- **The `services.html` `stroke-width="1"`** turned out to be a
  decorative background grid pattern, not an icon at all — different
  role entirely, not a bug.
- **The navbar's chevron icons were the real case**: the mobile
  services-accordion chevron was `stroke-width="3"` while every other
  navbar icon (desktop dropdown chevron, mobile close button) — including
  another icon at the exact same 24px size — used `2.5`. Fixed to `2.5`
  for consistency.

**Item 9 — Fluid type scale, decision made and applied to the homepage.**
`.text-fluid-h1`/`.text-fluid-h2` existed but were applied inconsistently
(some pages/sections, not others) rather than as a deliberate mechanism.
**Decision** (no explicit answer was given on this, so proceeding on a
stated default per the roadmap's own framing in §3 — flag if you want a
different scope): fluid type becomes the standard for *primary section
headings* site-wide — not every subheading or card title, which stay
fixed-size and hierarchically smaller. Applied to all 6 of the homepage's
primary section `<h2>`s that were still on fixed `text-4xl md:text-5xl`/
`text-5xl`/`text-4xl md:text-6xl` classes (Impact stats, "Full-funnel
execution" ×2, "Why revenue leaders choose Axris", FAQ, final CTA). Left
two smaller card-level `<h2>`s (Mission/Vision two-column block, already
`text-3xl lg:text-4xl`) and the two card-title `<h2>`s at `text-xl`
alone — different, smaller role, not primary section headings.
**Not yet done**: propagating this same decision to the other 15 pages —
that's real content-touching work per page, left for the page-by-page
Phase 2 sessions per `implementation-order.md`, now with the scope
question already answered so those sessions don't have to re-litigate it.

**Item 11 — CSP header, added.**
`.htaccess` had `X-Content-Type-Options` and `Referrer-Policy` but no
Content-Security-Policy despite real third-party surface area. Audited
every external origin actually referenced in source (not assumed):
Google Fonts, the four hotlinked placeholder-image hosts (unsplash,
pexels, pravatar, pinimg — README already flags these as pending
self-hosting; the CSP `img-src` list should shrink once that happens),
the Supabase project used by the contact form
(`mpwsiaarnccddejnkjdm.supabase.co`), and the Google Maps iframe embed on
Contact + About. Confirmed there are no bare inline `<script>` blocks
anywhere in the site (only `type="application/ld+json"`, which isn't
executable and isn't gated by `script-src` regardless) — so `script-src`
is `'self'`-only with no inline exception needed. `style-src` does need
`'unsafe-inline'` for the handful of remaining inline `style=""`
attributes (navbar.html, a few pages) — narrowing that further means
moving those into `src/css/`, which is real markup work, not a header
change; noted for a future pass.

### Items intentionally not actioned this session (blocked, not skipped)

- **Item 3 — hotlinked placeholder images.** Genuinely can't self-host
  these from this environment: `images.unsplash.com`, `images.pexels.com`,
  `i.pravatar.cc`, and `i.pinimg.com` are not in this session's network
  allowlist, so I can't download and re-host the actual image files
  myself. This needs either those domains added to what I can reach, or
  the files supplied directly. Flagging explicitly rather than silently
  skipping — this is the single highest-ranked unresolved item in
  `roadmap.md`.
- **Item 10 — logo as SVG instead of PNG.** I don't have the original
  vector artwork, and tracing the existing PNG into an SVG would produce
  a lower-fidelity approximation of the actual logo, not a faithful
  vector — that's a real risk to a brand mark, not a safe mechanical fix.
  Needs the source file from you (or whoever has the original design
  file) rather than a reconstruction.
- **Item 6 — component duplication (CTA buttons specifically).** The
  hero-heading and FAQ-accordion duplication from this item are already
  resolved (Session 1). The CTA button itself is still hand-authored per
  instance rather than a single defined component — I did **not** find
  new drift beyond what's already covered by the token/radius migrations
  above (button padding/sizing classes were consistent in what I sampled),
  but I did not do an exhaustive instance-by-instance audit of every CTA
  across all 16 pages this session — that's worth a dedicated pass if you
  want certainty here rather than a sampled check.

### Verified

- `npm run build` (CSS + JS) from a clean `npm install` completes with no
  errors.
- `rounded-card`/`rounded-card-lg` and `text-fluid-h2` all confirmed
  present and resolving to the correct values in the compiled
  `assets/css/main.css`.
- `shadow-brand/20` (used on several cards) confirmed it compiles to a
  real `--tw-shadow-color` declaration — this was worth checking
  explicitly since Tailwind's shadow-color utilities are easy to get wrong
  syntactically.
- No duplicate element IDs introduced anywhere touched this session.
- `npm test` (jsdom smoke test) — still not run; same limitation as
  Session 1 (needs a running local server, hangs in this sandbox). Please
  run it yourself before deploying.

### Files touched this session

```
tailwind.config.js       (line-ending normalization + borderRadius tokens)
.htaccess                (CSP header)
assets/components/navbar.html   (stroke-width fix)
index.html               (6 section headings → text-fluid-h2)
+ mechanical rounded-3xl / rounded-[2rem] / rounded-[2.5rem] → rounded-card
  / rounded-card-lg migration across all 16 HTML pages
```

---

# Session 1 (previous)


Scope of this session: **Phase 0 (Foundations) + Phase 1 (Shared
infrastructure) in full**, plus the accessibility fix and animation
capability that `implementation-order.md` designates Responsibility 6
(Homepage) must establish as the reusable pattern for every other page.

This is a genuinely 15-session project by the project's own
`file-ownership.md` / `implementation-order.md`. Rather than thinly touch
all 18 pages in one pass, this session fully finishes everything every
later page-owning session depends on — so Phase 2 (page-by-page redesign)
can now proceed on solid ground instead of each page session re-litigating
color tokens, navbar consistency, or the heading bug.

---

## Phase 0 — Foundations

### 1. Design system & tokens — RESOLVED
**Decision** (confirmed with you before starting): restore the original
"ultra premium minimalist" intent — `brand` (#0EA5E9 sky blue), `dark`
(#0A0A0A true black), `light` (#FAFAFA off-white) — rather than keeping
the accidental default-Tailwind blue-600/gray-900 that had actually been
rendering.

**What changed:**
- `tailwind.config.js` — `brand` is now a full shade scale (50–950, plus
  `DEFAULT` = #0EA5E9), not a single flat color, so hover/lighter/darker
  states have somewhere real to come from instead of ad-hoc opacity
  hacks. `dark`/`light` unchanged (single tokens, as originally intended).
- Retired the custom `green: '#00ff15'` override entirely. It was only
  load-bearing in the 8 service-page templates (numeral labels "01–04" +
  deliverables checkmarks) and read as an off-brand accident next to this
  palette — those 64 occurrences (8 pages × 8) now use `text-brand`/
  `bg-brand` instead. Removing the override also **un-shadows Tailwind's
  real `green-*` scale**, which the flat override was silently replacing —
  the correctly-used `green-500` compliance badges (footer, about-us,
  contact) were technically at risk from this and are now on solid ground.
- **Sitewide mechanical migration** (`migrate_tokens.py`, not shipped —
  scratch script, see Notes.md) across all 18 HTML pages + every CSS/JS
  partial: `blue-50/100/200/300/400/500/600/700/800/900` → the
  corresponding `brand-*` shade, `gray-900`/`gray-950` → `dark`,
  `gray-50` → `light`. 1,064 substitutions across 20 files. This was a
  pure class-name migration (no layout/structure changes), so it's low-
  risk — but it's exactly what unblocks every Phase 2 page session from
  redoing this same mechanical work independently.
- **Not touched**: `gray-100`–`gray-800` (borders, secondary text,
  surfaces) — `design-system.md` didn't flag these as inconsistent, only
  the primary blue and the dark/light section backgrounds.

### 2. Build pipeline — GSAP triple-bundling FIXED (decided: fix now, not defer)
`architecture.md §7.1` flagged this as "the single highest-leverage
performance fix available": `contact.js` and `case-studies.js` each
bundled a full second copy of GSAP core (and ScrollTrigger, for
case-studies) on top of the copy `main.js` already loads on every page.

**Fix**: `src/js/core/lenis-setup.js` now exposes `window.gsap` /
`window.ScrollTrigger` once `main.js` registers them (every page loads
`main.js` first — see `architecture.md §4`). `build.js` gained a small
`external-global` esbuild plugin that resolves `contact.js`'s and
`case-studies.js`'s own `import { gsap } from "gsap"` to those globals
instead of bundling GSAP a second time.

**Measured result:**
| Bundle | Before | After |
|---|---|---|
| `assets/js/pages/case-studies.js` | 116KB | **2.0KB** |
| `assets/js/pages/contact.js` | 287KB | **211.6KB** |
| `assets/js/main.js` | 154KB | 150.2KB (unchanged, expected) |

(`contact.js` is still heavier than case-studies because it also bundles
`@supabase/supabase-js`, which is unrelated to this fix.)

### 3. Imagery & asset pipeline — NOT started
Flagged in `implementation-order.md` as having "the longest lead time"
(sourcing/art-directing real photography) and explicitly allowed to run
in parallel rather than block Phase 0/1. Genuinely needs a human decision
(licensed stock vs. commissioned photography vs. AI-generated) before any
session can execute it — see Notes.md "Decisions needed from you."

---

## Phase 1 — Shared infrastructure

### 4. Core JS engine — no changes needed
Confirmed the shared `raf`/ticker pattern in `core/state.js` and
`core/lenis-setup.js` is unaffected by the token/build changes above and
is ready to receive the Phase 1 animation work below without modification.

### 5. UI chrome
- **Navbar migrated off its standalone inline `<style>` block.**
  `assets/components/navbar.html` no longer carries its own ~350-line
  `<style>` tag with hardcoded hex values independent of the Tailwind
  build (`architecture.md §7.2` / `design-system.md` "Additional color
  inconsistency — the navbar"). Those rules now live in
  `src/css/components/navbar.css`, consuming the resolved tokens via
  Tailwind's `theme()` function — a future color change now updates the
  navbar automatically instead of requiring someone to remember a second
  file. Three raw inline hex references that lived outside the old
  `<style>` block (an SVG stroke color, two inline `style="color:..."`
  attributes) were updated to match.
- **FAQ implementations consolidated.** `initFAQ()` (service pages'
  `.faq-item` markup) and `initDetailsFAQ()` (homepage's native
  `<details>`) each hand-rolled their own copy of the same 0fr/1fr
  CSS-grid accordion transition. Extracted the shared mechanics into one
  `makeGridTrack()`/`setGridTrackOpen()` pair in `src/js/ui/faq.js`; each
  function is now a thin adapter over one shared implementation instead
  of two independently-maintained copies. (Markup itself wasn't unified —
  homepage's native `<details>` is a deliberate no-JS accessibility
  fallback worth keeping as-is.)
- **`magnetic-buttons.js` detection heuristic updated.** Its auto-promote
  logic was string-matching `bg-blue-6`/`bg-gray-9` to detect the site's
  two CTA color variants — would have silently stopped auto-promoting any
  button after the token migration above. Now matches `bg-brand`/
  `bg-dark`.

### 6. Animation modules — hero entrance upgraded
Per `animation-system.md`'s Opportunities §1 ("layered transitions /
follow-through are underused... consider extending expressive easing to
the homepage's headline/hero entrances specifically, since those are the
highest-impact moments"): `src/js/animations/hero.js` no longer fades up
the headline in lockstep with the badge/paragraph/CTAs using the same
flat `power3.out` every other reveal on the site uses. It now gets its
own weighted entrance (`back.out(1.5)` mild overshoot, heavier initial
displacement) plus a lagged clip-path reveal on the "Accelerate revenue."
accent span — a small, contained example of the "weight, anticipation,
follow-through" language the Creative Direction brief asks for.
`prefers-reduced-motion` still short-circuits the whole function per the
existing documented pattern.

---

## Phase 2 (started) — Homepage

Per `implementation-order.md`'s explicit instruction ("solve [the
duplicate-heading bug] once here, document the corrected pattern, and
every other page-owning responsibility applies the same fix
independently"):

**The site-wide duplicate-heading accessibility bug is fixed on the
homepage hero.** Previously: a real `<h1>` existed only in the
mobile/tablet layout (`block lg:hidden`); the desktop layout
(`hidden lg:grid`) repeated the identical headline as a
`<p role="presentation" aria-hidden="true">` — meaning **every desktop
screen-reader user heard no hero heading at all**, since `display:none`
already removes the mobile copy from the accessibility tree and
`aria-hidden` removed the desktop copy too. Fix: the desktop copy is now
a real `<h1>` (not a decorative paragraph). Both copies are real headings;
they're still never simultaneously in the accessibility tree, since their
parent wrappers are mutually-exclusive `display:none`/`block` by
breakpoint — so exactly one accessible `<h1>` always exists, matching
whatever is visually rendered.

This was a deliberately *minimal, low-risk* fix rather than the fuller
"one shared `<h1>` tag across both layouts" restructure
`design-system.md` describes as an alternative — see Notes.md for why,
and what a full unification would involve if you want it done properly
in a later pass.

**Not yet done for the homepage**: the full visual redesign (bolder
typography scale, new section-level motion, imagery pass) — this session
focused on the foundational fixes every other page also needs, plus
proving the corrected heading pattern works in place. See Notes.md for
what's left.

---

## Files touched this session

```
tailwind.config.js
build.js
src/js/core/lenis-setup.js
src/js/ui/magnetic-buttons.js
src/js/ui/faq.js
src/js/animations/hero.js
src/css/main.css
src/css/components/navbar.css        (new)
src/css/components/cursor.css
assets/components/navbar.html
index.html                           (hero section only)

+ mechanical class-name migration (blue-*/gray-900/950/50 → brand/dark/light)
  across all 18 HTML pages, assets/components/footer.html, and every
  src/css + src/js partial that referenced those classes.
```

## Verified
- `npm run build` (CSS + JS) completes with no errors.
- `theme()` calls in the new `navbar.css` resolve correctly to real hex
  values in the built `assets/css/main.css`.
- Bundle sizes for `contact.js`/`case-studies.js` confirmed reduced (see
  table above).
- Full `npm test` (jsdom smoke test) was **not** completed this session —
  it requires a running local server and hung in this sandboxed
  environment; run it yourself before deploying (`npm run serve` in one
  terminal, `npm test` in another).
