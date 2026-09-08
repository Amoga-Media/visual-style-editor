import { describe, it, expect } from "vitest";
import { useSettingsStore } from "@/store/settings-store";

describe("Theme Toggle and Persistence", () => {
  it("initializes with a default theme", () => {
    const theme = useSettingsStore.getState().appTheme;
    expect(["dark", "light"]).toContain(theme);
  });

  it("toggles app theme between light and dark", () => {
    const initial = useSettingsStore.getState().appTheme;
    useSettingsStore.getState().toggleAppTheme();
    const toggled = useSettingsStore.getState().appTheme;
    expect(toggled).not.toBe(initial);

    useSettingsStore.getState().toggleAppTheme();
    const reverted = useSettingsStore.getState().appTheme;
    expect(reverted).toBe(initial);
  });

  it("sets specific theme directly", () => {
    useSettingsStore.getState().setAppTheme("light");
    expect(useSettingsStore.getState().appTheme).toBe("light");

    useSettingsStore.getState().setAppTheme("dark");
    expect(useSettingsStore.getState().appTheme).toBe("dark");
  });
});
