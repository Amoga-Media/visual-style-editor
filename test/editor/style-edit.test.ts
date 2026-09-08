import { describe, it, expect } from "vitest";
import { readInlineOrComputedStyleValue } from "@/lib/dom/computed-style";

describe("readInlineOrComputedStyleValue", () => {
  it("prefers an existing inline style value over the computed one", () => {
    const el = document.createElement("div");
    el.style.setProperty("font-size", "40px");
    expect(readInlineOrComputedStyleValue(el, "font-size")).toBe("40px");
  });

  it("falls back to the computed value when nothing is inline", () => {
    const style = document.createElement("style");
    style.textContent = ".sized { font-size: 22px; }";
    document.head.appendChild(style);

    const el = document.createElement("div");
    el.className = "sized";
    document.body.appendChild(el);

    expect(readInlineOrComputedStyleValue(el, "font-size")).toBe("22px");

    document.body.removeChild(el);
    document.head.removeChild(style);
  });
});
