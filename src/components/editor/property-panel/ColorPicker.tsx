import { useState, useEffect, useRef, useCallback } from "react";
import { parse as parseColor, converter, formatHex, formatRgb, formatHsl } from "culori";
import { Pipette, ChevronDown, Check, Ban } from "lucide-react";

const toHsv = converter("hsv");
const toRgb = converter("rgb");

export type ColorFormat = "hex" | "rgb" | "hsl";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  allowTransparent?: boolean;
}

const DEFAULT_PALETTE = [
  "#3b82f6", // Blue
  "#f97316", // Orange
  "#a855f7", // Purple
  "#c084fc", // Light Purple
  "#ef4444", // Red
  "#22c55e", // Green
  "#eab308", // Yellow
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#84cc16", // Lime
  "#0ea5e9", // Sky
  "#10b981", // Emerald
  "#f43f5e", // Rose
  "#d946ef", // Fuchsia
];

export default function ColorPicker({
  value,
  onChange,
  onCommit,
  allowTransparent = true,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("vse_recent_colors");
      return saved ? JSON.parse(saved) : DEFAULT_PALETTE.slice(0, 8);
    } catch {
      return DEFAULT_PALETTE.slice(0, 8);
    }
  });

  // HSV State: h: [0, 360], s: [0, 1], v: [0, 1], a: [0, 1]
  const [hue, setHue] = useState(210);
  const [sat, setSat] = useState(1);
  const [val, setVal] = useState(1);
  const [alpha, setAlpha] = useState(1);
  const [isTransparent, setIsTransparent] = useState(false);

  // Raw text input state
  const [textInput, setTextInput] = useState("#0099ff");
  const [alphaInput, setAlphaInput] = useState("100%");

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const spectrumRef = useRef<HTMLDivElement | null>(null);
  const isDraggingSpectrum = useRef(false);

  // Parse incoming value into HSV
  useEffect(() => {
    if (!value || value === "transparent" || value === "rgba(0, 0, 0, 0)" || value === "#00000000") {
      setIsTransparent(true);
      setAlpha(0);
      setTextInput("transparent");
      setAlphaInput("0%");
      return;
    }

    setIsTransparent(false);
    const parsed = parseColor(value);
    if (parsed) {
      const hsv = toHsv(parsed);
      setHue(hsv.h !== undefined && !isNaN(hsv.h) ? hsv.h : 0);
      setSat(hsv.s !== undefined && !isNaN(hsv.s) ? hsv.s : 1);
      setVal(hsv.v !== undefined && !isNaN(hsv.v) ? hsv.v : 1);
      const a = parsed.alpha !== undefined ? parsed.alpha : 1;
      setAlpha(a);
      setAlphaInput(`${Math.round(a * 100)}%`);

      if (format === "hex") {
        setTextInput(formatHex(parsed) || value);
      } else if (format === "rgb") {
        setTextInput(formatRgb(parsed) || value);
      } else {
        setTextInput(formatHsl(parsed) || value);
      }
    } else {
      setTextInput(value);
    }
  }, [value, format]);

  // Compute color output string from HSV & Alpha
  const computeColorString = useCallback(
    (h: number, s: number, v: number, a: number, fmt: ColorFormat): string => {
      if (a === 0) return "transparent";
      const rgb = toRgb({ mode: "hsv", h, s, v, alpha: a });
      if (!rgb) return "#000000";

      if (fmt === "hex") {
        if (a < 1) {
          const hex = formatHex(rgb) || "#000000";
          const aHex = Math.round(a * 255).toString(16).padStart(2, "0");
          return `${hex}${aHex}`;
        }
        return formatHex(rgb) || "#000000";
      } else if (fmt === "rgb") {
        return formatRgb(rgb) || `rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}, ${a})`;
      } else {
        return formatHsl(rgb) || `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%, ${a})`;
      }
    },
    []
  );

  function pushRecentColor(c: string) {
    if (!c || c === "transparent") return;
    setRecentColors((prev) => {
      const next = [c, ...prev.filter((item) => item.toLowerCase() !== c.toLowerCase())].slice(0, 16);
      try {
        localStorage.setItem("vse_recent_colors", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function emitColor(h: number, s: number, v: number, a: number, isCommit = false) {
    setIsTransparent(a === 0);
    const result = computeColorString(h, s, v, a, format);
    setTextInput(result);
    setAlphaInput(`${Math.round(a * 100)}%`);

    onChange(result);
    if (isCommit) {
      onCommit(result);
      if (result !== "transparent") pushRecentColor(result);
    }
  }

  // Handle Transparent Selection
  function handleSelectTransparent() {
    setIsTransparent(true);
    setAlpha(0);
    setTextInput("transparent");
    setAlphaInput("0%");
    onChange("transparent");
    onCommit("transparent");
  }

  // Spectrum 2D Drag Handling
  function updateSpectrumFromEvent(e: MouseEvent | React.MouseEvent<HTMLDivElement>) {
    if (!spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const nextSat = Number((x / rect.width).toFixed(3));
    const nextVal = Number((1 - y / rect.height).toFixed(3));

    setSat(nextSat);
    setVal(nextVal);
    const nextAlpha = isTransparent ? 1 : alpha;
    if (isTransparent) setAlpha(1);
    emitColor(hue, nextSat, nextVal, nextAlpha, false);
  }

  function handleSpectrumMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    isDraggingSpectrum.current = true;
    updateSpectrumFromEvent(e);

    function onMouseMove(moveEvent: MouseEvent) {
      if (isDraggingSpectrum.current) {
        updateSpectrumFromEvent(moveEvent);
      }
    }

    function onMouseUp() {
      if (isDraggingSpectrum.current) {
        isDraggingSpectrum.current = false;
        emitColor(hue, sat, val, alpha, true);
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  // EyeDropper API
  async function handleEyeDropper() {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const res = await eyeDropper.open();
        if (res?.sRGBHex) {
          const parsed = parseColor(res.sRGBHex);
          if (parsed) {
            const hsv = toHsv(parsed);
            setHue(hsv.h || 0);
            setSat(hsv.s || 1);
            setVal(hsv.v || 1);
            setAlpha(1);
            setIsTransparent(false);
            emitColor(hsv.h || 0, hsv.s || 1, hsv.v || 1, 1, true);
          }
        }
      } catch {}
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const pureHueHex = formatHex(toRgb({ mode: "hsv", h: hue, s: 1, v: 1 })) || "#ff0000";
  const displayColorHex = isTransparent
    ? "transparent"
    : formatHex(toRgb({ mode: "hsv", h: hue, s: sat, v: val, alpha })) || "#000000";

  return (
    <div ref={popoverRef} className="relative inline-block w-full">
      {/* Trigger Button: Color Swatch + Text Value */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-7 h-7 rounded-lg border border-slate-300 dark:border-[#333] shadow-sm flex items-center justify-center overflow-hidden shrink-0 cursor-pointer transition-transform active:scale-95"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
          }}
          title="Click to open color picker"
        >
          <div
            className="w-full h-full"
            style={{
              backgroundColor: isTransparent ? "transparent" : displayColorHex,
            }}
          />
          {isTransparent && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
              <Ban className="w-4 h-4 text-red-500" />
            </div>
          )}
        </button>

        <input
          type="text"
          value={textInput}
          onChange={(e) => {
            setTextInput(e.target.value);
            const val = e.target.value.trim();
            if (val === "transparent") {
              handleSelectTransparent();
              return;
            }
            const parsed = parseColor(val);
            if (parsed) {
              const hsv = toHsv(parsed);
              setHue(hsv.h || 0);
              setSat(hsv.s || 0);
              setVal(hsv.v || 0);
              const a = parsed.alpha !== undefined ? parsed.alpha : 1;
              setAlpha(a);
              setIsTransparent(false);
              onChange(val);
            }
          }}
          onBlur={() => {
            const val = textInput.trim();
            if (val === "transparent") {
              handleSelectTransparent();
              return;
            }
            const parsed = parseColor(val);
            if (parsed) {
              onCommit(val);
              pushRecentColor(val);
            } else {
              setTextInput(isTransparent ? "transparent" : displayColorHex);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = textInput.trim();
              if (val === "transparent") {
                handleSelectTransparent();
              } else {
                onCommit(val);
                pushRecentColor(val);
              }
            }
          }}
          className="flex-1 bg-[#141414] border border-[#262626] focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono outline-none"
          placeholder="#000000 or transparent"
          aria-label="Color string value"
        />
      </div>

      {/* Popover Color Picker Window (Exact Match to User Reference Mockup) */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-[#141414] border border-[#262626] rounded-3xl shadow-2xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150 select-none">
          {/* 1. 2D Saturation & Brightness Spectrum Box */}
          <div
            ref={spectrumRef}
            onMouseDown={handleSpectrumMouseDown}
            className="relative w-full h-36 rounded-2xl cursor-crosshair overflow-hidden shadow-inner"
            style={{
              backgroundColor: pureHueHex,
              backgroundImage: `linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, transparent)`,
            }}
          >
            {/* Draggable Circle Thumb (O handle from mockup) */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${sat * 100}%`,
                top: `${(1 - val) * 100}%`,
                backgroundColor: isTransparent ? "transparent" : displayColorHex,
              }}
            />
          </div>

          {/* 2. Tools & Sliders Row (EyeDropper + Rainbow Hue + Alpha Slider) */}
          <div className="flex items-center gap-3">
            {/* EyeDropper Icon Button */}
            <button
              type="button"
              aria-label="EyeDropper pick color from screen"
              onClick={handleEyeDropper}
              className="p-2 rounded-xl bg-[#1c1c1c] hover:bg-[#262626] text-zinc-300 transition-colors shrink-0 cursor-pointer shadow-sm border border-[#262626]"
              title="EyeDropper Pick Color from Screen"
            >
              <Pipette className="w-4 h-4" />
            </button>

            <div className="flex-1 space-y-2.5">
              {/* Rainbow Hue Slider */}
              <div className="relative w-full h-3 rounded-full overflow-hidden flex items-center">
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={hue}
                  aria-label="Hue angle"
                  onChange={(e) => {
                    const nextHue = parseFloat(e.target.value);
                    setHue(nextHue);
                    if (isTransparent) setAlpha(1);
                    emitColor(nextHue, sat, val, isTransparent ? 1 : alpha, false);
                  }}
                  onPointerUp={() => emitColor(hue, sat, val, alpha, true)}
                  className="w-full h-full opacity-0 absolute inset-0 cursor-pointer z-10"
                />
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                  }}
                />
                <div
                  className="absolute w-3.5 h-3.5 rounded-full bg-white border border-zinc-700 shadow pointer-events-none transform -translate-x-1/2"
                  style={{ left: `${(hue / 360) * 100}%` }}
                />
              </div>

              {/* Alpha Opacity Slider (Checkerboard + Gradient) */}
              <div
                className="relative w-full h-3 rounded-full overflow-hidden flex items-center"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                  backgroundSize: "6px 6px",
                  backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0",
                }}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={alpha}
                  aria-label="Color alpha opacity"
                  onChange={(e) => {
                    const nextA = parseFloat(e.target.value);
                    setAlpha(nextA);
                    emitColor(hue, sat, val, nextA, false);
                  }}
                  onPointerUp={() => emitColor(hue, sat, val, alpha, true)}
                  className="w-full h-full opacity-0 absolute inset-0 cursor-pointer z-10"
                />
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: `linear-gradient(to right, transparent, ${pureHueHex})`,
                  }}
                />
                <div
                  className="absolute w-3.5 h-3.5 rounded-full bg-white border border-zinc-700 shadow pointer-events-none transform -translate-x-1/2"
                  style={{ left: `${alpha * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. Format Selector, Value Code Pill & Alpha % Input */}
          <div className="flex items-center gap-1.5 text-xs">
            {/* Format Pill (Hex / RGB / HSL) */}
            <div className="relative">
              <select
                value={format}
                aria-label="Color format"
                onChange={(e) => {
                  const nextFmt = e.target.value as ColorFormat;
                  setFormat(nextFmt);
                  if (!isTransparent) {
                    const str = computeColorString(hue, sat, val, alpha, nextFmt);
                    setTextInput(str);
                  }
                }}
                className="appearance-none bg-[#1c1c1c] hover:bg-[#262626] border border-[#262626] text-zinc-200 font-semibold px-2.5 py-1.5 pr-6 rounded-xl cursor-pointer outline-none transition-colors"
              >
                <option value="hex">Hex</option>
                <option value="rgb">RGB</option>
                <option value="hsl">HSL</option>
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Formatted Value Input Pill */}
            <input
              type="text"
              value={textInput}
              aria-label="Formatted color value"
              onChange={(e) => setTextInput(e.target.value)}
              onBlur={() => {
                const parsed = parseColor(textInput);
                if (parsed) {
                  onCommit(textInput);
                  pushRecentColor(textInput);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onCommit(textInput);
                  pushRecentColor(textInput);
                }
              }}
              className="flex-1 bg-[#1c1c1c] border border-[#262626] text-zinc-200 font-mono text-center py-1.5 px-2 rounded-xl outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff]"
            />

            {/* Alpha % Pill */}
            <div className="w-16 bg-[#1c1c1c] border border-[#262626] text-zinc-200 font-mono text-center py-1.5 px-2 rounded-xl">
              {alphaInput}
            </div>
          </div>

          {/* Quick Transparent Button */}
          {allowTransparent && (
            <button
              type="button"
              onClick={handleSelectTransparent}
              className={`w-full py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isTransparent
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "bg-slate-100 dark:bg-[#27272a] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-[#38383c] hover:bg-slate-200 dark:hover:bg-[#323236]"
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-red-500" />
              <span>Set as Transparent</span>
              {isTransparent && <Check className="w-3.5 h-3.5 text-red-500 ml-auto" />}
            </button>
          )}

          {/* 4. "Last Colors" / Palette Swatches Section */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-[#27272a]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              <span>Last Colors</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {/* Transparent Swatch Chip */}
              {allowTransparent && (
                <button
                  type="button"
                  onClick={handleSelectTransparent}
                  className="w-6 h-6 rounded-lg border border-slate-300 dark:border-[#38383c] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer overflow-hidden relative shadow-sm"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                    backgroundSize: "6px 6px",
                  }}
                  title="Transparent"
                >
                  <Ban className="w-3 h-3 text-red-500" />
                </button>
              )}

              {/* Color Preset Swatches */}
              {recentColors.map((colorHex, idx) => (
                <button
                  key={`${colorHex}-${idx}`}
                  type="button"
                  onClick={() => {
                    const parsed = parseColor(colorHex);
                    if (parsed) {
                      const hsv = toHsv(parsed);
                      setHue(hsv.h || 0);
                      setSat(hsv.s || 1);
                      setVal(hsv.v || 1);
                      const a = parsed.alpha !== undefined ? parsed.alpha : 1;
                      setAlpha(a);
                      setIsTransparent(false);
                      emitColor(hsv.h || 0, hsv.s || 1, hsv.v || 1, a, true);
                    }
                  }}
                  className="w-6 h-6 rounded-lg border border-slate-200 dark:border-black/20 shadow-sm hover:scale-110 transition-transform cursor-pointer shrink-0"
                  style={{ backgroundColor: colorHex }}
                  title={colorHex}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
