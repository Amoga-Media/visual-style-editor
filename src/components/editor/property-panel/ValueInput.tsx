import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { convertUnit } from "@/lib/dom/unit-conversion";
import type { EditableProperty } from "@/types";

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
  viewport?: "desktop" | "tablet" | "mobile";
}

export default function ValueInput({
  amount,
  unit = "px",
  min = 0,
  max = 2000,
  step = 1,
  onChange,
  onCommit,
  allowedUnits,
  property,
  element,
  viewport = "desktop",
}: ValueInputProps) {
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
    const trimmed = raw.trim();
    if (!trimmed) return { amount, unit: currentUnit };

    const match = trimmed.match(/^([-\d.]+)\s*([a-zA-Z%]*)$/);
    if (!match) return { amount, unit: currentUnit };

    const parsedNum = parseFloat(match[1]);
    const num = isNaN(parsedNum) ? amount : parsedNum;
    let parsedUnit = match[2] ? match[2].toLowerCase() : currentUnit;

    if (allowedUnits && allowedUnits.length > 0) {
      const matched = allowedUnits.find((u) => u.toLowerCase() === parsedUnit);
      parsedUnit = matched || currentUnit;
    }

    const clamped = Math.max(min, Math.min(max, num));
    return { amount: clamped, unit: parsedUnit || currentUnit };
  }

  function handleBlur() {
    setIsFocused(false);
    const result = parseFullText(numText);
    setNumText(result.amount.toString());
    setCurrentUnit(result.unit);
    onCommit(result.amount, result.unit);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      inputRef.current?.blur();
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFullText(numText);
      const delta = e.shiftKey ? step * 10 : step;
      const nextNum = e.key === "ArrowUp" ? current.amount + delta : current.amount - delta;
      const clamped = Math.max(min, Math.min(max, nextNum));
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

    const parsed = parseFullText(numText);
    const converted = convertUnit(parsed.amount, currentUnit, newUnit, {
      property,
      element,
      viewport,
    });

    setNumText(converted.toString());
    setCurrentUnit(newUnit);
    setDropdownOpen(false);
    onChange?.(converted, newUnit);
    onCommit(converted, newUnit);
  }

  const hasMultipleUnits = allowedUnits && allowedUnits.length > 1;

  return (
    <div ref={containerRef} className="relative inline-flex items-center rounded-lg bg-[#111] border border-[#2a2a2a] hover:border-[#3a3a3a] focus-within:border-[#0099ff] focus-within:ring-1 focus-within:ring-[#0099ff]/40 transition-all p-0.5">
      <input
        ref={inputRef}
        type="text"
        value={isFocused ? numText : `${numText}`}
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
        className="w-14 bg-transparent px-1.5 py-0.5 text-xs font-mono text-zinc-100 text-right outline-none placeholder-zinc-600"
        title="Type number or value with unit (e.g. 100vw, 50%, 24px, 12pt)"
      />

      {hasMultipleUnits ? (
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#0099ff] hover:text-white hover:bg-[#222] transition-colors flex items-center gap-0.5 cursor-pointer select-none"
          title={`Current unit: ${currentUnit}. Click to change.`}
        >
          <span>{currentUnit}</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>
      ) : (
        <span className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 select-none">
          {currentUnit}
        </span>
      )}

      {/* Unit Dropdown Menu */}
      {dropdownOpen && hasMultipleUnits && (
        <div className="absolute right-0 top-full mt-1 w-20 bg-[#161616] border border-[#2e2e2e] rounded-lg shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-[#242424] mb-1">
            Units
          </div>
          {allowedUnits.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleSelectUnit(u)}
              className={`w-full text-left px-2.5 py-1 text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                currentUnit.toLowerCase() === u.toLowerCase()
                  ? "bg-[#0099ff]/15 text-[#0099ff] font-semibold"
                  : "text-zinc-300 hover:bg-[#222] hover:text-white"
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
