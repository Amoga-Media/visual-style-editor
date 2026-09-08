import { describe, it, expect } from "vitest";
import { forwardMap } from "@/lib/tailwind/forward-map";
import type { ThemeMap } from "@/types";

const emptyTheme: ThemeMap = { mode: "none", colors: [], fonts: [] };

const themeWithClifford: ThemeMap = {
  mode: "v3-cdn",
  colors: [{ name: "clifford", value: "#da373d" }],
  fonts: [],
};

const themeWithDisplayFont: ThemeMap = {
  mode: "v4-cdn",
  colors: [],
  fonts: [{ name: "display", stack: "'Georgia', serif" }],
};

describe("forwardMap — width/height (spacing scale)", () => {
  it("snap off -> arbitrary bracket value", () => {
    expect(forwardMap("width", "256px", { snap: false, theme: emptyTheme })).toBe("w-[256px]");
  });

  it("snap on, exact scale match -> named class", () => {
    expect(forwardMap("width", "256px", { snap: true, theme: emptyTheme })).toBe("w-64");
  });

  it("snap on, no exact match -> arbitrary bracket value, no fuzzy match", () => {
    expect(forwardMap("width", "257px", { snap: true, theme: emptyTheme })).toBe("w-[257px]");
  });

  it("height follows the same spacing scale, independently prefixed", () => {
    expect(forwardMap("height", "16px", { snap: true, theme: emptyTheme })).toBe("h-4");
    expect(forwardMap("height", "16px", { snap: false, theme: emptyTheme })).toBe("h-[16px]");
  });

  it("non-px units always fall through to bracket syntax, even with snap on", () => {
    expect(forwardMap("width", "50%", { snap: true, theme: emptyTheme })).toBe("w-[50%]");
    expect(forwardMap("width", "2rem", { snap: true, theme: emptyTheme })).toBe("w-[2rem]");
  });
});

describe("forwardMap — font-size (font-size scale)", () => {
  it("snap off -> arbitrary bracket value", () => {
    expect(forwardMap("font-size", "18px", { snap: false, theme: emptyTheme })).toBe("text-[18px]");
  });

  it("snap on, exact scale match -> named class", () => {
    expect(forwardMap("font-size", "18px", { snap: true, theme: emptyTheme })).toBe("text-lg");
  });

  it("snap on, no exact match -> arbitrary bracket value", () => {
    expect(forwardMap("font-size", "19px", { snap: true, theme: emptyTheme })).toBe("text-[19px]");
  });
});

describe("forwardMap — line-height / letter-spacing (always arbitrary)", () => {
  it("line-height always uses bracket syntax, snap has no effect", () => {
    expect(forwardMap("line-height", "1.5", { snap: false, theme: emptyTheme })).toBe("leading-[1.5]");
    expect(forwardMap("line-height", "1.5", { snap: true, theme: emptyTheme })).toBe("leading-[1.5]");
  });

  it("letter-spacing always uses bracket syntax, snap has no effect", () => {
    expect(forwardMap("letter-spacing", "0.05em", { snap: false, theme: emptyTheme })).toBe("tracking-[0.05em]");
    expect(forwardMap("letter-spacing", "0.05em", { snap: true, theme: emptyTheme })).toBe("tracking-[0.05em]");
  });
});

describe("forwardMap — text-align (keyword passthrough)", () => {
  it("maps each alignment keyword straight to its class", () => {
    expect(forwardMap("text-align", "left", { snap: false, theme: emptyTheme })).toBe("text-left");
    expect(forwardMap("text-align", "center", { snap: false, theme: emptyTheme })).toBe("text-center");
    expect(forwardMap("text-align", "right", { snap: false, theme: emptyTheme })).toBe("text-right");
    expect(forwardMap("text-align", "justify", { snap: false, theme: emptyTheme })).toBe("text-justify");
  });
});

describe("forwardMap — font-weight (always arbitrary numeric)", () => {
  it("wraps the numeric weight in bracket syntax", () => {
    expect(forwardMap("font-weight", "600", { snap: false, theme: emptyTheme })).toBe("font-[600]");
    expect(forwardMap("font-weight", "600", { snap: true, theme: emptyTheme })).toBe("font-[600]");
  });
});

describe("forwardMap — font-family", () => {
  it("matches a theme font stack -> named class", () => {
    expect(
      forwardMap("font-family", "'Georgia', serif", { snap: false, theme: themeWithDisplayFont })
    ).toBe("font-display");
  });

  it("no matching theme stack -> returns the raw stack for the caller's inline-style fallback", () => {
    expect(forwardMap("font-family", "'Comic Sans MS', cursive", { snap: false, theme: emptyTheme })).toBe(
      "'Comic Sans MS', cursive"
    );
  });
});

