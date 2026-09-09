import { describe, it, expect } from "vitest";
import { classifyUtilityClass } from "@/lib/tailwind/classify";
import type { ThemeMap } from "@/types";

const emptyTheme: ThemeMap = { mode: "v3-cdn", colors: [], fonts: [] };

describe("classifyUtilityClass — text- disambiguation", () => {
  it("text-lg -> font-size", () => expect(classifyUtilityClass("text-lg", emptyTheme)?.property).toBe("font-size"));
  it("text-center -> text-align", () => expect(classifyUtilityClass("text-center", emptyTheme)?.property).toBe("text-align"));
  it("text-red-500 -> text-color", () => expect(classifyUtilityClass("text-red-500", emptyTheme)?.property).toBe("text-color"));
  it("text-[17px] -> font-size", () => expect(classifyUtilityClass("text-[17px]", emptyTheme)?.property).toBe("font-size"));
  it("text-[#1a2b3c] -> text-color", () => expect(classifyUtilityClass("text-[#1a2b3c]", emptyTheme)?.property).toBe("text-color"));
});

describe("classifyUtilityClass — border- disambiguation", () => {
  it("border-2 -> border-width", () => expect(classifyUtilityClass("border-2", emptyTheme)?.property).toBe("border-width"));
  it("border-solid -> border-style", () => expect(classifyUtilityClass("border-solid", emptyTheme)?.property).toBe("border-style"));
  it("border-red-500 -> border-color", () => expect(classifyUtilityClass("border-red-500", emptyTheme)?.property).toBe("border-color"));
  it("border-t-4 -> border-width, side top", () => {
    const c = classifyUtilityClass("border-t-4", emptyTheme);
    expect(c?.property).toBe("border-width");
    expect(c?.side).toBe("top");
  });
  it("border-[#1a2b3c] -> border-color", () => expect(classifyUtilityClass("border-[#1a2b3c]", emptyTheme)?.property).toBe("border-color"));

  // Task 2.6's own follow-up: bare "border-t" (no width/color suffix at all,
  // just toggling that side's border on). The generic prefix/suffix split
  // can't recover a side letter from a 2-segment classname (see classify.ts
  // comment), so this needs its own case. Decision: classify as
  // border-width for that side, same as bare "border" already does for the
  // unscoped case, since "border added, no explicit width yet" is exactly
  // what an unset border-width represents.
  it("border-t (bare, no suffix) -> border-width, side top", () => {
    const c = classifyUtilityClass("border-t", emptyTheme);
    expect(c?.property).toBe("border-width");
    expect(c?.side).toBe("top");
  });
  it("border-r (bare, no suffix) -> border-width, side right", () => {
    const c = classifyUtilityClass("border-r", emptyTheme);
    expect(c?.property).toBe("border-width");
    expect(c?.side).toBe("right");
  });
  it("border-b (bare, no suffix) -> border-width, side bottom", () => {
    const c = classifyUtilityClass("border-b", emptyTheme);
    expect(c?.property).toBe("border-width");
    expect(c?.side).toBe("bottom");
  });
  it("border-l (bare, no suffix) -> border-width, side left", () => {
    const c = classifyUtilityClass("border-l", emptyTheme);
    expect(c?.property).toBe("border-width");
    expect(c?.side).toBe("left");
  });
  it("border (bare, no side, no suffix) -> border-width, no side", () => {
    const c = classifyUtilityClass("border", emptyTheme);
    expect(c?.property).toBe("border-width");
    expect(c?.side).toBeUndefined();
  });
});

describe("classifyUtilityClass — border-radius corner disambiguation", () => {
  // Found while building Task 3.5's BorderGroup: the per-corner classes were
  // being classified with property "border-radius" but NO side at all, so
  // applyClassMutation's side-scoped filter (`classification.side !== side`)
  // could never distinguish one corner's class from another — every rounded
  // corner class looked identical (side: undefined) to the mutation logic,
  // which would leave stale corner classes stacked alongside newly-committed
  // ones instead of replacing them. Same category of gap as Task 3.4's
  // stage-10 finding, caught here for the same reason: a dependent task
  // (per-corner radius controls) needs this to actually work.
  it("rounded (bare, all corners) -> border-radius, no side", () => {
    const c = classifyUtilityClass("rounded", emptyTheme);
    expect(c?.property).toBe("border-radius");
    expect(c?.side).toBeUndefined();
  });
  it("rounded-lg (all corners) -> border-radius, no side", () => {
    const c = classifyUtilityClass("rounded-lg", emptyTheme);
    expect(c?.property).toBe("border-radius");
    expect(c?.side).toBeUndefined();
  });
  it("rounded-tl-md -> border-radius, corner top-left", () => {
    const c = classifyUtilityClass("rounded-tl-md", emptyTheme);
    expect(c?.property).toBe("border-radius");
    expect(c?.side).toBe("top-left");
  });
  it("rounded-tr-[6px] -> border-radius, corner top-right", () => {
    const c = classifyUtilityClass("rounded-tr-[6px]", emptyTheme);
    expect(c?.property).toBe("border-radius");
    expect(c?.side).toBe("top-right");
  });
  it("rounded-br-full -> border-radius, corner bottom-right", () => {
    const c = classifyUtilityClass("rounded-br-full", emptyTheme);
    expect(c?.property).toBe("border-radius");
    expect(c?.side).toBe("bottom-right");
  });
  it("rounded-bl-none -> border-radius, corner bottom-left", () => {
    const c = classifyUtilityClass("rounded-bl-none", emptyTheme);
    expect(c?.property).toBe("border-radius");
    expect(c?.side).toBe("bottom-left");
  });
});

