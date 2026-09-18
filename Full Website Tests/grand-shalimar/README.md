# Grand Shalimar — Restaurant Website

A 4-page static site (Home, Our Story, Menu, Reservations) built with Tailwind CSS,
vanilla JS, GSAP/ScrollTrigger, and Lenis smooth scroll. No framework, no bundler —
just HTML files plus one compiled stylesheet and two shared JS files.

## Project structure

```
.
├── index.html               Home
├── our-story.html           Our Story
├── menu.html                Full menu (left-rail category selector + veg/non-veg filter)
├── reservations.html        3-step reservation form
│
├── src/css/input.css        Source CSS — Tailwind import + @theme tokens
│                             (colors/fonts) + custom component CSS.
│                             This is the ONE place to edit styles/tokens.
│
├── assets/css/style.css     Compiled/minified CSS (generated — don't hand-edit).
├── assets/js/animations.js  All GSAP / ScrollTrigger / Lenis motion.
├── assets/js/main.js        Everything else: mobile nav, forms, the
│                             accordion/hover-swap menu lists, the Menu page's
│                             category rail + veg/non-veg filter, and the
│                             Reservations wizard.
│
├── package.json
└── package-lock.json
```

> **No `tailwind.config.js` file, on purpose.** This project uses Tailwind CSS
> v4, which moved configuration into CSS itself (the `@theme` block in
> `src/css/input.css`). That's also the single config the previous version of
> this project was missing — one file instead of a repeated `<script>` block
> on every page.

Every page loads the same three things:

```html
<link rel="stylesheet" href="assets/css/style.css">
...
<script src="assets/js/animations.js"></script>
<script src="assets/js/main.js"></script>
```

GSAP, ScrollTrigger, and Lenis are still loaded from their CDNs (unchanged from
before) — only Tailwind moved to a real build.

## Setup

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
```

## Build CSS

The compiled CSS in `assets/css/style.css` is already committed, so the site
works out of the box with zero build step. Run this again any time you change
colors, fonts, or add new utility classes in the HTML:

```bash
npm run build:css       # one-off build, minified
npm run watch:css       # rebuilds automatically while you edit
```

## Preview locally

Any static file server works. If you have Node installed:

```bash
npm run serve            # http://localhost:5000
```

Or just open `index.html` directly in a browser — everything here is static.

## Editing brand colors / fonts

Open `src/css/input.css` and edit the `@theme` block at the top:

```css
@theme {
  --font-serif: "Playfair Display", serif;
  --font-sans: "Poppins", sans-serif;

  --color-brand-bg: #f9f9f9;
  --color-brand-dark: #1a1a1a;
  --color-brand-yellow: #fbbd08;
  --color-brand-green: #1f422e;
  --color-brand-orange: #f28e2b;
  --color-brand-pink: #d63384;
}
```

Then run `npm run build:css`. Utility classes like `bg-brand-dark`,
`text-brand-yellow`, and `font-serif` are generated automatically from these
variables — no other file needs to change.

## Editing the menu (menu.html)

The Menu page is one long scrolling list, grouped into 11 categories (Soups,
Appetizers, Sizzlers, Rice & Noodles, Veg Curries, Biryani & Rice, Tandoor &
Kebabs, Chicken Curries, Breads, Desserts, Beverages). A left-rail selector
(a horizontal pill strip on mobile) lets guests jump straight to a category,
highlights whichever one is currently in view while scrolling, and includes
an All / Veg / Non-Veg filter.

**To add or rename a dish:** find its `<div class="menu-item ...">` row inside
the matching `<section id="cat-...">` block and edit the text, or copy an
existing row for a new dish. Set `data-diet="veg"` or `data-diet="nonveg"` —
this drives both the colored dot next to the name and the Veg/Non-Veg filter.

**To add a whole new category:** you need three matching pieces, all using the
same short id (e.g. `drinks-hot`):
1. A `<section id="cat-drinks-hot" class="menu-cat ...">` block in the menu
   content column with its dish rows inside.
2. A `<li><button data-cat-link data-target="drinks-hot" class="cat-link ...">`
   entry in the desktop sidebar `<nav aria-label="Menu categories">` list.
3. A matching `<button data-cat-link data-target="drinks-hot" class="tab-btn ...">`
   pill in the mobile sticky strip near the top of the same section.

No JavaScript changes are needed — `assets/js/main.js` wires up new categories
automatically as long as the `data-target` on both nav entries matches the
`id="cat-..."` on the section.

## Renaming the restaurant

"Grand Shalimar" currently appears in: the `<title>` tag and nav logo on each
page, the footer, the `hello@grandshalimar.com` contact link, and a few copy
blocks on `privacy.html`/`terms.html`. A project-wide find-and-replace for
`Grand Shalimar` (and `grandshalimar` in the email link) will catch nearly all
of it.

## Known limitations (by design, for now)

- **Reservation form and newsletter signup are front-end only.** They validate
  and show a confirmation in the browser, but nothing is emailed, saved, or
  sent anywhere yet. Wire them up to a backend (email service, database,
  booking API) when you're ready.
- **No SEO work has been done** (meta descriptions, Open Graph tags,
  structured data, sitemap) — left out on request, for later.
- Photos are hotlinked from Unsplash placeholders. Swap `<img src="...">`
  values for your own photography before going live — every image has a
  descriptive `alt` attribute already in place to make this easy to track down.

## Deploying

This is a plain static site — drag the project folder onto Netlify/Vercel/GitHub
Pages/any static host, or upload it to any web server. No server-side runtime
required.
