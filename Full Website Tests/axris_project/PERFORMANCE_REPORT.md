# Performance Report — Session 10

Scope: Core Web Vitals (LCP, CLS, INP) + TTFB-adjacent loading behavior,
JS payload, GSAP usage, image weight, paint cost. This document is the
detailed backup for `Changelog.md`'s Session 10 entry — read that first
for the short version.

**Method note**: this sandbox has no headless browser / Lighthouse
runner available, so nothing below is a Lighthouse score — it's build
output measurements (file sizes, bundle composition via
`esbuild.analyzeMetafileSync`, structural HTML checks) plus reasoning
about what those changes should do to the metrics, not a lab-verified
"before: 62, after: 96" claim. Run Lighthouse / PageSpeed Insights /
WebPageTest against the built site yourself to get real scored numbers —
treat everything here as "why this should move the needle," not a
substitute for measuring it.

---

## 1. Starting point — what was already good

This codebase had already been through several optimization-aware
sessions before this one (see `Changelog.md` Sessions 1–9). Worth stating
plainly so the changes below read as *targeted*, not a rescue job:

- LCP image (`Hero.jpeg`) was already correctly preloaded with
  `fetchpriority="high"` and `loading="eager"`.
- Every font load already used the preload-then-swap-rel pattern (non-
  render-blocking), with `preconnect` to all three font origins.
- Below-the-fold images already had `loading="lazy"` + explicit
  `width`/`height` almost everywhere.