describe("classifyUtilityClass — font- disambiguation", () => {
  it("font-bold -> font-weight", () => expect(classifyUtilityClass("font-bold", emptyTheme)?.property).toBe("font-weight"));
  it("font-sans -> font-family", () => expect(classifyUtilityClass("font-sans", emptyTheme)?.property).toBe("font-family"));
  it("font-[560] -> font-weight", () => expect(classifyUtilityClass("font-[560]", emptyTheme)?.property).toBe("font-weight"));
  it("font-display resolves via theme fonts", () => {
    const theme: ThemeMap = { mode: "v4-cdn", colors: [], fonts: [{ name: "display", stack: "Fraunces, serif" }] };
    expect(classifyUtilityClass("font-display", theme)?.property).toBe("font-family");
  });
});

describe("classifyUtilityClass — position & layout constraints", () => {
  it("position tokens -> position", () => {
    expect(classifyUtilityClass("relative", emptyTheme)?.property).toBe("position");
    expect(classifyUtilityClass("absolute", emptyTheme)?.property).toBe("position");
    expect(classifyUtilityClass("fixed", emptyTheme)?.property).toBe("position");
    expect(classifyUtilityClass("sticky", emptyTheme)?.property).toBe("position");
    expect(classifyUtilityClass("static", emptyTheme)?.property).toBe("position");
  });

  it("min-w and max-w -> min-width & max-width", () => {
    expect(classifyUtilityClass("min-w-0", emptyTheme)?.property).toBe("min-width");
    expect(classifyUtilityClass("min-w-[320px]", emptyTheme)?.property).toBe("min-width");
    expect(classifyUtilityClass("max-w-7xl", emptyTheme)?.property).toBe("max-width");
    expect(classifyUtilityClass("max-w-[1200px]", emptyTheme)?.property).toBe("max-width");
  });

  it("min-h and max-h -> min-height & max-height", () => {
    expect(classifyUtilityClass("min-h-screen", emptyTheme)?.property).toBe("min-height");
    expect(classifyUtilityClass("max-h-full", emptyTheme)?.property).toBe("max-height");
  });

  it("insets -> top, right, bottom, left", () => {
    expect(classifyUtilityClass("top-4", emptyTheme)?.property).toBe("top");
    expect(classifyUtilityClass("right-[20px]", emptyTheme)?.property).toBe("right");
    expect(classifyUtilityClass("bottom-0", emptyTheme)?.property).toBe("bottom");
    expect(classifyUtilityClass("left-auto", emptyTheme)?.property).toBe("left");
  });

  it("z-index -> z-index", () => {
    expect(classifyUtilityClass("z-20", emptyTheme)?.property).toBe("z-index");
    expect(classifyUtilityClass("z-[999]", emptyTheme)?.property).toBe("z-index");
  });

  it("overflow -> overflow", () => {
    expect(classifyUtilityClass("overflow-hidden", emptyTheme)?.property).toBe("overflow");
    expect(classifyUtilityClass("overflow-auto", emptyTheme)?.property).toBe("overflow");
  });

  it("cursor -> cursor", () => {
    expect(classifyUtilityClass("cursor-pointer", emptyTheme)?.property).toBe("cursor");
    expect(classifyUtilityClass("cursor-grab", emptyTheme)?.property).toBe("cursor");
  });

  it("effects & transforms -> backdrop-blur, rotate, scale", () => {
    expect(classifyUtilityClass("backdrop-blur-md", emptyTheme)?.property).toBe("backdrop-blur");
    expect(classifyUtilityClass("rotate-45", emptyTheme)?.property).toBe("rotate");
    expect(classifyUtilityClass("scale-105", emptyTheme)?.property).toBe("scale");
  });
});

describe("classifyUtilityClass — display & flex/grid tokens", () => {
  it("flex and grid -> display", () => {
    expect(classifyUtilityClass("flex", emptyTheme)?.property).toBe("display");
    expect(classifyUtilityClass("grid", emptyTheme)?.property).toBe("display");
  });
});

describe("classifyUtilityClass — unrelated classes", () => {
  it("returns null for classes outside the editable set", () => {
    expect(classifyUtilityClass("sr-only", emptyTheme)).toBeNull();
    expect(classifyUtilityClass("hover:bg-red-500", emptyTheme)).toBeNull();
  });
});

