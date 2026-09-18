/* ═══════════════════════════════════════════════════════════
   REVEAL SYSTEM
   ------------------------------------------------------------
   ONE authoring convention: data-reveal="fade-up|fade-left|
   fade-right|word-by-word|letter-by-letter|image-wipe" (+ optional
   data-reveal-delay) and data-reveal-stagger on a parent for
   staggered children. Legacy `.reveal-up/-left/-right/-stagger`
   classes (still present in older markup) are treated as aliases,
   normalized to the same data-reveal path on boot rather than
   running a second, parallel implementation — previously the site
   had three independent reveal systems (explicit data-reveal,
   legacy classes, silent auto-detection) that had to be kept in
   sync by hand; this is the one place that logic lives now.

   Undecorated headings/paragraphs/content images are still
   auto-tagged (site-wide consistency without hand-annotating every
   page) — but auto-tagging now ALWAYS routes through the exact same
   reveal() function real data-reveal markup uses, so "explicit" and
   "automatic" can never drift into two different-looking animations.
═══════════════════════════════════════════════════════════ */
import { gsap, ScrollTrigger, ease, prefersReducedMotion, isMobileViewport } from "./core.js";
import { splitWords, splitLetters } from "../utils/text-split.js";

const EXCLUDE_SELECTOR = [
  "#global-nav", "#global-footer", "#ax-mobile-menu",
  ".faq-item", ".faq-btn", ".faq-content",
  ".toc-nav", ".toc-link", ".legal-toc",
  ".ht-track",              // horizontal timeline slides — the slide sliding in IS the reveal
  "[data-mobile-story-card]", // mobile scroll-story cards — same reasoning, owned by motion/mobile-story.js
  "#cta-reveal",             // has its own clip-mask timeline (cta-band.js)
  "#hero-classic",          // has its own choreographed timeline (hero.js)
  ".accordion-item",
  ".marquee-track",
  "[role='dialog']",
  ".sr-only",
  "#ax-cookie-banner",
  "#cs-hover-preview", ".cs-parallax-img", ".cs-timeline-item",
].join(", ");

function isExcluded(el) {
  return !!el.closest(EXCLUDE_SELECTOR);
}

function ancestorAlreadyReveals(el, depth = 3) {
  let node = el.parentElement;
  for (let i = 0; i < depth; i++) {
    if (!node) break;
    if (node.dataset && node.dataset.reveal) return true;
    node = node.parentElement;
  }
  return false;
}

/* ── The single reveal() implementation every path (explicit
   markup, legacy-class normalization, and lazy auto-detection)
   calls into. ──────────────────────────────────────────────── */
function reveal(el, kind, { delay = 0, immediate = false } = {}) {
  const trigger = immediate ? null : { trigger: el, start: "top 87%", toggleActions: "play none none none" };

  switch (kind) {
    case "fade-up":
      return gsap.fromTo(el, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.9, ease: ease.enter, delay, scrollTrigger: trigger });
    case "fade-left":
      return gsap.fromTo(el, { opacity: 0, x: -44 }, { opacity: 1, x: 0, duration: 0.9, ease: ease.enter, delay, scrollTrigger: trigger });
    case "fade-right":
      return gsap.fromTo(el, { opacity: 0, x: 44 }, { opacity: 1, x: 0, duration: 0.9, ease: ease.enter, delay, scrollTrigger: trigger });
    case "word-by-word": {
      const words = splitWords(el);
      if (!words.length) return null;
      return gsap.fromTo(words, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: ease.enter, stagger: 0.02, delay, scrollTrigger: trigger });
    }
    case "letter-by-letter": {
      const chars = splitLetters(el);
      if (!chars.length) return null;
      return gsap.fromTo(chars, { opacity: 0, y: 34, rotateX: -85 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.8, ease: ease.snap, stagger: 0.026, delay, scrollTrigger: trigger });
    }
    case "image-wipe": {
      // Clip-path wipe instead of the old opacity+scale fade — a real
      // "image reveal" (the frame uncovers the image) rather than a
      // generic fade any element could have. Transform-and-clip only:
      // no width/height/layout properties touched.
      const wrap = el.closest("[data-reveal-wrap]") || el.parentElement;
      if (wrap) gsap.set(wrap, { overflow: "hidden" });
      const tl = gsap.timeline({ delay, scrollTrigger: trigger });
      tl.fromTo(el, { clipPath: "inset(0 0 100% 0)", scale: 1.12 }, { clipPath: "inset(0 0 0% 0)", duration: 1.0, ease: ease.enter }, 0)
        .to(el, { scale: 1, duration: 1.1, ease: ease.glide }, 0.05);
      return tl;
    }
    default:
      return null;
  }
}

