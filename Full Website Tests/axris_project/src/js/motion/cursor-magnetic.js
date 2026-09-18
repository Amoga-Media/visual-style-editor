/* ═══════════════════════════════════════════════════════════
   CURSOR + MAGNETIC + TILT
   ------------------------------------------------------------
   The three interactions that respond directly to pointer
   position rather than scroll: the custom cursor ring, magnetic
   button follow, and a new lightweight 3D card tilt for depth on
   hover. Grouped in one module because they share the same
   "direct manipulation" character and, on desktop, often fire on
   the same elements in the same frame.
═══════════════════════════════════════════════════════════ */
import { gsap, ease, prefersReducedMotion, isTouch, raf } from "./core.js";

export function initCustomCursor() {
  if (isTouch) return;

  const cursor = document.createElement("div");
  cursor.id = "ax-cursor";
  cursor.innerHTML = '<div class="ax-cursor-ring"></div>';
  document.body.appendChild(cursor);
  const ring = cursor.querySelector(".ax-cursor-ring");

  document.addEventListener("mousemove", (e) => {
    raf.mouseX = e.clientX;
    raf.mouseY = e.clientY;
  });

  raf.ring = ring; // lerp runs inside the single shared ticker in core.js

  // Drag zones (currently: the marquee) are checked first and exclusively —
  // without this, the marquee's <img> children would also match the plain
  // "img" hover selector below and show the click/nav ring at the same
  // time as the drag ring instead of a single unambiguous affordance.
  const kindOf = (target) => {
    if (target.closest("[data-cursor='drag']")) return "drag";
    if (target.closest("a, button, img, [data-cursor='hover']")) return "hover";
    return null;
  };

  document.addEventListener("mouseover", (e) => {
    const kind = kindOf(e.target);
    if (kind === "drag") cursor.classList.add("ax-cursor--drag");
    else if (kind === "hover") cursor.classList.add("ax-cursor--active");
  });
  document.addEventListener("mouseout", (e) => {
    const kind = kindOf(e.target);
    if (kind === "drag") cursor.classList.remove("ax-cursor--drag");
    else if (kind === "hover") cursor.classList.remove("ax-cursor--active");
  });
  document.addEventListener("mouseleave", () => cursor.classList.add("ax-cursor--hidden"));
  document.addEventListener("mouseenter", () => cursor.classList.remove("ax-cursor--hidden"));

  // motion/drag.js dispatches these around the marquee's actual press/
  // release, independent of mouseover/out — lets the ring show a visibly
  // "caught" state for the exact duration a drag is live.
  document.addEventListener("ax:marquee-grab", () => cursor.classList.add("ax-cursor--dragging"));
  document.addEventListener("ax:marquee-release", () => cursor.classList.remove("ax-cursor--dragging"));
}

export function initMagneticButtons() {
  // Auto-promote the standard CTA shape site-wide (rounded-full + CTA
  // padding + brand/white/dark fill) so hand-authored markup doesn't need
  // to remember to add the class everywhere.
  document.querySelectorAll("a").forEach((el) => {
    if (el.classList.contains("btn-magnetic")) return;
    if (el.closest("#global-nav, #global-footer, #ax-mobile-menu")) return;
    if (el.closest(".faq-item, .faq-btn, .toc-nav, .toc-link")) return;
    const cls = el.className || "";
    const isCta = cls.includes("rounded-full") &&
      (cls.includes("px-8") || cls.includes("px-10") || cls.includes("px-6")) &&
      (cls.includes("py-4") || cls.includes("py-5") || cls.includes("py-3")) &&
      (cls.includes("bg-brand") || cls.includes("bg-white") || cls.includes("bg-dark") || cls.includes("bg-gray-8"));
    if (isCta) el.classList.add("btn-magnetic");
  });

  if (prefersReducedMotion || isTouch) return;

  document.querySelectorAll(".btn-magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * 0.4, y: y * 0.4, duration: 0.4, ease: ease.glide, overwrite: "auto" });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: ease.snap, overwrite: "auto" });
    });
    // Press feedback — the one deliberate, controlled use of scale in the
    // whole system (brief: avoid overusing scale). Real tactile response
    // to an actual click, not decoration.
    el.addEventListener("mousedown", () => gsap.to(el, { scale: 0.96, duration: 0.15, ease: ease.glide, overwrite: "auto" }));
    el.addEventListener("mouseup", () => gsap.to(el, { scale: 1, duration: 0.3, ease: ease.snap, overwrite: "auto" }));
  });
}

/* ── Card tilt depth ────────────────────────────────────────
   Subtle perspective rotate driven by cursor position within the
   element — rotateX/rotateY only (compositor-only transforms), capped
   small (±5deg) so it reads as physical weight/depth rather than a
   gimmick. Opt-in via [data-tilt] rather than blanket-applied, so it's
   used deliberately on real content surfaces (feature cards, stat
   panels) rather than everywhere. */
export function initCardTilt() {
  if (prefersReducedMotion || isTouch) return;
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const strength = parseFloat(el.dataset.tiltStrength) || 5;
    gsap.set(el, { transformPerspective: 800, transformStyle: "preserve-3d" });
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, { rotateY: px * strength, rotateX: -py * strength, duration: 0.5, ease: ease.glide, overwrite: "auto" });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: ease.snap, overwrite: "auto" });
    });

    // Keyboard-focus equivalent — focusin/focusout (not focus/blur) so this
    // still fires when a card wraps a link/button rather than being
    // focusable itself, matching cards.css's own :focus-within convention.
    el.addEventListener("focusin", () => {
      gsap.to(el, { rotateY: strength * 0.4, rotateX: -strength * 0.4, duration: 0.5, ease: ease.glide, overwrite: "auto" });
    });
    el.addEventListener("focusout", () => {
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: ease.snap, overwrite: "auto" });
    });
  });
}
