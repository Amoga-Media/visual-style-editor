export interface ShadowPreset {
  id: string;
  label: string;
  css: string;
  tailwindClass: string;
  category: "shadow" | "glow" | "inset" | "none";
}

export const SHADOW_PRESETS: ShadowPreset[] = [
  {
    id: "none",
    label: "None",
    css: "none",
    tailwindClass: "shadow-none",
    category: "none",
  },
  {
    id: "soft-sm",
    label: "Soft S",
    css: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
    tailwindClass: "shadow-sm",
    category: "shadow",
  },
  {
    id: "soft-md",
    label: "Soft M",
    css: "0 4px 16px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)",
    tailwindClass: "shadow-md",
    category: "shadow",
  },
  {
    id: "soft-lg",
    label: "Soft L",
    css: "0 10px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.12)",
    tailwindClass: "shadow-lg",
    category: "shadow",
  },
  {
    id: "hard",
    label: "Hard",
    css: "4px 4px 0px rgba(0,0,0,0.9)",
    tailwindClass: "shadow-[4px_4px_0px_rgba(0,0,0,0.9)]",
    category: "shadow",
  },
  {
    id: "elev-1",
    label: "Elev 1",
    css: "0 1px 2px rgba(0,0,0,0.05)",
    tailwindClass: "shadow-xs",
    category: "shadow",
  },
  {
    id: "elev-3",
    label: "Elev 3",
    css: "0 20px 60px rgba(0,0,0,0.35)",
    tailwindClass: "shadow-2xl",
    category: "shadow",
  },
  {
    id: "glow-blue",
    label: "Blue Glow",
    css: "0 0 20px rgba(0,132,255,0.6), 0 0 40px rgba(0,132,255,0.2)",
    tailwindClass: "shadow-[0_0_20px_rgba(0,132,255,0.6)]",
    category: "glow",
  },
  {
    id: "glow-purple",
    label: "Purple Glow",
    css: "0 0 20px rgba(139,92,246,0.6), 0 0 40px rgba(139,92,246,0.2)",
    tailwindClass: "shadow-[0_0_20px_rgba(139,92,246,0.6)]",
    category: "glow",
  },
  {
    id: "glow-green",
    label: "Green Glow",
    css: "0 0 20px rgba(16,185,129,0.6), 0 0 40px rgba(16,185,129,0.2)",
    tailwindClass: "shadow-[0_0_20px_rgba(16,185,129,0.6)]",
    category: "glow",
  },
  {
    id: "glow-amber",
    label: "Amber Glow",
    css: "0 0 20px rgba(245,158,11,0.6), 0 0 40px rgba(245,158,11,0.2)",
    tailwindClass: "shadow-[0_0_20px_rgba(245,158,11,0.6)]",
    category: "glow",
  },
  {
    id: "inset-sm",
    label: "Inset S",
    css: "inset 0 1px 4px rgba(0,0,0,0.2)",
    tailwindClass: "shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]",
    category: "inset",
  },
];

/** Returns a preset by its ID, or undefined if not found. */
export function getShadowPreset(id: string): ShadowPreset | undefined {
  return SHADOW_PRESETS.find((p) => p.id === id);
}

/** Returns all presets in a given category. */
export function getShadowPresetsByCategory(category: ShadowPreset["category"]): ShadowPreset[] {
  return SHADOW_PRESETS.filter((p) => p.category === category);
}
