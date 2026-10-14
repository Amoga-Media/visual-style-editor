import { useState, useEffect } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { Sparkles, Sun, Shield, CircleSlash, SlidersHorizontal, Palette, EyeOff, Check } from "lucide-react";
import CollapsibleGroup from "./CollapsibleGroup";
import { SHADOW_PRESETS, type ShadowPreset } from "@/lib/presets/shadow-presets";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { useChangeSetStore } from "@/store/change-set-store";

interface ShadowPresetsGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
  defaultOpen?: boolean;
}

function parseBoxShadow(shadowStr: string) {
  if (!shadowStr || shadowStr === "none") {
    return {
      color: "rgba(0, 0, 0, 0.2)",
      blur: 12,
      spread: 0,
      offsetX: 0,
      offsetY: 4,
      isInset: false,
    };
  }

  const isInset = shadowStr.includes("inset");
  const cleanStr = shadowStr.replace(/\binset\b/gi, "").trim();

  // Extract color: rgba(...), rgb(...), hsl(...), or #hex
  let color = "rgba(0, 0, 0, 0.25)";
  const colorMatch = cleanStr.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8})/i);
  if (colorMatch) {
    color = colorMatch[1];
  }

  // Remove color to isolate the length dimensions
  const lengthsStr = cleanStr.replace(colorMatch ? colorMatch[1] : "", "").trim();
  const lengths = lengthsStr
    .split(/\s+/)
    .map((l) => parseFloat(l))
    .filter((n) => !isNaN(n));

  return {
    offsetX: lengths[0] ?? 0,
    offsetY: lengths[1] ?? 4,
    blur: lengths[2] ?? 12,
    spread: lengths[3] ?? 0,
    color,
    isInset,
  };
}

