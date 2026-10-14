import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useSettingsStore } from "@/store/settings-store";
import SettingsModal from "@/components/editor/SettingsModal";
import Toolbar from "@/components/editor/Toolbar";

describe("Settings Store & Studio Settings Modal", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetAllSettings();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("initializes with default workspace settings and persists changes to localStorage", () => {
    const store = useSettingsStore.getState();
    expect(store.uiScale).toBe(1);
    expect(store.canvasGutter).toBe(0);
    expect(store.canvasMode).toBe("edit");
    expect(store.appTheme).toBe("dark");
    expect(store.showDotGrid).toBe(true);
    expect(store.showDimensionsHUD).toBe(true);
    expect(store.autoSaveEnabled).toBe(true);
    expect(store.inlineTextEditEnabled).toBe(true);

    // Update canvas gutter
    store.setCanvasGutter(40);
    expect(useSettingsStore.getState().canvasGutter).toBe(40);
    expect(localStorage.getItem("vse_canvas_gutter")).toBe("40");

    // Clamp canvas gutter to max 160
    store.setCanvasGutter(250);
    expect(useSettingsStore.getState().canvasGutter).toBe(160);

    // Update UI scale
    store.setUiScale(1.25);
    expect(useSettingsStore.getState().uiScale).toBe(1.25);
    expect(localStorage.getItem("vse_ui_scale")).toBe("1.25");

    // Toggle dot grid and HUD
    store.setShowDotGrid(false);
    expect(useSettingsStore.getState().showDotGrid).toBe(false);
    expect(localStorage.getItem("vse_show_dot_grid")).toBe("false");

    store.setShowDimensionsHUD(false);
    expect(useSettingsStore.getState().showDimensionsHUD).toBe(false);
    expect(localStorage.getItem("vse_dimensions_hidden")).toBe("true");

    // Toggle auto-save and inline edit
    store.setAutoSaveEnabled(false);
    expect(useSettingsStore.getState().autoSaveEnabled).toBe(false);

    store.setInlineTextEditEnabled(false);
    expect(useSettingsStore.getState().inlineTextEditEnabled).toBe(false);

    // Reset all settings
    useSettingsStore.getState().resetAllSettings();
    const resetState = useSettingsStore.getState();
    expect(resetState.uiScale).toBe(1);
    expect(resetState.canvasGutter).toBe(0);
    expect(resetState.appTheme).toBe("dark");
    expect(resetState.showDotGrid).toBe(true);
    expect(resetState.showDimensionsHUD).toBe(true);
    expect(resetState.autoSaveEnabled).toBe(true);
    expect(resetState.inlineTextEditEnabled).toBe(true);
  });

  it("renders SettingsModal with all 4 tabs and interactive controls", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleClose = vi.fn();
    const handleTogglePanels = vi.fn();
    const handleZoomReset = vi.fn();

    await act(async () => {
      root.render(
        <SettingsModal
          isOpen={true}
          onClose={handleClose}
          initialTab="appearance"
          uiPanelsVisible={true}
          onToggleUiPanels={handleTogglePanels}
          zoom={1.5}
          onZoomReset={handleZoomReset}
        />
      );
    });

    // Check header and tabs
    expect(container.textContent).toContain("Studio Settings");
    expect(container.textContent).toContain("Appearance & UI");
    expect(container.textContent).toContain("Canvas & Workspace");
    expect(container.textContent).toContain("Behavior & Safety");
    expect(container.textContent).toContain("Shortcuts Directory");

    // Appearance tab content
    expect(container.textContent).toContain("Dark Carbon");
    expect(container.textContent).toContain("Paper Light");
    expect(container.textContent).toContain("Interface Scale");
    expect(container.textContent).toContain("Workspace Sidebars");

    // Switch to Canvas & Workspace tab
    const canvasTabBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Canvas & Workspace")
    );
    await act(async () => {
      canvasTabBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Canvas Gutter (Empty Space)");
    expect(container.textContent).toContain("Canvas Texture");
    expect(container.textContent).toContain("Device Dimensions Capsule");
    expect(container.textContent).toContain("Canvas Zoom Level");
    expect(container.textContent).toContain("150%");

    // Switch to Behavior & Safety tab
    const behaviorTabBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Behavior & Safety")
    );
    await act(async () => {
      behaviorTabBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Auto-Save Crash Protection");
    expect(container.textContent).toContain("Double-Click Inline Text Editing");
    expect(container.textContent).toContain("Stored Autosave Sessions");
    expect(container.textContent).toContain("Restore Factory Defaults");

    // Switch to Shortcuts Directory tab
    const shortcutsTabBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Shortcuts Directory")
    );
    await act(async () => {
      shortcutsTabBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Toggle UI panels");
    expect(container.textContent).toContain("Open Studio Settings modal");
    expect(container.textContent).toContain("Resize canvas empty margin / gutter");

    // Click close / Done button
    const doneBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.trim() === "Done"
    );
    await act(async () => {
      doneBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(handleClose).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders dedicated Settings button in Toolbar in both DropZone and open project states", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleOpenSettings = vi.fn();

    // 1. DropZone state (fileName is null)
    await act(async () => {
      root.render(
        <Toolbar
          fileName={null}
          viewport="desktop"
          onViewportChange={() => {}}
          onChangeFile={() => {}}
          statusMessage={null}
          historyCount={0}
          onToggleHistory={() => {}}
          onOpenReview={() => {}}
          iframeDocument={null}
          onOpenSettings={handleOpenSettings}
        />
      );
    });

    const settingsBtn = container.querySelector("button[title*='Studio Settings']") as HTMLButtonElement;
    expect(settingsBtn).not.toBeNull();

    await act(async () => {
      settingsBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(handleOpenSettings).toHaveBeenCalledTimes(1);

    // 2. Open project state (fileName provided)
    await act(async () => {
      root.render(
        <Toolbar
          fileName="index.html"
          viewport="desktop"
          onViewportChange={() => {}}
          onChangeFile={() => {}}
          statusMessage={null}
          historyCount={0}
          onToggleHistory={() => {}}
          onOpenReview={() => {}}
          iframeDocument={null}
          onOpenSettings={handleOpenSettings}
        />
      );
    });

    const settingsBtnWithFile = container.querySelector("button[title*='Studio Settings']") as HTMLButtonElement;
    expect(settingsBtnWithFile).not.toBeNull();

    await act(async () => {
      settingsBtnWithFile.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(handleOpenSettings).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
