import { useEffect, useRef, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { getResponsivePropertyInfo } from "@/lib/dom/responsive-style-engine";
import ValueInput from "./ValueInput";
import { Lock, Unlock, Square, Circle } from "lucide-react";
import ColorPicker from "./ColorPicker";

interface BorderGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

const BORDER_STYLES = [
  { label: "Solid", val: "solid" },
  { label: "Dashed", val: "dashed" },
  { label: "Dotted", val: "dotted" },
  { label: "None", val: "none" },
];

type Unit = "px" | "%" | "rem" | "em" | "vw" | "pt";

interface AxisValue {
  amount: number;
  unit: Unit;
}

const RADIUS_ALLOWED_UNITS: Unit[] = ["px", "%", "rem", "em", "vw", "pt"];
const WIDTH_ALLOWED_UNITS: Unit[] = ["px", "pt", "rem", "em"];

const RANGE_BY_RADIUS_UNIT: Record<Unit, { min: number; max: number; step: number }> = {
  px: { min: 0, max: 200, step: 1 },
  "%": { min: 0, max: 100, step: 1 },
  rem: { min: 0, max: 12, step: 0.125 },
  em: { min: 0, max: 12, step: 0.125 },
  vw: { min: 0, max: 50, step: 0.25 },
  pt: { min: 0, max: 150, step: 1 },
};

const RANGE_BY_WIDTH_UNIT: Record<Unit, { min: number; max: number; step: number }> = {
  px: { min: 0, max: 48, step: 1 },
  pt: { min: 0, max: 36, step: 1 },
  rem: { min: 0, max: 3, step: 0.0625 },
  em: { min: 0, max: 3, step: 0.0625 },
  "%": { min: 0, max: 10, step: 0.5 },
  vw: { min: 0, max: 10, step: 0.5 },
};

function parseBorderValue(raw: string, defaultUnit: Unit = "px"): AxisValue {
  if (!raw || raw === "none" || raw === "auto") return { amount: 0, unit: defaultUnit };
  const match = raw.match(/^([-\d.]+)\s*(px|%|rem|em|vw|pt)?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const u = (match[2]?.toLowerCase() as Unit) || defaultUnit;
    return { amount: isNaN(num) ? 0 : num, unit: u };
  }
  const bareNum = parseFloat(raw);
  return { amount: isNaN(bareNum) ? 0 : bareNum, unit: defaultUnit };
}

export default function BorderGroup({
  element,
  structuralPath,
  theme,
  viewport = "desktop",
  onEdit,
}: BorderGroupProps) {
  const [borderColor, setBorderColor] = useState<string>("#e2e8f0");
  const [borderWidth, setBorderWidth] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [borderRadius, setBorderRadius] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [borderStyle, setBorderStyle] = useState<string>("solid");
  const baselineBorderColorRef = useRef<string>("");

  // 4 corners
  const [radiusTL, setRadiusTL] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [radiusTR, setRadiusTR] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [radiusBR, setRadiusBR] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [radiusBL, setRadiusBL] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [linkedRadius, setLinkedRadius] = useState<boolean>(true);

  // 4 sides width
  const [borderT, setBorderT] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [borderR, setBorderR] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [borderB, setBorderB] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [borderL, setBorderL] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [linkedBorder, setLinkedBorder] = useState<boolean>(true);

  const prevElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!element) return;
    const isNew = element !== prevElementRef.current;
    prevElementRef.current = element;

    function getVal(prop: string, side?: string): string {
      if (structuralPath) {
        const resp = getResponsivePropertyInfo(element!, structuralPath, prop, viewport, side);
        if (resp.value) return resp.value;
      }
      return readCurrentValue(element!, prop, theme, side as any);
    }

    const rawW = getVal("border-width");
    const parsedW = parseBorderValue(rawW);
    setBorderWidth(parsedW);
    setBorderT(parseBorderValue(getVal("border-width", "top"), parsedW.unit));
    setBorderR(parseBorderValue(getVal("border-width", "right"), parsedW.unit));
    setBorderB(parseBorderValue(getVal("border-width", "bottom"), parsedW.unit));
    setBorderL(parseBorderValue(getVal("border-width", "left"), parsedW.unit));

    const rawR = getVal("border-radius");
    const parsedR = parseBorderValue(rawR);
    setBorderRadius(parsedR);
    setRadiusTL(parseBorderValue(getVal("border-radius", "top-left"), parsedR.unit));
    setRadiusTR(parseBorderValue(getVal("border-radius", "top-right"), parsedR.unit));
    setRadiusBR(parseBorderValue(getVal("border-radius", "bottom-right"), parsedR.unit));
    setRadiusBL(parseBorderValue(getVal("border-radius", "bottom-left"), parsedR.unit));

    const rawC = getVal("border-color");
    setBorderColor(rawC || "#e2e8f0");
    if (isNew) baselineBorderColorRef.current = rawC || "#e2e8f0";

    const style = getVal("border-style") || "solid";
    setBorderStyle(style);
  }, [element, theme, viewport, structuralPath]);

  if (!element || !structuralPath) return null;

  function handleBorderColorChange(val: string) {
    setBorderColor(val);
    applyLiveStyle(element!, "border-color", val, theme, undefined, viewport, structuralPath!);
  }

  function commitBorderColor(val: string) {
    setBorderColor(val);
    commitStyleChange(
      element!,
      structuralPath!,
      "border-color",
      val,
      theme,
      onEdit,
      baselineBorderColorRef.current,
      undefined,
      viewport
    );
  }

  function commitUniformRadius(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || borderRadius.unit;
    const valObj = { amount, unit };
    setBorderRadius(valObj);
    setRadiusTL(valObj);
    setRadiusTR(valObj);
    setRadiusBR(valObj);
    setRadiusBL(valObj);
    commitStyleChange(
      element!,
      structuralPath!,
      "border-radius",
      `${amount}${unit}`,
      theme,
      onEdit,
      undefined,
      undefined,
      viewport
    );
  }

  function commitCornerRadius(
    corner: "top-left" | "top-right" | "bottom-right" | "bottom-left",
    amount: number,
    unitStr?: string
  ) {
    const unit = (unitStr as Unit) || borderRadius.unit;
    const valObj = { amount, unit };
    if (corner === "top-left") setRadiusTL(valObj);
    if (corner === "top-right") setRadiusTR(valObj);
    if (corner === "bottom-right") setRadiusBR(valObj);
    if (corner === "bottom-left") setRadiusBL(valObj);

    commitStyleChange(
      element!,
      structuralPath!,
      "border-radius",
      `${amount}${unit}`,
      theme,
      onEdit,
      undefined,
      corner,
      viewport
    );
  }

  function commitUniformWidth(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || borderWidth.unit;
    const valObj = { amount, unit };
    setBorderWidth(valObj);
    setBorderT(valObj);
    setBorderR(valObj);
    setBorderB(valObj);
    setBorderL(valObj);
    commitStyleChange(
      element!,
      structuralPath!,
      "border-width",
      `${amount}${unit}`,
      theme,
      onEdit,
      undefined,
      undefined,
      viewport
    );
  }

  function commitSideWidth(
    side: "top" | "right" | "bottom" | "left",
    amount: number,
    unitStr?: string
  ) {
    const unit = (unitStr as Unit) || borderWidth.unit;
    const valObj = { amount, unit };
    if (side === "top") setBorderT(valObj);
    if (side === "right") setBorderR(valObj);
    if (side === "bottom") setBorderB(valObj);
    if (side === "left") setBorderL(valObj);

    commitStyleChange(
      element!,
      structuralPath!,
      "border-width",
      `${amount}${unit}`,
      theme,
      onEdit,
      undefined,
      side,
      viewport
    );
  }

  function handleStyleChange(style: string) {
    setBorderStyle(style);
    commitStyleChange(
      element!,
      structuralPath!,
      "border-style",
      style,
      theme,
      onEdit,
      undefined,
      undefined,
      viewport
    );
  }

  return (
    <div className="p-4 border-b border-[#262626] space-y-4">
      {/* Border Style Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-400 block font-medium">Border Style</label>
        <div className="grid grid-cols-4 gap-1">
          {BORDER_STYLES.map((s) => (
            <button
              key={s.val}
              type="button"
              aria-label={`Border style ${s.label}`}
              onClick={() => handleStyleChange(s.val)}
              className={`py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
                borderStyle === s.val
                  ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
                  : "bg-[#141414] text-zinc-400 hover:text-white border border-[#262626]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Border Color */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-400 block font-medium">Border Color</label>
        <ColorPicker
          value={borderColor}
          onChange={handleBorderColorChange}
          onCommit={commitBorderColor}
          allowTransparent={true}
        />
      </div>

      {/* Border Radius (Uniform vs 4 Corners) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Circle className="w-3 h-3 text-zinc-400" />
            <span>Border Radius</span>
          </span>
          <button
            type="button"
            aria-label={linkedRadius ? "Unlink corner radius" : "Link corner radius"}
            onClick={() => setLinkedRadius(!linkedRadius)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              linkedRadius ? "text-[#0099ff] hover:text-[#33adff]" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title={linkedRadius ? "Linked (All Corners)" : "Unlinked (Individual Corners)"}
          >
            {linkedRadius ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>

        {linkedRadius ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>All Corners</span>
              <ValueInput
                amount={borderRadius.amount}
                unit={borderRadius.unit}
                min={RANGE_BY_RADIUS_UNIT[borderRadius.unit]?.min ?? 0}
                max={RANGE_BY_RADIUS_UNIT[borderRadius.unit]?.max ?? 200}
                step={RANGE_BY_RADIUS_UNIT[borderRadius.unit]?.step ?? 1}
                allowedUnits={RADIUS_ALLOWED_UNITS}
                property="border-radius"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || borderRadius.unit;
                  setBorderRadius({ amount: amt, unit });
                  applyLiveStyle(element, "border-radius", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitUniformRadius}
              />
            </div>
            <input
              type="range"
              min={RANGE_BY_RADIUS_UNIT[borderRadius.unit]?.min ?? 0}
              max={RANGE_BY_RADIUS_UNIT[borderRadius.unit]?.max ?? 64}
              step={RANGE_BY_RADIUS_UNIT[borderRadius.unit]?.step ?? 1}
              value={borderRadius.amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setBorderRadius({ ...borderRadius, amount: val });
                applyLiveStyle(element, "border-radius", `${val}${borderRadius.unit}`, theme, undefined, viewport, structuralPath!);
              }}
              onPointerUp={() => commitUniformRadius(borderRadius.amount, borderRadius.unit)}
              className="w-full accent-[#0099ff] cursor-pointer"
            />
          </div>
        ) : (
          <div className="p-3 bg-[#141414] rounded-xl border border-[#262626] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Top-Left</span>
                <ValueInput
                  amount={radiusTL.amount}
                  unit={radiusTL.unit}
                  min={RANGE_BY_RADIUS_UNIT[radiusTL.unit]?.min ?? 0}
                  max={RANGE_BY_RADIUS_UNIT[radiusTL.unit]?.max ?? 200}
                  step={RANGE_BY_RADIUS_UNIT[radiusTL.unit]?.step ?? 1}
                  allowedUnits={RADIUS_ALLOWED_UNITS}
                  property="border-radius"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || radiusTL.unit;
                    setRadiusTL({ amount: amt, unit });
                    applyLiveStyle(element, "border-radius", `${amt}${unit}`, theme, "top-left", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitCornerRadius("top-left", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Top-Right</span>
                <ValueInput
                  amount={radiusTR.amount}
                  unit={radiusTR.unit}
                  min={RANGE_BY_RADIUS_UNIT[radiusTR.unit]?.min ?? 0}
                  max={RANGE_BY_RADIUS_UNIT[radiusTR.unit]?.max ?? 200}
                  step={RANGE_BY_RADIUS_UNIT[radiusTR.unit]?.step ?? 1}
                  allowedUnits={RADIUS_ALLOWED_UNITS}
                  property="border-radius"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || radiusTR.unit;
                    setRadiusTR({ amount: amt, unit });
                    applyLiveStyle(element, "border-radius", `${amt}${unit}`, theme, "top-right", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitCornerRadius("top-right", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Bottom-Left</span>
                <ValueInput
                  amount={radiusBL.amount}
                  unit={radiusBL.unit}
                  min={RANGE_BY_RADIUS_UNIT[radiusBL.unit]?.min ?? 0}
                  max={RANGE_BY_RADIUS_UNIT[radiusBL.unit]?.max ?? 200}
                  step={RANGE_BY_RADIUS_UNIT[radiusBL.unit]?.step ?? 1}
                  allowedUnits={RADIUS_ALLOWED_UNITS}
                  property="border-radius"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || radiusBL.unit;
                    setRadiusBL({ amount: amt, unit });
                    applyLiveStyle(element, "border-radius", `${amt}${unit}`, theme, "bottom-left", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitCornerRadius("bottom-left", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Bottom-Right</span>
                <ValueInput
                  amount={radiusBR.amount}
                  unit={radiusBR.unit}
                  min={RANGE_BY_RADIUS_UNIT[radiusBR.unit]?.min ?? 0}
                  max={RANGE_BY_RADIUS_UNIT[radiusBR.unit]?.max ?? 200}
                  step={RANGE_BY_RADIUS_UNIT[radiusBR.unit]?.step ?? 1}
                  allowedUnits={RADIUS_ALLOWED_UNITS}
                  property="border-radius"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || radiusBR.unit;
                    setRadiusBR({ amount: amt, unit });
                    applyLiveStyle(element, "border-radius", `${amt}${unit}`, theme, "bottom-right", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitCornerRadius("bottom-right", amt, u)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Border Width (Uniform vs 4 Sides) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Square className="w-3 h-3 text-zinc-400" />
            <span>Border Width</span>
          </span>
          <button
            type="button"
            aria-label={linkedBorder ? "Unlink border width" : "Link border width"}
            onClick={() => setLinkedBorder(!linkedBorder)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              linkedBorder ? "text-[#0099ff] hover:text-[#33adff]" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title={linkedBorder ? "Linked (All Sides)" : "Unlinked (Individual Sides)"}
          >
            {linkedBorder ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>

        {linkedBorder ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>All Sides</span>
              <ValueInput
                amount={borderWidth.amount}
                unit={borderWidth.unit}
                min={RANGE_BY_WIDTH_UNIT[borderWidth.unit]?.min ?? 0}
                max={RANGE_BY_WIDTH_UNIT[borderWidth.unit]?.max ?? 48}
                step={RANGE_BY_WIDTH_UNIT[borderWidth.unit]?.step ?? 1}
                allowedUnits={WIDTH_ALLOWED_UNITS}
                property="border-width"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || borderWidth.unit;
                  setBorderWidth({ amount: amt, unit });
                  applyLiveStyle(element, "border-width", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitUniformWidth}
              />
            </div>
            <input
              type="range"
              min={RANGE_BY_WIDTH_UNIT[borderWidth.unit]?.min ?? 0}
              max={RANGE_BY_WIDTH_UNIT[borderWidth.unit]?.max ?? 32}
              step={RANGE_BY_WIDTH_UNIT[borderWidth.unit]?.step ?? 1}
              value={borderWidth.amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setBorderWidth({ ...borderWidth, amount: val });
                applyLiveStyle(element, "border-width", `${val}${borderWidth.unit}`, theme, undefined, viewport, structuralPath!);
              }}
              onPointerUp={() => commitUniformWidth(borderWidth.amount, borderWidth.unit)}
              className="w-full accent-[#0099ff] cursor-pointer"
            />
          </div>
        ) : (
          <div className="p-3 bg-[#141414] rounded-xl border border-[#262626] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Top</span>
                <ValueInput
                  amount={borderT.amount}
                  unit={borderT.unit}
                  min={RANGE_BY_WIDTH_UNIT[borderT.unit]?.min ?? 0}
                  max={RANGE_BY_WIDTH_UNIT[borderT.unit]?.max ?? 48}
                  step={RANGE_BY_WIDTH_UNIT[borderT.unit]?.step ?? 1}
                  allowedUnits={WIDTH_ALLOWED_UNITS}
                  property="border-width"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || borderT.unit;
                    setBorderT({ amount: amt, unit });
                    applyLiveStyle(element, "border-width", `${amt}${unit}`, theme, "top", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideWidth("top", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Right</span>
                <ValueInput
                  amount={borderR.amount}
                  unit={borderR.unit}
                  min={RANGE_BY_WIDTH_UNIT[borderR.unit]?.min ?? 0}
                  max={RANGE_BY_WIDTH_UNIT[borderR.unit]?.max ?? 48}
                  step={RANGE_BY_WIDTH_UNIT[borderR.unit]?.step ?? 1}
                  allowedUnits={WIDTH_ALLOWED_UNITS}
                  property="border-width"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || borderR.unit;
                    setBorderR({ amount: amt, unit });
                    applyLiveStyle(element, "border-width", `${amt}${unit}`, theme, "right", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideWidth("right", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Bottom</span>
                <ValueInput
                  amount={borderB.amount}
                  unit={borderB.unit}
                  min={RANGE_BY_WIDTH_UNIT[borderB.unit]?.min ?? 0}
                  max={RANGE_BY_WIDTH_UNIT[borderB.unit]?.max ?? 48}
                  step={RANGE_BY_WIDTH_UNIT[borderB.unit]?.step ?? 1}
                  allowedUnits={WIDTH_ALLOWED_UNITS}
                  property="border-width"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || borderB.unit;
                    setBorderB({ amount: amt, unit });
                    applyLiveStyle(element, "border-width", `${amt}${unit}`, theme, "bottom", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideWidth("bottom", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Left</span>
                <ValueInput
                  amount={borderL.amount}
                  unit={borderL.unit}
                  min={RANGE_BY_WIDTH_UNIT[borderL.unit]?.min ?? 0}
                  max={RANGE_BY_WIDTH_UNIT[borderL.unit]?.max ?? 48}
                  step={RANGE_BY_WIDTH_UNIT[borderL.unit]?.step ?? 1}
                  allowedUnits={WIDTH_ALLOWED_UNITS}
                  property="border-width"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || borderL.unit;
                    setBorderL({ amount: amt, unit });
                    applyLiveStyle(element, "border-width", `${amt}${unit}`, theme, "left", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideWidth("left", amt, u)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

