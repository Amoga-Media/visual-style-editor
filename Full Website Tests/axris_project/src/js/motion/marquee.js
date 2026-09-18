import { prefersReducedMotion, raf } from "./core.js";

export function initMarquee() {
  const track = document.querySelector(".marquee-track");
  if (!track || prefersReducedMotion) return;

  raf.marqueeSpeed = 0.04;

  function measure() {
    raf.marqueeTotalWidth = track.scrollWidth / 2;
  }
  measure();

  const images = track.querySelectorAll("img");
  if (images.length) {
    Promise.all(
      Array.from(images).map((img) =>
        img.complete ? Promise.resolve() : new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        })
      )
    ).then(measure);
  }

  window.addEventListener("resize", measure);
  raf.marqueeTrack = track;
}
