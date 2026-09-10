import { describe, it, expect } from "vitest";
import { forwardMap } from "@/lib/tailwind/forward-map";
import { classifyUtilityClass } from "@/lib/tailwind/classify";

describe("Auto Width & Fit-Content Shrink-Wrapping", () => {
  const options = { snap: false, theme: { mode: "v3-cdn" as const, colors: [], fonts: [] } };

  it("maps width: auto and fit-content correctly in forwardMap", () => {
    expect(forwardMap("width", "auto", options)).toBe("w-auto");
    expect(forwardMap("width", "fit-content", options)).toBe("w-fit");
    expect(forwardMap("width", "fit", options)).toBe("w-fit");
    expect(forwardMap("width", "max-content", options)).toBe("w-max");
    expect(forwardMap("width", "min-content", options)).toBe("w-min");
    expect(forwardMap("width", "100%", { ...options, snap: true })).toBe("w-full");
    expect(forwardMap("width", "100vw", { ...options, snap: true })).toBe("w-screen");
  });

  it("maps height: auto and fit-content correctly in forwardMap", () => {
    expect(forwardMap("height", "auto", options)).toBe("h-auto");
    expect(forwardMap("height", "fit-content", options)).toBe("h-fit");
    expect(forwardMap("height", "fit", options)).toBe("h-fit");
    expect(forwardMap("height", "100%", { ...options, snap: true })).toBe("h-full");
    expect(forwardMap("height", "100vh", { ...options, snap: true })).toBe("h-screen");
  });

  it("classifies w-fit, w-auto, w-full, h-fit accurately", () => {
    const wFit = classifyUtilityClass("w-fit");
    expect(wFit).toEqual({ property: "width", suffix: "fit" });

    const wAuto = classifyUtilityClass("w-auto");
    expect(wAuto).toEqual({ property: "width", suffix: "auto" });

    const hFit = classifyUtilityClass("h-fit");
    expect(hFit).toEqual({ property: "height", suffix: "fit" });
  });

  it("shrink-wraps div container with fit-content in DOM", () => {
    const container = document.createElement("div");
    container.style.width = "fit-content";
    const child = document.createElement("span");
    child.textContent = "Button label";
    container.appendChild(child);
    document.body.appendChild(container);

    expect(container.style.width).toBe("fit-content");
    container.remove();
  });
});
