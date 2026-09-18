import { state } from "../motion/core.js";

/* ─────────────────────────────────────────────────────────
   TABLE OF CONTENTS (legal pages)
───────────────────────────────────────────────────────── */
// Legal-page sections (h2s) aren't natively focusable — give them a
// programmatic focus stop (tabindex="-1", left in place rather than
// stripped after blur, matching the common GOV.UK/WAI "move focus to
// heading" pattern) so a keyboard/screen-reader user's next Tab press
// continues from the section they just jumped to, not from the TOC link
// they clicked. preventScroll avoids fighting the smooth-scroll already
// in progress.
function moveFocusTo(el) {
  if (!el) return;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

export function initTOC() {
  const links = document.querySelectorAll(".toc-link");
  const sections = document.querySelectorAll(".legal-section");
  if (!links.length || !sections.length) return;
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetEl = document.querySelector(targetId);
      if (state.lenis) {
        state.lenis.scrollTo(targetId, {
          offset: -120,
          duration: 1.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          onComplete: () => moveFocusTo(targetEl),
        });
      } else if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        moveFocusTo(targetEl);
      }
    });
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.remove("active", "bg-brand-50"));
        const id = entry.target.getAttribute("id");
        const activeLink = document.querySelector(`.toc-link[href="#${id}"]`);
        if (activeLink) {
          activeLink.classList.add("active", "bg-brand-50");
          if (window.innerWidth < 1024) activeLink.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }
    });
  }, { root: null, rootMargin: "-20% 0px -70% 0px", threshold: 0 });
  sections.forEach((s) => observer.observe(s));
}
