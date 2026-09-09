import { useState, useEffect } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { Code2, Plus, Trash2, Sparkles, Sliders, ChevronDown, ChevronRight } from "lucide-react";

interface AdvancedCssGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  onEdit?: (record: EditRecord) => void;
}

export function parseFilterFunctions(filterStr: string): Record<string, { amount: number; unit: string }> {
  const result: Record<string, { amount: number; unit: string }> = {};
  if (!filterStr || filterStr === "none") return result;
  const regex = /([a-z-]+)\(([-\d.]+)(px|%|deg|rem)?\)/gi;
  let match;
  while ((match = regex.exec(filterStr)) !== null) {
    const name = match[1].toLowerCase();
    const amount = parseFloat(match[2]);
    const defaultUnit = name === "blur" ? "px" : name === "hue-rotate" ? "deg" : "%";
    result[name] = {
      amount: isNaN(amount) ? 0 : amount,
      unit: match[3] || defaultUnit,
    };
  }
  return result;
}

export function updateFilterFunction(
  currentFilterStr: string,
  fnName: string,
  amount: number,
  unit: string,
  defaultAmount: number = 0
): string {
  const fns = parseFilterFunctions(currentFilterStr);
  if (amount === defaultAmount) {
    delete fns[fnName];
  } else {
    fns[fnName] = { amount, unit };
  }
  const parts = Object.entries(fns).map(([name, { amount: a, unit: u }]) => `${name}(${a}${u})`);
  return parts.length > 0 ? parts.join(" ") : "none";
}

const COMMON_CSS_SNIPPETS = [
  { label: "Glass Backdrop", prop: "backdrop-filter", val: "blur(12px) saturate(180%)" },
  { label: "Grayscale Filter", prop: "filter", val: "grayscale(100%)" },
  { label: "Soft Glow", prop: "filter", val: "drop-shadow(0 0 12px rgba(99,102,241,0.5))" },
  { label: "Perspective 3D", prop: "transform", val: "perspective(600px) rotateY(10deg)" },
  { label: "Pointer Events None", prop: "pointer-events", val: "none" },
  { label: "User Select None", prop: "user-select", val: "none" },
];

interface FilterControlDef {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultVal: number;
}

const FILTER_CONTROLS: FilterControlDef[] = [
  { name: "blur", label: "Blur", min: 0, max: 40, step: 1, unit: "px", defaultVal: 0 },
  { name: "grayscale", label: "Grayscale", min: 0, max: 100, step: 1, unit: "%", defaultVal: 0 },
  { name: "brightness", label: "Brightness", min: 0, max: 200, step: 5, unit: "%", defaultVal: 100 },
  { name: "contrast", label: "Contrast", min: 0, max: 200, step: 5, unit: "%", defaultVal: 100 },
  { name: "saturate", label: "Saturate", min: 0, max: 200, step: 5, unit: "%", defaultVal: 100 },
  { name: "sepia", label: "Sepia", min: 0, max: 100, step: 1, unit: "%", defaultVal: 0 },
  { name: "invert", label: "Invert", min: 0, max: 100, step: 1, unit: "%", defaultVal: 0 },
  { name: "hue-rotate", label: "Hue Rotate", min: 0, max: 360, step: 5, unit: "deg", defaultVal: 0 },
];

