/* ═══════════════════════════════════════════════════════════
   PAGE TRANSITIONS
   ------------------------------------------------------------
   This is a set of static HTML pages, not a client-side router —
   so "page transitions" here means owning the moment of navigation
   itself: the curtain already in the markup (see transitions.css)
   retracts on boot, and closes again over any qualifying internal
   link click before the browser actually navigates, so there's a
   deliberate covered beat instead of a hard cut to a blank/loading
   page. Reduced-motion visitors skip both directions entirely —
   the CSS default already renders the destination instantly.
═══════════════════════════════════════════════════════════ */
import { gsap, ease, prefersReducedMotion } from "./core.js";

const NAV_DURATION = 0.55;

export function initPageTransitions() {
  const overlay = document.getElementById("ax-page-transition");
  const panel = overlay ? overlay.querySelector(".ax-pt-panel") : null;
  if (!overlay || !panel) return;

  if (prefersReducedMotion) {
    gsap.set(panel, { yPercent: -100 });
  } else {
    // Retract shortly after boot — offset slightly so it doesn't visually
    // compete with the hero timeline's own entrance in the same first
    // second.
    gsap.set(panel, { yPercent: 0 });
    gsap.to(panel, { yPercent: -100, duration: 0.85, ease: ease.enter, delay: 0.15 });
  }

  if (prefersReducedMotion) return; // instant nav, no intercept — nothing to animate anyway

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    let url;
    try { url = new URL(href, window.location.href); } catch { return; }
    if (url.origin !== window.location.origin) return;
    // Same-page anchor (same path, just a hash) — let the browser's native
    // smooth-scroll-to-anchor behavior handle it, no curtain needed.
    if (url.pathname === window.location.pathname && url.hash) return;

    e.preventDefault();
    gsap.killTweensOf(panel);
    gsap.to(panel, {
      yPercent: 0, duration: NAV_DURATION, ease: ease.enter,
      onComplete: () => { window.location.href = url.href; },
    });
  });
}
