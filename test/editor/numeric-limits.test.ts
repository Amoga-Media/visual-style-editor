import { describe, it, expect } from "vitest";
import { applyLiveStyle } from "@/lib/dom/live-style-engine";

const emptyTheme = { mode: "none" as const, colors: [], fonts: [] };

describe("BUG-028: Spacing Controls and Numeric Input Boundaries", () => {
  it("allows negative values for margins and position offsets", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    applyLiveStyle(el, "margin", "-32px", emptyTheme);
    applyLiveStyle(el, "top", "-48px", emptyTheme);
    applyLiveStyle(el, "left", "-100px", emptyTheme);

    expect(el.style.margin).toBe("-32px");
    expect(el.style.top).toBe("-48px");
    expect(el.style.left).toBe("-100px");

    document.body.removeChild(el);
  });

  it("permits values exceeding artificial 2000px limit for large layouts", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    applyLiveStyle(el, "width", "3840px", emptyTheme);
    applyLiveStyle(el, "height", "2160px", emptyTheme);
    applyLiveStyle(el, "padding", "2400px", emptyTheme);

    expect(el.style.width).toBe("3840px");
    expect(el.style.height).toBe("2160px");
    expect(el.style.padding).toBe("2400px");

    document.body.removeChild(el);
  });

  it("preserves precise floating point numbers without premature truncation", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    applyLiveStyle(el, "width", "342.75px", emptyTheme);
    applyLiveStyle(el, "margin", "12.5px", emptyTheme);

    expect(el.style.width).toBe("342.75px");
    expect(el.style.margin).toBe("12.5px");

    document.body.removeChild(el);
  });
});
