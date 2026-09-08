import { describe, it, expect } from "vitest";
import { forwardMap } from "@/lib/tailwind/forward-map";
import { DEFAULT_THEME_MAP } from "@/lib/tailwind/default-theme";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";

describe("Multi-unit selection & styling support (px, %, pt, vw, vh, rem, em)", () => {
  const mockTailwindTheme = {
    ...DEFAULT_THEME_MAP,
    mode: "v3" as const,
  };

  const mockInlineTheme = {
    ...DEFAULT_THEME_MAP,
    mode: "none" as const,
  };

  describe("forwardMap unit translation", () => {
    it("generates arbitrary Tailwind classes with px", () => {
      const cls = forwardMap("width", "350px", { snap: false, theme: mockTailwindTheme });
      expect(cls).toBe("w-[350px]");
    });

    it("generates arbitrary Tailwind classes with %", () => {
      const cls = forwardMap("width", "50%", { snap: false, theme: mockTailwindTheme });
      expect(cls).toBe("w-[50%]");
    });

    it("generates arbitrary Tailwind classes with vw", () => {
      const cls = forwardMap("width", "100vw", { snap: false, theme: mockTailwindTheme });
      expect(cls).toBe("w-[100vw]");
    });

    it("generates arbitrary Tailwind classes with vh", () => {
      const cls = forwardMap("height", "100vh", { snap: false, theme: mockTailwindTheme });
      expect(cls).toBe("h-[100vh]");
    });

    it("generates arbitrary Tailwind classes with pt", () => {
      const cls = forwardMap("font-size", "14pt", { snap: false, theme: mockTailwindTheme });
      expect(cls).toBe("text-[14pt]");
    });

    it("generates arbitrary Tailwind classes for insets with % and vw", () => {
      const topCls = forwardMap("top", "25%", { snap: false, theme: mockTailwindTheme });
      expect(topCls).toBe("top-[25%]");

      const leftCls = forwardMap("left", "10vw", { snap: false, theme: mockTailwindTheme });
      expect(leftCls).toBe("left-[10vw]");
    });

    it("generates arbitrary Tailwind classes for padding/margin with pt and rem", () => {
      const padCls = forwardMap("padding", "18pt", { snap: false, theme: mockTailwindTheme });
      expect(padCls).toBe("p-[18pt]");

      const marCls = forwardMap("margin", "2rem", { snap: false, theme: mockTailwindTheme });
      expect(marCls).toBe("m-[2rem]");
    });

    it("generates arbitrary Tailwind classes for gap with vw and %", () => {
      const gapVw = forwardMap("gap", "4vw", { snap: false, theme: mockTailwindTheme });
      expect(gapVw).toBe("gap-[4vw]");

      const gapPct = forwardMap("gap", "5%", { snap: false, theme: mockTailwindTheme });
      expect(gapPct).toBe("gap-[5%]");
    });
  });

  describe("Live style engine with custom units (px, %, pt, vw, rem)", () => {
    it("applies inline style with pt and vw units in inline mode", () => {
      const div = document.createElement("div");
      applyLiveStyle(div, "font-size", "18pt", mockInlineTheme);
      expect(div.style.fontSize).toBe("18pt");

      applyLiveStyle(div, "width", "80vw", mockInlineTheme);
      expect(div.style.width).toBe("80vw");

      applyLiveStyle(div, "border-radius", "12pt", mockInlineTheme);
      expect(div.style.borderRadius).toBe("12pt");

      applyLiveStyle(div, "padding", "5%", mockInlineTheme);
      expect(div.style.padding).toBe("5%");
    });

    it("commits inline style changes with custom units and invokes onEdit record", () => {
      const div = document.createElement("div");
      let editRecord: any = null;

      commitStyleChange(
        div,
        "div[0]",
        "font-size",
        "24pt",
        mockInlineTheme,
        (rec) => {
          editRecord = rec;
        }
      );

      expect(div.style.fontSize).toBe("24pt");
      expect(editRecord).not.toBeNull();
      expect(editRecord.kind).toBe("style");
      expect(editRecord.styleProperty).toBe("font-size");
      expect(editRecord.newStyleValue).toBe("24pt");
    });

    it("commits corner border radius with % and pt units", () => {
      const div = document.createElement("div");
      let editRecord: any = null;

      commitStyleChange(
        div,
        "div[0]",
        "border-radius",
        "50%",
        mockInlineTheme,
        (rec) => {
          editRecord = rec;
        },
        undefined,
        "top-left"
      );

      expect(div.style.borderTopLeftRadius).toBe("50%");
      expect(editRecord.styleProperty).toBe("border-top-left-radius");
      expect(editRecord.newStyleValue).toBe("50%");
    });
  });
});
