import { useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { Sparkles, Sun, Shield, CircleSlash } from "lucide-react";
import CollapsibleGroup from "./CollapsibleGroup";
import { SHADOW_PRESETS, type ShadowPreset } from "@/lib/presets/shadow-presets";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";

interface ShadowPresetsGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
  defaultOpen?: boolean;
}

export default function ShadowPresetsGroup({
  element,
  structuralPath,
  theme,
  viewport = "desktop",
  onEdit,
  defaultOpen = true,
}: ShadowPresetsGroupProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "shadow" | "glow" | "inset">("all");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  if (!element || !structuralPath) return null;

  const filteredPresets = selectedCategory === "all"
    ? SHADOW_PRESETS
    : SHADOW_PRESETS.filter((p) => p.category === selectedCategory || p.id === "none");

  const handleApplyPreset = (preset: ShadowPreset) => {
    setActivePresetId(preset.id);

    if (theme.mode !== "none" && viewport === "desktop" && preset.tailwindClass) {
      const oldClassList = Array.from(element.classList);
      const filtered = oldClassList.filter((c) => !c.startsWith("shadow"));
      if (preset.tailwindClass && preset.tailwindClass !== "shadow-none") {
        filtered.push(preset.tailwindClass);
      }
      if (element.namespaceURI === "http://www.w3.org/2000/svg" || "ownerSVGElement" in element) {
        element.setAttribute("class", filtered.join(" "));
      } else {
        element.className = filtered.join(" ");
      }
      onEdit?.({
        kind: "class",
        structuralPath,
        property: "box-shadow" as any,
        oldClassList,
        newClassList: filtered,
        viewport,
        timestamp: new Date().toISOString(),
      });
    } else {
      applyLiveStyle(element, "box-shadow", preset.css, theme, undefined, viewport, structuralPath);
      commitStyleChange(
        element,
        structuralPath,
        "box-shadow",
        preset.css,
        theme,
        onEdit,
        undefined,
        undefined,
        viewport
      );
    }
  };

  return (
    <CollapsibleGroup
      groupId="shadow-presets"
      title="Shadow & Glow Presets"
      icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
      defaultOpen={defaultOpen}
    >
      <div className="space-y-3 p-1">
        {/* Category Filter Tabs */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-[#181818] p-0.5 border border-slate-200 dark:border-[#262626]">
          {(["all", "shadow", "glow", "inset"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 py-1 text-[10px] font-medium capitalize rounded-md transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-white dark:bg-[#282828] text-slate-900 dark:text-zinc-100 font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-3 gap-2">
          {filteredPresets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                title={`${preset.label} (${preset.category})\n${preset.css}`}
                className={`flex flex-col items-center gap-2 p-2 rounded-xl border text-center transition-all cursor-pointer group ${
                  isSelected
                    ? "border-[#0084FF] bg-[#0084FF]/10 text-[#0084FF]"
                    : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.05]"
                }`}
              >
                {/* Visual Preview Box */}
                <div className="w-full h-11 flex items-center justify-center p-1 bg-white/40 dark:bg-black/40 rounded-lg overflow-hidden">
                  <div
                    className="w-7 h-7 rounded-md bg-white dark:bg-[#222] transition-shadow border border-black/5 dark:border-white/5"
                    style={{
                      boxShadow: preset.css === "none" ? undefined : preset.css,
                    }}
                  />
                </div>
                <div className="w-full">
                  <span className="text-[10px] font-medium truncate block leading-tight text-slate-700 dark:text-zinc-300">
                    {preset.label}
                  </span>
                  <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-mono capitalize">
                    {preset.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </CollapsibleGroup>
  );
}
