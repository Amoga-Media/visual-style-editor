/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./index.html",
    "./pages/**/*.html",
    "./assets/components/**/*.html",
    "./src/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        // === CORE BRAND (unchanged source of truth — see design-system.md) ===
        'brand': {
          DEFAULT: '#0EA5E9',
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0EA5E9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        'dark':  '#0A0A0A',
        'light': '#FAFAFA',

        // === VISUAL REDESIGN — warm neutral scale (replaces default
        // cool-blue Tailwind gray) ===============================
        // The single biggest reason this site read as "default Tailwind"
        // rather than handcrafted was that every neutral (222 border-200s,
        // 229 text-600s, etc.) was Tailwind's stock blue-tinted gray scale
        // — the exact same ramp used by a huge percentage of Tailwind
        // sites out of the box. Swapping the `gray` key to a warm,
        // slightly toasted neutral (Tailwind's own well-tested `stone`
        // ramp, chosen for guaranteed contrast/accessibility parity with
        // the values it replaces) instantly re-tunes every existing
        // gray-* utility across all 16 pages toward the brand's warm
        // paper/ink palette — zero markup changes required, same
        // contrast ratios, completely different feeling.
        'gray': colors.stone,

        // === Formalized accent (was: ad-hoc #f97316 hardcoded directly
        // in cursor.css + cookie-consent.css, see design-system.md
        // "semantic colors in use, not formally tokenized anywhere") ===
        // Retuned from stock Tailwind orange to a warmer, less candy-ish
        // clay/terracotta so it reads as an intentional second brand
        // color instead of a leftover default swatch.
        'accent': {
          DEFAULT: '#C2542E',
          50:  '#FBF0EA',
          100: '#F5DCCC',
          400: '#D97A4F',
          500: '#C2542E',
          600: '#A1421F',
          700: '#7C331A',
        },

        // === Ink — a true off-black used only for hairline borders /
        // shadow tint mixing, distinct from `dark` (which stays reserved
        // for large dark-section backgrounds) ===
        'ink': '#14110F',
      },

      // Card radius tokens (kept from prior session — already resolved
      // the rounded-3xl / rounded-[2rem] / rounded-[2.5rem] three-way
      // split described in design-system.md).
      borderRadius: {
        'card':    '1.75rem',
        'card-lg': '2.25rem',
      },

      fontFamily: {
        'inter':   ['Inter', 'sans-serif'],
        'satoshi': ['Satoshi', 'sans-serif'],
        // === SESSION 12 — typography unification ====================
        // Was Fraunces (a display serif) through Session 4–11. Pulled
        // per direct client feedback: the serif-italic accent moments
        // (hero verb, huge stat numerals, pull-quotes) read as a third,
        // unrelated typographic voice against Satoshi's confident
        // geometric sans everywhere else — exactly the inconsistency
        // the client called out, contrasting the homepage unfavourably
        // against services.html/case-studies.html, which never adopted
        // Fraunces and stayed Satoshi/Inter-only throughout.
        // `font-display` now resolves to Satoshi itself — hierarchy for
        // those "big moment" elements (see editorial.css) is carried by
        // weight/size/tracking/color instead of a second family. One
        // typeface, used with more range, reads as more premium and
        // more deliberate for an enterprise B2B brand than a sans+serif
        // pairing — and removes an entire webfont's network weight,
        // which also helps the animation-performance audit in
        // PERFORMANCE_REPORT.md (one less font swap fighting GSAP/
        // ScrollTrigger for the main thread on first load).
        'display':  ['Satoshi', 'sans-serif'],
      },

      // === VISUAL REDESIGN — bespoke type scale ===================
      // Same rem sizes as Tailwind's stock scale (so responsive stacking
      // / wrapping behavior already tuned across 16 pages doesn't shift),
      // but every step now carries a hand-tuned line-height + letter-
      // spacing pairing instead of Tailwind's flat defaults. Large
      // display sizes tighten up (negative tracking, tight leading) the
      // way handset premium/editorial type does; small sizes open up
      // slightly for readability. This single change restyles every
      // heading and paragraph on every page without touching any HTML.
      fontSize: {
        xs:   ['0.75rem',   { lineHeight: '1.5',   letterSpacing: '0.01em' }],
        sm:   ['0.875rem',  { lineHeight: '1.6',   letterSpacing: '0.005em' }],
        base: ['1rem',      { lineHeight: '1.7',   letterSpacing: '0' }],
        lg:   ['1.125rem',  { lineHeight: '1.65',  letterSpacing: '0' }],
        xl:   ['1.25rem',   { lineHeight: '1.55',  letterSpacing: '-0.006em' }],
        '2xl':  ['1.5rem',   { lineHeight: '1.4',  letterSpacing: '-0.01em' }],
        '3xl':  ['1.875rem', { lineHeight: '1.28', letterSpacing: '-0.015em' }],
        '4xl':  ['2.25rem',  { lineHeight: '1.18', letterSpacing: '-0.02em' }],
        '5xl':  ['3rem',     { lineHeight: '1.1',  letterSpacing: '-0.025em' }],
        '6xl':  ['3.75rem',  { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        '7xl':  ['4.5rem',   { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        '8xl':  ['6rem',     { lineHeight: '1',    letterSpacing: '-0.035em' }],
        '9xl':  ['7.5rem',   { lineHeight: '0.98', letterSpacing: '-0.04em' }],
      },

      // === VISUAL REDESIGN — tinted, layered shadows ===============
      // Replaces Tailwind's flat black-alpha shadow-sm/md/lg/xl/2xl
      // (one of the most recognizable "default Tailwind" tells) with
      // soft, warm, ink-tinted, two-layer shadows: a tight contact
      // shadow + a diffuse ambient one, the way real light falls on a
      // raised card. Same utility names (shadow-sm, shadow-lg, ...),
      // so every one of the ~380 existing shadow-* usages site-wide
      // upgrades automatically.
      boxShadow: {
        sm:  '0 1px 2px 0 rgba(20,17,15,0.05), 0 1px 1px 0 rgba(20,17,15,0.03)',
        DEFAULT: '0 2px 8px -2px rgba(20,17,15,0.08), 0 1px 2px -1px rgba(20,17,15,0.04)',
        md:  '0 6px 16px -4px rgba(20,17,15,0.10), 0 2px 6px -2px rgba(20,17,15,0.05)',
        lg:  '0 16px 32px -8px rgba(20,17,15,0.12), 0 4px 10px -4px rgba(20,17,15,0.06)',
        xl:  '0 28px 56px -12px rgba(20,17,15,0.16), 0 8px 16px -6px rgba(20,17,15,0.07)',
        '2xl': '0 40px 80px -16px rgba(20,17,15,0.20), 0 12px 24px -8px rgba(20,17,15,0.08)',
        inner: 'inset 0 2px 4px 0 rgba(20,17,15,0.06)',
      },
    },
  },
  plugins: [],
}
