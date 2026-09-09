import { describe, test, expect } from "vitest";
import { convertUnit } from "@/lib/dom/unit-conversion";

describe("Unit Conversion Boundary Safety", () => {
  test("returns 0 on NaN or non-finite inputs", () => {
    expect(convertUnit(NaN, "px", "%")).toBe(0);
    expect(convertUnit(Infinity, "px", "%")).toBe(0);
  });

  test("handles zero reference dimensions gracefully without division by zero NaN", () => {
    const res = convertUnit(50, "px", "%", { referenceWidth: 0 });
    expect(res).toBe(0);
    expect(isNaN(res)).toBe(false);
  });

  test("converts standard px to pt and back accurately", () => {
    const pt = convertUnit(96, "px", "pt");
    expect(pt).toBe(72);
    const px = convertUnit(72, "pt", "px");
    expect(px).toBe(96);
  });
});
