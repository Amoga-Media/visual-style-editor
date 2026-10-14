import { create } from "zustand";

export type AppTheme = "dark" | "light";
export type CanvasMode = "edit" | "interact";

export interface SettingsState {
  snapToDefaultScale: boolean;
  appTheme: AppTheme;
  canvasMode: CanvasMode;
  uiScale: number;
  canvasGutter: number;
  showDotGrid: boolean;
  showDimensionsHUD: boolean;
  autoSaveEnabled: boolean;
  inlineTextEditEnabled: boolean;

  toggleSnap(): void;
  setAppTheme(theme: AppTheme): void;
  toggleAppTheme(): void;
  setCanvasMode(mode: CanvasMode): void;
  setUiScale(scale: number): void;
  increaseUiScale(): void;
  decreaseUiScale(): void;
  resetUiScale(): void;
  setCanvasGutter(gutter: number): void;
  setShowDotGrid(show: boolean): void;
  toggleShowDotGrid(): void;
  setShowDimensionsHUD(show: boolean): void;
  toggleShowDimensionsHUD(): void;
  setAutoSaveEnabled(enabled: boolean): void;
  toggleAutoSaveEnabled(): void;
  setInlineTextEditEnabled(enabled: boolean): void;
  toggleInlineTextEditEnabled(): void;
  resetAllSettings(): void;
}

function getInitialTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem("vse_theme") as AppTheme | null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

function getInitialUiScale(): number {
  if (typeof window === "undefined") return 1;
  try {
    const saved = localStorage.getItem("vse_ui_scale");
    // Clear out broken legacy 1.25 value
    if (saved === "1.25" || saved === "1.250") {
      localStorage.removeItem("vse_ui_scale");
      return 1;
    }
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.75 && parsed <= 1.5) return parsed;
    }
  } catch {}
  return 1;
}

function getInitialCanvasGutter(): number {
  if (typeof window === "undefined") return 0;
  try {
    const saved = localStorage.getItem("vse_canvas_gutter");
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 160) return parsed;
    }
  } catch {}
  return 0;
}

function getInitialShowDotGrid(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem("vse_show_dot_grid");
    if (saved !== null) return saved === "true";
  } catch {}
  return true;
}

function getInitialShowDimensionsHUD(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const hidden = localStorage.getItem("vse_dimensions_hidden");
    if (hidden !== null) return hidden !== "true";
    const saved = localStorage.getItem("vse_show_dimensions_hud");
    if (saved !== null) return saved === "true";
  } catch {}
  return true;
}

function getInitialAutoSaveEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem("vse_autosave_enabled");
    if (saved !== null) return saved === "true";
  } catch {}
  return true;
}

function getInitialInlineTextEditEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem("vse_inline_edit_enabled");
    if (saved !== null) return saved === "true";
  } catch {}
  return true;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  snapToDefaultScale: false,
  appTheme: getInitialTheme(),
  canvasMode: "edit",
  uiScale: getInitialUiScale(),
  canvasGutter: getInitialCanvasGutter(),
  showDotGrid: getInitialShowDotGrid(),
  showDimensionsHUD: getInitialShowDimensionsHUD(),
  autoSaveEnabled: getInitialAutoSaveEnabled(),
  inlineTextEditEnabled: getInitialInlineTextEditEnabled(),

  toggleSnap: () => set((s) => ({ snapToDefaultScale: !s.snapToDefaultScale })),
  setCanvasMode: (mode: CanvasMode) => set({ canvasMode: mode }),

  setAppTheme: (theme: AppTheme) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    try {
      localStorage.setItem("vse_theme", theme);
      localStorage.setItem("theme", theme);
    } catch {}
    set({ appTheme: theme });
  },

  toggleAppTheme: () => {
    const nextTheme: AppTheme = get().appTheme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    }
    try {
      localStorage.setItem("vse_theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
    } catch {}
    set({ appTheme: nextTheme });
  },

  setUiScale: (scale: number) => {
    const clamped = Math.min(Math.max(Number(scale.toFixed(2)), 0.75), 1.5);
    try {
      localStorage.setItem("vse_ui_scale", clamped.toString());
    } catch {}
    set({ uiScale: clamped });
  },

  increaseUiScale: () => {
    set((s) => {
      const next = Math.min(Number((s.uiScale + 0.05).toFixed(2)), 1.5);
      try {
        localStorage.setItem("vse_ui_scale", next.toString());
      } catch {}
      return { uiScale: next };
    });
  },

  decreaseUiScale: () => {
    set((s) => {
      const next = Math.max(Number((s.uiScale - 0.05).toFixed(2)), 0.75);
      try {
        localStorage.setItem("vse_ui_scale", next.toString());
      } catch {}
      return { uiScale: next };
    });
  },

  resetUiScale: () => {
    try {
      localStorage.removeItem("vse_ui_scale");
    } catch {}
    set({ uiScale: 1 });
  },

  setCanvasGutter: (gutter: number) => {
    const clamped = Math.max(0, Math.min(160, Math.round(gutter)));
    try {
      localStorage.setItem("vse_canvas_gutter", clamped.toString());
    } catch {}
    set({ canvasGutter: clamped });
  },

  setShowDotGrid: (show: boolean) => {
    try {
      localStorage.setItem("vse_show_dot_grid", String(show));
    } catch {}
    set({ showDotGrid: show });
  },

  toggleShowDotGrid: () => {
    const next = !get().showDotGrid;
    try {
      localStorage.setItem("vse_show_dot_grid", String(next));
    } catch {}
    set({ showDotGrid: next });
  },

  setShowDimensionsHUD: (show: boolean) => {
    try {
      localStorage.setItem("vse_dimensions_hidden", String(!show));
      localStorage.setItem("vse_show_dimensions_hud", String(show));
    } catch {}
    set({ showDimensionsHUD: show });
  },

  toggleShowDimensionsHUD: () => {
    const next = !get().showDimensionsHUD;
    try {
      localStorage.setItem("vse_dimensions_hidden", String(!next));
      localStorage.setItem("vse_show_dimensions_hud", String(next));
    } catch {}
    set({ showDimensionsHUD: next });
  },

  setAutoSaveEnabled: (enabled: boolean) => {
    try {
      localStorage.setItem("vse_autosave_enabled", String(enabled));
    } catch {}
    set({ autoSaveEnabled: enabled });
  },

  toggleAutoSaveEnabled: () => {
    const next = !get().autoSaveEnabled;
    try {
      localStorage.setItem("vse_autosave_enabled", String(next));
    } catch {}
    set({ autoSaveEnabled: next });
  },

  setInlineTextEditEnabled: (enabled: boolean) => {
    try {
      localStorage.setItem("vse_inline_edit_enabled", String(enabled));
    } catch {}
    set({ inlineTextEditEnabled: enabled });
  },

  toggleInlineTextEditEnabled: () => {
    const next = !get().inlineTextEditEnabled;
    try {
      localStorage.setItem("vse_inline_edit_enabled", String(next));
    } catch {}
    set({ inlineTextEditEnabled: next });
  },

  resetAllSettings: () => {
    try {
      localStorage.removeItem("vse_ui_scale");
      localStorage.setItem("vse_canvas_gutter", "0");
      localStorage.setItem("vse_theme", "dark");
      localStorage.setItem("vse_show_dot_grid", "true");
      localStorage.setItem("vse_dimensions_hidden", "false");
      localStorage.setItem("vse_show_dimensions_hud", "true");
      localStorage.setItem("vse_autosave_enabled", "true");
      localStorage.setItem("vse_inline_edit_enabled", "true");
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("dark");
    }
    set({
      uiScale: 1,
      canvasGutter: 0,
      canvasMode: "edit",
      appTheme: "dark",
      showDotGrid: true,
      showDimensionsHUD: true,
      autoSaveEnabled: true,
      inlineTextEditEnabled: true,
    });
  },
}));
