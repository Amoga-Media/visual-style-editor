/* ═══════════════════════════════════════════════════════════
   AXRIS MEDIA SOLUTIONS — MASTER ENGINE
   ------------------------------------------------------------
   Bundled (esbuild — see build.js) into assets/js/main.js, loaded
   by every page via one <script defer> tag.

   ALL motion — page transitions, hero timelines, scroll
   storytelling, parallax, cursor interactions, micro motion, text
   and image reveals — lives under src/js/motion/ and is owned by
   src/js/motion/core.js's single GSAP/ScrollTrigger/Lenis
   registration and shared ticker. Nothing outside motion/ imports
   "gsap" directly. The few remaining modules here are NOT
   animation — component injection, cookie consent, TOC
   scroll-to-anchor, nav highlighting, mobile-menu open/close state —
   and stay in core/ + ui/.
═══════════════════════════════════════════════════════════ */
import { ScrollTrigger, prefersReducedMotion, run, initLenisAndTicker } from "./motion/core.js";
import { initPageTransitions } from "./motion/page-transitions.js";
import { initHeroEntrance } from "./motion/hero.js";
import { initExplicitReveals, initAutoReveals } from "./motion/reveal.js";
import { initHorizontalTimeline, initStickyAccordion, initParallax } from "./motion/scroll-story.js";
import { initMobileStory } from "./motion/mobile-story.js";
import { initCtaBand } from "./motion/cta-band.js";
import { initCounters } from "./motion/counters.js";
import { initMarquee } from "./motion/marquee.js";
import { initDraggableMarquee } from "./motion/drag.js";
import { initCustomCursor, initMagneticButtons, initCardTilt } from "./motion/cursor-magnetic.js";
import { initHoverLift, initImageHoverReveal, initCaseStudyHoverReveal } from "./motion/micro.js";
import { initFAQ, initDetailsFAQ } from "./motion/faq.js";

import { loadComponents } from "./core/components-loader.js";
import { initMobileNav } from "./ui/mobile-nav.js";
import { initCookieConsent } from "./ui/cookie-consent.js";
import { initActiveNav } from "./ui/active-nav.js";
import { initTOC } from "./ui/toc.js";

/* ─────────────────────────────────────────────────────────
   MOTION BOOT SEQUENCE
   Order matters: page-transition curtain first (it's already
   covering the viewport from first paint — retract it early),
   then the hero's own choreographed timeline (which explicitly
   excludes itself from the reveal system so the two never
   double-animate the same elements), then the general reveal
   passes, then everything scroll/hover-driven, which can safely
   assume layout has settled.
───────────────────────────────────────────────────────── */
function initMotion() {
  run(initPageTransitions);
  run(initHeroEntrance);
  run(initExplicitReveals);
  run(initAutoReveals);
  run(initCounters);
  run(initHorizontalTimeline);
  run(initMobileStory);
  run(initStickyAccordion);
  run(initParallax);
  run(initCtaBand);
  run(initMarquee);
  run(initDraggableMarquee);
  run(initFAQ);
  run(initDetailsFAQ);
  run(initMagneticButtons);
  run(initCardTilt);
  run(initHoverLift);
  run(initImageHoverReveal);
  run(initCaseStudyHoverReveal);
  run(initTOC);

  ScrollTrigger.refresh();
}

document.addEventListener("DOMContentLoaded", () => {
  initLenisAndTicker();
  if (!prefersReducedMotion) run(initCustomCursor);
  initCookieConsent();
  initMotion();

  loadComponents().then(() => {
    run(initMobileNav);
    run(initActiveNav);
    ScrollTrigger.refresh(); // footer injection changes document height
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
});
