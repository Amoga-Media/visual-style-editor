import { describe, it, expect } from "vitest";
import { useSettingsStore } from "@/store/settings-store";

describe("Canvas Mode Switch", () => {
  it("defaults to edit mode and toggles to interact mode", () => {
    expect(useSettingsStore.getState().canvasMode).toBe("edit");
    useSettingsStore.getState().setCanvasMode("interact");
    expect(useSettingsStore.getState().canvasMode).toBe("interact");
    useSettingsStore.getState().setCanvasMode("edit");
    expect(useSettingsStore.getState().canvasMode).toBe("edit");
  });
});