export default function AdvancedCssGroup({
  element,
  structuralPath,
  theme,
  onEdit,
}: AdvancedCssGroupProps) {
  const [targetFilterProp, setTargetFilterProp] = useState<"filter" | "backdrop-filter">("filter");
  const [filterValues, setFilterValues] = useState<Record<string, number>>({});
  const [showSliders, setShowSliders] = useState(true);
  const [newProp, setNewProp] = useState("");
  const [newVal, setNewVal] = useState("");

  useEffect(() => {
    if (!element) return;
    const styleAttr = element.getAttribute("style") || "";
    const regex = new RegExp(`${targetFilterProp}:\\s*([^;]+)`, "i");
    const match = styleAttr.match(regex);
    const filterStr = match ? match[1].trim() : "";
    const parsed = parseFilterFunctions(filterStr);

    const values: Record<string, number> = {};
    for (const ctrl of FILTER_CONTROLS) {
      values[ctrl.name] = parsed[ctrl.name]?.amount ?? ctrl.defaultVal;
    }
    setFilterValues(values);
  }, [element, targetFilterProp, structuralPath]);

  if (!element || !structuralPath) return null;

  const styleAttr = element.getAttribute("style") || "";
  const inlineStyles: { key: string; value: string }[] = [];

  styleAttr.split(";").forEach((declaration) => {
    const trimmed = declaration.trim();
    if (!trimmed) return;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const k = trimmed.slice(0, colonIdx).trim();
      const v = trimmed.slice(colonIdx + 1).trim();
      if (k && v) inlineStyles.push({ key: k, value: v });
    }
  });

  function handleFilterSliderChange(name: string, amount: number, live: boolean = false) {
    const ctrl = FILTER_CONTROLS.find((c) => c.name === name);
    if (!ctrl) return;

    setFilterValues((prev) => ({ ...prev, [name]: amount }));

    // Get current filter property from inline style
    const curStyle = (element as HTMLElement).style?.getPropertyValue(targetFilterProp) || "";
    const updated = updateFilterFunction(curStyle, name, amount, ctrl.unit, ctrl.defaultVal);

    if (live) {
      applyLiveStyle(element!, targetFilterProp as any, updated, theme);
    } else {
      applyLiveStyle(element!, targetFilterProp as any, updated, theme);
      commitStyleChange(element!, structuralPath!, targetFilterProp as any, updated, theme, onEdit);
    }
  }

  function handleAddProperty(prop: string, val: string) {
    const cleanP = prop.trim().toLowerCase();
    const cleanV = val.trim();
    if (!cleanP || !cleanV) return;

    applyLiveStyle(element!, cleanP as any, cleanV, theme);
    commitStyleChange(element!, structuralPath!, cleanP as any, cleanV, theme, onEdit);
    setNewProp("");
    setNewVal("");
  }

  function handleRemoveProperty(prop: string) {
    (element as HTMLElement).style?.removeProperty(prop);
    commitStyleChange(element!, structuralPath!, prop as any, "", theme, onEdit);
  }

  return (
    <div className="p-4 border-b border-[#262626] space-y-4">
      {/* Header Action Row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium">Filter Controls & Presets</span>
        <button
          type="button"
          aria-label={showSliders ? "Hide filter intensity sliders" : "Show filter intensity sliders"}
          onClick={() => setShowSliders((prev) => !prev)}
          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <Sliders className="w-3 h-3 text-[#0099ff]" />
          <span>{showSliders ? "Hide Sliders" : "Show Sliders"}</span>
        </button>
      </div>

      {/* Visual Intensity Sliders (filter / backdrop-filter) */}
      {showSliders && (
        <div className="space-y-3 p-3 bg-[#141414] rounded-xl border border-[#262626]">
          {/* Target Toggle: Filter vs Backdrop Filter */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Target:</span>
            <div className="flex bg-[#1c1c1c] p-0.5 rounded-lg text-[11px] border border-[#262626]">
              <button
                type="button"
                aria-label="Target filter property"
                onClick={() => setTargetFilterProp("filter")}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  targetFilterProp === "filter"
                    ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                filter
              </button>
              <button
                type="button"
                aria-label="Target backdrop-filter property"
                onClick={() => setTargetFilterProp("backdrop-filter")}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  targetFilterProp === "backdrop-filter"
                    ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                backdrop-filter
              </button>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="space-y-2.5 pt-1">
            {FILTER_CONTROLS.map((ctrl) => {
              const currentVal = filterValues[ctrl.name] ?? ctrl.defaultVal;
              return (
                <div key={ctrl.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-300 font-mono">
                    <span className="font-sans text-zinc-400">{ctrl.label}</span>
                    <span className="text-[11px] text-[#0099ff] font-medium">
                      {currentVal}
                      {ctrl.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step}
                    value={currentVal}
                    onChange={(e) => handleFilterSliderChange(ctrl.name, parseFloat(e.target.value), true)}
                    onPointerUp={(e) => handleFilterSliderChange(ctrl.name, parseFloat((e.target as HTMLInputElement).value), false)}
                    className="w-full accent-[#0099ff] cursor-pointer h-1.5 bg-[#262626] rounded-lg"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick CSS Snippets */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
          <Sparkles className="w-3 h-3 text-[#0099ff]" />
          <span>Quick CSS Effects</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_CSS_SNIPPETS.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              aria-label={`Apply quick CSS snippet ${snippet.label}`}
              onClick={() => handleAddProperty(snippet.prop, snippet.val)}
              className="px-2 py-1 text-[10px] rounded-lg bg-[#141414] hover:bg-[#1c1c1c] border border-[#262626] text-zinc-300 transition-colors cursor-pointer"
            >
              {snippet.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom CSS Rule */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] text-zinc-400 block font-medium">Add Custom CSS Property</label>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="property (e.g. transform)"
            aria-label="Custom CSS property name"
            value={newProp}
            onChange={(e) => setNewProp(e.target.value)}
            className="flex-1 min-w-0 bg-[#141414] border border-[#262626] focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono outline-none"
          />
          <span className="text-zinc-500 font-mono">:</span>
          <input
            type="text"
            placeholder="value (e.g. scale(1.1))"
            aria-label="Custom CSS property value"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProperty(newProp, newVal)}
            className="flex-1 min-w-0 bg-[#141414] border border-[#262626] focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono outline-none"
          />
          <button
            type="button"
            aria-label="Add custom CSS property"
            onClick={() => handleAddProperty(newProp, newVal)}
            className="p-1.5 rounded-lg bg-[#0099ff] hover:bg-[#33adff] text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Apply CSS Property"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Current Inline Styles List */}
      {inlineStyles.length > 0 && (
        <div className="space-y-1 pt-1">
          <label className="text-[10px] text-zinc-500 block uppercase font-mono">
            Active Inline Declarations ({inlineStyles.length})
          </label>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {inlineStyles.map(({ key, value }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#141414] border border-[#262626] text-xs font-mono text-zinc-300"
              >
                <div className="truncate min-w-0">
                  <span className="text-[#0099ff]">{key}</span>
                  <span className="text-zinc-500">: </span>
                  <span className="truncate">{value}</span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove inline style ${key}`}
                  onClick={() => handleRemoveProperty(key)}
                  className="text-zinc-500 hover:text-rose-400 p-1 rounded cursor-pointer transition-colors"
                  title={`Remove ${key}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
