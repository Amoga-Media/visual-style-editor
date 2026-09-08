import { describe, it, expect } from "vitest";
import { buildPreSaveLabel, versionFilename } from "@/lib/fs/version-history";

describe("buildPreSaveLabel", () => {
  it("includes a localized time string", () => {
    const date = new Date(2026, 6, 19, 14, 41, 7);
    expect(buildPreSaveLabel(date)).toBe(`Before save at ${date.toLocaleTimeString()}`);
  });
});

describe("versionFilename", () => {
  it("slugifies the label and joins it to the original filename", () => {
    expect(versionFilename("Original (as opened)", "page.html")).toBe("original-as-opened--page.html");
  });

  it("handles a time-containing label without leftover punctuation", () => {
    expect(versionFilename("Before save at 2:41:07 PM", "index.html")).toBe("before-save-at-2-41-07-pm--index.html");
  });

  it("never leaves leading or trailing dashes from the slug", () => {
    expect(versionFilename("!!!weird!!!", "a.html")).toBe("weird--a.html");
  });
});
