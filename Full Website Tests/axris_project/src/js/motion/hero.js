/* ═══════════════════════════════════════════════════════════
   HERO TIMELINE
   ------------------------------------------------------------
   Previously each `.hero-anim` element got an independent
   gsap.fromTo with the same stagger delay math repeated at every
   call site. This builds ONE real timeline per hero so the pieces
   arrive with actual choreography — kicker settles first, headline
   follows with the signature overshoot ease, then paragraph/CTAs/
   art trail in on the same timeline instead of four unrelated
   tweens that happen to start around the same time.
═══════════════════════════════════════════════════════════ */
import { gsap, ease, prefersReducedMotion } from "./core.js";
import { splitLetters } from "../utils/text-split.js";

export function initHeroEntrance() {
  const hero = document.getElementById("hero-classic");
  if (!hero) return;

  const items = hero.querySelectorAll(".hero-anim");
  if (!items.length) return;

  if (prefersReducedMotion) {
    gsap.set(items, { opacity: 1, x: 0, y: 0 });
    return;
  }

  const headline = hero.querySelector("h1");
  const tl = gsap.timeline({ defaults: { ease: ease.enter } });

  items.forEach((el) => {
    if (el === headline) return; // headline gets its own letter-driven step below
    gsap.set(el, { opacity: 0, y: 28 });
  });

  let t = 0;

  // 1 — kicker / eyebrow settles first, a quiet beat before the headline
  const kicker = hero.querySelector(".kicker");
  if (kicker && kicker.classList.contains("hero-anim")) {
    tl.to(kicker, { opacity: 1, y: 0, duration: 0.6 }, t);
    t += 0.18;
  }

  // 2 — headline: letter-split with the sharper "snap" ease for real
  // follow-through weight on the site's single highest-impact moment.
  if (headline) {
    const chars = splitLetters(headline);
    if (chars.length) {
      gsap.set(chars, { opacity: 0, y: 36, rotateX: -70 });
      tl.to(chars, { opacity: 1, y: 0, rotateX: 0, duration: 0.9, ease: ease.snap, stagger: 0.016 }, t);
    } else {
      gsap.set(headline, { opacity: 0, y: 28 });
      tl.to(headline, { opacity: 1, y: 0, duration: 0.8 }, t);
    }
    t += 0.32;
  }

  // 3 — everything else trails in with a light stagger, overlapping the
  // tail of the headline rather than waiting for it to fully finish —
  // reads as one continuous entrance, not a sequence of separate beats.
  items.forEach((el) => {
    if (el === headline || (kicker && el === kicker)) return;
    tl.to(el, { opacity: 1, y: 0, duration: 0.75 }, t);
    t += 0.09;
  });
}
