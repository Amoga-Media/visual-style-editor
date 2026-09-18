import React, { useState } from "react";
import { Lock, Unlock } from "lucide-react";

interface BoxModelValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit: string;
}

interface BoxModelVisualizerProps {
  margin: BoxModelValues;
  padding: BoxModelValues;
  width?: number | string;
  height?: number | string;
  tagName?: string;
  onMarginChange: (side: "top" | "right" | "bottom" | "left" | "all", value: number) => void;
  onMarginCommit: (side: "top" | "right" | "bottom" | "left" | "all", value: number) => void;
  onPaddingChange: (side: "top" | "right" | "bottom" | "left" | "all", value: number) => void;
  onPaddingCommit: (side: "top" | "right" | "bottom" | "left" | "all", value: number) => void;
}

interface SideInputProps {
  value: number;
  unit: string;
  ariaLabel: string;
  onChange: (val: number) => void;
  onCommit: (val: number) => void;
  colorClass?: string;
}

function SideInput({ value, unit, ariaLabel, onChange, onCommit, colorClass = "text-slate-700 dark:text-zinc-300" }: SideInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value.toString());

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(tempVal);
    if (!isNaN(parsed)) {
      onCommit(parsed);
    } else {
      setTempVal(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTempVal(value.toString());
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = (parseFloat(tempVal) || 0) + (e.shiftKey ? 10 : 1);
      setTempVal(next.toString());
      onChange(next);
      onCommit(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (parseFloat(tempVal) || 0) - (e.shiftKey ? 10 : 1);
      setTempVal(next.toString());
      onChange(next);
      onCommit(next);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        autoFocus
        value={tempVal}
        aria-label={ariaLabel}
        onChange={(e) => {
          setTempVal(e.target.value);
          const p = parseFloat(e.target.value);
          if (!isNaN(p)) onChange(p);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-10 h-5 px-1 text-center font-mono text-[11px] font-bold bg-white dark:bg-[#1a1a1a] border border-[#0099ff] rounded outline-none shadow-xs"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setTempVal(value.toString());
        setIsEditing(true);
      }}
      title={`Click to edit ${ariaLabel}`}
      aria-label={ariaLabel}
      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer select-none ${colorClass}`}
    >
      {value === 0 ? "0" : `${value}${unit !== "px" ? unit : ""}`}
    </button>
  );
}

export default function BoxModelVisualizer({
  margin,
  padding,
  width = "auto",
  height = "auto",
  tagName = "div",
  onMarginChange,
  onMarginCommit,
  onPaddingChange,
  onPaddingCommit,
}: BoxModelVisualizerProps) {
  const [marginLinked, setMarginLinked] = useState(false);
  const [paddingLinked, setPaddingLinked] = useState(false);

  return (
    <div className="w-full select-none" data-testid="box-model-visualizer">
      {/* Outer Container: Margin */}
      <div className="relative rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-2.5 transition-all">
        {/* Margin Header */}
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 px-1">
          <span>Margin</span>
          <button
            type="button"
            onClick={() => setMarginLinked(!marginLinked)}
            title={marginLinked ? "Margin linked (all sides)" : "Margin unlinked (individual sides)"}
            className="p-0.5 rounded hover:bg-amber-500/20 transition-colors"
          >
            {marginLinked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 opacity-60 hover:opacity-100" />}
          </button>
        </div>

        {/* Margin Top */}
        <div className="flex justify-center -mt-1 mb-1">
          <SideInput
            value={margin.top}
            unit={margin.unit}
            ariaLabel="Margin Top"
            colorClass="text-amber-700 dark:text-amber-300"
            onChange={(v) => onMarginChange(marginLinked ? "all" : "top", v)}
            onCommit={(v) => onMarginCommit(marginLinked ? "all" : "top", v)}
          />
        </div>

        {/* Middle Row: Margin Left + Inner Padding Box + Margin Right */}
        <div className="flex items-center justify-between gap-1">
          {/* Margin Left */}
          <div className="w-8 flex justify-center">
            <SideInput
              value={margin.left}
              unit={margin.unit}
              ariaLabel="Margin Left"
              colorClass="text-amber-700 dark:text-amber-300"
              onChange={(v) => onMarginChange(marginLinked ? "all" : "left", v)}
              onCommit={(v) => onMarginCommit(marginLinked ? "all" : "left", v)}
            />
          </div>

          {/* Inner Container: Padding */}
          <div className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-2 transition-all">
            {/* Padding Header */}
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 px-1">
              <span>Padding</span>
              <button
                type="button"
                onClick={() => setPaddingLinked(!paddingLinked)}
                title={paddingLinked ? "Padding linked (all sides)" : "Padding unlinked (individual sides)"}
                className="p-0.5 rounded hover:bg-emerald-500/20 transition-colors"
              >
                {paddingLinked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 opacity-60 hover:opacity-100" />}
              </button>
            </div>

            {/* Padding Top */}
            <div className="flex justify-center -mt-1 mb-1">
              <SideInput
                value={padding.top}
                unit={padding.unit}
                ariaLabel="Padding Top"
                colorClass="text-emerald-700 dark:text-emerald-300"
                onChange={(v) => onPaddingChange(paddingLinked ? "all" : "top", v)}
                onCommit={(v) => onPaddingCommit(paddingLinked ? "all" : "top", v)}
              />
            </div>

            {/* Middle Row: Padding Left + Element Core + Padding Right */}
            <div className="flex items-center justify-between gap-1">
              {/* Padding Left */}
              <div className="w-8 flex justify-center">
                <SideInput
                  value={padding.left}
                  unit={padding.unit}
                  ariaLabel="Padding Left"
                  colorClass="text-emerald-700 dark:text-emerald-300"
                  onChange={(v) => onPaddingChange(paddingLinked ? "all" : "left", v)}
                  onCommit={(v) => onPaddingCommit(paddingLinked ? "all" : "left", v)}
                />
              </div>

              {/* Core: Element Box */}
              <div className="flex-1 py-1.5 px-2 rounded bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/40 text-center flex flex-col items-center justify-center min-w-[70px]">
                <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                  {typeof width === "number" ? `${Math.round(width)}px` : width} × {typeof height === "number" ? `${Math.round(height)}px` : height}
                </span>
                <span className="text-[9px] font-mono text-slate-500 dark:text-zinc-400">
                  &lt;{tagName}&gt;
                </span>
              </div>

              {/* Padding Right */}
              <div className="w-8 flex justify-center">
                <SideInput
                  value={padding.right}
                  unit={padding.unit}
                  ariaLabel="Padding Right"
                  colorClass="text-emerald-700 dark:text-emerald-300"
                  onChange={(v) => onPaddingChange(paddingLinked ? "all" : "right", v)}
                  onCommit={(v) => onPaddingCommit(paddingLinked ? "all" : "right", v)}
                />
              </div>
            </div>

            {/* Padding Bottom */}
            <div className="flex justify-center -mb-1 mt-1">
              <SideInput
                value={padding.bottom}
                unit={padding.unit}
                ariaLabel="Padding Bottom"
                colorClass="text-emerald-700 dark:text-emerald-300"
                onChange={(v) => onPaddingChange(paddingLinked ? "all" : "bottom", v)}
                onCommit={(v) => onPaddingCommit(paddingLinked ? "all" : "bottom", v)}
              />
            </div>
          </div>

          {/* Margin Right */}
          <div className="w-8 flex justify-center">
            <SideInput
              value={margin.right}
              unit={margin.unit}
              ariaLabel="Margin Right"
              colorClass="text-amber-700 dark:text-amber-300"
              onChange={(v) => onMarginChange(marginLinked ? "all" : "right", v)}
              onCommit={(v) => onMarginCommit(marginLinked ? "all" : "right", v)}
            />
          </div>
        </div>

        {/* Margin Bottom */}
        <div className="flex justify-center -mb-1 mt-1">
          <SideInput
            value={margin.bottom}
            unit={margin.unit}
            ariaLabel="Margin Bottom"
            colorClass="text-amber-700 dark:text-amber-300"
            onChange={(v) => onMarginChange(marginLinked ? "all" : "bottom", v)}
            onCommit={(v) => onMarginCommit(marginLinked ? "all" : "bottom", v)}
          />
        </div>
      </div>
    </div>
  );
}
