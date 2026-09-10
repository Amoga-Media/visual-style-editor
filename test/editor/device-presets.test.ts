import { describe, it, expect } from "vitest";
import {
  DEVICE_PRESETS,
  getDefaultPreset,
  getPresetsByCategory,
  getCategoryForWidth,
} from "@/lib/dom/device-presets";

describe("Device Presets Library", () => {
  it("includes all requested popular phone, tablet, and desktop dimensions", () => {
    const mobilePresets = getPresetsByCategory("mobile");
    const tabletPresets = getPresetsByCategory("tablet");
    const desktopPresets = getPresetsByCategory("desktop");

    expect(mobilePresets.length).toBeGreaterThanOrEqual(6);
    expect(tabletPresets.length).toBeGreaterThanOrEqual(5);
    expect(desktopPresets.length).toBeGreaterThanOrEqual(6);

    // Verify iPhone 15/14/13/12 dimensions
    const iphone = mobilePresets.find((p) => p.name.includes("iPhone 15 / 14 / 13 / 12"));
    expect(iphone).toBeDefined();
    expect(iphone?.width).toBe(390);
    expect(iphone?.height).toBe(844);

    // Verify iPhone Pro
    const iphonePro = mobilePresets.find((p) => p.name.includes("iPhone 15 / 14 Pro"));
    expect(iphonePro).toBeDefined();
    expect(iphonePro?.width).toBe(393);
    expect(iphonePro?.height).toBe(852);

    // Verify iPad
    const ipad = tabletPresets.find((p) => p.name.includes("iPad (Standard"));
    expect(ipad).toBeDefined();
    expect(ipad?.width).toBe(768);
    expect(ipad?.height).toBe(1024);

    // Verify Desktop Standard & 1080p
    const desktopStandard = desktopPresets.find((p) => p.id === "desktop-standard");
    expect(desktopStandard?.width).toBe(1440);
    expect(desktopStandard?.height).toBe(900);

    const desktop1080p = desktopPresets.find((p) => p.id === "desktop-1080p");
    expect(desktop1080p?.width).toBe(1920);
    expect(desktop1080p?.height).toBe(1080);
  });

  it("returns appropriate default preset for each category", () => {
    expect(getDefaultPreset("desktop").id).toBe("desktop-standard");
    expect(getDefaultPreset("tablet").id).toBe("ipad-standard");
    expect(getDefaultPreset("mobile").id).toBe("iphone-15-base");
  });

  it("correctly resolves category by screen width", () => {
    expect(getCategoryForWidth(375)).toBe("mobile");
    expect(getCategoryForWidth(390)).toBe("mobile");
    expect(getCategoryForWidth(640)).toBe("mobile");
    expect(getCategoryForWidth(768)).toBe("tablet");
    expect(getCategoryForWidth(820)).toBe("tablet");
    expect(getCategoryForWidth(1023)).toBe("tablet");
    expect(getCategoryForWidth(1024)).toBe("desktop");
    expect(getCategoryForWidth(1440)).toBe("desktop");
    expect(getCategoryForWidth(1920)).toBe("desktop");
  });
});
