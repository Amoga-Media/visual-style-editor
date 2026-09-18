import { gsap, ease, prefersReducedMotion } from "./core.js";

export function initCtaBand() {
  const section = document.getElementById("cta-reveal");
  if (!section || prefersReducedMotion) return;

  const slides = section.querySelectorAll(".cta-text-slide");
  if (slides.length) {
    gsap.fromTo(slides, { yPercent: 115, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.9, ease: ease.enter, stagger: 0.12,
      scrollTrigger: { trigger: section, start: "top 75%", toggleActions: "play none none none" },
    });
  }

  const bg = section.querySelector(".cta-marquee-bg");
  if (bg) {
    gsap.to(bg, {
      xPercent: -12, ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1 },
    });
  }
}
