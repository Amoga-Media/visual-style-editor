import { useEffect, useState } from "react";
import type { EditableProperty, EditRecord, ThemeMap } from "@/types";
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
      return readCurrentValue(element!, prop as EditableProperty, theme) || "";
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

  const win = element.ownerDocument?.defaultView || window;
  const parentEl = element.parentElement;
  const isParentStatic =
    parentEl &&
    parentEl.tagName.toLowerCase() !== "body" &&
    parentEl.tagName.toLowerCase() !== "html" &&
    win.getComputedStyle(parentEl).position === "static";

  function handlePositionChange(mode: string) {
    if (position === "static" && mode === "absolute") {
      // Jump-free conversion: preserve rendered offsets
      const targetEl = element as HTMLElement;
      const currentLeft = targetEl.offsetLeft || 0;
      const currentTop = targetEl.offsetTop || 0;

      setPosition(mode);
      applyLiveStyle(element!, "position", mode, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "position", mode, theme, onEdit, undefined, undefined, viewport);

      setLeft({ amount: currentLeft, unit: "px" });
      setTop({ amount: currentTop, unit: "px" });
      applyLiveStyle(element!, "left", `${currentLeft}px`, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "left", `${currentLeft}px`, theme, onEdit, undefined, undefined, viewport);
      applyLiveStyle(element!, "top", `${currentTop}px`, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "top", `${currentTop}px`, theme, onEdit, undefined, undefined, viewport);
      return;
    }

    if (position === "static" && mode === "relative") {
      // Relative switch: elements stay in place with 0px offsets
      setPosition(mode);
      applyLiveStyle(element!, "position", mode, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "position", mode, theme, onEdit, undefined, undefined, viewport);
      return;
    }

    setPosition(mode);
    applyLiveStyle(element!, "position", mode, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "position", mode, theme, onEdit, undefined, undefined, viewport);
  }

  function handleMakeParentRelative() {
    if (!parentEl) return;
    (parentEl as HTMLElement).style.position = "relative";
    if (theme.mode !== "none") {
      parentEl.classList.add("relative");
    }
    // Force re-render to update warning
    setPosition((p) => p);
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

  function pinTo(mode: string) {
    if (!element || !structuralPath) return;

    // 1. Ensure position is absolute (or sticky for sticky-top)
    if (mode === "sticky-top") {
      setPosition("sticky");
      applyLiveStyle(element, "position", "sticky", theme, undefined, viewport, structuralPath);
      commitStyleChange(element, structuralPath, "position", "sticky", theme, onEdit, undefined, undefined, viewport);
      setTop({ amount: 0, unit: "px" });
      applyLiveStyle(element, "top", "0px", theme, undefined, viewport, structuralPath);
      commitStyleChange(element, structuralPath, "top", "0px", theme, onEdit, undefined, undefined, viewport);
      setZIndex("50");
      applyLiveStyle(element, "z-index", "50", theme, undefined, viewport, structuralPath);
      commitStyleChange(element, structuralPath, "z-index", "50", theme, onEdit, undefined, undefined, viewport);
      return;
    }

    if (position === "static") {
      setPosition("absolute");
      applyLiveStyle(element, "position", "absolute", theme, undefined, viewport, structuralPath);
      commitStyleChange(element, structuralPath, "position", "absolute", theme, onEdit, undefined, undefined, viewport);

      // Auto-promote static parent to relative so child anchors inside its container
      if (parentEl && parentEl.tagName.toLowerCase() !== "body" && parentEl.tagName.toLowerCase() !== "html") {
        if (win.getComputedStyle(parentEl).position === "static") {
          (parentEl as HTMLElement).style.position = "relative";
          if (theme.mode !== "none") parentEl.classList.add("relative");
        }
      }
    }

    // 2. Helper to set insets & clear conflicting offsets
    const applyInsets = (insets: { top?: string; right?: string; bottom?: string; left?: string; transform?: string; width?: string; height?: string }) => {
      if (insets.top !== undefined) {
        setTop(parseInsetValue(insets.top));
        applyLiveStyle(element, "top", insets.top, theme, undefined, viewport, structuralPath);
        commitStyleChange(element, structuralPath, "top", insets.top, theme, onEdit, undefined, undefined, viewport);
      }
      if (insets.right !== undefined) {
        setRight(parseInsetValue(insets.right));
        applyLiveStyle(element, "right", insets.right, theme, undefined, viewport, structuralPath);
        commitStyleChange(element, structuralPath, "right", insets.right, theme, onEdit, undefined, undefined, viewport);
      }
      if (insets.bottom !== undefined) {
        setBottom(parseInsetValue(insets.bottom));
        applyLiveStyle(element, "bottom", insets.bottom, theme, undefined, viewport, structuralPath);
        commitStyleChange(element, structuralPath, "bottom", insets.bottom, theme, onEdit, undefined, undefined, viewport);
      }
      if (insets.left !== undefined) {
        setLeft(parseInsetValue(insets.left));
        applyLiveStyle(element, "left", insets.left, theme, undefined, viewport, structuralPath);
        commitStyleChange(element, structuralPath, "left", insets.left, theme, onEdit, undefined, undefined, viewport);
      }
      if (insets.transform !== undefined) {
        (element as HTMLElement).style.transform = insets.transform;
      }
      if (insets.width !== undefined) {
        applyLiveStyle(element, "width", insets.width, theme, undefined, viewport, structuralPath);
        commitStyleChange(element, structuralPath, "width", insets.width, theme, onEdit, undefined, undefined, viewport);
      }
      if (insets.height !== undefined) {
        applyLiveStyle(element, "height", insets.height, theme, undefined, viewport, structuralPath);
        commitStyleChange(element, structuralPath, "height", insets.height, theme, onEdit, undefined, undefined, viewport);
      }
    };

    switch (mode) {
      case "top-left":
        applyInsets({ top: "0px", left: "0px", right: "auto", bottom: "auto", transform: "" });
        break;
      case "top-center":
      case "top":
        applyInsets({ top: "0px", left: "50%", right: "auto", bottom: "auto", transform: "translateX(-50%)" });
        break;
      case "top-right":
        applyInsets({ top: "0px", right: "0px", left: "auto", bottom: "auto", transform: "" });
        break;
      case "center-left":
      case "left":
        applyInsets({ top: "50%", left: "0px", right: "auto", bottom: "auto", transform: "translateY(-50%)" });
        break;
      case "center":
      case "middle":
        applyInsets({ top: "50%", left: "50%", right: "auto", bottom: "auto", transform: "translate(-50%, -50%)" });
        break;
      case "center-right":
      case "right":
        applyInsets({ top: "50%", right: "0px", left: "auto", bottom: "auto", transform: "translateY(-50%)" });
        break;
      case "bottom-left":
        applyInsets({ bottom: "0px", left: "0px", top: "auto", right: "auto", transform: "" });
        break;
      case "bottom-center":
      case "bottom":
        applyInsets({ bottom: "0px", left: "50%", top: "auto", right: "auto", transform: "translateX(-50%)" });
        break;
      case "bottom-right":
        applyInsets({ bottom: "0px", right: "0px", top: "auto", left: "auto", transform: "" });
        break;
      case "stretch-h":
        applyInsets({ left: "0px", right: "0px", width: "auto", transform: "" });
        break;
      case "stretch-v":
        applyInsets({ top: "0px", bottom: "0px", height: "auto", transform: "" });
        break;
      case "all":
      case "fill":
      case "stretch-all":
        applyInsets({ top: "0px", right: "0px", bottom: "0px", left: "0px", width: "100%", height: "100%", transform: "" });
        break;
    }
  }

  const isPositioned = position !== "static";

  return (
    <div className="p-3.5 space-y-3.5">
      {/* Position Selector */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium">
          <span>Position Type</span>
          {position === "absolute" && (
            <span className="text-[10px] text-[#0099ff] font-medium flex items-center gap-1">
              <Move className="w-3 h-3" /> Draggable on Canvas
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {POSITION_MODES.map((m) => (
            <button
              key={m.val}
              type="button"
              onClick={() => handlePositionChange(m.val)}
              aria-label={`Position ${m.label}`}
              className={`py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
                position === m.val
                  ? "bg-[#0099ff] text-white font-semibold shadow-2xs"
                  : "bg-slate-100 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#262626] hover:bg-slate-200 dark:hover:bg-[#1c1c1c]"
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
            className="w-full mt-1.5 py-1 px-2 text-[11px] rounded-lg bg-[#0099ff]/15 hover:bg-[#0099ff]/25 border border-[#0099ff]/30 text-[#0099ff] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Move className="w-3 h-3" />
            <span>Make Absolute &amp; Drag on Canvas</span>
          </button>
        )}
      </div>

      {/* Parent Positioning Context Advisory (BUG-027) */}
      {position === "absolute" && isParentStatic && (
        <div className="p-2.5 bg-[#0099ff]/10 border border-[#0099ff]/30 rounded-xl space-y-1.5 text-xs">
          <div className="font-medium text-[#0099ff] text-[11px] flex items-center justify-between">
            <span>ℹ️ Parent container is static</span>
            <button
              type="button"
              aria-label="Make parent container relative position"
              onClick={handleMakeParentRelative}
              className="px-2 py-0.5 rounded bg-[#0099ff] text-white text-[10px] font-medium hover:bg-[#33adff] cursor-pointer"
            >
              Make Parent Relative
            </button>
          </div>
          <p className="text-[10px] text-zinc-400">
            Absolute offsets currently resolve against the nearest positioned ancestor. Making the parent relative binds offsets to the parent container.
          </p>
        </div>
      )}

      {/* Framer-Style Pinning & Constraints Matrix */}
      <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#262626] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#0099ff]">
            <Pin className="w-3 h-3" />
            <span>Pinning &amp; Constraints (Framer)</span>
          </div>
          <button
            type="button"
            aria-label="Pin all offsets to 0px"
            onClick={() => pinTo("all")}
            className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] hover:border-[#0099ff]/30 transition-colors cursor-pointer"
          >
            Fill All (0px)
          </button>
        </div>

          {/* 3x3 Pinning Matrix Grid */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">Pin Anchor Position</label>
            <div className="grid grid-cols-3 gap-1 max-w-[200px] mx-auto p-1.5 bg-slate-100 dark:bg-[#0c0c0c] rounded-lg border border-slate-200 dark:border-[#222222]">
              {[
                { id: "top-left", label: "↖ Top-L" },
                { id: "top-center", label: "↑ Top-C" },
                { id: "top-right", label: "↗ Top-R" },
                { id: "center-left", label: "← Left" },
                { id: "all", label: "✦ Fill" },
                { id: "center-right", label: "→ Right" },
                { id: "bottom-left", label: "↙ Bot-L" },
                { id: "bottom-center", label: "↓ Bot-C" },
                { id: "bottom-right", label: "↘ Bot-R" },
              ].map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => pinTo(pin.id)}
                  className="py-1 px-1 text-[9px] font-mono rounded bg-white dark:bg-[#1a1a1a] hover:bg-[#0099ff]/15 hover:text-[#0099ff] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#2a2a2a] transition-colors cursor-pointer text-center font-medium"
                >
                  {pin.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stretch & Sticky Presets */}
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <button
              type="button"
              aria-label="Stretch horizontal"
              onClick={() => pinTo("stretch-h")}
              className="py-1 px-1 rounded bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-[#0099ff] font-medium cursor-pointer text-center"
            >
              ↔ Stretch H
            </button>
            <button
              type="button"
              aria-label="Stretch vertical"
              onClick={() => pinTo("stretch-v")}
              className="py-1 px-1 rounded bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-[#0099ff] font-medium cursor-pointer text-center"
            >
              ↕ Stretch V
            </button>
            <button
              type="button"
              aria-label="Sticky top header"
              onClick={() => {
                handlePositionChange("sticky");
                pinTo("top");
                handleZIndexChange("50");
              }}
              className="py-1 px-1 rounded bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-[#0099ff] font-medium cursor-pointer text-center"
            >
              📌 Sticky Top
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400">Top</span>
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
              <span className="text-[11px] text-zinc-400">Right</span>
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
              <span className="text-[11px] text-zinc-400">Bottom</span>
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
              <span className="text-[11px] text-zinc-400">Left</span>
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

      {/* Z-Index Stacking */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Z-Index Layer</span>
          </span>
          <span className="font-mono text-[#0099ff] font-semibold">{zIndex}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {Z_PRESETS.map((p) => (
            <button
              key={p.val}
              type="button"
              aria-label={`Z-Index preset ${p.label}`}
              onClick={() => handleZIndexChange(p.val)}
              className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                zIndex === p.val
                  ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                  : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overflow Clipping */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-400 block font-medium">Overflow Behavior</label>
        <div className="grid grid-cols-4 gap-1">
          {OVERFLOW_MODES.map((o) => (
            <button
              key={o.val}
              type="button"
              aria-label={`Overflow behavior ${o.label}`}
              onClick={() => handleOverflowChange(o.val)}
              className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                overflow === o.val
                  ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                  : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
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
