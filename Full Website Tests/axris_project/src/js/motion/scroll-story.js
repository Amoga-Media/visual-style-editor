/* ═══════════════════════════════════════════════════════════
   SCROLL STORY
   ------------------------------------------------------------
   Everything driven by scroll progress rather than a one-shot
   "enter viewport" trigger: the horizontal pinned timeline, the
   sticky accordion crossfade (about-us/services), and lightweight
   parallax depth on hero art / section background imagery.
═══════════════════════════════════════════════════════════ */
import { gsap, ScrollTrigger, parallax, prefersReducedMotion } from "./core.js";

/* ── Horizontal pinned timeline (homepage "full-funnel execution") ──
   Mechanics unchanged from the previous implementation (CSS `position:
   sticky`, not GSAP pin:true, transform-only drive, will-change toggled
   only while in view) — this remains the site's signature scroll-story
   moment and the doc's own audit called the mechanics sound; only the
   authoring is now a thin wrapper so the same pin/scrub pattern is
   reusable elsewhere instead of living only here. */
export function initHorizontalTimeline() {
  const section = document.getElementById("horizontal-services-desktop");
  const track = section ? section.querySelector(".ht-track") : null;
  const progress = document.getElementById("ht-progress");
  if (!section || !track) return;

  const getScrollAmount = () => -(track.scrollWidth - window.innerWidth);
  const setSectionHeight = () => {
    section.style.height = window.innerHeight + Math.abs(getScrollAmount()) + "px";
  };
  setSectionHeight();

  gsap.to(track, {
    x: getScrollAmount,
    ease: "none",
    scrollTrigger: {
      trigger: section, start: "top top", end: "bottom bottom", scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => { if (progress) progress.style.width = self.progress * 100 + "%"; },
      onEnter: () => { track.style.willChange = "transform"; },
      onEnterBack: () => { track.style.willChange = "transform"; },
      onLeave: () => { track.style.willChange = "auto"; },
      onLeaveBack: () => { track.style.willChange = "auto"; },
    },
  });

  ScrollTrigger.addEventListener("refreshInit", setSectionHeight);
}

/* ── Sticky accordion crossfade (about-us.html, services.html) ──
   No-ops safely on pages without .accordion-item. Opacity-only writes
   (no width/height/layout properties), so this doesn't trigger layout
   even though it runs on every onEnter/onEnterBack through the section. */
export function initStickyAccordion() {
  const items = document.querySelectorAll(".accordion-item");
  if (!items.length) return;

  const images = {};
  items.forEach((item) => {
    const id = item.getAttribute("data-img");
    if (id && document.getElementById(id)) images[id] = document.getElementById(id);
  });

  if (items[0]) {
    items[0].style.opacity = "1";
    const firstImgId = items[0].getAttribute("data-img");
    if (images[firstImgId]) gsap.set(images[firstImgId], { opacity: 1, scale: 1, zIndex: 30 });
  }

  items.forEach((item) => {
    const targetImgId = item.getAttribute("data-img");
    ScrollTrigger.create({
      trigger: item, start: "top center", end: "bottom center",
      onEnter: () => activate(item, targetImgId),
      onEnterBack: () => activate(item, targetImgId),
    });
  });

  function activate(activeItem, activeImgId) {
    items.forEach((i) => (i.style.opacity = "0.3"));
    activeItem.style.opacity = "1";
    Object.keys(images).forEach((key) => {
      const img = images[key];
      if (!img) return;
      if (key === activeImgId) {
        img.style.zIndex = "30";
        gsap.to(img, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" });
      } else {
        img.style.zIndex = "10";
        gsap.to(img, { opacity: 0, scale: 1.1, duration: 0.6, ease: "power2.out" });
      }
    });
  }
}

/* ── Parallax depth pass ──────────────────────────────────
   Any element flagged data-parallax gets a gentle scroll-linked
   translateY (transform-only, scrubbed). Depth magnitude can be tuned
   per-element via data-parallax-speed (px). Kept subtle by default —
   the brief warns against overusing scale, and heavy parallax on large
   images is also a common jank source, so this stays small and
   deliberate rather than a site-wide "everything drifts" effect. */
export function initParallax() {
  if (prefersReducedMotion) return;
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const speed = parseFloat(el.dataset.parallaxSpeed) || 28;
    parallax(el, { speed });
  });
}
