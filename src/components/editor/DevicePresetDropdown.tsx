import { useState, useRef, useEffect } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  ChevronDown,
  Check,
  ArrowLeftRight,
  Sparkles,
  Maximize2,
} from "lucide-react";
import {
  type DevicePreset,
  DEVICE_PRESETS,
  getPresetsByCategory,
} from "@/lib/dom/device-presets";

interface DevicePresetDropdownProps {
  category: "desktop" | "tablet" | "mobile";
  activePreset: DevicePreset | null;
  customDimensions: { width: number; height: number } | null;
  onSelectPreset: (preset: DevicePreset) => void;
  onApplyCustomDimensions: (width: number, height: number) => void;
  onCategoryChange?: (category: "desktop" | "tablet" | "mobile") => void;
}

export default function DevicePresetDropdown({
  category,
  activePreset,
  customDimensions,
  onSelectPreset,
  onApplyCustomDimensions,
  onCategoryChange,
}: DevicePresetDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"desktop" | "tablet" | "mobile">(category);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync activeTab when category changes from external toolbar
  useEffect(() => {
    setActiveTab(category);
  }, [category]);

  // Custom dimensions form state
  const currentWidth = customDimensions
    ? customDimensions.width
    : activePreset && activePreset.width > 0
    ? activePreset.width
    : category === "desktop"
    ? 1440
    : category === "tablet"
    ? 768
    : 390;

  const currentHeight = customDimensions
    ? customDimensions.height
    : activePreset && activePreset.height > 0
    ? activePreset.height
    : category === "desktop"
    ? 900
    : category === "tablet"
    ? 1024
    : 844;

  const [inputWidth, setInputWidth] = useState<string>(String(currentWidth));
  const [inputHeight, setInputHeight] = useState<string>(String(currentHeight));

  // Sync inputs when activePreset or customDimensions change
  useEffect(() => {
    setInputWidth(String(currentWidth));
    setInputHeight(String(currentHeight));
  }, [currentWidth, currentHeight, isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleApplyCustom() {
    const w = parseInt(inputWidth, 10);
    const h = parseInt(inputHeight, 10);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      onApplyCustomDimensions(w, h);
      setIsOpen(false);
    }
  }

  function handleSwapDimensions() {
    const temp = inputWidth;
    setInputWidth(inputHeight);
    setInputHeight(temp);
  }

  // Display label for the capsule
  const isCustom = customDimensions !== null;
  const isFluid = !isCustom && activePreset?.id === "desktop-fill";

  let viewLabel = category === "desktop" ? "Desktop View" : category === "tablet" ? "Tablet View" : "Mobile View";
  if (isCustom) {
    viewLabel = "Custom View";
  } else if (activePreset && activePreset.category === category) {
    // Shorten long names for the capsule
    if (activePreset.id === "desktop-fill") {
      viewLabel = "Responsive Fill";
    } else if (activePreset.name.includes("iPhone")) {
      viewLabel = activePreset.name.split("/")[0].trim();
    } else if (activePreset.name.includes("iPad")) {
      viewLabel = activePreset.name.split("(")[0].trim();
    }
  }

  const dimensionText = isFluid
    ? "100% Fluid"
    : `${currentWidth} × ${currentHeight}`;

  const currentPresets = getPresetsByCategory(activeTab);

  return (
    <div className="relative mb-2 shrink-0 z-30" ref={dropdownRef}>
      {/* Interactive Capsule Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`Resolution preset: ${viewLabel}, ${dimensionText}`}
        className="px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#141414]/95 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] border border-slate-200 dark:border-[#262626] text-[11px] font-mono text-slate-700 dark:text-zinc-300 flex items-center gap-2 shadow-lg backdrop-blur-md select-none transition-all cursor-pointer group hover:border-[#0099ff]/50 active:scale-98"
      >
        <div className="flex items-center gap-1.5">
          {category === "desktop" ? (
            <Monitor className="w-3.5 h-3.5 text-[#0099ff]" />
          ) : category === "tablet" ? (
            <Tablet className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span className="font-medium text-slate-800 dark:text-zinc-200">{viewLabel}</span>
        </div>
        <span className="text-slate-300 dark:text-zinc-600">•</span>
        <span className="text-[#0099ff] font-semibold">{dimensionText}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0099ff]" : "group-hover:text-slate-700 dark:group-hover:text-zinc-300"
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] sm:w-[380px] bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          {/* Header & Category Switcher */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-[#262626]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Screen Resolution
            </span>
            <div className="flex items-center bg-slate-100 dark:bg-[#1a1a1a] rounded-lg p-0.5 border border-slate-200/80 dark:border-[#2a2a2a]">
              {(["desktop", "tablet", "mobile"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveTab(cat);
                    if (onCategoryChange && cat !== category) {
                      onCategoryChange(cat);
                    }
                  }}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all ${
                    activeTab === cat
                      ? "bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-xs font-semibold"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {cat === "desktop" ? (
                    <Monitor className="w-3 h-3" />
                  ) : cat === "tablet" ? (
                    <Tablet className="w-3 h-3" />
                  ) : (
                    <Smartphone className="w-3 h-3" />
                  )}
                  <span className="capitalize">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1st Option: Custom Dimensions */}
          <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1c1c1c]/80 border border-slate-200/80 dark:border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-zinc-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#0099ff]" />
                Custom Dimensions
              </span>
              <button
                type="button"
                onClick={handleSwapDimensions}
                className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-[#0099ff] dark:hover:text-[#0099ff] flex items-center gap-1 cursor-pointer transition-colors"
                title="Swap width and height (Rotate orientation)"
              >
                <ArrowLeftRight className="w-3 h-3" /> Rotate
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="200"
                  max="5000"
                  value={inputWidth}
                  onChange={(e) => setInputWidth(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCustom()}
                  placeholder="Width"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#333333] text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0099ff]"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-mono">W</span>
              </div>
              <span className="text-slate-400 dark:text-zinc-500 font-mono text-xs">×</span>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="200"
                  max="5000"
                  value={inputHeight}
                  onChange={(e) => setInputHeight(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCustom()}
                  placeholder="Height"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#333333] text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0099ff]"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-mono">H</span>
              </div>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-3 py-1.5 rounded-lg bg-[#0099ff] hover:bg-[#0088ee] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Presets List */}
          <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1 mb-1.5 flex items-center justify-between">
            <span>Popular Presets</span>
            <span className="text-[10px] lowercase text-slate-400">{currentPresets.length} available</span>
          </div>

          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
            {currentPresets.map((preset) => {
              const isSelected =
                !isCustom &&
                activePreset?.id === preset.id &&
                category === preset.category;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0099ff]/10 dark:bg-[#0099ff]/15 text-[#0099ff] font-semibold border border-[#0099ff]/30"
                      : "hover:bg-slate-100 dark:hover:bg-[#1c1c1c] text-slate-700 dark:text-zinc-300 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    {preset.category === "desktop" ? (
                      <Monitor className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    ) : preset.category === "tablet" ? (
                      <Tablet className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    )}
                    <span className="truncate">{preset.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? "bg-[#0099ff]/20 text-[#0099ff] font-semibold"
                          : "bg-slate-100 dark:bg-[#262626] text-slate-500 dark:text-zinc-400"
                      }`}
                    >
                      {preset.width === 0 ? "Fluid" : `${preset.width} × ${preset.height}`}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0099ff]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
