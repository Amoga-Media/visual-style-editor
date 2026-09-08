import { useEffect, useRef, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { getResponsivePropertyInfo } from "@/lib/dom/responsive-style-engine";
import ColorPicker from "./ColorPicker";
import ValueInput from "./ValueInput";
import { Shapes, Palette, Paintbrush } from "lucide-react";

interface SvgGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

export default function SvgGroup({
  element,
  structuralPath,
  theme,
  viewport = "desktop",
  onEdit,
}: SvgGroupProps) {
  const [fillColor, setFillColor] = useState<string>("currentColor");
  const [strokeColor, setStrokeColor] = useState<string>("transparent");
  const [strokeWidth, setStrokeWidth] = useState<{ amount: number; unit: "px" }>({ amount: 0, unit: "px" });

  const baselineFillRef = useRef<string>("");
  const baselineStrokeRef = useRef<string>("");
  const baselineStrokeWidthRef = useRef<string>("");
  const prevElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!element) return;
    const isNew = element !== prevElementRef.current;
    prevElementRef.current = element;

    const win = element.ownerDocument?.defaultView || window;
    const computed = win.getComputedStyle(element);

    function getVal(prop: string): string {
      if (structuralPath) {
        const resp = getResponsivePropertyInfo(element!, structuralPath, prop, viewport);
        if (resp.value) return resp.value;
      }
      return readCurrentValue(element!, prop as any, theme) || "";
    }

    const rawFill = getVal("fill") || (element as SVGElement).getAttribute?.("fill") || computed.fill || "currentColor";
    setFillColor(rawFill);
    if (isNew) baselineFillRef.current = rawFill;

    const rawStroke = getVal("stroke") || (element as SVGElement).getAttribute?.("stroke") || computed.stroke || "none";
    setStrokeColor(rawStroke === "none" ? "transparent" : rawStroke);
    if (isNew) baselineStrokeRef.current = rawStroke === "none" ? "transparent" : rawStroke;

    const rawSW = getVal("stroke-width") || (element as SVGElement).getAttribute?.("stroke-width") || computed.strokeWidth || "0px";
    const parsedSW = parseFloat(rawSW) || 0;
    setStrokeWidth({ amount: parsedSW, unit: "px" });
    if (isNew) baselineStrokeWidthRef.current = `${parsedSW}px`;
  }, [element, theme, viewport, structuralPath]);

  if (!element || !structuralPath) return null;

  function handleFillChange(val: string) {
    setFillColor(val);
    applyLiveStyle(element!, "fill" as any, val, theme, undefined, viewport, structuralPath!);
  }

  function commitFillChange(val: string) {
    setFillColor(val);
    commitStyleChange(
      element!,
      structuralPath!,
      "fill" as any,
      val,
      theme,
      onEdit,
      baselineFillRef.current,
      undefined,
      viewport
    );
  }

  function handleStrokeChange(val: string) {
    setStrokeColor(val);
    applyLiveStyle(element!, "stroke" as any, val, theme, undefined, viewport, structuralPath!);
  }

  function commitStrokeChange(val: string) {
    setStrokeColor(val);
    commitStyleChange(
      element!,
      structuralPath!,
      "stroke" as any,
      val,
      theme,
      onEdit,
      baselineStrokeRef.current,
      undefined,
      viewport
    );
  }

  function commitStrokeWidth(amount: number) {
    setStrokeWidth({ amount, unit: "px" });
    const valStr = `${amount}px`;
    applyLiveStyle(element!, "stroke-width" as any, valStr, theme, undefined, viewport, structuralPath!);
    commitStyleChange(
      element!,
      structuralPath!,
      "stroke-width" as any,
      valStr,
      theme,
      onEdit,
      baselineStrokeWidthRef.current,
      undefined,
      viewport
    );
  }

  return (
    <div className="p-4 border-b border-slate-200 dark:border-[#222] space-y-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
        <Shapes className="w-3.5 h-3.5 text-indigo-500" />
        <span>SVG Vector Styling</span>
      </div>

      {/* Fill Color */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
            <span>Fill Color</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setFillColor("currentColor");
              applyLiveStyle(element!, "fill" as any, "currentColor", theme, undefined, viewport, structuralPath!);
              commitStyleChange(element!, structuralPath!, "fill" as any, "currentColor", theme, onEdit, baselineFillRef.current, undefined, viewport);
            }}
            className="text-[10px] text-indigo-500 hover:text-indigo-400 font-medium cursor-pointer"
          >
            Use currentColor
          </button>
        </div>
        <ColorPicker
          value={fillColor}
          onChange={handleFillChange}
          onCommit={commitFillChange}
          allowTransparent={true}
        />
      </div>

      {/* Stroke Color */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Paintbrush className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
            <span>Stroke Color</span>
          </span>
        </div>
        <ColorPicker
          value={strokeColor}
          onChange={handleStrokeChange}
          onCommit={commitStrokeChange}
          allowTransparent={true}
        />
      </div>

      {/* Stroke Width */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300">
          <span>Stroke Width</span>
          <ValueInput
            amount={strokeWidth.amount}
            unit={strokeWidth.unit}
            min={0}
            max={32}
            step={0.5}
            allowedUnits={["px"]}
            property="stroke-width"
            element={element}
            viewport={viewport}
            onChange={(amt) => {
              setStrokeWidth({ amount: amt, unit: "px" });
              applyLiveStyle(element, "stroke-width" as any, `${amt}px`, theme, undefined, viewport, structuralPath!);
            }}
            onCommit={commitStrokeWidth}
          />
        </div>
        <input
          type="range"
          min={0}
          max={16}
          step={0.5}
          value={strokeWidth.amount}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setStrokeWidth({ amount: val, unit: "px" });
            applyLiveStyle(element, "stroke-width" as any, `${val}px`, theme, undefined, viewport, structuralPath!);
          }}
          onPointerUp={() => commitStrokeWidth(strokeWidth.amount)}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
