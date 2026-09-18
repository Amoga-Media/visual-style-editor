/* ─────────────────────────────────────────────────────────
   FAQ ACCORDIONS — one shared grid-track engine, two adapters
   ─────────────────────────────────────────────────────────
   Previously `initFAQ()` (service pages' .faq-item markup) and
   `initDetailsFAQ()` (homepage's native <details>/<summary>) each
   hand-rolled their own copy of the same 0fr/1fr grid-track open/close
   transition (see file-ownership.md Responsibility 5 / component-map.md
   "FAQ accordion — two independent implementations"). The two DOM shapes
   are different enough that fully merging the markup isn't worth the
   churn (homepage's native <details> is deliberately kept for its
   no-JS-required accessibility fallback), but the actual animation
   mechanics — wrap-in-spacing-free-inner-element, 0fr/1fr grid track,
   single-open-at-a-time — is one behavior now, not two.
───────────────────────────────────────────────────────── */

/**
 * Wraps `panel`'s existing children in a single spacing-free inner element
 * and turns `panel` into a 0fr/1fr CSS-grid accordion track. See the
 * BUG FIX note this used to carry in two places: a 0fr grid track can only
 * collapse to zero if the grid item inside it has zero size of its own —
 * min-height:0 clears the *content*-based floor, but not the panel's own
 * padding/border/margin, so any element with baked-in spacing needs that
 * spacing moved to a non-shrinking wrapper first.
 */
function makeGridTrack(panel, startOpen) {
  const inner = document.createElement("div");
  inner.style.minHeight = "0";
  while (panel.firstChild) inner.appendChild(panel.firstChild);
  panel.appendChild(inner);

  panel.style.display = "grid";
  panel.style.overflow = "hidden";
  panel.style.gridTemplateRows = startOpen ? "1fr" : "0fr";
  panel.style.transition = "grid-template-rows 0.5s ease-in-out";
  return inner;
}

function setGridTrackOpen(panel, open) {
  panel.style.gridTemplateRows = open ? "1fr" : "0fr";
}

export function initFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");
  if (!faqItems.length) return;

  faqItems.forEach((item, i) => {
    const content = item.querySelector(".faq-content");
    const btn = item.querySelector(".faq-btn");
    if (!content) return;
    content.classList.remove("max-h-0");
    content.style.maxHeight = "none";
    makeGridTrack(content, false);

    // Accessibility: these buttons previously carried no expand/collapse
    // state at all — a screen reader user had no way to know a question
    // was interactive, let alone whether it was currently open. Wire the
    // standard disclosure-button pattern: aria-expanded on the trigger,
    // aria-controls pointing at a real id on the panel.
    if (btn) {
      if (!content.id) content.id = `faq-panel-${i}-${Math.random().toString(36).slice(2, 7)}`;
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", content.id);
    }
  });

  faqItems.forEach((item) => {
    const btn = item.querySelector(".faq-btn");
    const content = item.querySelector(".faq-content");
    const icon = item.querySelector(".faq-icon");
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");
      faqItems.forEach((other) => {
        other.classList.remove("active", "border-brand");
        const otherContent = other.querySelector(".faq-content");
        if (otherContent) setGridTrackOpen(otherContent, false);
        const otherIcon = other.querySelector(".faq-icon");
        if (otherIcon) otherIcon.style.transform = "rotate(0deg)";
        const otherBtn = other.querySelector(".faq-btn");
        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("active", "border-brand");
        setGridTrackOpen(content, true);
        icon.style.transform = "rotate(180deg)";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

// BUG-11 fix (kept): homepage FAQ uses native <details>/<summary> — now
// sharing the same grid-track engine as initFAQ() above instead of its own
// copy of the transition logic.
export function initDetailsFAQ() {
  const items = document.querySelectorAll("#faq-homepage details");
  if (!items.length) return;
  items.forEach((el) => {
    const summary = el.querySelector("summary");
    const panel = el.querySelector("p");
    const icon = summary && summary.querySelector("span");
    if (!summary || !panel) return;
    const startOpen = el.hasAttribute("open");
    el.setAttribute("open", ""); // keep content rendered/measurable; visibility now driven by the grid track, not the native attribute

    // Accessibility: forcing `open` permanently true above (required so
    // the grid-track panel stays rendered/measurable for the animation)
    // means the browser's own automatic aria-expanded-from-<details>
    // exposure would now permanently lie to screen readers — every item
    // would announce "expanded" even when visually collapsed. An
    // explicit aria-expanded on the summary, kept in sync with the real
    // grid-track state below, overrides that native (now-incorrect)
    // inference.
    summary.setAttribute("aria-expanded", startOpen ? "true" : "false");

    makeGridTrack(panel, startOpen);
    if (icon) icon.style.transform = startOpen ? "rotate(45deg)" : "rotate(0deg)";

    summary.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = panel.style.gridTemplateRows !== "0fr";
      setGridTrackOpen(panel, !isOpen);
      summary.setAttribute("aria-expanded", isOpen ? "false" : "true");
      if (icon) icon.style.transform = isOpen ? "rotate(0deg)" : "rotate(45deg)";
    });
  });
}
