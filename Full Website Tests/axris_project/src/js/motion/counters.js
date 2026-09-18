import { gsap, prefersReducedMotion } from "./core.js";

export function initCounters() {
  const counters = document.querySelectorAll(".counter");
  if (!counters.length) return;

  counters.forEach((counter) => {
    const target = parseFloat(counter.getAttribute("data-target"));
    const isFloat = target % 1 !== 0;

    if (prefersReducedMotion) {
      counter.textContent = isFloat ? target.toFixed(1) : Math.round(target);
      return;
    }

    const counterObj = { value: 0 };
    gsap.to(counterObj, {
      scrollTrigger: { trigger: counter, start: "top 85%", toggleActions: "play none none none" },
      value: target, duration: 2, ease: "power2.out", snap: { value: isFloat ? 0.1 : 1 },
      onUpdate() { counter.textContent = isFloat ? counterObj.value.toFixed(1) : Math.round(counterObj.value); },
    });
  });
}
