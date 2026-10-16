import { useState, useEffect, useRef, useCallback } from "react";
import { parse as parseColor, converter, formatHex, formatHex8, formatRgb, formatHsl } from "culori";
import { Pipette, ChevronDown, Check, Ban, Sparkles, ArrowLeftRight, Trash2, Plus, Sliders } from "lucide-react";
import { DEFAULT_COLORS } from "@/lib/tailwind/default-theme";

const toHsv = converter("hsv");
const toRgb = converter("rgb");

export type ColorFormat = "hex" | "rgb" | "hsl";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  allowTransparent?: boolean;
}

export interface GradientStop {
  id: string;
  color: string;
  offset: number; // 0 to 100
}

export interface GradientConfig {
  type: "linear" | "radial";
  angle: number; // 0 to 360
  stops: GradientStop[];
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

export const GRADIENT_PRESETS: { name: string; gradient: string }[] = [
  { name: "Hyper Cyan", gradient: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)" },
  { name: "Sunset Fire", gradient: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)" },
  { name: "Cyber Neon", gradient: "linear-gradient(135deg, #f72585 0%, #7209b7 50%, #4cc9f0 100%)" },
  { name: "Deep Violet", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Emerald Flow", gradient: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)" },
  { name: "Dark Velvet", gradient: "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)" },
  { name: "Aurora Borealis", gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { name: "Obsidian Gold", gradient: "linear-gradient(135deg, #1a1a1a 0%, #d4af37 50%, #000000 100%)" },
  { name: "Midnight Blue", gradient: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" },
  { name: "Rose Dusk", gradient: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)" },
  { name: "Electric Indigo", gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)" },
  { name: "Silver Titanium", gradient: "linear-gradient(135deg, #2c3e50 0%, #bdc3c7 100%)" },
];

export function parseGradientString(str: string): GradientConfig | null {
  if (!str || !str.includes("gradient")) return null;
  const isRadial = str.startsWith("radial-gradient");
  let angle = 135;

  const angleMatch = str.match(/(\d+)deg/);
  if (angleMatch) {
    angle = parseInt(angleMatch[1], 10);
  } else if (str.includes("to right")) angle = 90;
  else if (str.includes("to bottom")) angle = 180;
  else if (str.includes("to top")) angle = 0;
  else if (str.includes("to left")) angle = 270;

  // Extract stops inside gradient parentheses
  const inner = str.replace(/^(linear|radial)-gradient\(/, "").replace(/\)$/, "");
  const parts = inner.split(/,(?![^(]*\))/);
  const stops: GradientStop[] = [];
  let idCount = 0;

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.endsWith("deg") || trimmed.startsWith("to ") || trimmed.startsWith("circle")) continue;

    const offsetMatch = trimmed.match(/\s+(\d+(\.\d+)?)%$/);
    let offset = 0;
    let color = trimmed;
    if (offsetMatch) {
      offset = parseFloat(offsetMatch[1]);
      color = trimmed.substring(0, offsetMatch.index).trim();
    } else {
      offset = stops.length === 0 ? 0 : 100;
    }
    stops.push({ id: `stop-${++idCount}`, color, offset });
  }

  if (stops.length < 2) {
    stops.push({ id: `stop-1`, color: "#3b82f6", offset: 0 });
    stops.push({ id: `stop-2`, color: "#8b5cf6", offset: 100 });
  }

  return {
    type: isRadial ? "radial" : "linear",
    angle,
    stops,
  };
}

export function buildGradientString(config: GradientConfig): string {
  const sortedStops = [...config.stops].sort((a, b) => a.offset - b.offset);
  const stopsStr = sortedStops.map((s) => `${s.color} ${s.offset}%`).join(", ");
  if (config.type === "radial") {
    return `radial-gradient(circle, ${stopsStr})`;
  }
  return `linear-gradient(${config.angle}deg, ${stopsStr})`;
}

export default function ColorPicker({
  value,
  onChange,
  onCommit,
  allowTransparent = true,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"solid" | "gradient">(() => {
    return value && value.includes("gradient") ? "gradient" : "solid";
  });
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("vse_recent_colors");
      return saved ? JSON.parse(saved) : DEFAULT_PALETTE.slice(0, 8);
    } catch {
      return DEFAULT_PALETTE.slice(0, 8);
    }
  });

  // Solid HSV State: h: [0, 360], s: [0, 1], v: [0, 1], a: [0, 1]
  const [hue, setHue] = useState(210);
  const [sat, setSat] = useState(1);
  const [val, setVal] = useState(1);
  const [alpha, setAlpha] = useState(1);
  const [isTransparent, setIsTransparent] = useState(false);

  // Gradient State
  const [gradientConfig, setGradientConfig] = useState<GradientConfig>(() => {
    const parsed = parseGradientString(value);
    if (parsed) return parsed;
    return {
      type: "linear",
      angle: 135,
      stops: [
        { id: "s-1", color: "#3b82f6", offset: 0 },
        { id: "s-2", color: "#8b5cf6", offset: 100 },
      ],
    };
  });
  const [activeStopId, setActiveStopId] = useState<string>("s-1");

  const currentHsvRef = useRef({
    hue: 210,
    sat: 1,
    val: 1,
    alpha: 1,
    isTransparent: false,
  });

  const [textInput, setTextInput] = useState("#0099ff");
  const [alphaInput, setAlphaInput] = useState("100%");

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const spectrumRef = useRef<HTMLDivElement | null>(null);
  const isDraggingSpectrum = useRef(false);
  const gradientTrackRef = useRef<HTMLDivElement | null>(null);

  // Parse incoming value
  useEffect(() => {
    if (!value) {
      setIsTransparent(true);
      setAlpha(0);
      currentHsvRef.current = { ...currentHsvRef.current, alpha: 0, isTransparent: true };
      setTextInput("transparent");
      setAlphaInput("0%");
      return;
    }

    if (value.includes("gradient")) {
      setPickerMode("gradient");
      const parsedGrad = parseGradientString(value);
      if (parsedGrad) {
        setGradientConfig(parsedGrad);
        if (parsedGrad.stops.length > 0) {
          setActiveStopId(parsedGrad.stops[0].id);
          syncHsvFromColorString(parsedGrad.stops[0].color);
        }
      }
      setTextInput(value);
      return;
    }

    if (value === "transparent" || value === "rgba(0, 0, 0, 0)" || value === "#00000000") {
      setIsTransparent(true);
      setAlpha(0);
      currentHsvRef.current = { ...currentHsvRef.current, alpha: 0, isTransparent: true };
      setTextInput("transparent");
      setAlphaInput("0%");
      return;
    }

    setIsTransparent(false);
    syncHsvFromColorString(value);
  }, [value, format]);

  function syncHsvFromColorString(colorStr: string) {
    let colorToParse = colorStr;
    if (colorToParse === "white") colorToParse = "#ffffff";
    else if (colorToParse === "black") colorToParse = "#000000";
    else {
      const match = DEFAULT_COLORS.find((c) => c.name === colorToParse);
      if (match) colorToParse = match.hex;
    }

    const parsed = parseColor(colorToParse);
    if (parsed) {
      const hsv = toHsv(parsed);
      const nextHue = hsv.h !== undefined && !isNaN(hsv.h) ? hsv.h : currentHsvRef.current.hue;
      const nextSat = hsv.s !== undefined && !isNaN(hsv.s) ? hsv.s : (hsv.v === 0 ? currentHsvRef.current.sat : 0);
      const nextVal = hsv.v !== undefined && !isNaN(hsv.v) ? hsv.v : 1;
      const nextAlpha = parsed.alpha !== undefined ? parsed.alpha : 1;

      setHue(nextHue);
      setSat(nextSat);
      setVal(nextVal);
      setAlpha(nextAlpha);
      currentHsvRef.current = {
        hue: nextHue,
        sat: nextSat,
        val: nextVal,
        alpha: nextAlpha,
        isTransparent: false,
      };
      setAlphaInput(`${Math.round(nextAlpha * 100)}%`);

      if (format === "hex") {
        if (nextAlpha < 0.999) {
          setTextInput(formatHex8(parsed) || colorToParse);
        } else {
          setTextInput(formatHex(parsed) || colorToParse);
        }
      } else if (format === "rgb") {
        setTextInput(formatRgb(parsed) || colorToParse);
      } else {
        setTextInput(formatHsl(parsed) || colorToParse);
      }
    } else {
      setTextInput(colorStr);
    }
  }

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
    const isTrans = a === 0;
    setIsTransparent(isTrans);
    setHue(h);
    setSat(s);
    setVal(v);
    setAlpha(a);
    currentHsvRef.current = { hue: h, sat: s, val: v, alpha: a, isTransparent: isTrans };

    const colorResult = computeColorString(h, s, v, a, format);

    if (pickerMode === "gradient") {
      const nextStops = gradientConfig.stops.map((st) =>
        st.id === activeStopId ? { ...st, color: colorResult } : st
      );
      const nextConfig = { ...gradientConfig, stops: nextStops };
      setGradientConfig(nextConfig);
      const gradCss = buildGradientString(nextConfig);
      setTextInput(gradCss);
      onChange(gradCss);
      if (isCommit) {
        onCommit(gradCss);
        pushRecentColor(colorResult);
      }
    } else {
      setTextInput(colorResult);
      setAlphaInput(`${Math.round(a * 100)}%`);
      onChange(colorResult);
      if (isCommit) {
        onCommit(colorResult);
        if (colorResult !== "transparent") pushRecentColor(colorResult);
      }
    }
  }

  // Handle Transparent Selection
  function handleSelectTransparent() {
    setIsTransparent(true);
    setAlpha(0);
    currentHsvRef.current = { ...currentHsvRef.current, alpha: 0, isTransparent: true };
    setTextInput("transparent");
    setAlphaInput("0%");
    if (pickerMode === "gradient") {
      emitColor(hue, sat, val, 0, true);
    } else {
      onChange("transparent");
      onCommit("transparent");
    }
  }

  // Spectrum 2D Drag Handling
  function handleSpectrumMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    isDraggingSpectrum.current = true;

    function updateFromCoords(clientX: number, clientY: number, isCommit = false) {
      if (!spectrumRef.current) return;
      const rect = spectrumRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height));

      const nextSat = Number((x / rect.width).toFixed(3));
      const nextVal = Number((1 - y / rect.height).toFixed(3));
      const h = currentHsvRef.current.hue;
      const a = currentHsvRef.current.isTransparent ? 1 : currentHsvRef.current.alpha;

      emitColor(h, nextSat, nextVal, a, isCommit);
    }

    updateFromCoords(e.clientX, e.clientY, false);

    function onMouseMove(moveEvent: MouseEvent) {
      if (isDraggingSpectrum.current) {
        updateFromCoords(moveEvent.clientX, moveEvent.clientY, false);
      }
    }

    function onMouseUp(upEvent: MouseEvent) {
      if (isDraggingSpectrum.current) {
        isDraggingSpectrum.current = false;
        updateFromCoords(upEvent.clientX, upEvent.clientY, true);
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
            const h = hsv.h || 0;
            const s = hsv.s || 1;
            const v = hsv.v || 1;
            emitColor(h, s, v, 1, true);
          }
        }
      } catch {}
    }
  }

  // Gradient Track Click to add stop
  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!gradientTrackRef.current) return;
    const rect = gradientTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));

    const currentColor = computeColorString(hue, sat, val, alpha, format);
    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      color: currentColor,
      offset: pct,
    };

    const nextStops = [...gradientConfig.stops, newStop].sort((a, b) => a.offset - b.offset);
    const nextConfig = { ...gradientConfig, stops: nextStops };
    setGradientConfig(nextConfig);
    setActiveStopId(newStop.id);
    const gradCss = buildGradientString(nextConfig);
    setTextInput(gradCss);
    onChange(gradCss);
    onCommit(gradCss);
  }

  // Delete active gradient stop
  function handleDeleteActiveStop() {
    if (gradientConfig.stops.length <= 2) return;
    const nextStops = gradientConfig.stops.filter((s) => s.id !== activeStopId);
    const nextConfig = { ...gradientConfig, stops: nextStops };
    setGradientConfig(nextConfig);
    setActiveStopId(nextStops[0].id);
    syncHsvFromColorString(nextStops[0].color);
    const gradCss = buildGradientString(nextConfig);
    setTextInput(gradCss);
    onChange(gradCss);
    onCommit(gradCss);
  }

  // Reverse gradient stops
  function handleReverseGradient() {
    const nextStops = gradientConfig.stops.map((s) => ({
      ...s,
      offset: 100 - s.offset,
    }));
    const nextConfig = { ...gradientConfig, stops: nextStops };
    setGradientConfig(nextConfig);
    const gradCss = buildGradientString(nextConfig);
    setTextInput(gradCss);
    onChange(gradCss);
    onCommit(gradCss);
  }

  // Select Preset Gradient
  function handleApplyGradientPreset(presetGradient: string) {
    const parsed = parseGradientString(presetGradient);
    if (!parsed) return;
    setGradientConfig(parsed);
    if (parsed.stops.length > 0) {
      setActiveStopId(parsed.stops[0].id);
      syncHsvFromColorString(parsed.stops[0].color);
    }
    setTextInput(presetGradient);
    onChange(presetGradient);
    onCommit(presetGradient);
    pushRecentColor(presetGradient);
  }

  // Interactive Opacity Handlers (0% - 100%)
  function handleAlphaInputChange(val: string) {
    setAlphaInput(val);
    const cleaned = val.replace("%", "").trim();
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(100, num));
      const nextAlpha = Number((clamped / 100).toFixed(2));
      emitColor(
        currentHsvRef.current.hue,
        currentHsvRef.current.sat,
        currentHsvRef.current.val,
        nextAlpha,
        false
      );
    }
  }

  function commitAlphaInput() {
    const cleaned = alphaInput.replace("%", "").trim();
    const num = parseFloat(cleaned);
    const clamped = isNaN(num) ? 100 : Math.max(0, Math.min(100, num));
    const nextAlpha = Number((clamped / 100).toFixed(2));
    setAlphaInput(`${Math.round(clamped)}%`);
    emitColor(
      currentHsvRef.current.hue,
      currentHsvRef.current.sat,
      currentHsvRef.current.val,
      nextAlpha,
      true
    );
  }

  // Close Popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const pureHueHex = formatHex(toRgb({ mode: "hsv", h: hue, s: 1, v: 1, alpha: 1 })) || "#ff0000";
  const displayColorHex = isTransparent
    ? "transparent"
    : formatHex(toRgb({ mode: "hsv", h: hue, s: sat, v: val, alpha })) || "#000000";

  const isGradient = value && value.includes("gradient");
  const activeStop = gradientConfig.stops.find((s) => s.id === activeStopId) || gradientConfig.stops[0];
  const liveGradientCss = buildGradientString(gradientConfig);

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
          title="Click to open color picker & gradient maker"
        >
          <div
            className="w-full h-full"
            style={{
              background: isGradient ? value : isTransparent ? "transparent" : displayColorHex,
            }}
          />
          {isTransparent && !isGradient && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
              <Ban className="w-4 h-4 text-red-500" />
            </div>
          )}
          {isGradient && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Sparkles className="w-3.5 h-3.5 text-white drop-shadow-md" />
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
            if (val.includes("gradient")) {
              setPickerMode("gradient");
              const parsed = parseGradientString(val);
              if (parsed) {
                setGradientConfig(parsed);
                onChange(val);
              }
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
            if (val.includes("gradient")) {
              onCommit(val);
              pushRecentColor(val);
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
          className="flex-1 bg-[#141414] border border-[#262626] focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono outline-none truncate"
          placeholder="#000000, transparent, or linear-gradient(...)"
          aria-label="Color string value"
        />

        {/* Opacity Control Input */}
        <div
          className="w-16 bg-[#141414] border border-[#262626] focus-within:border-[#0099ff] focus-within:ring-1 focus-within:ring-[#0099ff] rounded-lg px-1.5 py-1.5 flex items-center shrink-0"
          title="Color opacity percentage (0% - 100%)"
        >
          <input
            type="text"
            value={alphaInput}
            onChange={(e) => handleAlphaInputChange(e.target.value)}
            onBlur={() => commitAlphaInput()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAlphaInput();
            }}
            aria-label="Color opacity percentage"
            className="w-full bg-transparent text-xs text-zinc-200 font-mono text-center outline-none"
            placeholder="100%"
          />
        </div>
      </div>

      {/* Popover Color Picker Window with Solid & Gradient Tabs */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-[#141414] border border-[#262626] rounded-3xl shadow-2xl z-50 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150 select-none text-zinc-200">
          {/* Mode Switcher: Solid vs Gradient */}
          <div className="grid grid-cols-2 p-1 bg-[#1c1c1c] rounded-2xl border border-[#282828]">
            <button
              type="button"
              onClick={() => {
                setPickerMode("solid");
                const solidColor = computeColorString(hue, sat, val, alpha, format);
                setTextInput(solidColor);
                onChange(solidColor);
                onCommit(solidColor);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                pickerMode === "solid"
                  ? "bg-[#0099ff] text-white shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-current opacity-80" />
              <span>Solid Color</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPickerMode("gradient");
                const gradCss = buildGradientString(gradientConfig);
                setTextInput(gradCss);
                onChange(gradCss);
                onCommit(gradCss);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                pickerMode === "gradient"
                  ? "bg-[#0099ff] text-white shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gradient Maker</span>
            </button>
          </div>

          {/* GRADIENT CONTROLS SECTION */}
          {pickerMode === "gradient" && (
            <div className="space-y-3 p-3 bg-[#18181a] border border-[#262626] rounded-2xl">
              {/* 1. Interactive Gradient Track */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                  <span>Interactive Stops ({gradientConfig.stops.length})</span>
                  <span className="text-[10px] text-zinc-500">Click bar to add stop</span>
                </div>

                <div
                  ref={gradientTrackRef}
                  onClick={handleTrackClick}
                  className="relative w-full h-7 rounded-xl cursor-copy shadow-inner overflow-visible border border-white/10"
                  style={{
                    background: liveGradientCss,
                  }}
                  title="Click anywhere on the bar to add a new gradient stop"
                >
                  {/* Stop Draggable Thumb Pins */}
                  {gradientConfig.stops.map((stop) => {
                    const isActive = stop.id === activeStopId;
                    return (
                      <div
                        key={stop.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStopId(stop.id);
                          syncHsvFromColorString(stop.color);
                        }}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 cursor-pointer transition-transform hover:scale-125 z-20 shadow-lg ${
                          isActive
                            ? "border-white ring-2 ring-[#0099ff] scale-110"
                            : "border-black/50 hover:border-white"
                        }`}
                        style={{
                          left: `${stop.offset}%`,
                          backgroundColor: stop.color,
                        }}
                        title={`Stop at ${stop.offset}% (${stop.color}). Click to edit.`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 2. Stop Position & Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-zinc-400 text-[11px]">Stop Pos:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={activeStop?.offset ?? 0}
                    onChange={(e) => {
                      const nextOffset = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      const nextStops = gradientConfig.stops.map((s) =>
                        s.id === activeStopId ? { ...s, offset: nextOffset } : s
                      );
                      const nextConfig = { ...gradientConfig, stops: nextStops };
                      setGradientConfig(nextConfig);
                      const gradCss = buildGradientString(nextConfig);
                      setTextInput(gradCss);
                      onChange(gradCss);
                      onCommit(gradCss);
                    }}
                    className="w-14 bg-[#141414] border border-[#2e2e2e] rounded-lg px-1.5 py-0.5 text-xs text-center font-mono text-zinc-200 outline-none focus:border-[#0099ff]"
                  />
                  <span className="text-zinc-400 text-xs">%</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleReverseGradient}
                    className="p-1.5 rounded-lg bg-[#222] hover:bg-[#2e2e2e] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Reverse gradient stops direction"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={gradientConfig.stops.length <= 2}
                    onClick={handleDeleteActiveStop}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      gradientConfig.stops.length <= 2
                        ? "opacity-30 text-zinc-600 cursor-not-allowed"
                        : "bg-[#222] hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                    }`}
                    title="Remove selected gradient stop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3. Gradient Angle & Direction */}
              <div className="space-y-1.5 pt-1 border-t border-[#262626]">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                  <span>Linear Angle</span>
                  <span className="font-mono text-[#0099ff]">{gradientConfig.angle}°</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradientConfig.angle}
                    onChange={(e) => {
                      const nextAngle = parseInt(e.target.value, 10);
                      const nextConfig = { ...gradientConfig, angle: nextAngle, type: "linear" as const };
                      setGradientConfig(nextConfig);
                      const gradCss = buildGradientString(nextConfig);
                      setTextInput(gradCss);
                      onChange(gradCss);
                    }}
                    onPointerUp={() => {
                      const gradCss = buildGradientString(gradientConfig);
                      onCommit(gradCss);
                    }}
                    className="flex-1 accent-[#0099ff] h-1.5 bg-[#262626] rounded-full cursor-pointer"
                  />

                  {/* Quick Angle Presets */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: "0°", angle: 0 },
                      { label: "90°", angle: 90 },
                      { label: "135°", angle: 135 },
                      { label: "180°", angle: 180 },
                    ].map((btn) => (
                      <button
                        key={btn.angle}
                        type="button"
                        onClick={() => {
                          const nextConfig = { ...gradientConfig, angle: btn.angle, type: "linear" as const };
                          setGradientConfig(nextConfig);
                          const gradCss = buildGradientString(nextConfig);
                          setTextInput(gradCss);
                          onChange(gradCss);
                          onCommit(gradCss);
                        }}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          gradientConfig.angle === btn.angle
                            ? "bg-[#0099ff] border-[#0099ff] text-white font-bold"
                            : "bg-[#222] border-[#333] text-zinc-400 hover:text-white"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2D SATURATION & BRIGHTNESS SPECTRUM BOX */}
          <div
            ref={spectrumRef}
            onMouseDown={handleSpectrumMouseDown}
            className="relative w-full h-32 rounded-2xl cursor-crosshair overflow-hidden shadow-inner border border-[#282828]"
            style={{
              backgroundColor: pureHueHex,
              backgroundImage: `linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, transparent)`,
            }}
          >
            {/* Draggable Circle Thumb */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${sat * 100}%`,
                top: `${(1 - val) * 100}%`,
                backgroundColor: isTransparent ? "transparent" : displayColorHex,
              }}
            />
          </div>

          {/* Tools & Sliders Row (EyeDropper + Rainbow Hue + Alpha Slider) */}
          <div className="flex items-center gap-3">
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
                    const s = currentHsvRef.current.sat;
                    const v = currentHsvRef.current.val;
                    const a = currentHsvRef.current.isTransparent ? 1 : currentHsvRef.current.alpha;
                    emitColor(nextHue, s, v, a, false);
                  }}
                  onPointerUp={(e) => {
                    const targetVal = parseFloat((e.target as HTMLInputElement).value);
                    const nextHue = !isNaN(targetVal) ? targetVal : currentHsvRef.current.hue;
                    const s = currentHsvRef.current.sat;
                    const v = currentHsvRef.current.val;
                    const a = currentHsvRef.current.isTransparent ? 1 : currentHsvRef.current.alpha;
                    emitColor(nextHue, s, v, a, true);
                  }}
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

              {/* Alpha Opacity Slider */}
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
                    const nextAlpha = parseFloat(e.target.value);
                    const h = currentHsvRef.current.hue;
                    const s = currentHsvRef.current.sat;
                    const v = currentHsvRef.current.val;
                    emitColor(h, s, v, nextAlpha, false);
                  }}
                  onPointerUp={(e) => {
                    const targetVal = parseFloat((e.target as HTMLInputElement).value);
                    const nextAlpha = !isNaN(targetVal) ? targetVal : currentHsvRef.current.alpha;
                    const h = currentHsvRef.current.hue;
                    const s = currentHsvRef.current.sat;
                    const v = currentHsvRef.current.val;
                    emitColor(h, s, v, nextAlpha, true);
                  }}
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

          {/* Formats and Numerical Readouts */}
          <div className="flex items-center gap-2 text-xs">
            <div className="relative">
              <select
                value={format}
                aria-label="Color model format"
                onChange={(e) => setFormat(e.target.value as ColorFormat)}
                className="bg-[#1c1c1c] border border-[#262626] text-zinc-300 font-semibold py-1.5 pl-2.5 pr-6 rounded-xl appearance-none cursor-pointer outline-none focus:border-[#0099ff]"
              >
                <option value="hex">HEX</option>
                <option value="rgb">RGB</option>
                <option value="hsl">HSL</option>
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <input
              type="text"
              value={textInput}
              aria-label="Formatted color value"
              onChange={(e) => setTextInput(e.target.value)}
              onBlur={() => {
                const val = textInput.trim();
                if (val.includes("gradient")) {
                  onCommit(val);
                  pushRecentColor(val);
                  return;
                }
                const parsed = parseColor(val);
                if (parsed) {
                  onCommit(val);
                  pushRecentColor(val);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onCommit(textInput.trim());
                  pushRecentColor(textInput.trim());
                }
              }}
              className="flex-1 bg-[#1c1c1c] border border-[#262626] text-zinc-200 font-mono text-center py-1.5 px-2 rounded-xl outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] truncate"
            />

            <div
              className="w-16 bg-[#1c1c1c] border border-[#262626] focus-within:border-[#0099ff] focus-within:ring-1 focus-within:ring-[#0099ff] rounded-xl py-1.5 px-2 flex items-center shrink-0"
              title="Color opacity percentage (0% - 100%)"
            >
              <input
                type="text"
                value={alphaInput}
                onChange={(e) => handleAlphaInputChange(e.target.value)}
                onBlur={() => commitAlphaInput()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitAlphaInput();
                }}
                aria-label="Color opacity percentage"
                className="w-full bg-transparent text-xs text-zinc-200 font-mono text-center outline-none"
              />
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
                  : "bg-[#1c1c1c] text-zinc-300 border-[#282828] hover:bg-[#262626]"
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-red-500" />
              <span>Set as Transparent</span>
              {isTransparent && <Check className="w-3.5 h-3.5 text-red-500 ml-auto" />}
            </button>
          )}

          {/* DESIGNER GRADIENT PRESETS (When in Gradient Mode) */}
          {pickerMode === "gradient" && (
            <div className="space-y-2 pt-2 border-t border-[#262626]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                <span>Designer Gradient Presets</span>
                <Sparkles className="w-3 h-3 text-[#0099ff]" />
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyGradientPreset(preset.gradient)}
                    className="w-10 h-7 rounded-lg border border-white/10 hover:border-white hover:scale-110 transition-all cursor-pointer shadow-md overflow-hidden"
                    style={{ background: preset.gradient }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* LAST COLORS / SWATCHES (When in Solid Mode) */}
          {pickerMode === "solid" && (
            <div className="space-y-2 pt-1 border-t border-[#262626]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                <span>Last Colors</span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </div>

              <div className="grid grid-cols-8 gap-1.5">
                {allowTransparent && (
                  <button
                    type="button"
                    onClick={handleSelectTransparent}
                    className="w-6 h-6 rounded-lg border border-[#38383c] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer overflow-hidden relative shadow-sm"
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

                {recentColors.map((colorHex, idx) => (
                  <button
                    key={`${colorHex}-${idx}`}
                    type="button"
                    onClick={() => {
                      if (colorHex.includes("gradient")) {
                        handleApplyGradientPreset(colorHex);
                        return;
                      }
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
                    className="w-6 h-6 rounded-lg border border-white/10 shadow-sm hover:scale-110 transition-transform cursor-pointer shrink-0"
                    style={{ background: colorHex }}
                    title={colorHex}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
