import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { autoSaveSync, restoreAutoSave, clearAutoSave, listAutoSaveKeys, autoSave } from "@/lib/fs/auto-save";

describe("auto-save", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("autoSaveSync saves to localStorage with the correct key", () => {
    autoSaveSync("f1", "<p>hi</p>");
    expect(localStorage.getItem("vse_autosave_f1")).toBe("<p>hi</p>");
  });

  it("restoreAutoSave returns the saved html", () => {
    localStorage.setItem("vse_autosave_f2", "<b>x</b>");
    expect(restoreAutoSave("f2")).toBe("<b>x</b>");
  });

  it("restoreAutoSave returns null for a missing key", () => {
    expect(restoreAutoSave("missing-key")).toBeNull();
  });

  it("clearAutoSave removes the entry from localStorage", () => {
    localStorage.setItem("vse_autosave_f3", "x");
    clearAutoSave("f3");
    expect(localStorage.getItem("vse_autosave_f3")).toBeNull();
  });

  it("listAutoSaveKeys returns only auto-save keys", () => {
    localStorage.setItem("vse_autosave_fileA", "a");
    localStorage.setItem("vse_autosave_fileB", "b");
    localStorage.setItem("some_other_key", "c");
    const keys = listAutoSaveKeys();
    expect(keys).toContain("fileA");
    expect(keys).toContain("fileB");
    expect(keys).not.toContain("some_other_key");
  });

  it("autoSaveSync silently skips files larger than 400KB", () => {
    const hugeHtml = "x".repeat(400_001);
    autoSaveSync("big-file", hugeHtml);
    expect(localStorage.getItem("vse_autosave_big-file")).toBeNull();
  });

  it("autoSave debounces — only writes after the timer expires", () => {
    autoSave("f4", "<p>draft</p>");
    // Before timer fires, nothing should be written
    expect(localStorage.getItem("vse_autosave_f4")).toBeNull();
    // Advance fake timers by 2s
    vi.advanceTimersByTime(2000);
    expect(localStorage.getItem("vse_autosave_f4")).toBe("<p>draft</p>");
  });

  it("autoSave resets the debounce timer when called again within 2s", () => {
    autoSave("f5", "<p>v1</p>");
    vi.advanceTimersByTime(1000);
    autoSave("f5", "<p>v2</p>");
    vi.advanceTimersByTime(1000); // Only 1s after the second call — should not have fired yet
    expect(localStorage.getItem("vse_autosave_f5")).toBeNull();
    vi.advanceTimersByTime(1001); // Now 2s+ after the second call
    expect(localStorage.getItem("vse_autosave_f5")).toBe("<p>v2</p>");
  });
});
