import { useEffect, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { LayoutGrid, Rows, Columns, AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignHorizontalSpaceBetween } from "lucide-react";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { getResponsivePropertyInfo } from "@/lib/dom/responsive-style-engine";
import ValueInput from "./ValueInput";

interface FlexGridGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

type Unit = "px" | "%" | "rem" | "em" | "vw" | "pt";

interface AxisValue {
  amount: number;
  unit: Unit;
}

const GAP_ALLOWED_UNITS: Unit[] = ["px", "%", "rem", "em", "vw", "pt"];

const RANGE_BY_GAP_UNIT: Record<Unit, { min: number; max: number; step: number }> = {
  px: { min: 0, max: 192, step: 1 },
  "%": { min: 0, max: 50, step: 1 },
  rem: { min: 0, max: 12, step: 0.125 },
  em: { min: 0, max: 12, step: 0.125 },
  vw: { min: 0, max: 25, step: 0.5 },
  pt: { min: 0, max: 150, step: 1 },
};

function parseGapValue(raw: string, defaultUnit: Unit = "px"): AxisValue {
  if (!raw || raw === "normal" || raw === "auto") return { amount: 0, unit: defaultUnit };
  const match = raw.match(/^([-\d.]+)\s*(px|%|rem|em|vw|pt)?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const u = (match[2]?.toLowerCase() as Unit) || defaultUnit;
    return { amount: isNaN(num) ? 0 : num, unit: u };
  }
  const bareNum = parseFloat(raw);
  return { amount: isNaN(bareNum) ? 0 : bareNum, unit: defaultUnit };
}

export default function FlexGridGroup({
  element,
  structuralPath,
  theme,
  viewport = "desktop",
  onEdit,
}: FlexGridGroupProps) {
  const [display, setDisplay] = useState("block");
  const [flexDirection, setFlexDirection] = useState("row");
  const [justifyContent, setJustifyContent] = useState("start");
  const [alignItems, setAlignItems] = useState("start");
  const [gap, setGap] = useState<AxisValue>({ amount: 0, unit: "px" });

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

    setDisplay(getVal("display") || computed.display || "block");
    setFlexDirection(getVal("flex-direction") || computed.flexDirection || "row");
    setJustifyContent(getVal("justify-content") || computed.justifyContent || "start");
    setAlignItems(getVal("align-items") || computed.alignItems || "start");

    const rawGap = getVal("gap") || computed.gap;
    const parsedGap = parseGapValue(rawGap);
    setGap(parsedGap);
  }, [element, theme, viewport, structuralPath]);

  if (!element || !structuralPath) return null;

  function handleDisplayChange(newDisplay: string) {
    setDisplay(newDisplay);
    if (theme.mode !== "none" && viewport === "desktop") {
      const oldClassList = Array.from(element!.classList);
      const filtered = oldClassList.filter((c) => !["block", "flex", "grid", "inline-block", "hidden"].includes(c));
      if (newDisplay !== "block") filtered.push(newDisplay);
      element!.className = filtered.join(" ");

      onEdit?.({
        kind: "class",
        structuralPath: structuralPath!,
        property: "display" as any,
        oldClassList,
        newClassList: filtered,
        viewport,
        timestamp: new Date().toISOString(),
      });
    } else {
      applyLiveStyle(element!, "display", newDisplay, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "display", newDisplay, theme, onEdit, undefined, undefined, viewport);
    }
  }

  function handleJustifyChange(newJustify: string) {
    setJustifyContent(newJustify);
    if (theme.mode !== "none" && viewport === "desktop") {
      const oldClassList = Array.from(element!.classList);
      const filtered = oldClassList.filter((c) => !c.startsWith("justify-"));
      filtered.push(`justify-${newJustify}`);
      element!.className = filtered.join(" ");

      onEdit?.({
        kind: "class",
        structuralPath: structuralPath!,
        property: "justify-content" as any,
        oldClassList,
        newClassList: filtered,
        viewport,
        timestamp: new Date().toISOString(),
      });
    } else {
      applyLiveStyle(element!, "justify-content", newJustify, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "justify-content", newJustify, theme, onEdit, undefined, undefined, viewport);
    }
  }

  function handleAlignChange(newAlign: string) {
    setAlignItems(newAlign);
    if (theme.mode !== "none" && viewport === "desktop") {
      const oldClassList = Array.from(element!.classList);
      const filtered = oldClassList.filter((c) => !c.startsWith("items-"));
      filtered.push(`items-${newAlign}`);
      element!.className = filtered.join(" ");

      onEdit?.({
        kind: "class",
        structuralPath: structuralPath!,
        property: "align-items" as any,
        oldClassList,
        newClassList: filtered,
        viewport,
        timestamp: new Date().toISOString(),
      });
    } else {
      applyLiveStyle(element!, "align-items", newAlign, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "align-items", newAlign, theme, onEdit, undefined, undefined, viewport);
    }
  }

  function handleGapChange(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || gap.unit;
    setGap({ amount, unit });
    applyLiveStyle(element!, "gap", `${amount}${unit}`, theme, undefined, viewport, structuralPath!);
  }

  function handleGapCommit(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || gap.unit;
    setGap({ amount, unit });
    commitStyleChange(
      element!,
      structuralPath!,
      "gap",
      `${amount}${unit}`,
      theme,
      onEdit,
      undefined,
      undefined,
      viewport
    );
  }

  const isFlexOrGrid = display.includes("flex") || display.includes("grid");

  return (
    <div className="p-4 border-b border-gray-800 space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
        <span>Layout & Flow</span>
      </div>

      {/* Display Selector */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 block">Display Mode</label>
        <div className="grid grid-cols-4 gap-1">
          {["block", "flex", "grid", "inline-block"].map((d) => (
            <button
              key={d}
              onClick={() => handleDisplayChange(d)}
              className={`py-1 text-xs rounded transition-all cursor-pointer ${
                display === d
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {isFlexOrGrid && (
        <>
          {/* Flex Justify / Align */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Justify</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: "Start", val: "start" },
                  { label: "Center", val: "center" },
                  { label: "Between", val: "between" },
                ].map((j) => (
                  <button
                    key={j.val}
                    onClick={() => handleJustifyChange(j.val)}
                    className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                      justifyContent.includes(j.val)
                        ? "bg-indigo-600 text-white font-medium shadow-sm"
                        : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                    }`}
                  >
                    {j.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Align</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: "Start", val: "start" },
                  { label: "Center", val: "center" },
                  { label: "End", val: "end" },
                ].map((a) => (
                  <button
                    key={a.val}
                    onClick={() => handleAlignChange(a.val)}
                    className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                      alignItems.includes(a.val)
                        ? "bg-indigo-600 text-white font-medium shadow-sm"
                        : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gap */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span>Gap Spacing</span>
              <ValueInput
                amount={gap.amount}
                unit={gap.unit}
                min={RANGE_BY_GAP_UNIT[gap.unit]?.min ?? 0}
                max={RANGE_BY_GAP_UNIT[gap.unit]?.max ?? 192}
                step={RANGE_BY_GAP_UNIT[gap.unit]?.step ?? 1}
                allowedUnits={GAP_ALLOWED_UNITS}
                property="gap"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || gap.unit;
                  setGap({ amount: amt, unit });
                  applyLiveStyle(element!, "gap", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={(amt, u) => handleGapCommit(amt, u)}
              />
            </div>
            <input
              type="range"
              min={RANGE_BY_GAP_UNIT[gap.unit]?.min ?? 0}
              max={RANGE_BY_GAP_UNIT[gap.unit]?.max ?? 64}
              step={RANGE_BY_GAP_UNIT[gap.unit]?.step ?? 1}
              value={gap.amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setGap({ ...gap, amount: val });
                applyLiveStyle(element!, "gap", `${val}${gap.unit}`, theme, undefined, viewport, structuralPath!);
              }}
              onPointerUp={() => handleGapCommit(gap.amount, gap.unit)}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </>
      )}
    </div>
  );
}