describe("forwardMap — border-width/style/radius (always arbitrary, except style keywords)", () => {
  it("border-width always uses bracket syntax", () => {
    expect(forwardMap("border-width", "3px", { snap: false, theme: emptyTheme })).toBe("border-[3px]");
    expect(forwardMap("border-width", "3px", { snap: true, theme: emptyTheme })).toBe("border-[3px]");
  });

  it("border-style maps a real style keyword to its class", () => {
    expect(forwardMap("border-style", "dashed", { snap: false, theme: emptyTheme })).toBe("border-dashed");
  });

  it('border-style "none" returns empty string, caller removes border classes entirely', () => {
    expect(forwardMap("border-style", "none", { snap: false, theme: emptyTheme })).toBe("");
    expect(forwardMap("border-style", "none", { snap: true, theme: emptyTheme })).toBe("");
  });

  it("border-radius always uses bracket syntax", () => {
    expect(forwardMap("border-radius", "8px", { snap: false, theme: emptyTheme })).toBe("rounded-[8px]");
    expect(forwardMap("border-radius", "8px", { snap: true, theme: emptyTheme })).toBe("rounded-[8px]");
  });
});

describe("forwardMap — colors (default palette + theme snapping)", () => {
  it("snap on, exact default-palette hex match -> named class", () => {
    expect(forwardMap("text-color", "#ef4444", { snap: true, theme: emptyTheme })).toBe("text-red-500");
  });

  it("snap off -> arbitrary bracket hex, even if it would have matched", () => {
    expect(forwardMap("text-color", "#ef4444", { snap: false, theme: emptyTheme })).toBe("text-[#ef4444]");
  });

  it("snap on, custom theme token wins over the default palette", () => {
    expect(forwardMap("text-color", "#da373d", { snap: true, theme: themeWithClifford })).toBe("text-clifford");
  });

  it("snap on, no exact match anywhere -> arbitrary bracket hex, no fuzzy match", () => {
    expect(forwardMap("text-color", "#123456", { snap: true, theme: emptyTheme })).toBe("text-[#123456]");
  });

  it("background-color uses the bg- prefix", () => {
    expect(forwardMap("background-color", "#ef4444", { snap: true, theme: emptyTheme })).toBe("bg-red-500");
    expect(forwardMap("background-color", "#ef4444", { snap: false, theme: emptyTheme })).toBe("bg-[#ef4444]");
  });

  it("border-color uses the border- prefix", () => {
    expect(forwardMap("border-color", "#ef4444", { snap: true, theme: emptyTheme })).toBe("border-red-500");
    expect(forwardMap("border-color", "#ef4444", { snap: false, theme: emptyTheme })).toBe("border-[#ef4444]");
  });

  it("accepts non-hex color inputs (e.g. rgb()) and still snaps or normalizes to hex", () => {
    expect(forwardMap("text-color", "rgb(239, 68, 68)", { snap: true, theme: emptyTheme })).toBe("text-red-500");
    expect(forwardMap("text-color", "rgb(18, 52, 86)", { snap: false, theme: emptyTheme })).toBe("text-[#123456]");
  });
});

describe("forwardMap — Framer layout, constraints & positioning", () => {
  it("min-width & max-width mapping", () => {
    expect(forwardMap("min-width", "0", { snap: false, theme: emptyTheme })).toBe("min-w-0");
    expect(forwardMap("min-width", "320px", { snap: false, theme: emptyTheme })).toBe("min-w-[320px]");
    expect(forwardMap("max-width", "7xl", { snap: false, theme: emptyTheme })).toBe("max-w-7xl");
    expect(forwardMap("max-width", "1280px", { snap: false, theme: emptyTheme })).toBe("max-w-[1280px]");
  });

  it("min-height & max-height mapping", () => {
    expect(forwardMap("min-height", "screen", { snap: false, theme: emptyTheme })).toBe("min-h-screen");
    expect(forwardMap("max-height", "full", { snap: false, theme: emptyTheme })).toBe("max-h-full");
    expect(forwardMap("max-height", "500px", { snap: false, theme: emptyTheme })).toBe("max-h-[500px]");
  });

  it("positioning & offsets", () => {
    expect(forwardMap("position", "absolute", { snap: false, theme: emptyTheme })).toBe("absolute");
    expect(forwardMap("position", "relative", { snap: false, theme: emptyTheme })).toBe("relative");
    expect(forwardMap("top", "16px", { snap: true, theme: emptyTheme })).toBe("top-4");
    expect(forwardMap("left", "0px", { snap: true, theme: emptyTheme })).toBe("left-0");
  });

  it("z-index & overflow", () => {
    expect(forwardMap("z-index", "20", { snap: false, theme: emptyTheme })).toBe("z-20");
    expect(forwardMap("z-index", "999", { snap: false, theme: emptyTheme })).toBe("z-[999]");
    expect(forwardMap("overflow", "hidden", { snap: false, theme: emptyTheme })).toBe("overflow-hidden");
  });

  it("cursor, backdrop-blur, rotate, scale", () => {
    expect(forwardMap("cursor", "pointer", { snap: false, theme: emptyTheme })).toBe("cursor-pointer");
    expect(forwardMap("backdrop-blur", "md", { snap: false, theme: emptyTheme })).toBe("backdrop-blur");
    expect(forwardMap("backdrop-blur", "xl", { snap: false, theme: emptyTheme })).toBe("backdrop-blur-xl");
    expect(forwardMap("rotate", "45", { snap: false, theme: emptyTheme })).toBe("rotate-45");
    expect(forwardMap("scale", "105", { snap: false, theme: emptyTheme })).toBe("scale-105");
  });
});
