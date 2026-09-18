/* ═══════════════════════════════════════════════════════════
   MOTION CORE
   ------------------------------------------------------------
   Owns every animation dependency and every piece of shared
   per-frame state. Nothing else in the codebase calls
   `gsap.registerPlugin`, `gsap.ticker.add`, or `new Lenis()` —
   it happens exactly once, here. Every other motion module does
   `import { gsap, ScrollTrigger, ease } from "./core.js"` instead
   of `import { gsap } from "gsap"` directly, so there is
   architecturally only one place GSAP is wired up, one shared
   ticker, and one shared ease vocabulary for the whole site.
═══════════════════════════════════════════════════════════ */
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(ScrollTrigger, CustomEase, Draggable, InertiaPlugin);

/* ── Signature ease vocabulary ─────────────────────────────
   The brief calls for weight and follow-through instead of the
   uniform power3.out the whole site used before. Three named
   eases, each with a clear job — nothing else in the codebase
   should invent a fourth ad-hoc curve:
     ease.enter  — confident settle, a hair of overshoot. For
                   anything arriving on screen with intent (hero
                   lines, section headlines, card reveals).
     ease.snap   — sharper overshoot with a real bounce-back.
                   Reserved for direct-manipulation feedback
                   (magnetic buttons, cursor hover state).
     ease.glide  — no overshoot at all, pure deceleration. For
                   continuous/scroll-scrubbed motion (parallax,
                   pinned scroll-stories) where a bounce would
                   read as a glitch, not a flourish.
──────────────────────────────────────────────────────────── */
CustomEase.create("axEnter", "M0,0 C0.16,1 0.3,1 0.52,1.02 0.68,1.03 0.84,1 1,1");
CustomEase.create("axSnap", "M0,0 C0.34,1.56 0.64,1 1,1");
export const ease = {
  enter: "axEnter",
  snap: "axSnap",
  glide: "power2.out",
  linear: "none",
};

export const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

export const isTouch = window.matchMedia("(pointer: coarse)").matches;

/* ── Mobile viewport check (session 9 — mobile experience redesign) ──
   Distinct from `isTouch` on purpose: isTouch answers "can this device
   receive hover?" (used to gate direct-manipulation effects — magnetic
   buttons, cursor, tilt). isMobileViewport answers "is the available
   layout width phone-sized?" (used to gate layout-cost decisions, like
   how many DOM nodes a text-split reveal is allowed to create). A touch
   laptop with a 1440px screen should still get the full desktop reveal
   treatment; a 375px-wide phone shouldn't pay for 200 individually
   tweened character spans on every heading regardless of pointer type.
   Read once at boot to match every other capability flag in this file —
   this project doesn't re-bind animations on breakpoint-crossing resize
   anywhere else (the mobile/desktop markup swaps are load-time, not
   live), so a static read is consistent with the rest of the codebase. */
export const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;

/* ── Shared mutable state ─────────────────────────────────── */
export const state = { lenis: null };

/* Per-frame state consumed by the ONE gsap.ticker.add() callback below.
   Any new continuous (non-scroll-triggered) motion hooks in here instead
   of registering its own ticker callback — see animation-system.md's
   BUG-03 note, preserved deliberately from the previous architecture
   because it's a real, measured perf win (1 compositor write/frame
   instead of N). */
export const raf = {
  ring: null, ringX: 0, ringY: 0, mouseX: 0, mouseY: 0,
  marqueeTrack: null, marqueeX: 0, marqueeSpeed: 0.04, marqueeTotalWidth: 0,
  // Set true while motion/drag.js has the marquee under direct pointer
  // control (pressed or still coasting from inertia) so this ticker's own
  // auto-scroll write and Draggable's writes never fight over the same
  // frame — see drag.js's header comment for the full handoff sequence.
  marqueePaused: false,
};

/** Runs fn and reports (rather than throws) on failure — one broken
 *  section never takes the rest of the page's motion down with it. */
export function run(fn) {
  try { fn(); } catch (err) { console.error(`[axris/motion] ${fn.name || "init"} failed:`, err); }
}

export function initLenisAndTicker() {
  state.lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  state.lenis.on("scroll", ScrollTrigger.update);

  // Exposed for contact.js / case-studies.js, which are bundled separately
  // and resolve their own `gsap`/`ScrollTrigger` imports to these globals
  // (external-global esbuild plugin) rather than bundling a second copy.
  window.gsap = gsap;
  window.ScrollTrigger = ScrollTrigger;

  gsap.ticker.add((time, deltaTime) => {
    state.lenis.raf(time * 1000);

    if (raf.ring) {
      raf.ringX += (raf.mouseX - raf.ringX) * 0.12;
      raf.ringY += (raf.mouseY - raf.ringY) * 0.12;
      gsap.set(raf.ring, { x: raf.ringX, y: raf.ringY });
    }

    if (raf.marqueeTrack && raf.marqueeTotalWidth > 0 && !raf.marqueePaused) {
      raf.marqueeX -= deltaTime * raf.marqueeSpeed;
      if (Math.abs(raf.marqueeX) >= raf.marqueeTotalWidth - 1) raf.marqueeX = 0;
      gsap.set(raf.marqueeTrack, { x: raf.marqueeX });
    }
  });

  gsap.ticker.lagSmoothing(0);
}

/* ── Reusable scroll-storytelling primitives ─────────────────
   Two small factory functions any section can use to get pinned/
   scrubbed/parallax behaviour without hand-rolling ScrollTrigger
   config each time — this is what makes "scroll storytelling" a
   site-wide *language* rather than the horizontal timeline's
   one-off bespoke implementation. Both use transforms only
   (x/y/rotate via gsap.set — compositor-only, no layout read
   inside the scroll handler) to hold 60fps under Lenis + scrub.
──────────────────────────────────────────────────────────── */

/** Subtle scroll-linked depth on a single element: translateY (and
 *  optional slight rotate) driven by scroll progress through the
 *  viewport. No layout reads on scroll — start/end are measured once
 *  by ScrollTrigger, then every frame is a transform write. */
export function parallax(el, { speed = 40, rotate = 0, scrub = true } = {}) {
  if (!el || prefersReducedMotion) return null;
  return gsap.fromTo(
    el,
    { y: -speed, rotate: -rotate },
    {
      y: speed, rotate, ease: ease.linear,
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub },
    }
  );
}

/** A pinned, scroll-scrubbed "story": pins `pinEl` for the scroll
 *  distance implied by `distance` (px) and calls `onUpdate(progress)`
 *  every frame with a 0→1 value. Callers own what progress *means*
 *  (moving a track's x, crossfading slides, driving a timeline) —
 *  this only owns the pin/scrub mechanics, so it's reusable for the
 *  horizontal timeline, a future vertical story, etc. */
export function createScrollStory({ pinEl, distance, onUpdate, pin = true, anticipatePin = 1 }) {
  if (!pinEl) return null;
  return ScrollTrigger.create({
    trigger: pinEl,
    start: "top top",
    end: () => `+=${distance()}`,
    pin,
    pinSpacing: true,
    scrub: 0.4,
    anticipatePin,
    invalidateOnRefresh: true,
    onUpdate: (self) => onUpdate(self.progress),
  });
}

export { gsap, ScrollTrigger, Draggable };
