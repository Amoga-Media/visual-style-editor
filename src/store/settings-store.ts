import { create } from "zustand";

export type AppTheme = "dark" | "light";
export type CanvasMode = "edit" | "interact";

interface SettingsState {
  snapToDefaultScale: boolean;
  appTheme: AppTheme;
  canvasMode: CanvasMode;
  uiScale: number;
  toggleSnap(): void;
  setAppTheme(theme: AppTheme): void;
  toggleAppTheme(): void;
  setCanvasMode(mode: CanvasMode): void;
  setUiScale(scale: number): void;
  increaseUiScale(): void;
  decreaseUiScale(): void;
  resetUiScale(): void;
}

function getInitialTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem("vse_theme") as AppTheme | null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  snapToDefaultScale: false,
  appTheme: getInitialTheme(),
  canvasMode: "edit",
  uiScale: 1.0,

  toggleSnap: () => set((s) => ({ snapToDefaultScale: !s.snapToDefaultScale })),
  setCanvasMode: (mode: CanvasMode) => set({ canvasMode: mode }),

  setAppTheme: (theme: AppTheme) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    try {
      localStorage.setItem("vse_theme", theme);
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
    } catch {}
    set({ appTheme: nextTheme });
  },

  setUiScale: (scale: number) => {
    const clamped = Math.min(Math.max(Number(scale.toFixed(2)), 0.75), 1.5);
    set({ uiScale: clamped });
  },

  increaseUiScale: () => {
    set((s) => ({ uiScale: Math.min(Number((s.uiScale + 0.05).toFixed(2)), 1.5) }));
  },

  decreaseUiScale: () => {
    set((s) => ({ uiScale: Math.max(Number((s.uiScale - 0.05).toFixed(2)), 0.75) }));
  },

  resetUiScale: () => set({ uiScale: 1.0 }),
}));
