# Notes — for the next session(s)

## Session 12 addendum (typography unification — Fraunces removed)

- **Direct client feedback**: the homepage's fonts read worse than
  `services.html`/`case-studies.html`. Root cause found: those two hub
  pages never adopted the Session 4 "editorial" Fraunces display-serif
  system — they're Satoshi (headings) + Inter (body) only, same as
  everywhere else on the site. The homepage (and the 8 service-detail
  pages under `pages/service-pages/`) layered Fraunces italic serif on
  top of that as accent moments (hero verb, stat numerals, pull-quotes,
  FAQ index numbers) — a third, unrelated typographic voice that read
  as inconsistent, not premium, against Satoshi's confident geometric
  sans everywhere else. Fixed at the source rather than patched per
  page:
  - `tailwind.config.js`: `fontFamily.display` now resolves to Satoshi,
    not Fraunces (see that file's own comment for the full reasoning).
  - `editorial.css`: `.font-display`, `.numeral-display`, `.pull-quote`,
    and the FAQ running-index counter all rebuilt in Satoshi — hierarchy
    now comes from weight/tracking/color (e.g. a 500-weight pull-quote
    against 800-weight headlines, an 800-weight outlined numeral instead
    of a 340-weight italic serif one) instead of a second typeface.
  - `pricing.css` (`.pricing-card__price`) and `testimonials.css`
    (`.testimonial-card::before` / `__quote`) had the same Fraunces
    references — fixed too, even though neither component is adopted on
    a real page yet, so they don't regress the moment they are.
  - Every hand-authored `font-display italic` usage in `index.html` (5
    spots: hero accent word, both stat numerals, the quiet "107+
    clients" label, the vision-panel line) and all 8 service-page
    templates (4 stat-numeral spots each, 32 total) had its `italic`
    dropped and a weight (`font-medium`/`font-black` as appropriate)
    added explicitly — leaving `italic` in would have faux-italic'd
    (browser-skewed) Satoshi, which looks worse than no italic at all.
  - The Fraunces `<link>` tags (preload + noscript fallback) were
    removed from all 9 pages that had them (homepage + 8 service
    pages) — one fewer webfont request/swap on every page that loads
    it, which is a small, real assist to the FPS/performance audit
    already flagged as in-progress in `PERFORMANCE_REPORT.md`, not just
    a typography cleanup.
- **Also fixed while in the homepage**: the two plain white cards in
  the "Why revenue leaders choose Axris" bento grid ("100% Compliant",
  "Rapid Deployment") had `border-none` instead of a `border-gray-*`
  class, which meant they silently fell outside `cards.css`'s
  `.rounded-card[class*="border-gray"][class*="bg-white"]` selector —
  no lift, no corner-mark growth, no hover at all, unlike literally
  every other card on the site (including their own siblings in the
  same grid, the two photo cards, which get a hover-zoom via
  `data-hover-zoom` instead). Changed to `border border-gray-100` —
  zero new CSS, just brings them into the selector everything else
  already uses.
- Also dialed `.numeral-display` back from a 900 to an 800 font-weight
  (stroke width 1.5px → 1.25px to match): at 900, Satoshi's strokes are
  thick enough that the outline effect would nearly fill the digit's
  counters in at the smaller sizes this class is used at (`text-2xl`),
  losing the hollow-watermark look the class is going for.
  legal pages, and `services.html`/`case-studies.html` themselves never
  referenced Fraunces or `.font-display`/`.numeral-display` in the
  first place — nothing to fix there, confirmed by grep before
  starting, not assumed.
- **Judgment call**: kept every existing class name (`.font-display`,
  `.numeral-display`, `.pull-quote`) rather than renaming them, even
  though "display" now really just means "Satoshi, used emphatically."
  Renaming would have been cosmetic-only churn across 9+ files for the
  same runtime result — the class *names* were never the client's
  complaint, the *rendered typeface* was.
- Verified: `npm install` clean, `npm run build` clean (`build:css` +
  `build:js` + `version-assets`, which correctly re-hashed
  `assets/css/main.css` and rewrote the `?v=` query string on all 16
  HTML pages), grep-confirmed zero remaining `Fraunces` references in
  the compiled `assets/css/main.css` output and zero remaining
  `font-display italic` combinations anywhere in the project. No
  headless browser available in this sandbox (same standing limitation
  every prior session has flagged) — this was verified from source/
  build output, not a rendered screenshot; worth a quick visual pass
  once you can view it live, especially the hero's weight-contrast
  "Accelerate" and the outlined Satoshi numerals, to confirm they read
  the way this note describes.

## Session 11 addendum (accessibility / WCAG pass)

- **The site-wide duplicate-heading bug is now fully closed out.** This
  has been flagged as open in the Session 3, 8, and 9 addenda below —
  `about-us.html` and `case-studies.html` explicitly called out in
  Session 9's addendum, `services.html`/`contact.html`/the 3 legal pages
  implicitly included in Session 8's "other 7 pages" count. Turned out
  the 3 legal pages (`terms`/`privacy-policy`/`casl`) were already fine
  (single fluid `<h1>`, no duplicate) — only `about-us.html`,
  `case-studies.html`, `contact.html`, and `services.html` actually had
  it. All four fixed this session using the two-real-`<h1>`s-mutually-
  exclusive-by-breakpoint pattern (not the homepage's later single-fluid-
  `<h1>` simplification — see `ACCESSIBILITY_REPORT.md` §2.1 for why).
  If you're about to go looking for this bug again: don't, it's done.
- **Full detail on this session's work is in `ACCESSIBILITY_REPORT.md`**,
  not repeated here — read that first if you're picking up accessibility
  work next.
- **Left flagged, not done**: a real color-contrast sweep of the ~291
  `gray-500`/`gray-600` text usages and every `text-brand`-as-solid-text
  usage. One confirmed, high-confidence instance was fixed (footer
  copyright line), but auditing the rest safely needs a rendered page or
  an automated contrast tool — there's no way to tell from source alone
  which of those 291 call sites sit on a light background (fine) versus
  a dark one (several combinations measurably fail) without one. Real,
  moderate-size opportunity for whoever has browser access next.
- **Left flagged, not done**: no headless browser / screen reader was
  available in this sandbox, so nothing this session did was verified
  with an actual axe-core/Lighthouse run or a real VoiceOver/NVDA pass —
  everything was reasoned from markup/CSS/JS structure. Worth an actual
  screen-reader pass on the homepage FAQ, a service-page FAQ, the
  contact form's full error/retry/success loop, and the desktop Services
  dropdown specifically — those are the spots with the most interactive
  state and the hardest to fully verify from source alone.

## Session 9 addendum (mobile experience redesign)

- **Mobile is no longer "desktop, shrunk."** Everything mobile-specific
  now lives in one new file, `src/css/mobile/mobile-experience.css`,
  imported dead last in `main.css` on purpose (it needs to win the
  cascade against every desktop-authored rule above it at the widths it
  targets). If you add a new mobile-only visual rule anywhere else in
  the project instead of here, you're fragmenting the one place meant
  to answer "how does mobile differ from desktop" — put it in this file
  unless there's a specific reason not to.
- **New mobile scroll-story** — the homepage's 4-stage process section
  (`#horizontal-services-mobile`) has its own sticky progress rail now
  (`src/js/motion/mobile-story.js`), not just a static stack. If you add
  a 5th stage card, it needs `data-mobile-story-card` +
  `data-mobile-story-label="..."` — the module reads both automatically,
  nothing else to wire up. Deliberately not a pinned scroll-jack (see
  the file's own header comment for why) — don't "upgrade" this to full
  GSAP pin per-card without re-reading that reasoning first, it was a
  deliberate choice, not a shortcut.
  - **Left on the table, worth revisiting**: didn't add a persistent
    parallax drift to each card's image, because `reveal.js`'s shared
    `image-wipe` primitive returns the image to exactly `scale: 1` once
    its one-time entrance finishes, leaving no overscan margin for a
    parallax translateY to move within without exposing an edge. Fixing
    this properly means giving `image-wipe` a persistent scale buffer
    as a primitive-level change (affects every image using it site-
    wide, not just these 4), which felt too broad for a mobile-only
    session — but if you want the parallax, that's the actual blocker,
    not something wrong with mobile-story.js itself.
- **Two real bugs found (and fixed) while building the swipe-to-dismiss
  gesture on the mobile menu** — both would bite again if you add a
  second Draggable-driven UI element anywhere:
  1. `.ax-header-wrapper` had `z-index: 10001`, one *higher* than
     `#ax-mobile-menu`'s old `10000` — the always-present fixed header
     was silently capturing taps in the top ~80px of the screen even
     while the mobile menu sat open "on top of it." This was a
     pre-existing bug unrelated to anything new this session, just
     never surfaced before because nothing had tested exact tap
     coordinates against `document.elementFromPoint()` there before.
     Now `#ax-mobile-menu` is `z-index: 10010` — strictly above the
     header. If you add another fixed-position full-screen overlay,
     check it against `10001` too.
  2. GSAP `Draggable` caches its own internal x/y baseline once, at
     `Draggable.create()` time — not from re-reading the DOM on every
     press. Since this project only ever opens/closes things via CSS
     classes (not Draggable itself), any Draggable instance attached to
     an element whose position *also* changes via a CSS class will go
     stale the first time that happens outside of Draggable's own
     dragging. Fix is `this.update(true)` inside `onPress`, every time,
     before trusting `this.x`/`this.y` — not a one-time setup call. This
     cost real debugging time (wrong-looking `this.y` values around
     −800 on a panel that was visually at `y: 0`) before the actual
     cause (stale baseline, not a coordinate-math bug) was found via
     direct instrumentation rather than assumption. If you add a second
     drag interaction on top of anything class-toggled, budget for this
     up front instead of rediscovering it.
- **`isTouch` vs `isMobileViewport`** — `core.js` now exports both, and
  they answer genuinely different questions (full reasoning in that
  file's own comment). Short version: gate *input-capability* decisions
  (does hover exist, can this receive a magnetic-cursor effect) on
  `isTouch`; gate *layout-cost* decisions (how many DOM nodes is a
  reveal allowed to create) on `isMobileViewport`. Don't collapse them
  into one flag — a touch laptop with a 1440px screen should still get
  the full desktop reveal treatment.
- **`initHoverLift`/`initImageHoverReveal`/`initCaseStudyHoverReveal`
  (`micro.js`) are now gated behind `isTouch`**, matching
  `cursor-magnetic.js`'s existing convention for the same reason
  (`initCustomCursor`/`initMagneticButtons`/`initCardTilt` were already
  doing this; these three were the gap). If you write a new hover-driven
  motion function, gate it behind `isTouch` from the start — the bug
  class here (mobile fires a synthetic `mouseenter` on tap but often
  never fires the matching `mouseleave`, so the effect visibly "sticks"
  until an unrelated tap elsewhere) is easy to introduce and easy to
  miss until someone actually tests on a touch-emulated viewport.
- **Auto-reveal heading downgrade is mobile-viewport-only, and only for
  the *automatic* detection pass.** `initAutoReveals()` in `reveal.js`
  now uses `fade-up` instead of `letter-by-letter` for un-annotated
  headings below 768px (DOM-node + 3D-transform cost of per-character
  splitting, applied automatically to every heading on weaker phone
  hardware). Anything with its own hand-authored
  `data-reveal="letter-by-letter"` — hero.js's single headline being
  the main example — is untouched. If you're wondering why a heading on
  mobile "looks plainer" than the same class on desktop, this is why,
  and it's deliberate.
- **Left alone on purpose**: `about-us.html` and `case-studies.html`
  still have the pre-Session-8 duplicate-heading pattern (Session 8 only
  fixed the homepage's copy of this bug). Their mobile heading already
  renders fine — this is a desktop accessibility gap, not a mobile one —
  so it wasn't pulled into this session's scope. Still worth doing;
  just wasn't this session's job.
- **Confirmed pre-existing, not investigated further**:
  `case-studies.html` throws `Cannot read properties of undefined
  (reading 'registerPlugin')` in a Playwright mobile-viewport smoke
  test. Verified this happens on a completely fresh, unmodified
  extraction of the session-8 zip too — nothing this session touched
  caused it. Likely a `case-studies.js`/`main.js` script-ordering race;
  someone should actually chase this down properly in a dedicated pass
  rather than the drive-by glance it got here.
- Verified: `npm install` clean from scratch, `npm run build` clean
  throughout. Playwright mobile-viewport (390×844, touch-emulated) smoke
  test across 7 pages, with and without `prefers-reduced-motion`, run
  after every structurally-significant change rather than only at the
  end — same discipline Session 8 used, extended to actually simulate
  touch gestures (not just screenshot static states), which is
  specifically what caught both Draggable/z-index bugs above.

## Session 8 addendum (interaction completion pass)

- **New `src/js/motion/drag.js`** — the logo marquee is now a real
  drag-and-throw (GSAP Draggable + InertiaPlugin, both free in the
  installed gsap 3.14.2). Full handoff logic with `marquee.js`/
  `raf.marqueePaused` is documented in the file's own header — read
  that before touching either file. The short version: `marquee.js`
  still owns the ambient auto-scroll; `drag.js` only takes over while a
  press/throw is actually live, then hands `raf.marqueeX` back so the
  ambient scroll resumes from wherever the user let go.
- **If you add a second draggable surface**, don't copy the
  `raf.marqueePaused` flag verbatim — that's specific to the
  marquee/ambient-ticker handoff. A drag interaction with no competing
  ambient animation underneath it doesn't need a pause flag at all,
  just `Draggable.create()` on its own.
- **A real race condition was found and fixed while building this** —
  worth knowing if you extend `drag.js`: don't use a flat
  `setTimeout` as an "assume the throw finished" fallback. Check
  `this.tween` inside `onRelease` instead (Draggable sets it
  synchronously, before dispatching `onRelease`, whenever a throw was
  actually created — verified against the installed
  `gsap/Draggable.js` source, not just assumed from docs). A timer-based
  guess will eventually fire mid-coast on a long throw and yank control
  away from InertiaPlugin's still-running tween.
- **Two real, pre-existing bugs were found and fixed**, not introduced
  this session — worth knowing about since they'd been shipping
  invisibly: (1) `micro.js`'s `initHoverLift`/`initImageHoverReveal`
  had no `prefers-reduced-motion` guard, which silently defeated
  `cards.css`'s own correctly-written reduced-motion block on any
  element both systems touched (GSAP's inline `transform` always wins
  the cascade over a CSS class rule) — fixed with the same guard every
  other direct-manipulation function already has. (2)
  `cookie-consent.css` had `cursor: none !important` with nothing to
  replace it for touch/reduced-motion/no-JS visitors — removed; it was
  the only place on the site doing this.
- **`group-focus-within:` was added mechanically, sitewide** (64
  classes, 12 files) as the keyboard-focus mirror of every existing
  `group-hover:` class. If you add a new `group-hover:` utility anywhere,
  add the matching `group-focus-within:` one alongside it by hand from
  now on — the one-off script that did the bulk pass
  (`add_focus_within.py`) wasn't kept in the project, same as
  `migrate_tokens.py` before it.
- **Contact form validation is real now** — `contact.js` owns it
  (`novalidate` on the `<form>`, required + email-format checks, the
  `[aria-invalid]`/`.form-error-text` CSS hooks `forms.css` shipped back
  in Session 5 anticipating exactly this). If a field is ever added or
  removed from the form, update the `FIELD_RULES` object at the top of
  `contact.js` — it's the single source of truth for which fields are
  validated and what their label reads as in the error message.
- **Not done, flagged as a real follow-up**: drag was deliberately kept
  to the one clear candidate (the marquee). The pinned hero timeline
  would be a much bigger, riskier change — a second drag gesture
  layered over an active `pin: true` ScrollTrigger — and wasn't
  attempted this session.
- Verified: `npm install` clean from scratch, `npm run build` clean
  throughout, `npm test` — all 16 pages pass with zero JS errors,
  checked after every structurally-significant change rather than only
  at the end.

## Session 7 addendum (atmosphere / cinematic depth system)

- **New `src/css/components/atmosphere.css`**, wired in last in
  `main.css`. Full rationale is in that file's own header comment —
  worth reading before touching it, since every rule was deliberately
  chosen to avoid a specific stacking/z-index trap (see below). This
  was a CSS-only session: **zero HTML files were touched**, confirmed
  by diffing the whole project against the pre-session delivery.
- **The one thing worth understanding before extending this file**:
  only 20 of the site's 93 `<section>` elements combine `relative` +
  `overflow-hidden`. That ruled out the "obvious" way to do ambient
  background glows (a `::before`/`::after` positioned behind text via
  z-index) as a *default* technique, since it would silently break —
  glow painting over copy, or bleeding outside the section — on the
  other 73. Everything in `atmosphere.css` instead uses
  `background-image` (always behind an element's own content, always
  clipped to its own box, no prerequisites) or `box-shadow: inset`
  directly on the element being decorated (same guarantee). If a
  future pass wants the richer effects only a real decorative div/
  pseudo-element can do (parallax-able blurred orbs, anything that
  needs to visually escape its own box), that needs a small, explicit
  HTML pass first — add `relative overflow-hidden` (or a dedicated
  wrapper) to whichever sections it targets — rather than assuming the
  z-index trick is safe site-wide.
- **Not done, flagged as a real follow-up**: `mask-image` edge-
  feathering on the hero portrait image (part of the "masks" ask in
  this session's brief) — see Changelog.md's Session 7 entry for why
  this was left out rather than blind-shipped. Small, contained task
  if picked up: check what's actually behind the hero image's wrapper
  on every page that reuses this hero markup before feathering it.
- **Also not done**: no per-page hand-placed decorative glow orbs
  (the kind of bespoke touch a page-by-page visual pass might add to
  one specific hero). This session deliberately built a sitewide,
  markup-independent system instead — consistent with this project's
  existing "resolve once, apply everywhere via tokens/recipes"
  convention (same reasoning as the Session 3 color/shadow work) — but
  if a specific page wants a one-off bespoke atmospheric moment beyond
  what the shared recipes give it, that's real per-page work, not
  something this file does.
- Verified: `npm run build` clean, `npm test` — all 16 pages pass with
  zero JS errors, diff-confirmed no HTML/JS drift.

## Session 5 addendum (centralized motion rebuild)

- **Full animation-system rewrite.** Every motion module now lives under
  `src/js/motion/` (`core.js`, `reveal.js`, `hero.js`, `scroll-story.js`,
  `cta-band.js`, `counters.js`, `marquee.js`, `cursor-magnetic.js`,
  `micro.js`, `faq.js`, `page-transitions.js`). The old `src/js/core/
  state.js`, `core/lenis-setup.js`, `animations/*`, and `ui/cursor.js` /
  `ui/magnetic-buttons.js` / `ui/micro-interactions.js` / `ui/faq.js` are
  deleted — consolidated, not left dangling alongside the new code.
  `main.js` is now a pure orchestrator; nothing outside `motion/` imports
  `"gsap"` directly, so there's architecturally one registration point.
- **One reveal convention** (`data-reveal="fade-up|fade-left|fade-right|
  word-by-word|letter-by-letter|image-wipe"`) replaces the three
  overlapping systems (explicit attribute / legacy classes / silent
  auto-detection) that used to have to be kept in sync by hand. Legacy
  `.reveal-up/-left/-right/-stagger` classes still work — normalized to
  the same attribute on boot, not a second implementation.
- **New signature eases** (`ease.enter` / `ease.snap` / `ease.glide` in
  `motion/core.js`, via `CustomEase`) replace the uniform `power3.out`
  used everywhere before — see `docs/animation-system.md` Session 5 note
  for which is used where and why.
- **New: page transitions.** `#ax-page-transition` curtain markup was
  injected right after `<body>` on the 9 pages this session (and the
  previous layout session) touched — homepage + 8 service pages. **The
  other 7 pages (about-us, services, case-studies, contact, casl, terms,
  privacy-policy) do NOT have this markup yet.** They still load the new
  `motion/page-transitions.js` module (one shared bundle), but
  `initPageTransitions()` no-ops safely without the markup — so those 7
  pages are functionally fine, just without the curtain effect. Add the
  same `<div id="ax-page-transition">...` snippet (see
  `motion/page-transitions.js`'s top comment) to those pages' `<body>`
  when they get their layout pass.
- **New: `data-parallax`, `data-tilt`, `data-hover-zoom` hooks** — opt-in,
  reusable primitives (`parallax()`/`createScrollStory()` in
  `motion/core.js`) wired up so far only on the homepage hero image/stat
  card and the two large "why Axris" mosaic images. Worth extending to
  the 8 service pages' hero numeral / stat rows in a follow-up pass —
  the primitives exist, they're just not yet applied everywhere they
  could be.
- Same caveat as last session: no headless browser was available in this
  sandbox, so verification was static (build succeeds, BeautifulSoup
  structural checks, grep-checked compiled CSS/JS) — a visual/interaction
  QA pass is worth doing before shipping, especially for the page
  transition timing and the hero timeline's letter-split choreography.

## Session 4 addendum (editorial layout redesign)

- **Scope this session**: full composition/layout redesign (not just visual
  polish) of the homepage and the 8-page service-page template, per an
  "editorial/magazine, no repeating left-image-right-text-card-button"
  brief. Did NOT touch: about-us, services hub, case-studies, contact,
  legal pages (casl/terms/privacy) — still on the old layout.
- **New primitives**: `src/css/components/editorial.css` (`.kicker`,
  `.numeral-display`, `.pull-quote`, `.rail-label`, `.index-row`,
  `.faq-index`) plus a `Fraunces` display-serif font (`font-display` in
  Tailwind config), loaded non-blocking the same way as Inter/Satoshi.
  Additive only — nothing existing was renamed/removed, so pages not yet
  touched are unaffected and can adopt these later.
- **The site-wide duplicate-heading accessibility bug is now fixed on all
  9 pages touched this session** (homepage + 8 service pages) — collapsed
  to one real `<h1>` with fluid `clamp()` sizing instead of a hidden
  mobile/desktop pair. The other 7 pages (about-us, services, case-studies,
  contact, and the 3 legal pages) still have the bug — same fix pattern
  applies, just hasn't been run there yet.
- **How the 8 service pages were redone**: NOT hand-edited individually.
  `/mnt/user-data/.../scripts/redesign_service_pages.py` (not part of this
  repo — was a one-off session tool) walks each file's 7-section skeleton
  by index and swaps composition/typography while leaving copy and every
  JS-load-bearing class (`.counter[data-target]`, `.faq-item/.faq-btn/
  .faq-content/.faq-icon`, `.marquee-track`, etc.) untouched. If another
  page template needs the same treatment, that's the pattern to reuse:
  transform structurally by section index, don't regenerate from scratch.
- Homepage: hero, logo-strip label, impact-stats band, "why Axris" header,
  mission/vision (was two equal cards → now an asymmetric pull-quote +
  offset panel), and FAQ were recomposed. The horizontal pinned timeline
  and the `#cta-reveal` marquee-text CTA were deliberately left untouched
  — both are bespoke GSAP/ScrollTrigger mechanics and not part of the
  "repetitive card pattern" complaint this pass targeted.
- Imagery self-hosting is still blocked exactly as described below —
  unchanged this session. No headless browser was available in this
  sandbox to render/screenshot the result — verification was static
  (BeautifulSoup structural checks + compiled-CSS grep), not visual.

## Session 3 addendum (visual redesign)

- Full detail is in `Changelog.md`'s Session 3 entry, not repeated here.
  Quick pointers for whoever picks this up next:
- **`.eyebrow` label component exists but isn't applied everywhere yet.**
  It's a safe drop-in for the several hand-authored uppercase-tracking
  labels on light backgrounds (see homepage lines with
  `text-gray-600 uppercase tracking-widest`); the dark/brand-background
  instances need a manual color override per instance if you want them
  converted too — don't blind-regex those, the default `.eyebrow` color
  (`brand-600`) is unreadable on a brand-blue or dark card.
- **The site-wide duplicate-heading accessibility bug (see
  `design-system.md` §Accessibility) is still only fixed on the homepage
  hero** (from Session 2). This was out of scope for the visual-redesign
  brief this session worked from, but it's still the single most-repeated
  open issue in the project — worth prioritizing explicitly in whatever
  session tackles Phase 2's remaining pages, rather than assuming the
  visual pass incidentally fixed it (it didn't touch markup structure at
  all, only CSS/attribute values).
- Imagery self-hosting is still blocked exactly as described below —
  unchanged this session.

## Session 2 addendum

- **Fluid-type scope question (previously open) is now answered**: primary
  section `<h2>`s get `.text-fluid-h2` site-wide; card/sub-headings stay
  fixed-size. Applied to the homepage's 6 primary section headings this
  session — the other 15 pages still need this same pass, but the
  decision itself no longer needs to be re-made per page.
- **Imagery self-hosting (roadmap item 3) is blocked by network access**,
  not by a missing decision this time — `images.unsplash.com`,
  `images.pexels.com`, `i.pravatar.cc`, `i.pinimg.com` aren't reachable
  from this sandbox's network allowlist, so I can't download and re-host
  the actual files myself even though no new sourcing decision is needed
  (the README already says you'll self-host the *same* images, not
  replace them with new ones). If you add those domains to what I can
  reach, or hand me the files directly, this becomes a same-session
  mechanical task, not a multi-session one.
- **Logo SVG (item 10) needs the original vector source from you** — I
  can't respsonsibly trace the existing PNG into a faithful SVG.
- **CSP header** (`.htaccess`) currently allow-lists the 4 hotlinked image
  hosts in `img-src` — once those are self-hosted, tighten that list down
  to just `'self'`.

## What's left, in the order `implementation-order.md` specifies
(unchanged from Session 1 — still accurate)


**Phase 0** — Imagery & asset pipeline (Responsibility 12) is the one
Phase 0 item not started. It needs a decision from you first (see below),
and has the longest lead time — worth kicking off even though it doesn't
block Phase 2 starting.

**Phase 2 — page-by-page**, in the doc's suggested order:
1. ~~Homepage~~ — foundational fixes done (tokens, heading bug, hero
   motion); full visual redesign of the rest of the page (stats section,
   process timeline, case-study teasers, FAQ, final CTA) not yet done.
2. **Service detail template** (8 files, treat as one template) — apply
   the resolved tokens (already done via the migration script) and the
   corrected single-heading pattern; each of these 8 files almost
   certainly has the same duplicate-hero-heading structure the homepage
   had. Check each before assuming the pattern is identical.
3. **About & Services hub** — same heading-pattern check, plus the sticky
   image-crossfade accordion and Google Maps embed noted in
   `file-ownership.md`.
4. **Case studies** — now unblocked now that the GSAP-bundling decision
   (§Phase 0 item 2) is resolved.
5. **Contact** — same unblock; lowest visual-redesign urgency per the
   original doc since the Supabase lead-capture flow already works.
6. **Legal pages** — deliberately last/lowest-motion, per the brief.

**Phase 3** — SEO/structured-data verification and a full accessibility
audit, once Phase 2's content is near-final. Worth specifically re-
checking the homepage FAQ's JSON-LD block against the visible `<details>`
copy if that content changes in a later pass (they're currently still in
sync — I didn't touch FAQ copy this session).

**Phase 4** — Final QA/build verification across all pages, as the
project's own doc describes.

## Decisions needed from you before certain later phases can proceed

1. **Imagery direction** (Responsibility 12) — licensed stock, commissioned/
   AI-generated photography, or something else? This blocks self-hosting
   the ~50+ hotlinked Unsplash/Pexels/pravatar images flagged as a real
   reliability risk in `architecture.md §7.3`.
2. **Fluid-type policy** — `design-system.md` asks whether `.text-fluid-h1`/
   `.text-fluid-h2` become the default mechanism for *all* large display
   type, or stay reserved for hero moments specifically. I used the
   existing hero-only convention for this session's fix; a future session
   redesigning section headings site-wide should get an explicit answer
   on this before it starts.

## Judgment call worth flagging: the hero heading fix

`design-system.md` describes an alternative to what I did: collapse the
mobile and desktop hero layouts into **one** shared `<h1>` (using two
inner `<span>`s or responsive classes on a single tag) instead of two
separate real headings in two separate layout wrappers.

I didn't do that. Reason: the mobile layout (cinematic full-bleed
background image with text overlaid on top) and the desktop layout
(two-column grid with a separate bordered image card + floating stat) are
genuinely different visual treatments, not just different type scales —
unifying them into one literal DOM element while preserving both would
require restructuring the surrounding image/grid markup too, which is a
bigger, riskier change than the accessibility bug itself needed. The fix
I made (both copies are real `<h1>` elements; their parent wrappers are
still mutually-exclusive `display:none`/`block` by breakpoint, so exactly
one is ever in the accessibility tree at a time) resolves the actual
reported bug — screen readers now hear the headline at every viewport —
at much lower risk.

If you want the fuller unification (arguably cleaner markup, one fewer
place for the two copies to drift out of sync if edited independently in
the future), that's a reasonable follow-up task, but it's a genuine
layout redesign of the hero's image treatment, not a quick fix — flag it
explicitly if you want it done in a dedicated pass rather than folded
into a "just fix accessibility" session.

## Scratch script (not shipped, for your reference)

`migrate_tokens.py`, used to do the sitewide blue-*/gray-900/950/50 class
rename, isn't included in this delivery (it was a one-off migration tool,
not part of the site). If a similar mechanical rename is ever needed
again, the approach was: ordered regex substitution (longest/most-specific
patterns first) across every real source file listed in
`architecture.md`'s source-vs-build-output table — never touching
`assets/css/main.css` or `assets/js/*` directly, since those are
regenerated by `npm run build` anyway.

## One thing to double check before deploying

I could not get `npm test` (the jsdom smoke test) to complete in this
sandboxed environment — it requires `npm run serve` running in a second
process and hung when I tried to run both together here. Please run it
yourself locally (`npm run serve` in one terminal, `npm test` in another)
before pushing this to production, especially given the hero markup
change and the JS refactors (FAQ, magnetic buttons, GSAP externalization).
`npm run build` itself completes cleanly with no errors, and I manually
verified the built CSS/JS output looks correct, but that's not a
substitute for the real smoke test.
