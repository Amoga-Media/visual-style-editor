import { create } from "zustand";

export type AppTheme = "dark" | "light";

interface SettingsState {
  snapToDefaultScale: boolean;
  appTheme: AppTheme;
  toggleSnap(): void;
  setAppTheme(theme: AppTheme): void;
  toggleAppTheme(): void;
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

  toggleSnap: () => set((s) => ({ snapToDefaultScale: !s.snapToDefaultScale })),

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
}));
