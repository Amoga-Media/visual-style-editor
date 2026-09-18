# Accessibility Report — Session 11

Scope: WCAG 2.1 AA — keyboard navigation, ARIA correctness, focus order,
`prefers-reduced-motion`, semantic HTML, screen-reader compatibility.
This document is the detailed backup for `Changelog.md`'s Session 11
entry — read that first for the short version.

**Method note**: this sandbox has no headless browser / screen reader /
axe-core runner available, so nothing below is an automated audit
score — it's a manual read of the HTML/CSS/JS (structure, ARIA
attributes, focus-management code, computed contrast ratios from the
actual Tailwind config's hex values) plus reasoning about what a real
screen reader or keyboard-only user would hit. Run axe DevTools,
Lighthouse's accessibility category, and an actual screen reader
(VoiceOver/NVDA) against the built site to get real verified results —
treat everything here as "here's the mechanism and why it's a problem,"
not a substitute for testing it with real assistive tech.

---

## 1. Starting point — what was already good

This codebase had already been through real, deliberate accessibility
work before this session — worth stating plainly so the fixes below
read as *targeted*, not a rescue job:

- Skip-link, `.sr-only` utility, and a real `:focus-visible` ring system
  already existed (`base/reset-and-a11y.css`).
- `prefers-reduced-motion` was already respected at both the CSS layer
  (`base/responsive-a11y.css` — kills the marquee's CSS keyframe
  animation, transitions, etc.) *and* the JS layer (`motion/core.js`'s
  engine reads `matchMedia` and short-circuits GSAP entrance/scroll
  animations accordingly) — the harder, easy-to-half-do version of this
  requirement was already done correctly.
- The mobile nav (`ui/mobile-nav.js`) already implements a textbook
  dialog pattern: `role="dialog"`/`aria-modal`, a real focus trap,
  Escape-to-close, and focus restored to the hamburger button on close.
  This turned out to be the reference implementation the two contact-page
  modals below were missing (§2.3).
- The contact form (`pages/contact.js`) already does per-field
  `aria-invalid`/`aria-describedby`/`role="alert"` error wiring, moves
  focus to the first invalid field on a failed submit, and gates its
  shake animation behind the same reduced-motion check. This is a more
  thorough implementation than most production forms ship with.
- Every one of the 173 inline icon SVGs across all 16 pages already had
  zero instances of a meaningful (non-decorative) icon — no chart, no
  data visualization, nothing needing its own accessible name. Confirmed
  by checking for `aria-label`/`role`/`<title>` on any of them before
  touching anything (§2.6) — none existed, so there was no risk of
  silencing something that mattered.