function normalizeLegacyClasses() {
  document.querySelectorAll(".reveal-up, .reveal-left, .reveal-right").forEach((el) => {
    if (el.dataset.reveal) return;
    if (el.classList.contains("reveal-up")) el.dataset.reveal = "fade-up";
    else if (el.classList.contains("reveal-left")) el.dataset.reveal = "fade-left";
    else if (el.classList.contains("reveal-right")) el.dataset.reveal = "fade-right";
  });
  document.querySelectorAll(".reveal-stagger").forEach((parent) => {
    if (parent.dataset.revealStagger) return;
    parent.dataset.revealStagger = "0.1";
    Array.from(parent.children).forEach((child) => {
      if (!child.dataset.reveal) child.dataset.reveal = "fade-up";
    });
  });
}

/** Explicit data-reveal markup (all pages) + legacy class aliases,
 *  normalized to the same attribute above. Runs eagerly on boot since
 *  there are typically only a few dozen explicitly-authored elements
 *  per page — cheap enough not to need the lazy IntersectionObserver
 *  the auto-detection pass below uses for the much larger, undecorated
 *  set (every heading/paragraph/image site-wide). */
export function initExplicitReveals() {
  if (prefersReducedMotion) return;
  normalizeLegacyClasses();

  document.querySelectorAll("[data-reveal-stagger]").forEach((parent) => {
    const staggerAmt = parseFloat(parent.dataset.revealStagger) || 0.1;
    const children = Array.from(parent.children).filter((c) => c.dataset.reveal);
    if (!children.length) return;
    const kind = children[0].dataset.reveal;
    const tl = gsap.timeline({ scrollTrigger: { trigger: parent, start: "top 82%", toggleActions: "play none none none" } });
    children.forEach((child, i) => {
      child.dataset.__revealHandled = "1";
      const fromVars = kind === "fade-left" ? { x: -40 } : kind === "fade-right" ? { x: 40 } : { y: 36 };
      tl.fromTo(child, { opacity: 0, ...fromVars }, { opacity: 1, x: 0, y: 0, duration: 0.75, ease: ease.enter }, i * staggerAmt);
    });
  });

  document.querySelectorAll("[data-reveal]:not([data-__reveal-handled])").forEach((el) => {
    if (el.dataset.__revealHandled) return;
    const kind = el.dataset.reveal;
    const delay = parseFloat(el.dataset.revealDelay) || 0;
    reveal(el, kind, { delay });
    el.dataset.__revealHandled = "1";
  });
}

/** Lazy auto-detection: tags every undecorated heading/paragraph/
 *  content image site-wide and reveals it the first time it actually
 *  scrolls into view, via one shared IntersectionObserver rather than
 *  one ScrollTrigger per element (was ~60+ on the homepage alone). */
export function initAutoReveals() {
  if (prefersReducedMotion) return;

  const skipTextSplitting = !!document.querySelector(".legal-section, .legal-toc, .toc-nav");
  const targets = new Map();

  /* Mobile perf note (session 9): letter-by-letter split creates one
     tweened <span> per character (splitLetters, utils/text-split.js) plus
     a 3D rotateX per span — cheap on a handful of desktop hero moments,
     genuinely expensive when applied automatically to *every* undecorated
     heading on a phone-class device (more layout thrash from the DOM
     rewrite, more compositor layers from the 3D transforms, all on
     weaker hardware). Auto-detected headings downgrade to the same
     fade-up treatment fade-up/word-by-word content gets; explicit
     data-reveal="letter-by-letter" markup (hand-chosen by a page author
     for one specific moment, e.g. hero.js's own headline) is untouched —
     this only affects the "nobody annotated this, so auto-tag it" path. */
  const headingKind = isMobileViewport ? "fade-up" : "letter-by-letter";

  if (!skipTextSplitting) {
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => {
      if (el.dataset.reveal || el.dataset.split || isExcluded(el)) return;
      if (ancestorAlreadyReveals(el)) return;
      if (el.textContent.trim().length < 3) return;
      targets.set(el, headingKind);
    });
    document.querySelectorAll("p").forEach((el) => {
      if (el.dataset.reveal || el.dataset.split || isExcluded(el)) return;
      if (ancestorAlreadyReveals(el)) return;
      if (el.closest("li, .toc-link")) return;
      if (el.textContent.trim().length < 25) return;
      targets.set(el, "word-by-word");
    });
  }

  document.querySelectorAll("img").forEach((img) => {
    if (img.dataset.reveal || isExcluded(img)) return;
    if (img.closest("[data-reveal]")) return;
    const w = parseInt(img.getAttribute("width") || "0", 10);
    if (w && w < 64) return;
    targets.set(img, "image-wipe");
  });

  document.querySelectorAll(".btn-magnetic").forEach((el) => {
    if (el.dataset.reveal || isExcluded(el)) return;
    if (ancestorAlreadyReveals(el)) return;
    el.dataset.reveal = "fade-up"; // marks it handled; tweened directly below (cheap, no split needed)
    reveal(el, "fade-up");
  });

  if (!targets.size) return;

  let refreshTimer = null;
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const kind = targets.get(entry.target);
      targets.delete(entry.target);
      entry.target.dataset.reveal = kind;
      reveal(entry.target, kind, { immediate: true });
      scheduleRefresh();
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });

  targets.forEach((_kind, el) => io.observe(el));
}
