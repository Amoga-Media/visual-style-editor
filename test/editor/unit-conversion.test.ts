import { describe, it, expect } from "vitest";
import { convertUnit } from "@/lib/dom/unit-conversion";

describe("Accurate Unit Conversion Engine", () => {
  it("converts px to pt mathematically (67px -> 50.25pt)", () => {
    const pt = convertUnit(67, "px", "pt");
    expect(pt).toBe(50.25);
  });

  it("converts pt to px mathematically (50.25pt -> 67px)", () => {
    const px = convertUnit(50.25, "pt", "px");
    expect(px).toBe(67);
  });

  it("converts px to rem with standard 16px base (32px -> 2rem, 24px -> 1.5rem)", () => {
    expect(convertUnit(32, "px", "rem")).toBe(2);
    expect(convertUnit(24, "px", "rem")).toBe(1.5);
    expect(convertUnit(16, "px", "rem")).toBe(1);
  });

  it("converts rem to px with standard 16px base (2rem -> 32px)", () => {
    expect(convertUnit(2, "rem", "px")).toBe(32);
    expect(convertUnit(1.5, "rem", "px")).toBe(24);
  });

  it("converts typography font-size px to % based on 16px baseline", () => {
    // 16px = 100%, 24px = 150%, 32px = 200%
    expect(convertUnit(16, "px", "%", { property: "font-size" })).toBe(100);
    expect(convertUnit(24, "px", "%", { property: "font-size" })).toBe(150);
    expect(convertUnit(32, "px", "%", { property: "font-size" })).toBe(200);
  });

  it("converts typography % to px based on 16px baseline", () => {
    expect(convertUnit(150, "%", "px", { property: "font-size" })).toBe(24);
    expect(convertUnit(200, "%", "px", { property: "font-size" })).toBe(32);
  });

  it("converts dimension px to % with reference width / container", () => {
    // 600px on 1200px desktop -> 50%
    expect(convertUnit(600, "px", "%", { property: "width", viewport: "desktop", referenceWidth: 1200 })).toBe(50);
    // 67px on 1000px container -> 6.7%
    expect(convertUnit(67, "px", "%", { property: "width", referenceWidth: 1000 })).toBe(6.7);
  });

  it("converts px to vw on desktop (1200px base) and tablet (768px base)", () => {
    // 120px on desktop (1200) -> 10vw
    expect(convertUnit(120, "px", "vw", { viewport: "desktop", referenceWidth: 1200 })).toBe(10);
    // 76.8px on tablet (768) -> 10vw
    expect(convertUnit(76.8, "px", "vw", { viewport: "tablet", referenceWidth: 768 })).toBe(10);
  });

  it("returns same amount if fromUnit === toUnit", () => {
    expect(convertUnit(67, "px", "px")).toBe(67);
    expect(convertUnit(50, "%", "%")).toBe(50);
  });
});
