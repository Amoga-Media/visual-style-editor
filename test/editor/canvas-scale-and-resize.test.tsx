import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useSettingsStore } from "@/store/settings-store";
import EditorStudio from "@/components/editor/EditorStudio";
import { useWorkspaceStore } from "@/store/workspace-store";

describe("Canvas Scale, Gutter & Artboard Resizing", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetUiScale();
    useWorkspaceStore.getState().resetWorkspace();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults uiScale to 1.25 so 100% zoom looks like 125% zoom by default", () => {
    expect(useSettingsStore.getState().uiScale).toBe(1.25);

    useSettingsStore.getState().increaseUiScale();
    expect(useSettingsStore.getState().uiScale).toBe(1.3);

    useSettingsStore.getState().resetUiScale();
    expect(useSettingsStore.getState().uiScale).toBe(1.25);
  });

  it("renders EditorStudio root with zoom: 1.25 and 80vw/80vh scaling", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<EditorStudio />);
    });

    const rootElement = container.firstElementChild as HTMLElement;
    expect(rootElement).not.toBeNull();
    expect(rootElement.style.zoom).toBe("1.25");
    expect(rootElement.style.width).toMatch(/^80(\.000)?vw$/);
    expect(rootElement.style.height).toMatch(/^80(\.000)?vh$/);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders canvas with 0px gutter by default and interactive artboard resize handles", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<EditorStudio />);
    });

    // Select starter template to enter the canvas workspace
    const templateButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("AI SaaS Landing Page")
    );
    await act(async () => {
      templateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Verify canvas container has 0px padding by default (no black empty space)
    const canvasContainer = container.querySelector(".canvas-dot-grid") as HTMLElement;
    expect(canvasContainer).not.toBeNull();
    expect(canvasContainer.style.padding).toBe("0px");

    // Verify artboard frame has width 1440px and height 900px matching default Desktop preset
    const artboardFrame = canvasContainer.querySelector(".shadow-2xl") as HTMLElement;
    expect(artboardFrame).not.toBeNull();
    expect(artboardFrame.style.width).toBe("1440px");
    expect(artboardFrame.style.height).toBe("900px");

    // Verify drag-to-resize handles exist on the artboard frame
    const widthResizeHandle = canvasContainer.querySelector("[title*='Drag to resize artboard width']");
    const heightResizeHandle = canvasContainer.querySelector("[title*='Drag to resize artboard height']");
    const cornerResizeHandle = canvasContainer.querySelector("[title*='Drag to resize width & height']");

    expect(widthResizeHandle).not.toBeNull();
    expect(heightResizeHandle).not.toBeNull();
    expect(cornerResizeHandle).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("responds to Ctrl+Shift+Scroll to adjust black empty space (gutter) and Ctrl+Scroll to zoom", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<EditorStudio />);
    });

    // Select starter template
    const templateButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("AI SaaS Landing Page")
    );
    await act(async () => {
      templateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const canvasContainer = container.querySelector(".canvas-dot-grid") as HTMLElement;
    expect(canvasContainer.style.padding).toBe("0px");

    // Dispatch Ctrl + Shift + Scroll (wheel down to increase empty space)
    await act(async () => {
      window.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
          shiftKey: true,
          deltaY: 50,
        })
      );
    });

    // Gutter should increase by 8px to 8px
    expect(canvasContainer.style.padding).toBe("8px");
    expect(container.textContent).toContain("Empty Space: 8px");

    // Dispatch Ctrl + Shift + Scroll (wheel up to reduce empty space)
    await act(async () => {
      window.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
          shiftKey: true,
          deltaY: -50,
        })
      );
    });

    // Gutter should reduce back to 0px (flush)
    expect(canvasContainer.style.padding).toBe("0px");
    expect(container.textContent).toContain("Empty Space: 0px (Flush Edge-to-Edge)");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
