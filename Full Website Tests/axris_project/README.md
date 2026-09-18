# Axris Media Solutions — Website

Static marketing site. Plain HTML pages, Tailwind CSS, GSAP/Lenis-driven
animations, built with a small npm-based pipeline (no framework, no server
required at runtime — the built output is just HTML/CSS/JS you can host
anywhere, including Hostinger/Apache — see `.htaccess`).

## What changed in this reorg

- **No more CDN dependencies**, other than Google Fonts and a handful of
  placeholder images (`images.unsplash.com`, `images.pexels.com`,
  `i.pravatar.cc`, `i.pinimg.com`) you said you'll download and self-host
  later, and the Google Maps embed on the About page (that one has to stay
  external — it's a live map, not a static asset). GSAP, ScrollTrigger,
  Lenis, and Supabase are now real npm dependencies, bundled straight into
  the site's own JS — no `/assets/vendor/*.min.js` files to keep in sync
  by hand anymore.
- **One monolithic 1,224-line `main.js` → 20+ small files**, organized by
  concern (`core/`, `ui/`, `animations/`, `pages/`) — see the map below.
- **One monolithic `styles.css` → 9 small files**, grouped the same way.
- Every page now loads a **single** `<script src="/assets/js/main.js">`
  instead of four separate vendor + app script tags.
- `class="lenis"` on `<html>` was inconsistent across pages (present on 6,
  missing on 10) — now consistent on all 16.

Nothing about how the site *behaves* changed — this was a reorganization,
not a rewrite. The compiled CSS output is byte-identical to what you had
before; the JS is the same logic, split into files and running through a
bundler instead of hand-copied vendor scripts.

## Project structure

```
package.json           npm scripts + dependencies (see below)
tailwind.config.js      Tailwind content globs + theme
postcss.config.js       Tailwind + autoprefixer
build.js                bundles src/js/ → assets/js/  (esbuild)
scripts/
  build-css.js          assembles src/css/ → assets/css/main.css (Tailwind CLI)
  smoke-test.js          optional regression check — see "Testing" below

src/                    ← EDIT HERE
  css/
    main.css             entry point — just @tailwind + @import lines
    base/                resets, a11y, layout, typography
    components/          cursor, cookie banner, scrollbar/TOC
    animations/           CSS the animation JS depends on (marquee track,
                          text-split spans, CTA band, etc.)
  js/
    main.js               entry point — imports + boots everything below
    core/                 Lenis setup, navbar/footer injection, shared state
    ui/                    nav, cursor, cookie banner, FAQ, TOC, magnetic buttons
    animations/            every scroll-triggered / decorative effect
    utils/                 text-splitting helpers shared by 2+ animation modules
    pages/                page-SPECIFIC scripts (contact form + Supabase,
                          case-studies timeline) —
                          each bundled separately, loaded only on its page

index.html, pages/*.html, pages/service-pages/*.html   ← the actual pages
assets/
  css/main.css            BUILT — don't hand-edit, npm run build overwrites it
  js/main.js, js/pages/*.js   BUILT — same as above
  components/             navbar.html / footer.html, fetched by core/components-loader.js
  images/, case-studies/  static files, unchanged
```

## Setup

```
npm install
npm run build      # one-off production build (minified)
```

That's it — open `index.html` through a local server (see below) and the
site is fully built. `node_modules/` is not included in this delivery;
`npm install` regenerates it from `package.json`/`package-lock.json`.

## Day-to-day: editing

```
npm run dev        # watches src/css/ and src/js/, rebuilds on save
npm run serve      # in a second terminal — plain static file server on :8080
```

- **Editing an animation or interaction** → find the right file under
  `src/js/animations/` or `src/js/ui/` (the entry point `src/js/main.js`
  lists every module and what it's for). Save, and `npm run dev` rebuilds
  `assets/js/main.js` automatically.
- **Editing styles** → same idea under `src/css/`. `src/css/main.css` is
  just a manifest of `@import` lines in a specific order — see the comment
  at the top of that file before reordering anything, since a couple of
  partials are intentionally positioned before vs. after Tailwind's own
  output.
- **Editing page content/sections** (adding/removing a section on a
  service page, etc.) → that's the follow-up pass you mentioned wanting to
  do next, once this reorg was in place. All 8 pages under
  `pages/service-pages/` share the same section order:
  **Hero → Stats bar → Feature/benefits → Process ("How we
  orchestrate") → FAQ → Final CTA.** Since the structure really is
  identical across all 8, the safest workflow once you're ready is: pick
  one file, make the structural change there, verify it, then apply the
  same change to the other 7 — happy to do that copy-across for you when
  you're ready.

### Why this fixes the "homepage works, service page breaks" pattern

That pattern is usually one of two things: (a) the compiled CSS was stale
— didn't include a class a page needed because `npm run build` hadn't
been re-run since the last content edit, or (b) a hand-edited vendor
script drifted out of sync between pages. Both are structurally harder to
hit now: CSS is one command away from being back in sync with whatever's
currently in every HTML file, and there's only one JS bundle for every
page to load — no per-page vendor script list that can quietly drift.

## Performance

`npm run build` now runs a third step after the CSS/JS builds:
`scripts/version-assets.js` appends a content-hash query string
(`?v=<hash>`) to every CSS/JS reference across all 16 pages, so the 1-year
`immutable` cache headers in `.htaccess` are actually safe — a deploy
changes the hash, which changes the URL, which busts the old cache entry.
Don't hand-edit those `?v=...` query strings; they're regenerated on every
build the same way `assets/css/main.css` itself is.

See `PERFORMANCE_REPORT.md` for the full detail on this and every other
performance change from the Core Web Vitals session (image weight, JS
payload, GSAP bundling, loading strategy) — what was measured, what
changed, and what was deliberately left alone with reasoning.

## Testing

`scripts/smoke-test.js` loads every page + its real bundled JS in a
headless DOM and reports any JS error, without needing a real browser.
It can't verify what things *look* like, but it does catch broken
imports, typos, and reference errors — useful right after a bigger JS
edit.

```
npm run build
npm run serve        # terminal 1
npm test              # terminal 2
```

## Dependencies

| Package | Why |
|---|---|
| `gsap` | animation engine — all scroll/hover/entrance effects |
| `lenis` | smooth-scroll |
| `@supabase/supabase-js` | contact form submission (contact.html only, lazy-loaded — see `PERFORMANCE_REPORT.md`) |
| `tailwindcss`, `postcss`, `autoprefixer` | CSS build |
| `esbuild` | bundles `src/js/**` → the files every page actually loads |
| `npm-run-all` | runs the CSS + JS build/watch scripts together |
| `jsdom` (dev only) | powers the optional smoke test |

Versions of `gsap`/`lenis` are pinned exactly (not `^`) to match what was
already tested and working, so a routine `npm install` down the line
won't silently pull in a newer version with different behavior.
