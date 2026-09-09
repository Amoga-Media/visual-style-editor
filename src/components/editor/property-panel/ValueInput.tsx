import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { convertUnit } from "@/lib/dom/unit-conversion";
import type { EditableProperty } from "@/types";
import type { ViewportMode } from "@/components/editor/Toolbar";

interface ValueInputProps {
  amount: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (amount: number, unit: string) => void;
  onCommit: (amount: number, unit: string) => void;
  allowedUnits?: string[];
  property?: EditableProperty | string;
  element?: Element | null;
  viewport?: ViewportMode;
}

const NEGATIVE_ALLOWED_PROPERTIES = new Set([
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "top",
  "right",
  "bottom",
  "left",
  "rotate",
  "z-index",
  "order",
]);

export default function ValueInput({
  amount,
  unit = "px",
  min,
  max,
  step = 1,
  onChange,
  onCommit,
  allowedUnits,
  property,
  element,
  viewport = "desktop",
}: ValueInputProps) {
  const isNegativeAllowed = property ? NEGATIVE_ALLOWED_PROPERTIES.has(property.toString()) : false;
  const effectiveMin = min !== undefined ? min : (isNegativeAllowed ? -Infinity : 0);
  const effectiveMax = max !== undefined && isFinite(max) ? max : Infinity;

  const [numText, setNumText] = useState(amount.toString());
  const [currentUnit, setCurrentUnit] = useState(unit);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCurrentUnit(unit);
  }, [unit]);

  useEffect(() => {
    if (!isFocused) {
      setNumText(amount.toString());
    }
  }, [amount, isFocused]);

  // Click outside to close unit dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  function parseFullText(raw: string): { amount: number; unit: string } {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed || trimmed === "-") return { amount, unit: currentUnit };
    if (trimmed === "auto") return { amount: 0, unit: "auto" };
    if (trimmed === "none") return { amount: 0, unit: "none" };

    const match = trimmed.match(/^([-\d.]+)\s*([a-zA-Z%]*)$/);
    if (!match) return { amount, unit: currentUnit };

    const parsedNum = parseFloat(match[1]);
    const num = isNaN(parsedNum) ? amount : parsedNum;
    let parsedUnit = match[2] ? match[2].toLowerCase() : currentUnit;

    if (allowedUnits && allowedUnits.length > 0) {
      const matched = allowedUnits.find((u) => u.toLowerCase() === parsedUnit);
      parsedUnit = matched || currentUnit;
    }

    const clamped = Math.max(effectiveMin, Math.min(effectiveMax, num));
    return { amount: clamped, unit: parsedUnit || currentUnit };
  }

  function handleBlur() {
    setIsFocused(false);
    const result = parseFullText(numText);
    if (result.unit === "auto") {
      setNumText("auto");
      setCurrentUnit("auto");
      onCommit(0, "auto");
    } else if (result.unit === "none") {
      setNumText("none");
      setCurrentUnit("none");
      onCommit(0, "none");
    } else {
      setNumText(result.amount.toString());
      setCurrentUnit(result.unit);
      onCommit(result.amount, result.unit);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      inputRef.current?.blur();
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFullText(numText);
      if (current.unit === "auto" || current.unit === "none") return;
      const delta = e.shiftKey ? step * 10 : step;
      const nextNum = e.key === "ArrowUp" ? current.amount + delta : current.amount - delta;
      const clamped = Math.max(effectiveMin, Math.min(effectiveMax, nextNum));
      const rounded = Math.round(clamped * 100) / 100;
      setNumText(rounded.toString());
      onChange?.(rounded, current.unit);
      onCommit(rounded, current.unit);
    }
  }

  function handleSelectUnit(newUnit: string) {
    if (newUnit.toLowerCase() === currentUnit.toLowerCase()) {
      setDropdownOpen(false);
      return;
    }

    if (newUnit.toLowerCase() === "auto") {
      setNumText("auto");
      setCurrentUnit("auto");
      setDropdownOpen(false);
      onChange?.(0, "auto");
      onCommit(0, "auto");
      return;
    }

    if (newUnit.toLowerCase() === "none") {
      setNumText("none");
      setCurrentUnit("none");
      setDropdownOpen(false);
      onChange?.(0, "none");
      onCommit(0, "none");
      return;
    }

    const parsed = parseFullText(numText);
    const fromUnit = (currentUnit === "auto" || currentUnit === "none") ? "px" : currentUnit;
    const converted = convertUnit(parsed.amount, fromUnit, newUnit, {
      property,
      element,
      viewport: viewport === "all" ? undefined : viewport,
    });

    setNumText(converted.toString());
    setCurrentUnit(newUnit);
    setDropdownOpen(false);
    onChange?.(converted, newUnit);
    onCommit(converted, newUnit);
  }

  const hasMultipleUnits = allowedUnits && allowedUnits.length > 1;

  return (
    <div ref={containerRef} className="relative inline-flex items-center rounded-md bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-[#333333] focus-within:border-[#0099ff] focus-within:ring-1 focus-within:ring-[#0099ff]/40 transition-all px-1 py-0.5">
      <input
        ref={inputRef}
        type="text"
        value={isFocused ? numText : (currentUnit === "auto" ? "auto" : currentUnit === "none" ? "none" : `${numText}`)}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => {
          setNumText(e.target.value);
          const parsed = parseFullText(e.target.value);
          if (parsed.unit !== currentUnit) {
            setCurrentUnit(parsed.unit);
          }
          onChange?.(parsed.amount, parsed.unit);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-16 bg-transparent px-1.5 py-0.5 text-[13px] font-mono font-medium text-slate-800 dark:text-zinc-100 text-right outline-none placeholder-slate-400 dark:placeholder-zinc-600"
        title="Type number or value with unit (e.g. 100vw, 50%, 24px, 12pt)"
      />

      {hasMultipleUnits ? (
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          aria-label={`Unit selection, currently ${currentUnit}`}
          className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-[#0099ff] hover:text-[#0099ff] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] transition-colors flex items-center gap-0.5 cursor-pointer select-none"
          title={`Current unit: ${currentUnit}. Click to change.`}
        >
          <span>{currentUnit}</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      ) : (
        <span className="px-1.5 py-0.5 text-[11px] font-mono text-slate-400 dark:text-zinc-400 select-none">
          {currentUnit}
        </span>
      )}

      {/* Unit Dropdown Menu */}
      {dropdownOpen && hasMultipleUnits && (
        <div className="absolute right-0 top-full mt-1 w-22 bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] rounded-lg shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-[#262626] mb-1">
            Units
          </div>
          {allowedUnits.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleSelectUnit(u)}
              aria-label={`Select unit ${u}`}
              className={`w-full text-left px-2.5 py-1 text-[12px] font-mono flex items-center justify-between cursor-pointer transition-colors ${
                currentUnit.toLowerCase() === u.toLowerCase()
                  ? "bg-[#0099ff]/15 text-[#0099ff] font-semibold"
                  : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#262626] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{u}</span>
              {currentUnit.toLowerCase() === u.toLowerCase() && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff]"></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

