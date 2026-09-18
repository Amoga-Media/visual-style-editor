/* ═══════════════════════════════════════════════════════════
   DRAG
   ------------------------------------------------------------
   Session 8 addition. Every other direct-manipulation surface on
   the site (cursor, magnetic buttons, card tilt) responds to
   pointer *position*; nothing responded to pointer movement held
   down — an actual grab-and-throw. This file is that one real
   drag interaction: the homepage logo marquee, which was already
   the site's one continuously-moving element and therefore the
   one place a visitor might plausibly want to reach out and stop,
   or flick forward to see a specific logo faster.

   Ownership handoff: motion/marquee.js still owns the *ambient*
   auto-scroll (a plain per-frame decrement of raf.marqueeX in
   core.js's shared ticker). This file only takes the wheel
   temporarily — press pauses the ambient scroll (raf.marqueePaused
   = true), Draggable + InertiaPlugin own the track's x while the
   user is actively holding or the throw is still coasting, and on
   release/settle this file hands x back to raf.marqueeX so the
   ambient scroll picks up exactly where the user left it instead
   of snapping. Two systems, one baton, never both writing the
   same frame.
═══════════════════════════════════════════════════════════ */
import { gsap, prefersReducedMotion, raf, Draggable } from "./core.js";

/** Keeps the track within one loop-length of duplicated content by
 *  teleporting exactly one loop-width the instant a drag or throw
 *  crosses the boundary — invisible because the content on both sides
 *  of the seam is identical (the marquee's own two-copy loop trick, see
 *  marquee.js). Standard GSAP Draggable pattern for an infinite drag
 *  strip: mutate `this.x` inside the callback, push the same value onto
 *  the target and into raf's shared state. Reads raf.marqueeTotalWidth
 *  live (not captured at setup) so a post-resize re-measure is honored
 *  immediately instead of wrapping against a stale width. */
function wrapAndSync() {
  const totalWidth = raf.marqueeTotalWidth;
  if (!totalWidth) return;
  this.x = gsap.utils.wrap(-totalWidth, 0, this.x);
  gsap.set(this.target, { x: this.x });
  raf.marqueeX = this.x;
}

export function initDraggableMarquee() {
  const track = document.querySelector(".marquee-track");
  if (!track) return;

  if (prefersReducedMotion) {
    // marquee.js no-ops entirely under this preference (no auto-scroll
    // ticker, no measured loop width) — which previously left
    // reduced-motion visitors with a clipped, uninteractable strip: only
    // the first screenful of logos, no way to reach the rest. A plain
    // native horizontal scroll restores access without adding any of the
    // motion (auto-scroll, physics throw) this preference asks to avoid.
    track.parentElement.style.overflowX = "auto";
    track.parentElement.style.scrollbarWidth = "none";
    track.style.cursor = "default";
    return;
  }

  const resume = () => {
    raf.marqueeX = gsap.getProperty(track, "x");
    raf.marqueePaused = false;
  };

  // Cursor affordance, auto-applied — the same "promote via JS, touch no
  // markup" convention initMagneticButtons() uses for .btn-magnetic. The
  // custom cursor (cursor-magnetic.js) reads this attribute to swap its
  // usual circular hover ring for a horizontal grab pill, so the cursor
  // itself telegraphs "drag me" before the visitor ever presses.
  track.setAttribute("data-cursor", "drag");

  Draggable.create(track, {
    type: "x",
    inertia: true,
    cursor: "grab",
    activeCursor: "grabbing",
    onPress() {
      raf.marqueePaused = true;
      document.dispatchEvent(new CustomEvent("ax:marquee-grab"));
    },
    onDrag: wrapAndSync,
    onThrowUpdate: wrapAndSync,
    onRelease() {
      document.dispatchEvent(new CustomEvent("ax:marquee-release"));
      // Draggable sets `this.tween` synchronously, before this callback
      // fires, whenever a throw was actually created (enough release
      // velocity + inertia:true). No tween means the user let go almost
      // stationary — nothing else will ever resume the ambient scroll,
      // so do it immediately. When a tween DOES exist, onThrowComplete
      // below is solely responsible for resuming, once the coast
      // actually finishes — resuming here too would yank control away
      // from a still-animating throw.
      if (!this.tween) resume();
    },
    onThrowComplete: resume,
  });
}
