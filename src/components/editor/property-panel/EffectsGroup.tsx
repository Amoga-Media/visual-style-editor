import { useEffect, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { Sparkles, SunMedium, MousePointer, RotateCw, ZoomIn, Eye } from "lucide-react";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { getResponsivePropertyInfo } from "@/lib/dom/responsive-style-engine";
import ValueInput from "./ValueInput";

interface EffectsGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

const SHADOW_PRESETS = [
  { label: "None", class: "", css: "none" },
  { label: "SM", class: "shadow-sm", css: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
  { label: "MD", class: "shadow-md", css: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
  { label: "LG", class: "shadow-lg", css: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
  { label: "XL", class: "shadow-xl", css: "0 20px 25px -5px rgb(0 0 0 / 0.1)" },
  { label: "2XL", class: "shadow-2xl", css: "0 25px 50px -12px rgb(0 0 0 / 0.25)" },
  { label: "Inner", class: "shadow-inner", css: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)" },
];

const BLUR_PRESETS = [
  { label: "None", val: "none" },
  { label: "SM (4px)", val: "sm" },
  { label: "MD (8px)", val: "md" },
  { label: "LG (16px)", val: "lg" },
  { label: "XL (24px)", val: "xl" },
];

const CURSOR_PRESETS = [
  { label: "Default", val: "default" },
  { label: "Pointer", val: "pointer" },
  { label: "Grab", val: "grab" },
  { label: "Text", val: "text" },
  { label: "Disabled", val: "not-allowed" },
  { label: "Move", val: "move" },
];

export default function EffectsGroup({
  element,
  structuralPath,
  theme,
  viewport = "desktop",
  onEdit,
}: EffectsGroupProps) {
  const [activeShadow, setActiveShadow] = useState("None");
  const [opacity, setOpacity] = useState(100);
  const [activeBlur, setActiveBlur] = useState("none");
  const [activeCursor, setActiveCursor] = useState("default");
  const [rotate, setRotate] = useState(0);
  const [scale, setScale] = useState(100);

  useEffect(() => {
    if (!element) return;
    const classList = Array.from(element.classList);
    const foundPreset = SHADOW_PRESETS.find((p) => p.class && classList.includes(p.class));
    setActiveShadow(foundPreset ? foundPreset.label : "None");

    const win = element.ownerDocument?.defaultView || window;
    const computed = win.getComputedStyle(element);

    function getVal(prop: string): string {
      if (structuralPath) {
        const resp = getResponsivePropertyInfo(element!, structuralPath, prop, viewport);
        if (resp.value) return resp.value;
      }
      return readCurrentValue(element!, prop, theme) || "";
    }

    const rawOp = getVal("opacity");
    const op = rawOp ? parseFloat(rawOp) : parseFloat(computed.opacity);
    setOpacity(isNaN(op) ? 100 : Math.round(op * 100));

    const cur = getVal("cursor") || computed.cursor || "default";
    setActiveCursor(cur);

    const blur = getVal("backdrop-blur") || "none";
    setActiveBlur(blur);

    const rot = parseFloat(getVal("rotate")) || 0;
    setRotate(rot);

    const sc = parseFloat(getVal("scale")) || 1;
    setScale(Math.round(sc * 100));
  }, [element, theme, viewport, structuralPath]);

  if (!element || !structuralPath) return null;

  function handleShadowChange(preset: typeof SHADOW_PRESETS[0]) {
    setActiveShadow(preset.label);
    const oldClassList = Array.from(element!.classList);

    if (theme.mode !== "none" && viewport === "desktop") {
      const filtered = oldClassList.filter((c) => !c.startsWith("shadow"));
      if (preset.class) filtered.push(preset.class);
      element!.className = filtered.join(" ");

      onEdit?.({
        kind: "class",
        structuralPath: structuralPath!,
        property: "box-shadow" as any,
        oldClassList,
        newClassList: filtered,
        viewport,
        timestamp: new Date().toISOString(),
      });
    } else {
      commitStyleChange(
        element!,
        structuralPath!,
        "box-shadow",
        preset.css,
        theme,
        onEdit,
        undefined,
        undefined,
        viewport
      );
    }
  }

  function handleOpacityChange(val: number) {
    setOpacity(val);
    applyLiveStyle(element!, "opacity", (val / 100).toString(), theme, undefined, viewport, structuralPath!);
  }

  function handleOpacityCommit(val: number) {
    setOpacity(val);
    const num = (val / 100).toString();
    commitStyleChange(element!, structuralPath!, "opacity", num, theme, onEdit, undefined, undefined, viewport);
  }

  function handleBlurChange(val: string) {
    setActiveBlur(val);
    applyLiveStyle(element!, "backdrop-blur", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "backdrop-blur", val, theme, onEdit, undefined, undefined, viewport);
  }

  function handleCursorChange(val: string) {
    setActiveCursor(val);
    applyLiveStyle(element!, "cursor", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "cursor", val, theme, onEdit, undefined, undefined, viewport);
  }

  function handleRotateChange(val: number) {
    setRotate(val);
    applyLiveStyle(element!, "rotate", val.toString(), theme, undefined, viewport, structuralPath!);
  }

  function handleRotateCommit(val: number) {
    setRotate(val);
    commitStyleChange(element!, structuralPath!, "rotate", val.toString(), theme, onEdit, undefined, undefined, viewport);
  }

  function handleScaleChange(val: number) {
    setScale(val);
    applyLiveStyle(element!, "scale", (val / 100).toString(), theme, undefined, viewport, structuralPath!);
  }

  function handleScaleCommit(val: number) {
    setScale(val);
    commitStyleChange(element!, structuralPath!, "scale", (val / 100).toString(), theme, onEdit, undefined, undefined, viewport);
  }

  return (
    <div className="p-4 border-b border-gray-800 space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Shadows & Effects</span>
      </div>

      {/* Shadow Preset Pills */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 block">Box Shadow</label>
        <div className="grid grid-cols-4 gap-1">
          {SHADOW_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handleShadowChange(p)}
              className={`py-1 text-xs rounded transition-all cursor-pointer ${
                activeShadow === p.label
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span className="flex items-center gap-1.5">
            <SunMedium className="w-3 h-3 text-gray-400" />
            <span>Opacity</span>
          </span>
          <ValueInput
            amount={opacity}
            unit="%"
            min={0}
            max={100}
            step={5}
            allowedUnits={["%"]}
            property="opacity"
            element={element}
            viewport={viewport}
            onChange={(amt) => handleOpacityChange(amt)}
            onCommit={(amt) => handleOpacityCommit(amt)}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={opacity}
          onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
          onPointerUp={() => handleOpacityCommit(opacity)}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Backdrop Blur (Glassmorphism) */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 block">Backdrop Blur (Glassmorphism)</label>
        <div className="grid grid-cols-5 gap-1">
          {BLUR_PRESETS.map((b) => (
            <button
              key={b.val}
              onClick={() => handleBlurChange(b.val)}
              className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                activeBlur === b.val
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cursor Picker */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <MousePointer className="w-3 h-3" />
          <span>Cursor Type</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {CURSOR_PRESETS.map((c) => (
            <button
              key={c.val}
              onClick={() => handleCursorChange(c.val)}
              className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                activeCursor === c.val
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transform: Rotate */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span className="flex items-center gap-1.5">
            <RotateCw className="w-3 h-3 text-gray-400" />
            <span>Rotate</span>
          </span>
          <ValueInput
            amount={rotate}
            unit="deg"
            min={-180}
            max={180}
            step={1}
            allowedUnits={["deg"]}
            property="rotate"
            element={element}
            viewport={viewport}
            onChange={(amt) => handleRotateChange(amt)}
            onCommit={(amt) => handleRotateCommit(amt)}
          />
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={rotate}
          onChange={(e) => handleRotateChange(parseFloat(e.target.value))}
          onPointerUp={() => handleRotateCommit(rotate)}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Transform: Scale */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span className="flex items-center gap-1.5">
            <ZoomIn className="w-3 h-3 text-gray-400" />
            <span>Scale</span>
          </span>
          <ValueInput
            amount={scale}
            unit="%"
            min={25}
            max={200}
            step={5}
            allowedUnits={["%"]}
            property="scale"
            element={element}
            viewport={viewport}
            onChange={(amt) => handleScaleChange(amt)}
            onCommit={(amt) => handleScaleCommit(amt)}
          />
        </div>
        <input
          type="range"
          min={25}
          max={200}
          step={5}
          value={scale}
          onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
          onPointerUp={() => handleScaleCommit(scale)}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
