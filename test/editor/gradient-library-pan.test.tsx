import { describe, it, expect, beforeEach } from "vitest";
import { formatCssValue, applyLiveStyle } from "@/lib/dom/live-style-engine";
import { useSettingsStore } from "@/store/settings-store";
import { createRoot } from "react-dom/client";
import { act } from "react";
import InsertPanel from "@/components/editor/InsertPanel";

describe("Visual Style Editor - Features & UX Enhancements", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults application theme to black / dark theme", () => {
    const theme = useSettingsStore.getState().appTheme;
    expect(theme).toBe("dark");
  });

  it("formats and applies gradient CSS background-image dynamically", () => {
    const gradientVal = "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)";
    const formatted = formatCssValue("background-color", gradientVal);
    expect(formatted).toEqual({
      prop: "background-image",
      val: gradientVal,
    });

    // Test DOM application
    const div = document.createElement("div");
    document.body.appendChild(div);

    applyLiveStyle(div, "background-color", gradientVal);
    expect(div.style.backgroundImage).toBe(gradientVal);

    div.remove();
  });

  it("applies text gradient clipping when gradient color is applied to text-color", () => {
    const gradientVal = "linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)";
    const p = document.createElement("p");
    document.body.appendChild(p);

    applyLiveStyle(p, "text-color", gradientVal);
    expect(p.style.backgroundImage).toBe(gradientVal);
    expect(p.style.getPropertyValue("background-clip") || p.style.backgroundClip).toBe("text");

    // Switching back to solid color removes text gradient clipping cleanly
    applyLiveStyle(p, "text-color", "#ffffff");
    expect(p.style.backgroundImage).toBe("");
    expect(p.style.getPropertyValue("-webkit-background-clip") || (p.style as any).webkitBackgroundClip).toBeFalsy();

    p.remove();
  });

  it("renders unified InsertPanel with search and category filtering", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    let insertedSnippet = "";
    let insertedPosition = "";

    await act(async () => {
      root.render(
        <InsertPanel
          onInsertElement={(snippet, pos) => {
            insertedSnippet = snippet;
            insertedPosition = pos;
          }}
          selectedElement={null}
        />
      );
    });

    // Verify search input is present
    const searchInput = container.querySelector("input[placeholder*='Search elements & blocks']") as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    // Verify category filter tabs: All, Elements, Blocks (with count labels)
    const categoryButtons = Array.from(container.querySelectorAll("button"));
    const allTab = categoryButtons.find((b) => b.textContent?.includes("All"));
    const elementsTab = categoryButtons.find((b) => b.textContent?.includes("Elements"));
    const blocksTab = categoryButtons.find((b) => b.textContent?.includes("Blocks"));

    expect(allTab).toBeDefined();
    expect(elementsTab).toBeDefined();
    expect(blocksTab).toBeDefined();

    // Verify clicking an insert button fires callback with snippet
    const plusButtons = container.querySelectorAll("button[title*='Insert']");
    expect(plusButtons.length).toBeGreaterThan(0);

    await act(async () => {
      plusButtons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(insertedSnippet).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
