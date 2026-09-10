import { useEffect, useRef, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { getResponsivePropertyInfo } from "@/lib/dom/responsive-style-engine";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";
import ColorPicker from "./ColorPicker";
import ValueInput from "./ValueInput";
import { Shapes, Palette, Paintbrush, Sparkles } from "lucide-react";

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
  const [iconColor, setIconColor] = useState<string>("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState<{ amount: number; unit: "px" }>({ amount: 0, unit: "px" });

  const baselineFillRef = useRef<string>("");
  const baselineStrokeRef = useRef<string>("");
  const baselineIconColorRef = useRef<string>("");
  const baselineStrokeWidthRef = useRef<string>("");
  const prevElementRef = useRef<Element | null>(null);

  const parentSvg = element ? (element.tagName.toLowerCase() === "svg" ? element : element.closest("svg")) : null;
  const isNestedInSvg = !!parentSvg && parentSvg !== element;

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
    setFillColor(rawFill === "none" ? "none" : rawFill);
    if (isNew) baselineFillRef.current = rawFill;

    const rawStroke = getVal("stroke") || (element as SVGElement).getAttribute?.("stroke") || computed.stroke || "none";
    setStrokeColor(rawStroke === "none" ? "transparent" : rawStroke);
    if (isNew) baselineStrokeRef.current = rawStroke === "none" ? "transparent" : rawStroke;

    const svgComputed = parentSvg ? win.getComputedStyle(parentSvg) : computed;
    const rawIconColor = svgComputed.color || "#ffffff";
    setIconColor(rawIconColor);
    if (isNew) baselineIconColorRef.current = rawIconColor;

    const rawSW = getVal("stroke-width") || (element as SVGElement).getAttribute?.("stroke-width") || computed.strokeWidth || "0px";
    const parsedSW = parseFloat(rawSW) || 0;
    setStrokeWidth({ amount: parsedSW, unit: "px" });
    if (isNew) baselineStrokeWidthRef.current = `${parsedSW}px`;
  }, [element, theme, viewport, structuralPath, parentSvg]);

  if (!element || !structuralPath) return null;

  const usesCurrentColor =
    fillColor === "currentColor" ||
    strokeColor === "currentColor" ||
    element.getAttribute("fill") === "currentColor" ||
    element.getAttribute("stroke") === "currentColor" ||
    (parentSvg && (parentSvg.getAttribute("stroke") === "currentColor" || parentSvg.getAttribute("fill") === "currentColor"));

  function handleFillChange(val: string) {
    const finalVal = val === "transparent" ? "none" : val;
    setFillColor(finalVal);
    if (element) {
      if (element.hasAttribute("fill") || finalVal === "none") {
        element.setAttribute("fill", finalVal);
      }
      applyLiveStyle(element, "fill" as any, finalVal, theme, undefined, viewport, structuralPath!);
    }
  }

  function commitFillChange(val: string) {
    const finalVal = val === "transparent" ? "none" : val;
    setFillColor(finalVal);
    if (!element || !structuralPath) return;

    if (element.hasAttribute("fill")) {
      const oldVal = baselineFillRef.current;
      element.setAttribute("fill", finalVal);
      onEdit?.({
        kind: "attribute",
        structuralPath,
        property: "fill",
        attributeName: "fill",
        oldValue: oldVal,
        newValue: finalVal,
        timestamp: new Date().toISOString(),
      });
      baselineFillRef.current = finalVal;
    } else {
      commitStyleChange(
        element,
        structuralPath,
        "fill" as any,
        finalVal,
        theme,
        onEdit,
        baselineFillRef.current,
        undefined,
        viewport
      );
      baselineFillRef.current = finalVal;
    }
  }

  function handleStrokeChange(val: string) {
    setStrokeColor(val);
    if (element) {
      if (element.hasAttribute("stroke")) {
        element.setAttribute("stroke", val);
      }
      applyLiveStyle(element, "stroke" as any, val, theme, undefined, viewport, structuralPath!);
    }
  }

  function commitStrokeChange(val: string) {
    setStrokeColor(val);
    if (!element || !structuralPath) return;

    if (element.hasAttribute("stroke")) {
      const oldVal = baselineStrokeRef.current;
      element.setAttribute("stroke", val);
      onEdit?.({
        kind: "attribute",
        structuralPath,
        property: "stroke",
        attributeName: "stroke",
        oldValue: oldVal,
        newValue: val,
        timestamp: new Date().toISOString(),
      });
      baselineStrokeRef.current = val;
    } else {
      commitStyleChange(
        element,
        structuralPath,
        "stroke" as any,
        val,
        theme,
        onEdit,
        baselineStrokeRef.current,
        undefined,
        viewport
      );
      baselineStrokeRef.current = val;
    }
  }

  function handleIconColorChange(val: string) {
    setIconColor(val);
    if (parentSvg) {
      const svgPath = computeStructuralPath(parentSvg, domAdapter);
      applyLiveStyle(parentSvg, "text-color", val, theme, undefined, viewport, svgPath);
    }
  }

  function commitIconColorChange(val: string) {
    setIconColor(val);
    if (parentSvg) {
      const svgPath = computeStructuralPath(parentSvg, domAdapter);
      commitStyleChange(
        parentSvg,
        svgPath,
        "text-color",
        val,
        theme,
        onEdit,
        baselineIconColorRef.current,
        undefined,
        viewport
      );
      baselineIconColorRef.current = val;
    }
  }

  function commitStrokeWidth(amount: number) {
    setStrokeWidth({ amount, unit: "px" });
    const valStr = `${amount}px`;
    if (element?.hasAttribute("stroke-width")) {
      element.setAttribute("stroke-width", String(amount));
      onEdit?.({
        kind: "attribute",
        structuralPath: structuralPath!,
        property: "stroke-width",
        attributeName: "stroke-width",
        oldValue: baselineStrokeWidthRef.current,
        newValue: String(amount),
        timestamp: new Date().toISOString(),
      });
      baselineStrokeWidthRef.current = `${amount}px`;
    } else {
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
      baselineStrokeWidthRef.current = valStr;
    }
  }

  return (
    <div className="p-4 border-b border-[#262626] space-y-4">
      {/* Icon Color (currentColor source) - Safe for icons in buttons/links */}
      {usesCurrentColor && parentSvg && (
        <div className="p-2.5 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-200 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Icon Inherited Color (currentColor)</span>
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            Updates color on the &lt;svg&gt; icon directly without modifying surrounding container text.
          </p>
          <ColorPicker
            value={iconColor}
            onChange={handleIconColorChange}
            onCommit={commitIconColorChange}
            allowTransparent={false}
          />
        </div>
      )}

      {/* Fill Color */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-zinc-400" />
            <span>Fill Color</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Set fill color to none"
              onClick={() => {
                handleFillChange("none");
                commitFillChange("none");
              }}
              className={`text-[10px] cursor-pointer font-medium ${
                fillColor === "none" || fillColor === "transparent"
                  ? "text-rose-400 font-semibold"
                  : "text-zinc-400 hover:text-rose-400"
              }`}
            >
              Set none
            </button>
            <button
              type="button"
              aria-label="Set fill color to currentColor"
              onClick={() => {
                handleFillChange("currentColor");
                commitFillChange("currentColor");
              }}
              className="text-[10px] text-[#0099ff] hover:text-[#33adff] font-medium cursor-pointer"
            >
              Use currentColor
            </button>
          </div>
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
        <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Paintbrush className="w-3 h-3 text-zinc-400" />
            <span>Stroke Color</span>
          </span>
          <button
            type="button"
            aria-label="Set stroke color to currentColor"
            onClick={() => {
              handleStrokeChange("currentColor");
              commitStrokeChange("currentColor");
            }}
            className="text-[10px] text-[#0099ff] hover:text-[#33adff] font-medium cursor-pointer"
          >
            Use currentColor
          </button>
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
        <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
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
          className="w-full accent-[#0099ff] cursor-pointer"
        />
      </div>

      {/* SVG / Icon Scale & Size Presets */}
      <div className="space-y-2 pt-2 border-t border-[#262626]">
        <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Shapes className="w-3.5 h-3.5 text-zinc-400" />
            <span>Icon Size / Scale</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Quick Preset</span>
        </div>

        {/* Quick Size Presets */}
        <div className="grid grid-cols-6 gap-1">
          {[16, 20, 24, 32, 48, 64].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                const target = parentSvg || element;
                if (!target) return;
                applyLiveStyle(target, "width", `${size}px`, theme, undefined, viewport, structuralPath!);
                applyLiveStyle(target, "height", `${size}px`, theme, undefined, viewport, structuralPath!);
                commitStyleChange(target, structuralPath!, "width", `${size}px`, theme, onEdit, undefined, undefined, viewport);
                commitStyleChange(target, structuralPath!, "height", `${size}px`, theme, onEdit, undefined, undefined, viewport);
              }}
              className="py-1 text-[11px] font-mono rounded bg-[#141414] hover:bg-[#1c1c1c] text-zinc-400 hover:text-white border border-[#262626] hover:border-[#0099ff]/50 transition-all cursor-pointer text-center"
            >
              {size}px
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