- **GSAP/ScrollTrigger triple-bundling** (a real, documented issue in
  `architecture.md` §7.1 — full GSAP core shipped a second time in both
  `contact.js` and `case-studies.js`) **had already been fixed** via
  `build.js`'s `externalGlobalPlugin`, which resolves `gsap`/`gsap/
  ScrollTrigger` imports in those two page-specific bundles to the
  `window.gsap`/`window.ScrollTrigger` globals `main.js` already sets up.
  Confirmed via `esbuild.analyzeMetafileSync` — `case-studies.js` is 2KB,
  not the ~116KB the architecture doc's audit-era number described.
- Mobile-specific perf work (Session 9): hover listeners gated behind
  `isTouch`, `will-change` toggled rather than left permanently on,
  letter-splitting downgraded to a cheaper reveal on mobile viewports,
  the fixed film-grain overlay disabled below 768px, `.htaccess` already
  had gzip + 1-year `Expires` + a real, scoped CSP.

None of that needed redoing. This session targeted what was left.

## 2. Changes made, with numbers

### 2.1 Images

| Asset | Before | After | Change |
|---|---|---|---|
| `logo.png` (navbar, every page) | 2312×1071, 52.9KB | 400×185, 11.4KB PNG / **7.4KB WebP** | −86% (WebP) |
| `logo-white.png` (footer, every page) | 725×344, 87.9KB | 360×171, 22.4KB PNG / **13.8KB WebP** | −84% (WebP) |
| `Hero.jpeg` (homepage LCP element) | 102.1KB | +**74.2KB WebP** sibling | −27% |
| `strategy` / `optimization` / `mapping` / `conversion` / `impact` / `launch` / `Execution` (8 files, homepage + services.html) | ~100.6KB each | WebP siblings 50.2–81.6KB | −18% to −50% |
| `outreach.jpeg` | 101.2KB | **left unchanged** — its WebP re-encode was *larger* than the JPEG at every quality tested (60/65/70/75/80) | n/a |

The oversized logo was the single biggest surprise here: a 130px-wide
navbar element was shipping a 2312px source, on **every page of the
site**, `loading="eager"`. That's the highest-leverage fix in this
report by request count, even though any one page's saving looks small.

All conversions use `<picture><source type="image/webp">` with the
original format as the `<img>` fallback — nothing was replaced outright,
so there's no regression for the ~1% of traffic on a browser without
WebP support. `logo-white2.png` (59.9KB) is unreferenced anywhere in the
codebase — left in place, flagged for deletion.

### 2.2 JS

| Bundle | Before | After | Notes |
|---|---|---|---|
| `assets/js/main.js` (every page) | 204.9KB / 76.6KB gzip | unchanged | See §3 for what was considered and not done here |
| `assets/js/pages/contact.js` | 213.1KB / 55.4KB gzip | **5.0KB / 2.0KB gzip** | Supabase split out — see below |
| `assets/js/pages/contact-submit.js` | — (didn't exist) | 208.6KB / 55.1KB gzip | New — lazy-loaded, off the critical path |
| `assets/js/pages/case-studies.js` | 2.0KB | unchanged | Already fixed pre-session |

`contact.js` going from 213KB to 5KB doesn't delete any functionality —
it moves ~190KB of `@supabase/supabase-js` into `contact-submit.js`,
fetched via a runtime-injected `<script>` tag during idle time
(`requestIdleCallback`, 4s timeout, `setTimeout` fallback) rather than
parsed as part of the page's initial script. In the common case (visitor
takes more than a few idle-frames to fill out a 4-field form) the chunk
is already warm by the time they hit submit; in the rare fast-submit
case, `handleFormSubmit` calls `loadSubmitChunk()` itself, so the
functional behavior is identical either way — one extra network round
trip in the worst case, same successful submission either way. The
Supabase project URL/key and `contact_submissions` table/column
contract are byte-for-byte unchanged.

### 2.3 Loading strategy

- `<link rel="preload" href="/assets/components/navbar.html" as="fetch"
  crossorigin>` (+ same for `footer.html`) on all 16 pages. These two
  files were already fetched by `core/components-loader.js` at runtime —
  unchanged — but only once `main.js` had parsed and started executing.
  The preload lets the browser's preload scanner start both requests
  immediately, in parallel with CSS/font requests, rather than waiting
  on JS execution to even begin the fetch.
- Checked whether the fetch-and-inject pattern itself was a CLS bug (the
  classic "empty container, content pops in" pattern) before touching
  it: `.ax-header-wrapper` is `position: fixed` (out of flow, doesn't
  push content) and the footer is append-only at the end of `<body>`
  (nothing below it to reflow). Neither was actually contributing
  measured CLS. Fixed the *load-time* cost (flash-of-no-nav duration),
  left the underlying architecture alone rather than restructuring it on
  a hypothesis that turned out not to hold.
- **Cache correctness**: `.htaccess` already sent 1-year `Expires` for
  CSS/JS/images, on *unversioned filenames*. That's a real staleness
  risk, not just a missed optimization — a deploy could be invisible to
  a returning visitor for up to a year. `scripts/version-assets.js`
  (new, wired into `npm run build`) appends a content-hash query string
  to every CSS/JS reference across all 16 pages, computed from the
  actual built output, idempotent across repeated builds. `.htaccess`
  now also sends explicit `Cache-Control: public, max-age=31536000,
  immutable` alongside the existing `Expires` headers.
- Added a `mod_brotli` block to `.htaccess` alongside the existing
  `mod_deflate` (gzip) one. Brotli typically beats gzip by 15–20% on
  text assets at equivalent CPU cost; this is a no-op on hosts without
  the module (the `<IfModule>` guard skips it cleanly), so it's free to
  add and only helps on hosts that have it.

## 3. Considered, not done — and why

Being explicit about this matters as much as the changes themselves.

- **Self-hosting the ~50+ hotlinked Unsplash/Pexels/pravatar/pinimg
  images.** This is the largest *remaining* opportunity in the codebase
  — third-party image origins are a real LCP/reliability risk (no
  control over sizing, format, or uptime) — but it's blocked by this
  sandbox's network allowlist, exactly as `Notes.md`'s Session 2
  addendum already documented. Not re-attempted here; hand this session
  network access to `images.unsplash.com` / `images.pexels.com` /
  `i.pravatar.cc` / `i.pinimg.com` (or the files directly) and it becomes
  a same-session mechanical task.
- **Lazy-loading `Draggable`/`InertiaPlugin` out of `main.js`.** These
  two GSAP plugins are ~34KB (minified) of the ~205KB `main.js` every
  page loads, used only for the mobile-nav swipe-to-dismiss gesture and
  the draggable logo marquee — genuinely deferrable, in principle.
  Didn't do it: `Changelog.md`'s Session 9 entry documents two real,
  subtle bugs already found in this exact code path (Draggable's
  internal baseline-caching behavior needing an explicit `update(true)`
  re-sync on open) — evidence this specific mechanic is fragile enough
  to need real interactive testing, which isn't available here. Flagged
  rather than risked.
- **Splitting the boot sequence's synchronous init calls
  (`main.js`'s `initMotion()`) across idle callbacks** to reduce the
  single long task on `DOMContentLoaded` (an INP/TBT lever). Didn't do
  it: the function's own comment states "order matters," several inits
  end with a shared `ScrollTrigger.refresh()` that assumes every trigger
  above it has already registered, and reordering this without a way to
  visually confirm scroll-trigger positions still land correctly is a
  real regression risk for a codebase already found to have order-
  dependent animation bugs (Session 9). Worth doing with real testing.
- **Trimming unused Google Fonts / Fontshare weights.** Requested: Inter
  (6 weights), Satoshi (5 weights), Fraunces (variable, two axes). A
  weight-by-weight usage audit across all 16 pages + every CSS partial
  is possible but wasn't completed with enough confidence this session
  to cut a weight and be sure nothing breaks — flagged as a real,
  moderate-size opportunity (each unused woff2 weight is roughly
  10–20KB) for whoever can grep with more certainty or, better, load the
  actual site and check the Network tab for which font files are
  requested at all.
- **Font-metric fallback matching** (`size-adjust`/`ascent-override`/
  `descent-override` on a local `@font-face` fallback declaration) to
  eliminate the small swap-triggered layout shift `font-display: swap`
  can cause when the webfont's metrics differ from the fallback's.
  Real technique, real potential CLS win, but doing it *wrong* (an
  imprecise override) can make CLS worse, not better, and getting the
  numbers right needs either the actual font files measured locally or
  a tool like Fontaine/Capsize — not attempted blind.

## 4. Suggested next steps, in order

1. Run `npm run build` (now runs `version-assets` automatically), then
   `npm run serve` + `npm test` — the real smoke test — before deploying.
   Not run this session per the request; this is the one thing that
   should happen before any of the above ships.
2. Run Lighthouse (or PageSpeed Insights) against the built site for
   real scored numbers — everything above is reasoned from file sizes
   and bundle composition, not a lab run.
3. If network access to the four hotlinked image hosts becomes
   available, self-hosting those ~50+ images is the single largest
   remaining opportunity in the codebase.
4. Specifically test the contact form end-to-end (fast submit, slow
   connection, and JS-disabled-then-re-enabled edge cases) given the
   `contact.js`/`contact-submit.js` split — it's the highest-stakes
   change in this session (lead-capture path) even though the
   submission contract itself didn't change.
