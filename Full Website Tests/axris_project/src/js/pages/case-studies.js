/* ─────────────────────────────────────────────────────────
   CASE STUDIES PAGE — timeline scroll animation
   ------------------------------------------------------------
   Bundled to assets/js/pages/case-studies.js, loaded only on
   case-studies.html, after main.js.
───────────────────────────────────────────────────────── */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

document.addEventListener("DOMContentLoaded", () => {
  // Explicitly register the plugin here instead of relying on main.js's
  // boot sequence having already run first — this script used to depend on
  // an unstated ordering between two independent DOMContentLoaded listeners
  // (plus an arbitrary 100ms delay to paper over it). registerPlugin() is
  // safe to call more than once, so this makes the page-specific timeline
  // below self-sufficient.
  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const timelineSection = document.querySelector("section#grid");
  const progressLine = document.getElementById("timeline-progress");

  if (timelineSection && progressLine && !prefersReducedMotion) {
    gsap.to(progressLine, {
      height: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: timelineSection,
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
    });
  }

  const csItems = document.querySelectorAll(".cs-timeline-item");

  csItems.forEach((item, index) => {
    const node = item.querySelector(".cs-node");
    const nodeInner = item.querySelector(".cs-node-inner");
    const content = item.querySelector(".cs-content");
    const imageContainer = item.querySelector(".cs-image");
    const parallaxImg = item.querySelector(".cs-parallax-img");

    const contentElements = Array.from(content.children);
    const isEven = index % 2 !== 0;

    if (prefersReducedMotion) {
      // .cs-node-inner starts at opacity:0 via a Tailwind class in the
      // markup itself — jump every element straight to its revealed
      // end state instead of skipping the tween outright, or these
      // dots (and the scroll-gated content/image) would never appear
      // for reduced-motion visitors.
      if (node) node.style.borderColor = "#2563EB";
      if (nodeInner) gsap.set(nodeInner, { opacity: 1 });
      gsap.set(imageContainer, { opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)" });
      gsap.set(contentElements, { opacity: 1, y: 0 });
      return; // skip the scroll-scrubbed parallax image too — continuous scroll-linked motion
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: item,
        start: "top 75%",
        toggleActions: "play none none reverse",
      },
    });

    if (node && nodeInner) {
      tl.to(node, { borderColor: "#2563EB", duration: 0.3 }).to(
        nodeInner,
        { opacity: 1, duration: 0.2 },
        "<",
      );
    }

    tl.add("syncReveal", "-=0.1");

    tl.fromTo(
      imageContainer,
      {
        opacity: 0,
        x: isEven ? 60 : -60,
        clipPath: "inset(0 100% 0 0)",
      },
      {
        opacity: 1,
        x: 0,
        clipPath: "inset(0 0% 0 0)",
        duration: 1,
        ease: "power4.out",
      },
      "syncReveal",
    ).fromTo(
      contentElements,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
      },
      "syncReveal+=0.1",
    );

    if (parallaxImg) {
      gsap.to(parallaxImg, {
        y: "20%",
        ease: "none",
        scrollTrigger: {
          trigger: imageContainer,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  });
});
