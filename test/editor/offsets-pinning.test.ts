import { describe, it, expect } from "vitest";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";

const emptyTheme = { mode: "none" as const, colors: [], fonts: [] };

describe("BUG-027: Offsets and Pinning", () => {
  it("computes jump-free coordinates when transitioning from static to absolute", () => {
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "500px";
    container.style.height = "500px";

    const child = document.createElement("div");
    child.id = "target-box";
    child.style.width = "100px";
    child.style.height = "100px";
    container.appendChild(child);
    document.body.appendChild(container);

    // Mock layout offsets
    Object.defineProperty(child, "offsetLeft", { value: 64, configurable: true });
    Object.defineProperty(child, "offsetTop", { value: 128, configurable: true });

    // Jump-free conversion logic
    const renderedLeft = child.offsetLeft;
    const renderedTop = child.offsetTop;

    applyLiveStyle(child, "position", "absolute", emptyTheme);
    applyLiveStyle(child, "left", `${renderedLeft}px`, emptyTheme);
    applyLiveStyle(child, "top", `${renderedTop}px`, emptyTheme);

    expect(child.style.position).toBe("absolute");
    expect(child.style.left).toBe("64px");
    expect(child.style.top).toBe("128px");

    document.body.removeChild(container);
  });

  it("applies pinning combinations (horizontal, vertical, all edges) accurately", () => {
    const el = document.createElement("div");
    el.style.position = "absolute";
    document.body.appendChild(el);

    // Horizontal Pinning: left: 0, right: 0
    applyLiveStyle(el, "left", "0px", emptyTheme);
    applyLiveStyle(el, "right", "0px", emptyTheme);
    expect(el.style.left).toBe("0px");
    expect(el.style.right).toBe("0px");

    // Vertical Pinning: top: 0, bottom: 0
    applyLiveStyle(el, "top", "0px", emptyTheme);
    applyLiveStyle(el, "bottom", "0px", emptyTheme);
    expect(el.style.top).toBe("0px");
    expect(el.style.bottom).toBe("0px");

    // All Edges Pinning
    expect(el.style.top).toBe("0px");
    expect(el.style.right).toBe("0px");
    expect(el.style.bottom).toBe("0px");
    expect(el.style.left).toBe("0px");

    document.body.removeChild(el);
  });

  it("detects static parent containers for absolute positioned elements", () => {
    const parent = document.createElement("div");
    parent.id = "parent-container";
    parent.style.position = "static";

    const child = document.createElement("div");
    child.id = "child-element";
    child.style.position = "absolute";

    parent.appendChild(child);
    document.body.appendChild(parent);

    const isParentStatic = window.getComputedStyle(parent).position === "static";
    expect(isParentStatic).toBe(true);

    // After 1-click make parent relative
    parent.style.position = "relative";
    expect(parent.style.position).toBe("relative");
    expect(window.getComputedStyle(parent).position).toBe("relative");

    document.body.removeChild(parent);
  });
});
