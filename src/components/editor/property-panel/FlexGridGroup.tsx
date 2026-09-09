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
  const [flexWrap, setFlexWrap] = useState("nowrap");
  const [justifyContent, setJustifyContent] = useState("start");
  const [alignItems, setAlignItems] = useState("start");
  const [gridCols, setGridCols] = useState("1");
  const [gridRows, setGridRows] = useState("1");
  const [gridFlow, setGridFlow] = useState("row");
  const [gap, setGap] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [isGridMode, setIsGridMode] = useState(false);

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

    const currentDisplay = getVal("display") || computed.display || "block";
    setDisplay(currentDisplay);
    setIsGridMode(currentDisplay.includes("grid"));
    setFlexDirection(getVal("flex-direction") || computed.flexDirection || "row");
    setFlexWrap(getVal("flex-wrap") || computed.flexWrap || "nowrap");
    setJustifyContent(getVal("justify-content") || computed.justifyContent || "start");
    setAlignItems(getVal("align-items") || computed.alignItems || "start");
    setGridCols(getVal("grid-template-columns") || computed.gridTemplateColumns || "1");
    setGridRows(getVal("grid-template-rows") || computed.gridTemplateRows || "1");
    setGridFlow(getVal("grid-auto-flow") || computed.gridAutoFlow || "row");

    const rawGap = getVal("gap") || computed.gap;
    const parsedGap = parseGapValue(rawGap);
    setGap(parsedGap);
  }, [element, theme, viewport, structuralPath]);

  if (!element || !structuralPath) return null;

  function updateProperty(property: any, value: string, live: boolean = false) {
    if (live) {
      applyLiveStyle(element!, property, value, theme, undefined, viewport, structuralPath!);
    } else {
      applyLiveStyle(element!, property, value, theme, undefined, viewport, structuralPath!);
      commitStyleChange(
        element!,
        structuralPath!,
        property,
        value,
        theme,
        onEdit,
        undefined,
        undefined,
        viewport
      );
    }
  }

  function handleDisplayChange(newDisplay: string) {
    setDisplay(newDisplay);
    setIsGridMode(newDisplay.includes("grid"));
    updateProperty("display", newDisplay, false);
  }

  function handleJustifyChange(newJustify: string) {
    setJustifyContent(newJustify);
    updateProperty("justify-content", newJustify, false);
  }

  function handleAlignChange(newAlign: string) {
    setAlignItems(newAlign);
    updateProperty("align-items", newAlign, false);
  }

  function handleDirectionChange(newDir: string) {
    setFlexDirection(newDir);
    updateProperty("flex-direction", newDir, false);
  }

  function handleWrapChange(newWrap: string) {
    setFlexWrap(newWrap);
    updateProperty("flex-wrap", newWrap, false);
  }

  function handleGridColsChange(cols: string) {
    setGridCols(cols);
    updateProperty("grid-template-columns", cols, false);
  }

  function handleGridRowsChange(rows: string) {
    setGridRows(rows);
    updateProperty("grid-template-rows", rows, false);
  }

  function handleGridFlowChange(flow: string) {
    setGridFlow(flow);
    updateProperty("grid-auto-flow", flow, false);
  }

  function handleGapChange(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || gap.unit;
    setGap({ amount, unit });
    updateProperty("gap", `${amount}${unit}`, true);
  }

  function handleGapCommit(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || gap.unit;
    setGap({ amount, unit });
    updateProperty("gap", `${amount}${unit}`, false);
  }

  const isFlex = display === "flex" || display === "inline-flex";
  const isGrid = display === "grid" || display === "inline-grid";
  const isFlexOrGrid = isFlex || isGrid;

  return (
    <div className="p-3.5 space-y-3.5">
      {/* Display Selector */}
      <div className="space-y-1">
        <label className="text-xs text-slate-500 dark:text-zinc-400 block font-medium">Display Mode</label>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: "block", label: "Block" },
            { id: "flex", label: "Flex" },
            { id: "grid", label: "Grid" },
            { id: "inline-block", label: "Inl-Block" },
            { id: "inline-flex", label: "Inl-Flex" },
            { id: "inline-grid", label: "Inl-Grid" },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleDisplayChange(d.id)}
              aria-label={`Display mode ${d.label}`}
              className={`py-1 text-xs rounded-lg transition-all cursor-pointer ${
                display === d.id
                  ? "bg-[#0099ff] text-white font-semibold shadow-2xs"
                  : "bg-slate-100 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#262626] hover:bg-slate-200 dark:hover:bg-[#1c1c1c]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {isFlex && (
        <>
          {/* Flex Direction & Wrap */}
          <div className="grid grid-cols-2 gap-2">

            <div>
              <label className="text-xs text-gray-400 block mb-1">Direction</label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: "Row", val: "row" },
                  { label: "Col", val: "column" },
                  { label: "Row-R", val: "row-reverse" },
                  { label: "Col-R", val: "column-reverse" },
                ].map((dir) => (
                  <button
                    key={dir.val}
                    onClick={() => handleDirectionChange(dir.val)}
                    type="button"
                    aria-label={`Flex direction ${dir.label}`}
                    className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                      flexDirection === dir.val
                        ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                        : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
                    }`}
                  >
                    {dir.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-medium">Wrap</label>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { label: "No Wrap", val: "nowrap" },
                  { label: "Wrap", val: "wrap" },
                  { label: "Wrap Reverse", val: "wrap-reverse" },
                ].map((w) => (
                  <button
                    key={w.val}
                    type="button"
                    aria-label={`Flex wrap ${w.label}`}
                    onClick={() => handleWrapChange(w.val)}
                    className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                      flexWrap === w.val
                        ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                        : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {isGrid && (
        <>
          {/* Grid Columns & Rows */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-medium">Grid Columns</label>
              <div className="grid grid-cols-4 gap-1 mb-1">
                {["1", "2", "3", "4"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Grid columns ${c}`}
                    onClick={() => handleGridColsChange(c)}
                    className={`py-1 text-xs rounded transition-all cursor-pointer ${
                      gridCols === c || gridCols === `repeat(${c}, minmax(0, 1fr))`
                        ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                        : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={gridCols}
                aria-label="Grid columns value"
                onChange={(e) => handleGridColsChange(e.target.value)}
                placeholder="cols (e.g. 3 or repeat(3, 1fr))"
                className="w-full bg-[#141414] border border-[#262626] focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded px-2 py-1 text-xs text-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-medium">Grid Rows</label>
              <div className="grid grid-cols-3 gap-1 mb-1">
                {["1", "2", "3"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-label={`Grid rows ${r}`}
                    onClick={() => handleGridRowsChange(r)}
                    className={`py-1 text-xs rounded transition-all cursor-pointer ${
                      gridRows === r || gridRows === `repeat(${r}, minmax(0, 1fr))`
                        ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                        : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={gridRows}
                aria-label="Grid rows value"
                onChange={(e) => handleGridRowsChange(e.target.value)}
                placeholder="rows (e.g. 2 or repeat(2, 1fr))"
                className="w-full bg-[#141414] border border-[#262626] focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded px-2 py-1 text-xs text-zinc-200"
              />
            </div>
          </div>

          {/* Grid Flow */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 block font-medium">Auto Flow</label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: "Row", val: "row" },
                { label: "Col", val: "col" },
                { label: "Row Dense", val: "row dense" },
                { label: "Col Dense", val: "col dense" },
              ].map((f) => (
                <button
                  key={f.val}
                  type="button"
                  aria-label={`Grid auto flow ${f.label}`}
                  onClick={() => handleGridFlowChange(f.val)}
                  className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                    gridFlow === f.val
                      ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                      : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isFlexOrGrid && (
        <>
          {/* Justify / Align */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-medium">Justify Content</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: "Start", val: "start" },
                  { label: "Center", val: "center" },
                  { label: "End", val: "end" },
                  { label: "Between", val: "between" },
                  { label: "Around", val: "around" },
                  { label: "Evenly", val: "evenly" },
                ].map((j) => (
                  <button
                    key={j.val}
                    type="button"
                    aria-label={`Justify content ${j.label}`}
                    onClick={() => handleJustifyChange(j.val)}
                    className={`py-1 text-[10px] rounded transition-all cursor-pointer ${
                      justifyContent.includes(j.val)
                        ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                        : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
                    }`}
                  >
                    {j.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-medium">Align Items</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: "Start", val: "start" },
                  { label: "Center", val: "center" },
                  { label: "End", val: "end" },
                  { label: "Stretch", val: "stretch" },
                  { label: "Baseline", val: "baseline" },
                ].map((a) => (
                  <button
                    key={a.val}
                    type="button"
                    aria-label={`Align items ${a.label}`}
                    onClick={() => handleAlignChange(a.val)}
                    className={`py-1 text-[10px] rounded transition-all cursor-pointer ${
                      alignItems.includes(a.val)
                        ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                        : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
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
            <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
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
                  handleGapChange(amt, unit);
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
                handleGapChange(val, gap.unit);
              }}
              onPointerUp={() => handleGapCommit(gap.amount, gap.unit)}
              className="w-full accent-[#0099ff] cursor-pointer"
            />
          </div>
        </>
      )}
    </div>
  );
}
