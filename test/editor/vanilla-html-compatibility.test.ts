import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";
import { applyLiveStyle, commitStyleChange, resolvePropertyForSide } from "@/lib/dom/live-style-engine";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import { revertAllEdits } from "@/components/editor/ReviewModal";
import type { EditRecord, ThemeMap } from "@/types";

const SAMPLE_DARK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Social Media Co-Pilot — Dark Edition</title>
<style>
  :root{
    --bg: #09090b;
    --ink: #fafafa;
    --accent: #3b82f6;
  }
  body{
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: sans-serif;
  }
  .floaters{
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .floating-img {
    width: 100%;
    border-radius: 16px;
  }
  .headline .line-2{ 
    background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cta{
    background: var(--accent);
    color: #fff;
    padding: 18px 40px;
    border-radius: 999px;
  }
</style>
</head>
<body>
<main class="hero">
  <div class="floaters" aria-hidden="true">
    <div class="floater floater--top-left">
      <img class="floating-img" src="https://images.unsplash.com/photo-1" alt="Social Interface">
    </div>
  </div>
  <section class="content">
    <div class="logo-badge">
      <svg viewBox="0 0 40 40" width="30" height="30">
        <path d="M21 6a13 13 0 1 0 8.6 22.9" stroke="#fafafa" stroke-width="4.5" fill="none"/>
      </svg>
    </div>
    <h1 class="headline">
      <span class="line line-1">World's First AI-Powered</span>
      <span class="line line-2">Social Media Co-Pilot</span>
    </h1>
    <p class="subhead">Social media AI that edits, creates, and manages all in one place.</p>
    <button type="button" class="cta">Get Started for Free</button>
  </section>
</main>
</body>
</html>`;

describe("Vanilla HTML & Inline Style Compatibility", () => {
  let dom: JSDOM;
  let document: Document;
  const noTailwindTheme: ThemeMap = { mode: "none", colors: [], fonts: [] };

  beforeEach(() => {
    dom = new JSDOM(SAMPLE_DARK_HTML, { pretendToBeVisual: true });
    document = dom.window.document;
  });

  it("computes valid structural paths for deep elements, buttons, and floating images", () => {
    const ctaButton = document.querySelector(".cta")!;
    const path = computeStructuralPath(ctaButton, domAdapter);
    expect(path).toContain("button");

    const img = document.querySelector(".floating-img")!;
    const imgPath = computeStructuralPath(img, domAdapter);
    expect(imgPath).toContain("img");
  });

  it("correctly resolves side-specific CSS properties for corner radiuses, borders, paddings, and margins", () => {
    expect(resolvePropertyForSide("border-radius", "top-left")).toBe("border-top-left-radius");
    expect(resolvePropertyForSide("border-radius", "bottom-right")).toBe("border-bottom-right-radius");
    expect(resolvePropertyForSide("border-width", "top")).toBe("border-top-width");
    expect(resolvePropertyForSide("padding", "left")).toBe("padding-left");
    expect(resolvePropertyForSide("margin", "bottom")).toBe("margin-bottom");
  });

  it("applies live styles and commits inline style edits on elements without Tailwind", () => {
    const ctaButton = document.querySelector(".cta") as HTMLElement;
    const path = computeStructuralPath(ctaButton, domAdapter);
    const recordedEdits: EditRecord[] = [];

    // Apply live style
    applyLiveStyle(ctaButton, "width", "320px", noTailwindTheme);
    expect(ctaButton.style.width).toBe("320px");

    // Commit style change
    commitStyleChange(
      ctaButton,
      path,
      "width",
      "320px",
      noTailwindTheme,
      (edit) => recordedEdits.push(edit)
    );

    expect(recordedEdits.length).toBe(1);
    expect(recordedEdits[0].kind).toBe("style");
    if (recordedEdits[0].kind === "style") {
      expect(recordedEdits[0].styleProperty).toBe("width");
      expect(recordedEdits[0].newStyleValue).toBe("320px");
    }
  });

  it("applies styles to SVG elements seamlessly", () => {
    const svgPath = document.querySelector("path") as unknown as Element;
    const path = computeStructuralPath(svgPath, domAdapter);
    const recordedEdits: EditRecord[] = [];

    applyLiveStyle(svgPath, "opacity", "0.5", noTailwindTheme);
    expect((svgPath as HTMLElement).style.opacity).toBe("0.5");

    commitStyleChange(
      svgPath,
      path,
      "opacity",
      "0.5",
      noTailwindTheme,
      (edit) => recordedEdits.push(edit)
    );

    expect(recordedEdits.length).toBe(1);
  });

  it("overrides -webkit-text-fill-color when changing text color on gradient text", () => {
    const line2 = document.querySelector(".line-2") as HTMLElement;
    const path = computeStructuralPath(line2, domAdapter);

    applyLiveStyle(line2, "text-color", "#ff5500", noTailwindTheme);
    expect(line2.style.color).toBe("rgb(255, 85, 0)");
    expect(line2.style.getPropertyValue("-webkit-text-fill-color")).toBe("rgb(255, 85, 0)");

    commitStyleChange(line2, path, "text-color", "#ff5500", noTailwindTheme);
    expect(line2.style.color).toBe("rgb(255, 85, 0)");
    expect(line2.style.getPropertyValue("-webkit-text-fill-color")).toBe("rgb(255, 85, 0)");
  });

  it("splices inline style edits into the original HTML cleanly without altering other tags", () => {
    const ctaButton = document.querySelector(".cta")!;
    const path = computeStructuralPath(ctaButton, domAdapter);

    const res = applyEditsClientSide(SAMPLE_DARK_HTML, [
      {
        kind: "style",
        structuralPath: path,
        styleProperty: "background-color",
        newStyleValue: "#ef4444",
      },
      {
        kind: "style",
        structuralPath: path,
        styleProperty: "font-size",
        newStyleValue: "20px",
      },
    ]);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain('style="background-color: #ef4444; font-size: 20px;"');
      expect(res.html).toContain('class="cta"');
      expect(res.html).toContain("<title>Social Media Co-Pilot — Dark Edition</title>");
    }
  });

  it("supports undo and discard-all for inline styles on non-Tailwind documents", () => {
    const ctaButton = document.querySelector(".cta") as HTMLElement;
    const path = computeStructuralPath(ctaButton, domAdapter);

    const edit1: EditRecord = {
      kind: "style",
      structuralPath: path,
      property: "width",
      styleProperty: "width",
      oldStyleValue: "",
      newStyleValue: "250px",
      timestamp: "2026-09-09T00:00:00Z",
    };

    // Apply edit
    ctaButton.style.setProperty("width", "250px");
    expect(ctaButton.style.width).toBe("250px");

    // Revert all edits via ReviewModal helper
    revertAllEdits([edit1], document);
    expect(ctaButton.style.width).toBe("");
  });
});