- Every `<img>` across all 16 pages + both shared components already had
  an `alt` attribute — checked with a tag-spanning regex, not a
  single-line grep (which would've produced false positives on this
  codebase's multi-line attribute formatting). Zero missing.

None of that needed redoing. This session targeted what was left.

## 2. Changes made, with reasoning

### 2.1 Desktop `<h1>` missing on four pages (highest severity)

**This was a known, already-tracked issue** — `Notes.md`'s Session 3,
Session 8, and Session 9 addenda each independently flag it as "the
single most-repeated open issue in the project," and `Changelog.md`
documents the accepted fix pattern (shipped on the homepage in Session 2,
then further simplified to a single fluid `<h1>` later). It just hadn't
been carried over to four pages that needed it.

The pattern: each of `about-us.html`, `case-studies.html`,
`contact.html`, and `services.html` had a real `<h1>` set to
`class="block md:hidden"` (Tailwind's `md:hidden` compiles to
`display: none` at ≥768px) paired with a visually-identical
`<p aria-hidden="true" class="hidden md:block">` carrying the large
letter-by-letter-animated desktop version of the same text.

At any viewport ≥768px — i.e. most desktop and tablet traffic — the real
`<h1>` was removed from the accessibility tree by `display: none`, and
the visible large heading was *also* removed from the accessibility tree
by `aria-hidden="true"`. Both at once. A desktop screen-reader user
landing on any of these four pages got **zero accessible top-level
heading** — not a duplicate, an absence. Navigating by heading (a core
screen-reader browsing pattern) would skip straight past the hero to
whatever the next real heading down the page was.

**Fix**: converted the desktop `<p aria-hidden="true">` into a real
`<h1>` on all four pages (dropped the `aria-hidden`, changed the tag).
This is exactly the two-real-headings-mutually-exclusive-by-breakpoint
pattern `Changelog.md` already documents as the accepted fix for this
project (before the homepage was later simplified further to a single
fluid-sized `<h1>`, which would also work but means giving up the
letter-by-letter reveal animation on desktop — not this session's call
to make unilaterally, so the minimal, already-precedented fix was used
instead). Each page now has exactly one `<h1>` in the accessibility tree
at any given viewport width; the letter-by-letter animation is untouched.

### 2.2 Desktop "Services" nav dropdown — unreachable by keyboard

`.ax-services-parent .ax-services-dropdown` (the 8-link mega-menu under
"Services" in the main nav, every page) was revealed on `:hover` only.
Its closed state is `visibility: hidden`, which — unlike `opacity: 0`
— also removes descendants from the Tab order in every mainstream
browser. Net effect: a keyboard-only user tabbing through the nav went
straight from "Services" to "Case Studies," with no way to ever reach
the 8 links in between, even though they're ordinary, otherwise-fine
`<a>` tags.

**Fix**: added `:focus-within` alongside the existing `:hover` selector
in `navbar.css`. Because `:focus-within` fires the instant the
"Services" link itself (a direct child of `.ax-services-parent`)
receives focus, and `visibility` flips to `visible` at the *start* of a
hidden→visible transition (not the end), the dropdown is already
interactable by the time the user's next Tab press lands inside it.
Pure CSS, no JS touched.

### 2.3 Contact-page success/error modals — no focus management

`role="dialog" aria-modal="true"` on `#success-modal` and `#error-modal`
was aspirational rather than actual: opening either modal never moved
focus into it (focus stayed on the submit button, now sitting behind an
overlay), Tab could walk straight through the underlying form instead of
staying inside the dialog, Escape did nothing, and closing either modal
never returned focus anywhere — a keyboard/screen-reader user would
silently lose their place, focus dropping to `<body>`.

**Fix**: `pages/contact.js` now has a small `makeDialogController()`
factory (one instance per modal) providing exactly what `mobile-nav.js`
already does for the mobile menu — the reference implementation was
already in the codebase, just not applied here:
- Focus moves to the modal's first real control on open.
- Tab is trapped within the modal's focusable elements.
- Escape and a backdrop click both route through the dialog's own
  `closeModal()`/`closeErrorModal()` (same as clicking "Got it"/"Close"),
  not a separate half-close path — one dismissal path, not four
  divergent ones.
- Focus returns to whichever element had it before the modal opened
  (the submit button, in every real-world case) when the modal closes.

### 2.4 FAQ accordions — two different ARIA-state bugs

**Homepage (`#faq-homepage`, native `<details>`/`<summary>`)**:
`initDetailsFAQ()` intentionally forces the `open` attribute permanently
true on every item — necessary, because the CSS grid-track expand/
collapse technique needs the panel to stay rendered and measurable, and
native `<details>` without `open` sets `display: none` on its content,
which would break the animation. But browsers derive an automatic
expanded/collapsed announcement for AT from that same `open` attribute —
so with it pinned permanently true, every FAQ item was announced as
"expanded" regardless of whether it was visually open or closed.

**Fix**: added an explicit `aria-expanded` on the `<summary>`, kept in
sync with the actual grid-track state in the click handler. An
author-supplied `aria-expanded` takes precedence over the host-language
inference, so this overrides the now-permanently-wrong native signal
without touching the animation technique it was protecting.

**Service pages (`.faq-item`/`.faq-btn`/`.faq-content`, all 8 pages)**:
these aren't native `<details>` at all — plain `<button>` + `<div>` — and
had no `aria-expanded`, no `id`/`aria-controls` link between trigger and
panel, nothing. A screen reader had no way to know these buttons were
disclosure controls, let alone their state.

**Fix**: `initFAQ()` now assigns each panel an `id`, wires
`aria-controls` from the button to it, and toggles `aria-expanded`
`true`/`false` in the existing click handler (which already manages the
open/closed visual state — this just exposes it).

### 2.5 Google Maps iframes — no accessible name

Both embeds (`about-us.html`, `contact.html`) had no `title` attribute.
An `<iframe>` with no accessible name is announced to screen readers as
just "iframe" — no indication of what's inside before deciding whether
to enter it.

**Fix**: added `title="Map showing Axris Media Solutions' office
location in Yerwada, Pune"` to both.

### 2.6 Duplicate marquee logos — announced twice

The homepage's client-logo marquee (`#logo-marquee` or equivalent) is a
standard seamless-scroll trick: the same 10 logos, rendered twice back
to back, so the CSS scroll loop has no visible seam. Every logo already
had a real, correct `alt`. Neither copy was hidden from AT, so a screen
reader would announce all 10 client names, then immediately announce the
same 10 again.

**Fix**: `aria-hidden="true"` on the second (duplicate) copy's wrapper.
The first copy still announces normally.

### 2.7 Decorative icon SVGs — 173 instances, zero had `aria-hidden`

Checked every inline `<svg>` across all 16 pages + both shared
components (182 total) for anything suggesting it carried real meaning —
`aria-label`, `role`, an `aria-labelledby` reference, a `<title>` child.
Zero. Also checked for icon-only links/buttons that would've been left
with *no* accessible name if their only content got hidden (which would
make this fix actively harmful) — zero of those too; every interactive
element with an icon also has visible text or an `aria-label` on the
parent already.

**Fix**: `aria-hidden="true" focusable="false"` added to all 173 —
checkmarks, arrows, chevrons, feature-list icons, the close/hamburger
icons already handled by hand in §2.2's file. `focusable="false"` is
belt-and-suspenders for older IE/Edge behavior where SVGs could pick up
a tab stop even with `aria-hidden` set.

### 2.8 In-page navigation loses keyboard focus (legal pages' TOC)

`terms.html`/`privacy-policy.html`/`casl.html`'s table-of-contents links
scroll to the target `.legal-section` (via Lenis or native
`scrollIntoView`) but never moved focus there. A sighted mouse user sees
the scroll and it reads as "done"; a keyboard user's next Tab press
continued from wherever the TOC link sat in the page, not from the
content that had just scrolled into view — and a screen-reader user
listening rather than watching had no cue the jump happened at all.

**Fix**: `ui/toc.js` now gives the target section `tabindex="-1"` (if it
doesn't already have one) and calls `.focus({ preventScroll: true })` on
it — either in the Lenis path's `onComplete` or immediately after the
native `scrollIntoView` fallback. Standard "move focus to heading/section
after a jump-link" pattern (same one GOV.UK and most accessibility
guides recommend for exactly this scroll-without-focus gap).

### 2.9 Cookie-consent banner — no landmark, no accessible name

`ui/cookie-consent.js` injects the banner as a plain `<div>` with no
role or label — a screen reader user tabbing or browsing by landmark had
no way to discover it existed except by literally tabbing into one of
its buttons mid-page. The decorative 🍪 emoji was also unhidden, so some
AT would announce its Unicode name ("cookie emoji") before the heading.

**Fix**: `role="region" aria-label="Cookie consent"` on the banner
(non-modal — it doesn't block the page or steal focus on appearance,
matching its actual non-blocking behavior), `aria-hidden="true"` on the
emoji.

### 2.10 Color contrast — one confirmed failure, fixed; broader scale flagged, not done

Computed actual WCAG contrast ratios from the project's real hex values
(`tailwind.config.js`'s `stone` palette, aliased to `gray`) rather than
eyeballing:

| Token | On white | On the dark footer (`#0A0A0A`) |
|---|---|---|
| `gray-400` (`#a8a29e`) | 2.52:1 — fails | 7.85:1 — passes |
| `gray-500` (`#78716c`) | 4.8:1 — passes | 4.13:1 — fails (needs 4.5) |
| `gray-600` (`#57534e`) | 7.63:1 — passes | 2.6:1 — fails badly |

**Confirmed and fixed**: the footer's copyright line (`© 2026 Axris
Media Solutions...`) used `text-gray-600` on the dark footer background
— 2.6:1, a clear AA failure — while the line directly below it
("Designed & Developed by Amoga Media") already correctly used
`text-gray-400` (7.85:1). Changed the copyright line to match its
sibling. One-line, high-confidence, visually near-invisible change
(both are already muted secondary text at the same size).

**Not done — flagged instead of guessed at**: `text-gray-500`/
`text-gray-600` appear 291 times across the site, and without a
rendered browser there's no reliable way to tell from source alone which
of those 291 sit on the dark background (where several combinations
measurably fail) versus the light background (where they're all fine).
Auditing that properly needs either a rendered page (to see which
wrapper each instance actually inherits its background from) or a
tool like axe/Lighthouse's contrast checker run against the built site.
Same reasoning applies to `text-brand` (`#0EA5E9`) used as plain solid
text — 2.77:1 on white, a real fail if it's sized/used as body-scale
link text anywhere, fine if it's only ever large decorative display
type (≥24px bold clears the 3:1 large-text threshold... at 2.77:1 it
still wouldn't, actually, so this one's worth someone's explicit
attention with a rendered page in front of them). Not guessed at blind.

## 3. Considered, not done — and why

- **Full color-contrast sweep of the 291 remaining `gray-500`/
  `gray-600` usages and the `text-brand` solid-text usages.** See §2.10 —
  needs a rendered page or an automated contrast tool to do safely; this
  session fixed the one instance it could verify with certainty from
  source alone (a direct sibling-line comparison) and flagged the rest
  rather than guessing which of 291 call sites sit on which background.
- **Re-running an axe-core / Lighthouse accessibility audit against the
  built site.** This sandbox has no headless browser. Everything above
  is reasoned from markup/CSS/JS, not a scored automated run — see the
  method note at the top. `npm run build` was run and completed cleanly;
  `npm test` (the real jsdom + live-server regression suite) was **not**
  run this session per the request — run it, plus a real screen reader
  pass, before deploying.
- **The "supplementary category tag" spans on case-study cards**
  (`hidden md:block` text like "Enterprise Tech / Email Marketing" next
  to each client name) drop out of the accessibility tree on mobile
  viewports along with their visual hiding. Left alone: the core
  identifying information (the client name itself, in a real `<h3>`) is
  always present regardless of viewport, this is genuinely supplementary
  context rather than essential content, and changing it risks a wider
  edit than an accessibility pass alone calls for. Worth a second look if
  someone wants to be thorough, not urgent.
- **The `aria-hidden`, visually-hidden `<aside id="company-overview">`
  SEO/AI-crawler block on `about-us.html`** (dense structured facts,
  `.sr-only`, sits before the real `<h1>` in DOM order) is real content a
  screen-reader user *will* hit — via heading navigation, they'd
  encounter this block's own internal `<h2>`/`<h3>`s before the page's
  actual `<h1>`. This isn't a hard WCAG failure (each sectioning
  container is allowed its own heading hierarchy, and HTML5 doesn't
  require heading order to be strictly linear across siblings), and it
  looks like a deliberate choice to feed the same structured facts to
  screen readers and AI-crawlers alike — not touched, since removing or
  restructuring it would undo that intentional pattern. Flagged here
  only so whoever owns SEO/AI-crawler strategy knows the tradeoff exists.

## 4. Suggested next steps, in order

1. Run `npm run build` (done this session, clean) then `npm run serve` +
   `npm test` before deploying — not run this session per the request.
2. A real screen reader pass (VoiceOver on Safari, NVDA on Firefox/
   Chrome) on: the homepage FAQ, a service-page FAQ, the contact form's
   full submit-error-retry-success loop, and the desktop Services
   dropdown. These are exactly the interactive-state-heavy spots that
   are hardest to verify from source alone.
3. Run axe DevTools or Lighthouse's accessibility category against the
   built site for a scored, automated pass — everything above is reasoned
   from markup/CSS/JS structure, not a lab run.
4. The color-contrast sweep flagged in §2.10/§3 — needs a rendered page,
   not blind source-reading.
