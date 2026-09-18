import { gsap, ease, prefersReducedMotion, isTouch } from "./core.js";

/** Card hover lift — captures the Tailwind-computed box-shadow once so
 *  mouseleave restores it instead of zeroing it out permanently.
 *
 *  prefersReducedMotion guard (session 8): this GSAP tween sets an inline
 *  `transform`, which — being inline — wins the cascade over cards.css's
 *  own `@media (prefers-reduced-motion: reduce) { transform: none }`
 *  block every time, silently defeating it on any element this function
 *  also touches. The bug was invisible until now because nothing had
 *  compared the two systems directly: cards.css correctly disables its
 *  hover lift under reduced motion, but this file was still lifting the
 *  same elements regardless. Bailing out here is the actual fix; the CSS
 *  guard was already correct.
 *
 *  isTouch guard (session 9 — mobile experience redesign): this was
 *  attaching mouseenter/mouseleave/focusin/focusout to every rounded-card
 *  element site-wide unconditionally, including on phones. Two real
 *  problems, not one: (1) mobile browsers fire a synthetic `mouseenter`
 *  on tap but frequently never fire the matching `mouseleave` until the
 *  user taps a completely different element, so a tapped card could lift
 *  and visibly stay lifted/shadowed after the tap — a "stuck hover" that
 *  reads as a bug; (2) it's pure wasted listener registration and GSAP
 *  tween setup on every card on every page load for an interaction
 *  metaphor (hover) that doesn't exist on a touchscreen. Touch devices
 *  get real tap feedback instead via CSS `:active` — see
 *  mobile/mobile-experience.css §Touch interaction language. */
export function initHoverLift() {
  if (prefersReducedMotion || isTouch) return;

  document.querySelectorAll('.rounded-3xl, [class*="rounded-[2"], .rounded-card').forEach((el) => {
    if (el.closest("#global-nav, #global-footer, #ax-mobile-menu")) return;
    if (el.tagName !== "DIV" && el.tagName !== "A") return;

    const baseShadow = getComputedStyle(el).boxShadow;
    const liftIn = () => gsap.to(el, { y: -5, boxShadow: "0 28px 70px rgba(0,0,0,0.12)", duration: 0.4, ease: ease.glide, overwrite: "auto" });
    const liftOut = () => gsap.to(el, { y: 0, boxShadow: baseShadow, duration: 0.4, ease: ease.glide, overwrite: "auto" });

    el.addEventListener("mouseenter", liftIn);
    el.addEventListener("mouseleave", liftOut);
    // focusin/focusout (not focus/blur) so a card that wraps a link or
    // button — the common case — still lifts when that child is
    // keyboard-focused, not only when the card itself somehow is.
    el.addEventListener("focusin", liftIn);
    el.addEventListener("focusout", liftOut);
  });
}

/** Image-hover-reveal — a slow, deliberate scale (the one other place
 *  scale is used intentionally, alongside button press feedback) on
 *  card/feature images under a fixed-size, overflow-hidden frame, so the
 *  zoom never affects surrounding layout. Opt in via [data-hover-zoom].
 *  Same reduced-motion guard and focus-parity reasoning as initHoverLift
 *  above — see that function's comment. */
export function initImageHoverReveal() {
  if (prefersReducedMotion || isTouch) return;

  document.querySelectorAll("[data-hover-zoom]").forEach((frame) => {
    const img = frame.querySelector("img");
    if (!img) return;
    frame.style.overflow = "hidden";
    const zoomIn = () => gsap.to(img, { scale: 1.06, duration: 0.7, ease: ease.glide, overwrite: "auto" });
    const zoomOut = () => gsap.to(img, { scale: 1, duration: 0.6, ease: ease.glide, overwrite: "auto" });

    frame.addEventListener("mouseenter", zoomIn);
    frame.addEventListener("mouseleave", zoomOut);
    frame.addEventListener("focusin", zoomIn);
    frame.addEventListener("focusout", zoomOut);
  });
}

/** Case-study quick-browse hover preview (case-studies.html only) —
 *  image preview follows the cursor, swaps source on hover/focus.
 *
 *  Session 8 fix: focus already swapped the preview <img>'s src (so the
 *  right image was loaded and ready) but never actually showed the
 *  preview box — it stays opacity:0 until a mouseenter/mousemove fires,
 *  which a keyboard user tabbing through the list never triggers. A
 *  sighted keyboard user got the same underlying content change as a
 *  mouse user (the h3/label text already reveals via CSS group-focus) but
 *  none of the accompanying visual. Fixed by giving focus its own
 *  show/hide pair, positioned from the link's own bounding box instead of
 *  a cursor coordinate that doesn't exist for keyboard input. */
export function initCaseStudyHoverReveal() {
  const links = document.querySelectorAll(".cs-quick-item a[data-img]");
  const previewBox = document.getElementById("cs-hover-preview");
  const previewImg = previewBox ? previewBox.querySelector("img") : null;
  if (!links.length || !previewBox || !previewImg) return;

  let loadedSrc = "";
  links.forEach((link) => {
    // Cursor-follow preview only makes sense where there's a cursor to
    // follow. On touch, `mouseenter` fires as a synthetic event on tap
    // but the matching `mouseleave` is unreliable (same class of bug as
    // micro.js's card hover-lift — see initHoverLift's comment above),
    // which would leave a floating preview box stuck on screen after a
    // tap. The focus-driven path below (added for keyboard access) also
    // covers touch screen-reader users correctly, so nothing is lost by
    // skipping the mouse path here — see isTouch's own doc comment in
    // core.js for why this is a viewport-independent, device-capability
    // check rather than a width check.
    if (!isTouch) {
      link.addEventListener("mouseenter", () => {
        const src = link.getAttribute("data-img");
        if (src && src !== loadedSrc) { previewImg.src = src; loadedSrc = src; }
        gsap.to(previewBox, { opacity: 1, scale: 1, duration: 0.4, ease: ease.snap, overwrite: "auto" });
      });
      link.addEventListener("mousemove", (e) => {
        const xOffset = window.innerWidth < 768 ? 130 : 170;
        const yOffset = window.innerWidth < 768 ? 98 : 128;
        gsap.to(previewBox, { x: e.clientX - xOffset, y: e.clientY - yOffset, duration: 0.2, ease: ease.glide, overwrite: "auto" });
      });
      link.addEventListener("mouseleave", () => {
        gsap.to(previewBox, { opacity: 0, scale: 0.5, duration: 0.3, ease: "power2.in", overwrite: "auto" });
      });
    }
    link.addEventListener("focus", () => {
      const src = link.getAttribute("data-img");
      if (src && src !== loadedSrc) { previewImg.src = src; loadedSrc = src; }
      // Anchor to the row itself (vertically centered, offset right of
      // the text) since there's no pointer coordinate to follow.
      const rect = link.getBoundingClientRect();
      const boxWidth = previewBox.offsetWidth || (window.innerWidth < 768 ? 260 : 340);
      gsap.set(previewBox, { x: rect.right - boxWidth, y: rect.top - 20 });
      gsap.to(previewBox, { opacity: 1, scale: 1, duration: 0.4, ease: ease.snap, overwrite: "auto" });
    });
    link.addEventListener("blur", () => {
      gsap.to(previewBox, { opacity: 0, scale: 0.5, duration: 0.3, ease: "power2.in", overwrite: "auto" });
    });
  });
}
