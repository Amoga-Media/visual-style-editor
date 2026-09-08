import { useEffect, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { Move, Pin, Layers, Eye, EyeOff, Scissors } from "lucide-react";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { getResponsivePropertyInfo } from "@/lib/dom/responsive-style-engine";
import ValueInput from "./ValueInput";

interface PositionGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

const POSITION_MODES = [
  { label: "Static", val: "static" },
  { label: "Relative", val: "relative" },
  { label: "Absolute", val: "absolute" },
  { label: "Fixed", val: "fixed" },
  { label: "Sticky", val: "sticky" },
];

const OVERFLOW_MODES = [
  { label: "Visible", val: "visible" },
  { label: "Hidden", val: "hidden" },
  { label: "Scroll", val: "scroll" },
  { label: "Auto", val: "auto" },
];

const Z_PRESETS = [
  { label: "Auto", val: "auto" },
  { label: "0", val: "0" },
  { label: "10", val: "10" },
  { label: "20", val: "20" },
  { label: "30", val: "30" },
  { label: "50", val: "50" },
];

type Unit = "px" | "%" | "vw" | "vh" | "rem" | "em" | "pt";

const INSET_ALLOWED_UNITS: Unit[] = ["px", "%", "vw", "vh", "rem", "em", "pt"];

const RANGE_BY_UNIT: Record<Unit, { min: number; max: number; step: number }> = {
  px: { min: -1000, max: 2000, step: 1 },
  "%": { min: -100, max: 100, step: 1 },
  vw: { min: -100, max: 100, step: 1 },
  vh: { min: -100, max: 100, step: 1 },
  rem: { min: -50, max: 100, step: 0.25 },
  em: { min: -50, max: 100, step: 0.25 },
  pt: { min: -750, max: 1500, step: 1 },
};

interface InsetValue {
  amount: number;
  unit: Unit;
}

function parseInsetValue(raw: string, defaultUnit: Unit = "px"): InsetValue {
  if (!raw || raw === "auto") return { amount: 0, unit: defaultUnit };
  const match = raw.match(/^([-\d.]+)\s*(px|%|vw|vh|rem|em|pt)?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const u = (match[2]?.toLowerCase() as Unit) || defaultUnit;
    return { amount: isNaN(num) ? 0 : num, unit: u };
  }
  const bareNum = parseFloat(raw);
  return { amount: isNaN(bareNum) ? 0 : bareNum, unit: defaultUnit };
}

export default function PositionGroup({
  element,
  structuralPath,
  theme,
  viewport = "desktop",
  onEdit,
}: PositionGroupProps) {
  const [position, setPosition] = useState("static");
  const [zIndex, setZIndex] = useState("auto");
  const [overflow, setOverflow] = useState("visible");
  const [top, setTop] = useState<InsetValue>({ amount: 0, unit: "px" });
  const [right, setRight] = useState<InsetValue>({ amount: 0, unit: "px" });
  const [bottom, setBottom] = useState<InsetValue>({ amount: 0, unit: "px" });
  const [left, setLeft] = useState<InsetValue>({ amount: 0, unit: "px" });

  useEffect(() => {
    if (!element) return;
    const win = element.ownerDocument?.defaultView || window;
    const computed = win.getComputedStyle(element);

    function getVal(prop: string): string {
      if (structuralPath) {
        const resp = getResponsivePropertyInfo(element!, structuralPath, prop, viewport);
        if (resp.value) return resp.value;
      }
      return readCurrentValue(element!, prop, theme) || "";
    }

    const pos = getVal("position") || computed.position || "static";
    setPosition(pos);

    const z = getVal("z-index") || computed.zIndex || "auto";
    setZIndex(z);

    const ov = getVal("overflow") || computed.overflow || "visible";
    setOverflow(ov);

    const rawT = getVal("top");
    setTop(parseInsetValue(rawT));

    const rawR = getVal("right");
    setRight(parseInsetValue(rawR));

    const rawB = getVal("bottom");
    setBottom(parseInsetValue(rawB));

    const rawL = getVal("left");
    setLeft(parseInsetValue(rawL));
  }, [element, theme, viewport, structuralPath]);

  if (!element || !structuralPath) return null;

  function handlePositionChange(mode: string) {
    setPosition(mode);
    applyLiveStyle(element!, "position", mode, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "position", mode, theme, onEdit, undefined, undefined, viewport);
  }

  function handleZIndexChange(val: string) {
    setZIndex(val);
    applyLiveStyle(element!, "z-index", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "z-index", val, theme, onEdit, undefined, undefined, viewport);
  }

  function handleOverflowChange(val: string) {
    setOverflow(val);
    applyLiveStyle(element!, "overflow", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "overflow", val, theme, onEdit, undefined, undefined, viewport);
  }

  function commitInset(property: "top" | "right" | "bottom" | "left", amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    const valStr = `${amount}${unit}`;
    if (property === "top") setTop({ amount, unit });
    if (property === "right") setRight({ amount, unit });
    if (property === "bottom") setBottom({ amount, unit });
    if (property === "left") setLeft({ amount, unit });

    commitStyleChange(element!, structuralPath!, property, valStr, theme, onEdit, undefined, undefined, viewport);
  }

  function handlePinAll() {
    setTop({ amount: 0, unit: "px" });
    setRight({ amount: 0, unit: "px" });
    setBottom({ amount: 0, unit: "px" });
    setLeft({ amount: 0, unit: "px" });

    commitStyleChange(element!, structuralPath!, "top", "0px", theme, onEdit, undefined, undefined, viewport);
    commitStyleChange(element!, structuralPath!, "right", "0px", theme, onEdit, undefined, undefined, viewport);
    commitStyleChange(element!, structuralPath!, "bottom", "0px", theme, onEdit, undefined, undefined, viewport);
    commitStyleChange(element!, structuralPath!, "left", "0px", theme, onEdit, undefined, undefined, viewport);
  }

  const isPositioned = position !== "static";

  return (
    <div className="p-4 border-b border-slate-200 dark:border-gray-800 space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
        <Move className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        <span>Position & Layering</span>
      </div>

      {/* Position Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
          <span>Position Type</span>
          {position === "absolute" && (
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
              <Move className="w-3 h-3" /> Draggable on Canvas
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {POSITION_MODES.map((m) => (
            <button
              key={m.val}
              onClick={() => handlePositionChange(m.val)}
              className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                position === m.val
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "bg-slate-100 dark:bg-gray-900 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-gray-800 hover:bg-slate-200 dark:hover:bg-gray-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {position !== "absolute" && (
          <button
            type="button"
            onClick={() => handlePositionChange("absolute")}
            className="w-full mt-1.5 py-1 px-2 text-[11px] rounded-lg bg-indigo-50 dark:bg-indigo-600/15 hover:bg-indigo-100 dark:hover:bg-indigo-600/25 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Move className="w-3 h-3" />
            <span>Make Absolute &amp; Drag on Canvas</span>
          </button>
        )}
      </div>

      {/* Insets Pinning (Top, Right, Bottom, Left) */}
      {isPositioned && (
        <div className="p-3 bg-slate-50 dark:bg-gray-950/60 rounded-xl border border-slate-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Pin className="w-3 h-3" />
              <span>Offsets & Pinning</span>
            </div>
            <button
              onClick={handlePinAll}
              className="text-[10px] text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 hover:border-indigo-500/30 transition-colors cursor-pointer"
            >
              Pin All (0px)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-gray-400">Top</span>
              <ValueInput
                amount={top.amount}
                unit={top.unit}
                min={RANGE_BY_UNIT[top.unit]?.min ?? -500}
                max={RANGE_BY_UNIT[top.unit]?.max ?? 1500}
                step={RANGE_BY_UNIT[top.unit]?.step ?? 1}
                allowedUnits={INSET_ALLOWED_UNITS}
                property="top"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || top.unit;
                  setTop({ amount: amt, unit });
                  applyLiveStyle(element, "top", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={(amt, u) => commitInset("top", amt, u)}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-gray-400">Right</span>
              <ValueInput
                amount={right.amount}
                unit={right.unit}
                min={RANGE_BY_UNIT[right.unit]?.min ?? -500}
                max={RANGE_BY_UNIT[right.unit]?.max ?? 1500}
                step={RANGE_BY_UNIT[right.unit]?.step ?? 1}
                allowedUnits={INSET_ALLOWED_UNITS}
                property="right"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || right.unit;
                  setRight({ amount: amt, unit });
                  applyLiveStyle(element, "right", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={(amt, u) => commitInset("right", amt, u)}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-gray-400">Bottom</span>
              <ValueInput
                amount={bottom.amount}
                unit={bottom.unit}
                min={RANGE_BY_UNIT[bottom.unit]?.min ?? -500}
                max={RANGE_BY_UNIT[bottom.unit]?.max ?? 1500}
                step={RANGE_BY_UNIT[bottom.unit]?.step ?? 1}
                allowedUnits={INSET_ALLOWED_UNITS}
                property="bottom"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || bottom.unit;
                  setBottom({ amount: amt, unit });
                  applyLiveStyle(element, "bottom", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={(amt, u) => commitInset("bottom", amt, u)}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-gray-400">Left</span>
              <ValueInput
                amount={left.amount}
                unit={left.unit}
                min={RANGE_BY_UNIT[left.unit]?.min ?? -500}
                max={RANGE_BY_UNIT[left.unit]?.max ?? 1500}
                step={RANGE_BY_UNIT[left.unit]?.step ?? 1}
                allowedUnits={INSET_ALLOWED_UNITS}
                property="left"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || left.unit;
                  setLeft({ amount: amt, unit });
                  applyLiveStyle(element, "left", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={(amt, u) => commitInset("left", amt, u)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Z-Index Stacking */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-gray-400" />
            <span>Z-Index Layer</span>
          </span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400">{zIndex}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {Z_PRESETS.map((p) => (
            <button
              key={p.val}
              onClick={() => handleZIndexChange(p.val)}
              className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                zIndex === p.val
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "bg-slate-100 dark:bg-gray-900 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-gray-800 hover:bg-slate-200 dark:hover:bg-gray-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overflow Clipping */}
      <div className="space-y-1.5">
        <label className="text-xs text-slate-500 dark:text-gray-400 block">Overflow Behavior</label>
        <div className="grid grid-cols-4 gap-1">
          {OVERFLOW_MODES.map((o) => (
            <button
              key={o.val}
              onClick={() => handleOverflowChange(o.val)}
              className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                overflow === o.val
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "bg-slate-100 dark:bg-gray-900 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-gray-800 hover:bg-slate-200 dark:hover:bg-gray-800"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
