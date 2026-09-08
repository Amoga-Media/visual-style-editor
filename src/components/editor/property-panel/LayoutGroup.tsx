import { useEffect, useRef, useState } from "react";
import type { EditableProperty, EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { getResponsivePropertyInfo } from "@/lib/dom/responsive-style-engine";
import ValueInput from "./ValueInput";
import { ChevronDown, ChevronRight, Sliders, Lock, Unlock, Space } from "lucide-react";

type Unit = "px" | "%" | "vw" | "vh" | "rem" | "em" | "pt";

const SIZING_ALLOWED_UNITS: Unit[] = ["px", "%", "vw", "vh", "rem", "em", "pt"];
const SPACING_ALLOWED_UNITS: Unit[] = ["px", "%", "rem", "em", "vw", "pt"];

const RANGE_BY_UNIT: Record<Unit, { min: number; max: number; step: number }> = {
  px: { min: 0, max: 1920, step: 1 },
  "%": { min: 0, max: 100, step: 1 },
  vw: { min: 0, max: 100, step: 1 },
  vh: { min: 0, max: 100, step: 1 },
  rem: { min: 0, max: 64, step: 0.25 },
  em: { min: 0, max: 64, step: 0.25 },
  pt: { min: 0, max: 1200, step: 1 },
};

interface AxisValue {
  amount: number;
  unit: Unit;
}

export function handleSliderChange(element: Element, property: EditableProperty, value: string, theme?: ThemeMap, viewport: ViewportMode = "desktop", structuralPath?: string) {
  applyLiveStyle(element, property, value, theme, undefined, viewport, structuralPath);
}

export function handleSliderCommit(
  element: Element,
  arg2: any,
  arg3: any,
  arg4: any,
  arg5: any,
  arg6?: any,
  arg7?: any,
  viewport: ViewportMode = "desktop"
) {
  let structuralPath: string;
  let property: EditableProperty;
  let value: string;
  let theme: ThemeMap;
  let onEdit: ((record: EditRecord) => void) | undefined;
  let baselineOldValue: string | undefined;

  if (typeof arg2 === "string" && (typeof arg6 === "string" || typeof arg7 === "function")) {
    property = arg2 as EditableProperty;
    value = arg3 as string;
    theme = arg5 as ThemeMap;
    structuralPath = (arg6 as string) ?? "";
    onEdit = typeof arg7 === "function" ? arg7 : undefined;
  } else {
    structuralPath = arg2 as string;
    property = arg3 as EditableProperty;
    value = arg4 as string;
    theme = arg5 as ThemeMap;
    onEdit = typeof arg6 === "function" ? arg6 : undefined;
    baselineOldValue = typeof arg7 === "string" ? arg7 : undefined;
  }

  commitStyleChange(element, structuralPath, property, value, theme, onEdit, baselineOldValue, undefined, viewport);
}

function parseAxisValue(raw: string, defaultUnit: Unit = "px"): AxisValue {
  if (!raw || raw === "none" || raw === "auto") return { amount: 0, unit: defaultUnit };
  const match = raw.match(/^([-\d.]+)\s*(px|%|vw|vh|rem|em|pt)?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const u = (match[2]?.toLowerCase() as Unit) || defaultUnit;
    return { amount: isNaN(num) ? 0 : num, unit: u };
  }
  const bareNum = parseFloat(raw);
  return { amount: isNaN(bareNum) ? 0 : bareNum, unit: defaultUnit };
}

const MAX_WIDTH_PRESETS = [
  { label: "None", val: "none" },
  { label: "SM", val: "384px" },
  { label: "MD", val: "448px" },
  { label: "LG", val: "512px" },
  { label: "XL", val: "576px" },
  { label: "2XL", val: "672px" },
  { label: "4XL", val: "896px" },
  { label: "7XL", val: "1280px" },
  { label: "Full", val: "100%" },
];

interface LayoutGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

export default function LayoutGroup({ element, structuralPath, theme, viewport = "desktop", onEdit }: LayoutGroupProps) {
  const [width, setWidth] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [height, setHeight] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [lockAspect, setLockAspect] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [aspectRatioCss, setAspectRatioCss] = useState<string>("auto");
  const [minWidth, setMinWidth] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [maxWidth, setMaxWidth] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [minHeight, setMinHeight] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [maxHeight, setMaxHeight] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [showConstraints, setShowConstraints] = useState(false);

  // 4-side Padding
  const [padding, setPadding] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [padT, setPadT] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [padR, setPadR] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [padB, setPadB] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [padL, setPadL] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [linkedPadding, setLinkedPadding] = useState<boolean>(true);

  // 4-side Margin
  const [margin, setMargin] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [marT, setMarT] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [marR, setMarR] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [marB, setMarB] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [marL, setMarL] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [linkedMargin, setLinkedMargin] = useState<boolean>(true);

  const prevElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!element) return;
    prevElementRef.current = element;

    const win = element.ownerDocument?.defaultView || window;
    const computed = win.getComputedStyle(element);

    const rawW = getResponsivePropertyInfo(element, structuralPath || "", "width", viewport).value || readCurrentValue(element, "width", theme);
    const parsedW = parseAxisValue(rawW, "px");
    if (parsedW.amount === 0 && computed.width) {
      parsedW.amount = parseFloat(computed.width) || 0;
    }
    setWidth(parsedW);

    const rawH = getResponsivePropertyInfo(element, structuralPath || "", "height", viewport).value || readCurrentValue(element, "height", theme);
    const parsedH = parseAxisValue(rawH, "px");
    if (parsedH.amount === 0 && computed.height) {
      parsedH.amount = parseFloat(computed.height) || 0;
    }
    setHeight(parsedH);

    if (parsedW.amount > 0 && parsedH.amount > 0) {
      setAspectRatio(Number((parsedW.amount / parsedH.amount).toFixed(4)));
    }

    const rawAR = readCurrentValue(element, "aspect-ratio" as any, theme) || computed.aspectRatio || "auto";
    setAspectRatioCss(rawAR);

    const rawMinW = getResponsivePropertyInfo(element, structuralPath || "", "min-width", viewport).value || readCurrentValue(element, "min-width", theme);
    setMinWidth(parseAxisValue(rawMinW));

    const rawMaxW = getResponsivePropertyInfo(element, structuralPath || "", "max-width", viewport).value || readCurrentValue(element, "max-width", theme);
    setMaxWidth(parseAxisValue(rawMaxW));

    const rawMinH = getResponsivePropertyInfo(element, structuralPath || "", "min-height", viewport).value || readCurrentValue(element, "min-height", theme);
    setMinHeight(parseAxisValue(rawMinH));

    const rawMaxH = getResponsivePropertyInfo(element, structuralPath || "", "max-height", viewport).value || readCurrentValue(element, "max-height", theme);
    setMaxHeight(parseAxisValue(rawMaxH));

    // Padding
    const rawP = getResponsivePropertyInfo(element, structuralPath || "", "padding", viewport).value || readCurrentValue(element, "padding", theme);
    const parsedP = parseAxisValue(rawP);
    setPadding(parsedP);
    setPadT(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "padding-top", viewport).value || readCurrentValue(element, "padding-top", theme), parsedP.unit));
    setPadR(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "padding-right", viewport).value || readCurrentValue(element, "padding-right", theme), parsedP.unit));
    setPadB(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "padding-bottom", viewport).value || readCurrentValue(element, "padding-bottom", theme), parsedP.unit));
    setPadL(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "padding-left", viewport).value || readCurrentValue(element, "padding-left", theme), parsedP.unit));

    // Margin
    const rawM = getResponsivePropertyInfo(element, structuralPath || "", "margin", viewport).value || readCurrentValue(element, "margin", theme);
    const parsedM = parseAxisValue(rawM);
    setMargin(parsedM);
    setMarT(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "margin-top", viewport).value || readCurrentValue(element, "margin-top", theme), parsedM.unit));
    setMarR(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "margin-right", viewport).value || readCurrentValue(element, "margin-right", theme), parsedM.unit));
    setMarB(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "margin-bottom", viewport).value || readCurrentValue(element, "margin-bottom", theme), parsedM.unit));
    setMarL(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "margin-left", viewport).value || readCurrentValue(element, "margin-left", theme), parsedM.unit));
  }, [element, theme, viewport, structuralPath]);

  if (!element || !structuralPath) return null;

  function handleWidthLiveChange(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || width.unit;
    setWidth({ amount, unit });
    applyLiveStyle(element!, "width", `${amount}${unit}`, theme, undefined, viewport, structuralPath!);

    if (lockAspect && aspectRatio > 0 && unit === "px") {
      const scaledH = Math.round(amount / aspectRatio);
      setHeight({ amount: scaledH, unit: "px" });
      applyLiveStyle(element!, "height", `${scaledH}px`, theme, undefined, viewport, structuralPath!);
    }
  }

  function commitWidth(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setWidth({ amount, unit });
    commitStyleChange(element!, structuralPath!, "width", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);

    if (lockAspect && aspectRatio > 0 && unit === "px") {
      const scaledH = Math.round(amount / aspectRatio);
      setHeight({ amount: scaledH, unit: "px" });
      commitStyleChange(element!, structuralPath!, "height", `${scaledH}px`, theme, onEdit, undefined, undefined, viewport);
    }
  }

  function handleHeightLiveChange(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || height.unit;
    setHeight({ amount, unit });
    applyLiveStyle(element!, "height", `${amount}${unit}`, theme, undefined, viewport, structuralPath!);

    if (lockAspect && aspectRatio > 0 && unit === "px") {
      const scaledW = Math.round(amount * aspectRatio);
      setWidth({ amount: scaledW, unit: "px" });
      applyLiveStyle(element!, "width", `${scaledW}px`, theme, undefined, viewport, structuralPath!);
    }
  }

  function commitHeight(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setHeight({ amount, unit });
    commitStyleChange(element!, structuralPath!, "height", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);

    if (lockAspect && aspectRatio > 0 && unit === "px") {
      const scaledW = Math.round(amount * aspectRatio);
      setWidth({ amount: scaledW, unit: "px" });
      commitStyleChange(element!, structuralPath!, "width", `${scaledW}px`, theme, onEdit, undefined, undefined, viewport);
    }
  }

  function handleSetAspectRatioCss(val: string) {
    setAspectRatioCss(val);
    applyLiveStyle(element!, "aspect-ratio" as any, val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "aspect-ratio" as any, val, theme, onEdit, undefined, undefined, viewport);
  }

  function commitMinWidth(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setMinWidth({ amount, unit });
    commitStyleChange(element!, structuralPath!, "min-width", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  function commitMaxWidth(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setMaxWidth({ amount, unit });
    commitStyleChange(element!, structuralPath!, "max-width", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  function commitMinHeight(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setMinHeight({ amount, unit });
    commitStyleChange(element!, structuralPath!, "min-height", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  function commitMaxHeight(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setMaxHeight({ amount, unit });
    commitStyleChange(element!, structuralPath!, "max-height", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  function applyMaxWidthPreset(preset: typeof MAX_WIDTH_PRESETS[0]) {
    if (preset.val === "none") {
      setMaxWidth({ amount: 0, unit: "px" });
      commitStyleChange(element!, structuralPath!, "max-width", "none", theme, onEdit, undefined, undefined, viewport);
    } else {
      const parsed = parseAxisValue(preset.val);
      setMaxWidth(parsed);
      commitStyleChange(element!, structuralPath!, "max-width", preset.val, theme, onEdit, undefined, undefined, viewport);
    }
  }

  // Padding commits
  function commitUniformPadding(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || padding.unit;
    const valObj = { amount, unit };
    setPadding(valObj);
    setPadT(valObj);
    setPadR(valObj);
    setPadB(valObj);
    setPadL(valObj);
    commitStyleChange(element!, structuralPath!, "padding", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  function commitSidePadding(property: "padding-top" | "padding-right" | "padding-bottom" | "padding-left", amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || padding.unit;
    const valObj = { amount, unit };
    if (property === "padding-top") setPadT(valObj);
    if (property === "padding-right") setPadR(valObj);
    if (property === "padding-bottom") setPadB(valObj);
    if (property === "padding-left") setPadL(valObj);
    commitStyleChange(element!, structuralPath!, property, `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  // Margin commits
  function commitUniformMargin(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || margin.unit;
    const valObj = { amount, unit };
    setMargin(valObj);
    setMarT(valObj);
    setMarR(valObj);
    setMarB(valObj);
    setMarL(valObj);
    commitStyleChange(element!, structuralPath!, "margin", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  function commitSideMargin(property: "margin-top" | "margin-right" | "margin-bottom" | "margin-left", amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || margin.unit;
    const valObj = { amount, unit };
    if (property === "margin-top") setMarT(valObj);
    if (property === "margin-right") setMarR(valObj);
    if (property === "margin-bottom") setMarB(valObj);
    if (property === "margin-left") setMarL(valObj);
    commitStyleChange(element!, structuralPath!, property, `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  return (
    <div className="p-4 border-b border-slate-200 dark:border-[#222] space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Layout & Sizing</div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const next = !lockAspect;
              setLockAspect(next);
              if (next && width.amount > 0 && height.amount > 0) {
                setAspectRatio(Number((width.amount / height.amount).toFixed(4)));
              }
            }}
            className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
              lockAspect
                ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40 font-medium"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#181818] border border-transparent"
            }`}
            title={lockAspect ? "Aspect Ratio Locked (Proportional scaling on)" : "Aspect Ratio Unlocked (Click to lock ratio)"}
          >
            {lockAspect ? <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <Unlock className="w-3 h-3" />}
            <span>Lock Ratio</span>
          </button>

          <button
            onClick={() => setShowConstraints(!showConstraints)}
            className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
              showConstraints
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-medium"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#181818]"
            }`}
            title="Toggle Min/Max Size Constraints"
          >
            <Sliders className="w-3 h-3" />
            <span>Constraints</span>
          </button>
        </div>
      </div>

      {/* Aspect Ratio Presets Bar */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono uppercase">Aspect Ratio</label>
        <div className="grid grid-cols-5 gap-1">
          {[
            { label: "Auto", val: "auto" },
            { label: "1:1", val: "1 / 1" },
            { label: "16:9", val: "16 / 9" },
            { label: "4:3", val: "4 / 3" },
            { label: "9:16", val: "9 / 16" },
          ].map((ar) => (
            <button
              key={ar.label}
              type="button"
              onClick={() => handleSetAspectRatioCss(ar.val)}
              className={`py-1 text-[10px] rounded-lg transition-colors cursor-pointer border ${
                aspectRatioCss === ar.val
                  ? "bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/50 font-semibold"
                  : "bg-slate-100 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#262626] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c1c1c]"
              }`}
            >
              {ar.label}
            </button>
          ))}
        </div>
      </div>

      {/* Width */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-1.5">
            <span>Width</span>
            {lockAspect && <Lock className="w-2.5 h-2.5 text-indigo-400" />}
          </div>
          <ValueInput
            amount={width.amount}
            unit={width.unit}
            min={RANGE_BY_UNIT[width.unit]?.min ?? 0}
            max={RANGE_BY_UNIT[width.unit]?.max ?? 2000}
            step={RANGE_BY_UNIT[width.unit]?.step ?? 1}
            allowedUnits={SIZING_ALLOWED_UNITS}
            property="width"
            element={element}
            viewport={viewport}
            onChange={handleWidthLiveChange}
            onCommit={commitWidth}
          />
        </div>
        <input
          type="range"
          min={RANGE_BY_UNIT[width.unit]?.min ?? 0}
          max={RANGE_BY_UNIT[width.unit]?.max ?? 1200}
          step={RANGE_BY_UNIT[width.unit]?.step ?? 1}
          value={width.amount}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            handleWidthLiveChange(val, width.unit);
          }}
          onPointerUp={() => commitWidth(width.amount, width.unit)}
          className="w-full accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Height */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-1.5">
            <span>Height</span>
            {lockAspect && <Lock className="w-2.5 h-2.5 text-indigo-400" />}
          </div>
          <ValueInput
            amount={height.amount}
            unit={height.unit}
            min={RANGE_BY_UNIT[height.unit]?.min ?? 0}
            max={RANGE_BY_UNIT[height.unit]?.max ?? 2000}
            step={RANGE_BY_UNIT[height.unit]?.step ?? 1}
            allowedUnits={SIZING_ALLOWED_UNITS}
            property="height"
            element={element}
            viewport={viewport}
            onChange={handleHeightLiveChange}
            onCommit={commitHeight}
          />
        </div>
        <input
          type="range"
          min={RANGE_BY_UNIT[height.unit]?.min ?? 0}
          max={RANGE_BY_UNIT[height.unit]?.max ?? 1200}
          step={RANGE_BY_UNIT[height.unit]?.step ?? 1}
          value={height.amount}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            handleHeightLiveChange(val, height.unit);
          }}
          onPointerUp={() => commitHeight(height.amount, height.unit)}
          className="w-full accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Constraints Drawer (Min/Max Width & Height) */}
      {showConstraints && (
        <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#242424] space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Size Constraints
          </div>

          {/* Max Width Quick Presets */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 dark:text-zinc-400 block">Max Width Presets</label>
            <div className="grid grid-cols-5 gap-1">
              {MAX_WIDTH_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyMaxWidthPreset(p)}
                  className="py-1 text-[10px] rounded-lg bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#252525] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#282828] transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min Width & Max Width Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Min Width</span>
              <ValueInput
                amount={minWidth.amount}
                unit={minWidth.unit}
                min={0}
                max={2000}
                step={1}
                allowedUnits={SIZING_ALLOWED_UNITS}
                property="min-width"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || minWidth.unit;
                  setMinWidth({ amount: amt, unit });
                  applyLiveStyle(element, "min-width", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitMinWidth}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Max Width</span>
              <ValueInput
                amount={maxWidth.amount}
                unit={maxWidth.unit}
                min={0}
                max={2000}
                step={1}
                allowedUnits={SIZING_ALLOWED_UNITS}
                property="max-width"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || maxWidth.unit;
                  setMaxWidth({ amount: amt, unit });
                  applyLiveStyle(element, "max-width", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitMaxWidth}
              />
            </div>
          </div>

          {/* Min Height & Max Height Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Min Height</span>
              <ValueInput
                amount={minHeight.amount}
                unit={minHeight.unit}
                min={0}
                max={2000}
                step={1}
                allowedUnits={SIZING_ALLOWED_UNITS}
                property="min-height"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || minHeight.unit;
                  setMinHeight({ amount: amt, unit });
                  applyLiveStyle(element, "min-height", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitMinHeight}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Max Height</span>
              <ValueInput
                amount={maxHeight.amount}
                unit={maxHeight.unit}
                min={0}
                max={2000}
                step={1}
                allowedUnits={SIZING_ALLOWED_UNITS}
                property="max-height"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || maxHeight.unit;
                  setMaxHeight({ amount: amt, unit });
                  applyLiveStyle(element, "max-height", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitMaxHeight}
              />
            </div>
          </div>
        </div>
      )}

      {/* Padding 4-Side Box Model */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
          <span>Padding</span>
          <button
            onClick={() => setLinkedPadding(!linkedPadding)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              linkedPadding ? "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
            }`}
            title={linkedPadding ? "Linked (All Sides)" : "Unlinked (4 Sides)"}
          >
            {linkedPadding ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>

        {linkedPadding ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>All Sides</span>
              <ValueInput
                amount={padding.amount}
                unit={padding.unit}
                min={0}
                max={256}
                step={1}
                allowedUnits={SPACING_ALLOWED_UNITS}
                property="padding"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || padding.unit;
                  setPadding({ amount: amt, unit });
                  applyLiveStyle(element, "padding", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitUniformPadding}
              />
            </div>
            <input
              type="range"
              min={0}
              max={128}
              step={1}
              value={padding.amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPadding({ ...padding, amount: val });
                applyLiveStyle(element, "padding", `${val}${padding.unit}`, theme, undefined, viewport, structuralPath!);
              }}
              onPointerUp={() => commitUniformPadding(padding.amount, padding.unit)}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#242424] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Top</span>
                <ValueInput
                  amount={padT.amount}
                  unit={padT.unit}
                  min={0}
                  max={256}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="padding-top"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || padT.unit;
                    setPadT({ amount: amt, unit });
                    applyLiveStyle(element, "padding-top", `${amt}${unit}`, theme, "top", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSidePadding("padding-top", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Right</span>
                <ValueInput
                  amount={padR.amount}
                  unit={padR.unit}
                  min={0}
                  max={256}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="padding-right"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || padR.unit;
                    setPadR({ amount: amt, unit });
                    applyLiveStyle(element, "padding-right", `${amt}${unit}`, theme, "right", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSidePadding("padding-right", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Bottom</span>
                <ValueInput
                  amount={padB.amount}
                  unit={padB.unit}
                  min={0}
                  max={256}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="padding-bottom"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || padB.unit;
                    setPadB({ amount: amt, unit });
                    applyLiveStyle(element, "padding-bottom", `${amt}${unit}`, theme, "bottom", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideMargin("padding-bottom" as any, amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Left</span>
                <ValueInput
                  amount={padL.amount}
                  unit={padL.unit}
                  min={0}
                  max={256}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="padding-left"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || padL.unit;
                    setPadL({ amount: amt, unit });
                    applyLiveStyle(element, "padding-left", `${amt}${unit}`, theme, "left", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSidePadding("padding-left", amt, u)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Margin 4-Side Box Model */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
          <span>Margin</span>
          <button
            onClick={() => setLinkedMargin(!linkedMargin)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              linkedMargin ? "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
            }`}
            title={linkedMargin ? "Linked (All Sides)" : "Unlinked (4 Sides)"}
          >
            {linkedMargin ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>

        {linkedMargin ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>All Sides</span>
              <ValueInput
                amount={margin.amount}
                unit={margin.unit}
                min={-128}
                max={256}
                step={1}
                allowedUnits={SPACING_ALLOWED_UNITS}
                property="margin"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || margin.unit;
                  setMargin({ amount: amt, unit });
                  applyLiveStyle(element, "margin", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitUniformMargin}
              />
            </div>
            <input
              type="range"
              min={0}
              max={128}
              step={1}
              value={margin.amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setMargin({ ...margin, amount: val });
                applyLiveStyle(element, "margin", `${val}${margin.unit}`, theme, undefined, viewport, structuralPath!);
              }}
              onPointerUp={() => commitUniformMargin(margin.amount, margin.unit)}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#242424] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Top</span>
                <ValueInput
                  amount={marT.amount}
                  unit={marT.unit}
                  min={-128}
                  max={256}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="margin-top"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || marT.unit;
                    setMarT({ amount: amt, unit });
                    applyLiveStyle(element, "margin-top", `${amt}${unit}`, theme, "top", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideMargin("margin-top", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Right</span>
                <ValueInput
                  amount={marR.amount}
                  unit={marR.unit}
                  min={-128}
                  max={256}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="margin-right"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || marR.unit;
                    setMarR({ amount: amt, unit });
                    applyLiveStyle(element, "margin-right", `${amt}${unit}`, theme, "right", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideMargin("margin-right", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Bottom</span>
                <ValueInput
                  amount={marB.amount}
                  unit={marB.unit}
                  min={-128}
                  max={256}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="margin-bottom"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || marB.unit;
                    setMarB({ amount: amt, unit });
                    applyLiveStyle(element, "margin-bottom", `${amt}${unit}`, theme, "bottom", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideMargin("margin-bottom", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Left</span>
                <ValueInput
                  amount={marL.amount}
                  unit={marL.unit}
                  min={-128}
                  max={256}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="margin-left"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || marL.unit;
                    setMarL({ amount: amt, unit });
                    applyLiveStyle(element, "margin-left", `${amt}${unit}`, theme, "left", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideMargin("margin-left", amt, u)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