function buildBoxShadowCss(x: number, y: number, b: number, s: number, c: string, inset: boolean): string {
  if (b === 0 && s === 0 && x === 0 && y === 0) return "none";
  return `${inset ? "inset " : ""}${x}px ${y}px ${b}px ${s}px ${c}`;
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

  // Custom Shadow / Glow Studio Controls
  const [color, setColor] = useState("rgba(0, 0, 0, 0.25)");
  const [blur, setBlur] = useState(12);
  const [spread, setSpread] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(4);
  const [isInset, setIsInset] = useState(false);

  const edits = useChangeSetStore((s) => s.edits);

  useEffect(() => {
    if (!element) return;
    const styleAttr = (element as HTMLElement).style?.boxShadow || "";
    if (styleAttr && styleAttr !== "none") {
      const parsed = parseBoxShadow(styleAttr);
      setColor(parsed.color);
      setBlur(parsed.blur);
      setSpread(parsed.spread);
      setOffsetX(parsed.offsetX);
      setOffsetY(parsed.offsetY);
      setIsInset(parsed.isInset);
    }
  }, [element, edits]);

  if (!element || !structuralPath) return null;

  const filteredPresets = selectedCategory === "all"
    ? SHADOW_PRESETS
    : SHADOW_PRESETS.filter((p) => p.category === selectedCategory || p.id === "none");

  const currentCss = buildBoxShadowCss(offsetX, offsetY, blur, spread, color, isInset);

  function handleCustomChange(
    newX: number,
    newY: number,
    newBlur: number,
    newSpread: number,
    newColor: string,
    newInset: boolean,
    commit: boolean = true
  ) {
    setOffsetX(newX);
    setOffsetY(newY);
    setBlur(newBlur);
    setSpread(newSpread);
    setColor(newColor);
    setIsInset(newInset);

    const css = buildBoxShadowCss(newX, newY, newBlur, newSpread, newColor, newInset);
    applyLiveStyle(element!, "box-shadow", css, theme, undefined, viewport, structuralPath!);
    if (commit) {
      commitStyleChange(
        element!,
        structuralPath!,
        "box-shadow",
        css,
        theme,
        onEdit,
        undefined,
        undefined,
        viewport
      );
    }
  }

  const handleApplyPreset = (preset: ShadowPreset) => {
    setActivePresetId(preset.id);

    if (preset.css === "none") {
      handleCustomChange(0, 0, 0, 0, "rgba(0,0,0,0)", false, true);
      return;
    }

    const parsed = parseBoxShadow(preset.css);
    handleCustomChange(
      parsed.offsetX,
      parsed.offsetY,
      parsed.blur,
      parsed.spread,
      parsed.color,
      parsed.isInset,
      true
    );
  };

  const handleClearShadow = () => {
    setActivePresetId("none");
    handleCustomChange(0, 0, 0, 0, "rgba(0,0,0,0)", false, true);
  };

  return (
    <CollapsibleGroup
      groupId="shadow-presets"
      title="Shadow & Glow Studio"
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
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer group ${
                  isSelected
                    ? "border-[#0084FF] bg-[#0084FF]/10 text-[#0084FF]"
                    : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.05]"
                }`}
              >
                {/* Visual Preview Box */}
                <div className="w-full h-10 flex items-center justify-center p-1 bg-white/40 dark:bg-black/40 rounded-lg overflow-hidden">
                  <div
                    className="w-6 h-6 rounded-md bg-white dark:bg-[#222] transition-shadow border border-black/5 dark:border-white/5"
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

        {/* ========================================================= */}
        {/* Custom Shadow & Glow Parameters (Color, Intensity, etc.) */}
        {/* ========================================================= */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#262626] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              <SlidersHorizontal className="w-3 h-3 text-[#0099ff]" />
              <span>Customize Shadow &amp; Glow</span>
            </span>
            <button
              type="button"
              onClick={handleClearShadow}
              className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer"
            >
              <EyeOff className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Color Picker & Inset Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium block">
                Shadow / Glow Color
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={color.startsWith("#") ? color.slice(0, 7) : "#0099ff"}
                  onChange={(e) => handleCustomChange(offsetX, offsetY, blur, spread, e.target.value, isInset, true)}
                  className="w-7 h-7 rounded border border-slate-200 dark:border-[#262626] cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleCustomChange(offsetX, offsetY, blur, spread, e.target.value, isInset, false)}
                  onBlur={() => handleCustomChange(offsetX, offsetY, blur, spread, color, isInset, true)}
                  placeholder="rgba(0,0,0,0.25)"
                  className="flex-1 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded px-2 py-1 text-[11px] font-mono text-slate-800 dark:text-zinc-200 outline-none"
                />
              </div>
            </div>

            {/* Inset Toggle Switch */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium block">
                Type
              </label>
              <button
                type="button"
                onClick={() => handleCustomChange(offsetX, offsetY, blur, spread, color, !isInset, true)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-all cursor-pointer ${
                  isInset
                    ? "bg-amber-500/15 text-amber-500 border-amber-500/30 font-semibold"
                    : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#262626]"
                }`}
              >
                {isInset ? "Inset (Inner)" : "Outer Drop"}
              </button>
            </div>
          </div>

          {/* Intensity (Blur) Slider with Direct Decimal Number Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium">
                Intensity / Blur Radius
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={120}
                  step={0.1}
                  value={blur}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleCustomChange(offsetX, offsetY, val, spread, color, isInset, true);
                  }}
                  className="w-14 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded px-1.5 py-0.5 text-right font-mono text-[11px] text-slate-800 dark:text-zinc-200 focus:border-[#0099ff] outline-none"
                />
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">px</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={blur}
              onChange={(e) => handleCustomChange(offsetX, offsetY, parseFloat(e.target.value), spread, color, isInset, false)}
              onPointerUp={(e) => handleCustomChange(offsetX, offsetY, parseFloat((e.target as HTMLInputElement).value), spread, color, isInset, true)}
              className="w-full accent-[#0099ff] cursor-pointer h-1.5 bg-slate-200 dark:bg-[#262626] rounded-lg"
            />
          </div>

          {/* Spread Radius Slider with Direct Decimal Number Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium">Spread Radius</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={-40}
                  max={60}
                  step={0.1}
                  value={spread}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleCustomChange(offsetX, offsetY, blur, val, color, isInset, true);
                  }}
                  className="w-14 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded px-1.5 py-0.5 text-right font-mono text-[11px] text-slate-800 dark:text-zinc-200 focus:border-[#0099ff] outline-none"
                />
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">px</span>
              </div>
            </div>
            <input
              type="range"
              min={-30}
              max={50}
              step={0.5}
              value={spread}
              onChange={(e) => handleCustomChange(offsetX, offsetY, blur, parseFloat(e.target.value), color, isInset, false)}
              onPointerUp={(e) => handleCustomChange(offsetX, offsetY, blur, parseFloat((e.target as HTMLInputElement).value), color, isInset, true)}
              className="w-full accent-[#0099ff] cursor-pointer h-1.5 bg-slate-200 dark:bg-[#262626] rounded-lg"
            />
          </div>

          {/* Offset X Slider with Direct Decimal Number Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium">Offset X (Horizontal)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={-50}
                  max={50}
                  step={0.1}
                  value={offsetX}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleCustomChange(val, offsetY, blur, spread, color, isInset, true);
                  }}
                  className="w-14 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded px-1.5 py-0.5 text-right font-mono text-[11px] text-slate-800 dark:text-zinc-200 focus:border-[#0099ff] outline-none"
                />
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">px</span>
              </div>
            </div>
            <input
              type="range"
              min={-40}
              max={40}
              step={0.5}
              value={offsetX}
              onChange={(e) => handleCustomChange(parseFloat(e.target.value), offsetY, blur, spread, color, isInset, false)}
              onPointerUp={(e) => handleCustomChange(parseFloat((e.target as HTMLInputElement).value), offsetY, blur, spread, color, isInset, true)}
              className="w-full accent-[#0099ff] cursor-pointer h-1.5 bg-slate-200 dark:bg-[#262626] rounded-lg"
            />
          </div>

          {/* Offset Y Slider with Direct Decimal Number Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium">Offset Y (Vertical)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={-50}
                  max={50}
                  step={0.1}
                  value={offsetY}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleCustomChange(offsetX, val, blur, spread, color, isInset, true);
                  }}
                  className="w-14 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded px-1.5 py-0.5 text-right font-mono text-[11px] text-slate-800 dark:text-zinc-200 focus:border-[#0099ff] outline-none"
                />
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">px</span>
              </div>
            </div>
            <input
              type="range"
              min={-40}
              max={40}
              step={0.5}
              value={offsetY}
              onChange={(e) => handleCustomChange(offsetX, parseFloat(e.target.value), blur, spread, color, isInset, false)}
              onPointerUp={(e) => handleCustomChange(offsetX, parseFloat((e.target as HTMLInputElement).value), blur, spread, color, isInset, true)}
              className="w-full accent-[#0099ff] cursor-pointer h-1.5 bg-slate-200 dark:bg-[#262626] rounded-lg"
            />
          </div>

          {/* Live CSS Code Readout */}
          <div className="pt-1">
            <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-[#161616] border border-slate-200 dark:border-[#262626] text-[9px] font-mono text-slate-600 dark:text-zinc-400 break-all select-all">
              box-shadow: {currentCss};
            </div>
          </div>
        </div>
      </div>
    </CollapsibleGroup>
  );
}
