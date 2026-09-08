import { describe, it, expect } from "vitest";
import { detectTailwindMode } from "@/lib/tailwind/detect-mode";

describe("detectTailwindMode", () => {
  it("detects v3 CDN script tag", () => {
    const html = `<html><head><script src="https://cdn.tailwindcss.com"></script></head><body></body></html>`;
    expect(detectTailwindMode(html)).toBe("v3-cdn");
  });

  it("detects v4 CDN browser script tag", () => {
    const html = `<html><head><script src="https://unpkg.com/@tailwindcss/browser@4"></script></head><body></body></html>`;
    expect(detectTailwindMode(html)).toBe("v4-cdn");
  });

  it("returns none when no Tailwind script is present", () => {
    const html = `<html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>`;
    expect(detectTailwindMode(html)).toBe("none");
  });
});
