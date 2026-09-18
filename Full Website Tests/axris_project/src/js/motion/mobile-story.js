/* ═══════════════════════════════════════════════════════════
   MOBILE SCROLL-STORY — session 9
   ------------------------------------------------------------
   The mobile-only counterpart to the desktop pinned horizontal
   timeline (motion/scroll-story.js's initHorizontalTimeline). Where
   the mobile section previously just stacked all four stages
   statically with a plain fade-up each, this gives it its own
   equivalent set piece: a slim rail stays sticky just beneath the
   mobile nav for the section's duration, its fill bar tracking overall
   scroll progress and its index/label crossfading to match whichever
   stage card is centered in view, while each card gets a slightly more
   deliberate scale-in entrance than the site's default fade-up.

   Deliberately NOT a GSAP-pinned scroll-jack, on purpose: pinning each
   card (the naive mobile translation of "desktop, but vertical") would
   mean 4 separate scroll-hijacked holds back to back, which fights
   momentum scrolling and reads as laggy/stuck on touch — see
   scroll-story.js's own comment on why the desktop version itself uses
   `position: sticky` over `pin: true` for exactly this reason. This
   mirrors that same judgment rather than introducing a second, heavier
   convention for mobile specifically.

   ScrollTrigger.matchMedia (rather than a one-time width check, the
   pattern the rest of this codebase otherwise uses — see core.js's own
   isMobileViewport comment on why a static read is normally correct
   here) is used deliberately for this one feature: it's the difference
   between a user rotating a tablet from portrait to landscape mid-scroll
   getting a broken half-initialized rail versus GSAP just handling the
   teardown/setup for them, and ScrollTrigger already provides this for
   free with no extra bookkeeping on this file's part.
═══════════════════════════════════════════════════════════ */
import { gsap, ScrollTrigger, ease, prefersReducedMotion } from "./core.js";

export function initMobileStory() {
  const section = document.getElementById("horizontal-services-mobile");
  if (!section) return;

  const rail = section.querySelector("[data-mobile-story-rail]");
  const cards = section.querySelectorAll("[data-mobile-story-card]");
  if (!rail || !cards.length) return;

  const fill = rail.querySelector(".mobile-story-rail__fill");
  const indexEl = rail.querySelector(".mobile-story-rail__index");
  const labelEl = rail.querySelector(".mobile-story-rail__label");
  const total = cards.length;

  ScrollTrigger.matchMedia({
    "(max-width: 1023px)": function () {
      // Overall progress bar — one continuous scrub across the whole
      // stack, independent of the per-card triggers below, so the fill
      // always exactly matches scroll position rather than stepping.
      const fillTrigger = fill && ScrollTrigger.create({
        trigger: section,
        start: "top top+=88",
        end: "bottom bottom",
        scrub: 0.3,
        onUpdate(self) {
          gsap.set(fill, { scaleX: Math.max(0, Math.min(1, self.progress)) });
        },
      });

      const cardTriggers = [];
      cards.forEach((card, i) => {
        const setActive = () => {
          if (indexEl) {
            indexEl.textContent =
              String(i + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
          }
          if (labelEl) labelEl.textContent = card.dataset.mobileStoryLabel || "";
        };
        cardTriggers.push(
          ScrollTrigger.create({
            trigger: card,
            start: "top 60%",
            end: "bottom 40%",
            onEnter: setActive,
            onEnterBack: setActive,
          })
        );

        if (prefersReducedMotion) {
          gsap.set(card, { opacity: 1, y: 0, scale: 1 });
          return;
        }

        cardTriggers.push(
          gsap.fromTo(
            card,
            { opacity: 0, y: 36, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              ease: ease.enter,
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          ).scrollTrigger
        );
      });

      // First card reads as active before any scrolling happens.
      if (indexEl) indexEl.textContent = "01 / " + String(total).padStart(2, "0");
      if (labelEl) labelEl.textContent = cards[0].dataset.mobileStoryLabel || "";

      // Cleanup handed back to matchMedia — required so rotating past
      // the 1024px boundary doesn't leave dangling triggers or an
      // inline scaleX stuck on the fill bar from a mid-scrub resize.
      return () => {
        if (fillTrigger) fillTrigger.kill();
        cardTriggers.forEach((t) => t && t.kill());
        if (fill) gsap.set(fill, { clearProps: "transform" });
      };
    },
  });
}
