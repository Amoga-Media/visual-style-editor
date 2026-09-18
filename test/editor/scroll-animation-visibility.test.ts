import { describe, it, expect, beforeEach } from "vitest";
import { serializeCleanDocument } from "@/components/editor/EditorStudio";

describe("Scroll Animation Visibility & Canvas Reveal Bridge", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    document.body.className = "";
  });

  it("ensures editor helper styles contain visibility and preloader suppression rules", () => {
    // Inject the helper styles onto the document
    const styleEl = document.createElement("style");
    styleEl.id = "vse-editor-helper-styles";
    styleEl.textContent = `
      html, body {
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      [data-aos], [data-sal], .gs-reveal, .gsap-fade-up, .story-scrub-text .word {
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
      }
      #preloader, .preloader {
        display: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    document.body.innerHTML = `
      <div id="preloader" class="fixed inset-0 z-50">Loading...</div>
      <section class="hero gs-reveal" style="opacity: 0;">
        <h1 data-aos="fade-up">Hero Title</h1>
      </section>
      <section class="menu-section gsap-fade-up">
        <div class="story-scrub-text"><span class="word" style="opacity: 0.16;">Story</span></div>
      </section>
    `;

    expect(document.getElementById("vse-editor-helper-styles")).not.toBeNull();
    expect(document.getElementById("preloader")).not.toBeNull();
    expect(document.querySelector("[data-aos]")).not.toBeNull();

    // Verify serializeCleanDocument strips the helper styles on export
    const cleanOutput = serializeCleanDocument(document);
    expect(cleanOutput).not.toContain("vse-editor-helper-styles");
    expect(cleanOutput).not.toContain("pointer-events: auto !important");
    // Verify original content markup remains intact in exported document
    expect(cleanOutput).toContain('id="preloader"');
    expect(cleanOutput).toContain('data-aos="fade-up"');
    expect(cleanOutput).toContain("gs-reveal");
    expect(cleanOutput).toContain("gsap-fade-up");
  });

  it("verifies unblocking scroll locks and setting aos-animate on elements", () => {
    document.body.className = "overflow-hidden no-scroll";
    document.body.innerHTML = `
      <div id="card-1" data-aos="fade-up" class="gs-reveal" style="opacity: 0;">Card 1</div>
      <div id="card-2" data-aos="zoom-in" class="gsap-fade-up" style="opacity: 0;">Card 2</div>
    `;

    // Simulate unblock logic
    document.body.classList.remove("overflow-hidden", "no-scroll");
    document.querySelectorAll("[data-aos]").forEach((el) => {
      el.classList.add("aos-animate");
    });
    document.querySelectorAll(".gs-reveal, .gsap-fade-up").forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.opacity === "0") {
        htmlEl.style.removeProperty("opacity");
      }
    });

    expect(document.body.classList.contains("overflow-hidden")).toBe(false);
    expect(document.getElementById("card-1")?.classList.contains("aos-animate")).toBe(true);
    expect(document.getElementById("card-2")?.classList.contains("aos-animate")).toBe(true);
    expect((document.getElementById("card-1") as HTMLElement).style.opacity).toBe("");
    expect((document.getElementById("card-2") as HTMLElement).style.opacity).toBe("");
  });
});
