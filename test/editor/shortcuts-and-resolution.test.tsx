import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import DevicePresetDropdown from "@/components/editor/DevicePresetDropdown";
import EditorStudio from "@/components/editor/EditorStudio";
import { getDefaultPreset, DEVICE_PRESETS } from "@/lib/dom/device-presets";

describe("DevicePresetDropdown Component", () => {
  it("renders active category label and dimensions in the capsule", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const activePreset = getDefaultPreset("desktop");

    await act(async () => {
      root.render(
        <DevicePresetDropdown
          category="desktop"
          activePreset={activePreset}
          customDimensions={null}
          onSelectPreset={() => {}}
          onApplyCustomDimensions={() => {}}
        />
      );
    });

    expect(container.textContent).toContain("Desktop View");
    expect(container.textContent).toContain("1440 × 900");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("opens dropdown and allows entering and applying custom dimensions", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const onApplyCustom = vi.fn();
    const activePreset = getDefaultPreset("tablet");

    await act(async () => {
      root.render(
        <DevicePresetDropdown
          category="tablet"
          activePreset={activePreset}
          customDimensions={null}
          onSelectPreset={() => {}}
          onApplyCustomDimensions={onApplyCustom}
        />
      );
    });

    // Click capsule to open dropdown
    const capsuleButton = container.querySelector("button");
    expect(capsuleButton).not.toBeNull();

    await act(async () => {
      capsuleButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Verify Custom Dimensions inputs are rendered
    expect(container.textContent).toContain("Custom Dimensions");
    const inputs = container.querySelectorAll("input[type='number']");
    expect(inputs.length).toBe(2);

    const widthInput = inputs[0] as HTMLInputElement;
    const heightInput = inputs[1] as HTMLInputElement;

    function setInputValue(input: HTMLInputElement, value: string) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeSetter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Change dimensions to 1200 x 800
    await act(async () => {
      setInputValue(widthInput, "1200");
      setInputValue(heightInput, "800");
    });

    // Click Apply button
    const applyButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Apply"
    );
    expect(applyButton).toBeDefined();

    await act(async () => {
      applyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onApplyCustom).toHaveBeenCalledWith(1200, 800);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("allows selecting pre-filled presets from list", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const onSelectPreset = vi.fn();
    const activePreset = getDefaultPreset("mobile");

    await act(async () => {
      root.render(
        <DevicePresetDropdown
          category="mobile"
          activePreset={activePreset}
          customDimensions={null}
          onSelectPreset={onSelectPreset}
          onApplyCustomDimensions={() => {}}
        />
      );
    });

    // Click capsule to open
    const capsuleButton = container.querySelector("button");
    await act(async () => {
      capsuleButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Find iPhone 15 Pro Max preset button
    const presetButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("iPhone 15 / 14 / 13 Pro Max")
    );
    expect(presetButton).toBeDefined();

    await act(async () => {
      presetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelectPreset).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "iPhone 15 / 14 / 13 Pro Max",
        width: 430,
        height: 932,
      })
    );

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});

describe("EditorStudio Keyboard Shortcuts Integration", () => {
  it("toggles UI panels on Ctrl+\\ and opens shortcuts modal on Ctrl+K", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<EditorStudio />);
    });

    // Select starter template to enter studio
    const templateButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("AI SaaS Landing Page")
    );
    await act(async () => {
      templateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Verify left and right panels are visible initially
    expect(container.textContent).toContain("Layers");
    expect(container.querySelector("aside")).not.toBeNull();

    // Trigger Ctrl + \ to hide panels
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "\\",
          code: "Backslash",
          ctrlKey: true,
          bubbles: true,
        })
      );
    });

    // Verify UI panels hidden indicator is visible and asides are gone
    expect(container.textContent).toContain("UI Panels Hidden");
    expect(container.querySelectorAll("aside").length).toBe(0);

    // Trigger Ctrl + \ again to restore panels
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "\\",
          code: "Backslash",
          ctrlKey: true,
          bubbles: true,
        })
      );
    });

    expect(container.querySelectorAll("aside").length).toBeGreaterThan(0);

    // Trigger Ctrl + K to open shortcuts modal
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
        })
      );
    });

    expect(container.textContent).toContain("Keyboard Shortcuts");
    expect(container.textContent).toContain("Power up your visual editing speed");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
