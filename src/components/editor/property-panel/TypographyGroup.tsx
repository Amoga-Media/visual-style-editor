import { useEffect, useRef, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { applyLiveStyle, commitStyleChange, isStyleableElement } from "@/lib/dom/live-style-engine";
import { getResponsivePropertyInfo, resetResponsivePropertyForViewport, syncResponsiveStylesheet } from "@/lib/dom/responsive-style-engine";
import { POPULAR_FONTS, loadFontInDocument, cleanFontFamilyName, getFontFamilyCssValue, type FontOption } from "@/lib/fonts/google-fonts";
import ValueInput from "./ValueInput";
import InlineTextEditor from "../InlineTextEditor";
import {
  Type,
  Italic,
  Underline,
  Strikethrough,
  ChevronDown,
  Search,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

type LengthUnit = "px" | "rem" | "em" | "pt" | "vw" | "%";
type TextAlignValue = "left" | "center" | "right" | "justify";
type TextTransformValue = "none" | "uppercase" | "lowercase" | "capitalize";
type TextDecorationValue = "none" | "underline" | "line-through";

interface LengthValue {
  amount: number;
  unit: LengthUnit;
}

const FONT_SIZE_UNITS: LengthUnit[] = ["px", "rem", "em", "pt", "vw", "%"];
const LINE_HEIGHT_UNITS: LengthUnit[] = ["px", "rem", "em", "%", "pt"];
const LETTER_SPACING_UNITS: LengthUnit[] = ["px", "rem", "em", "pt", "%"];

const FONT_SIZE_RANGE: Record<LengthUnit, { min: number; max: number; step: number }> = {
  px: { min: 6, max: 160, step: 1 },
  rem: { min: 0.5, max: 10, step: 0.125 },
  em: { min: 0.5, max: 10, step: 0.125 },
  pt: { min: 6, max: 120, step: 1 },
  vw: { min: 0.5, max: 20, step: 0.25 },
  "%": { min: 25, max: 800, step: 5 },
};

const LINE_HEIGHT_RANGE: Record<LengthUnit, { min: number; max: number; step: number }> = {
  px: { min: 8, max: 200, step: 1 },
  rem: { min: 0.5, max: 12, step: 0.125 },
  em: { min: 0.5, max: 12, step: 0.125 },
  "%": { min: 50, max: 400, step: 5 },
  pt: { min: 8, max: 150, step: 1 },
  vw: { min: 1, max: 25, step: 0.5 },
};

const LETTER_SPACING_RANGE: Record<LengthUnit, { min: number; max: number; step: number }> = {
  px: { min: -10, max: 40, step: 0.5 },
  rem: { min: -0.5, max: 2.5, step: 0.05 },
  em: { min: -0.5, max: 2.5, step: 0.05 },
  pt: { min: -10, max: 30, step: 0.5 },
  "%": { min: -20, max: 100, step: 1 },
  vw: { min: -1, max: 5, step: 0.1 },
};

const FONT_WEIGHT_OPTIONS = [
  { label: "Thin (100)", value: "100" },
  { label: "Extralight (200)", value: "200" },
  { label: "Light (300)", value: "300" },
  { label: "Normal (400)", value: "400" },
  { label: "Medium (500)", value: "500" },
  { label: "Semibold (600)", value: "600" },
  { label: "Bold (700)", value: "700" },
  { label: "Extrabold (800)", value: "800" },
  { label: "Black (900)", value: "900" },
];

const FONT_CATEGORIES = ["All", "Sans-Serif", "Serif", "Display", "Monospace", "Handwriting", "System"] as const;

function parseLength(raw: string, defaultAmount = 16, defaultUnit: LengthUnit = "px"): LengthValue {
  if (!raw) return { amount: defaultAmount, unit: defaultUnit };
  const match = raw.match(/^([-\d.]+)\s*(px|rem|em|pt|vw|%)?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const u = (match[2]?.toLowerCase() as LengthUnit) || defaultUnit;
    return { amount: isNaN(num) ? defaultAmount : num, unit: u };
  }
  const bareNum = parseFloat(raw);
  return { amount: isNaN(bareNum) ? defaultAmount : bareNum, unit: defaultUnit };
}

interface TypographyGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

export default function TypographyGroup({
  element,
  structuralPath,
  theme,
  viewport = "desktop",
  onEdit,
}: TypographyGroupProps) {
  const [fontFamily, setFontFamily] = useState<string>("Inter");
  const [fontSize, setFontSize] = useState<LengthValue>({ amount: 16, unit: "px" });
  const [lineHeight, setLineHeight] = useState<LengthValue>({ amount: 24, unit: "px" });
  const [letterSpacing, setLetterSpacing] = useState<LengthValue>({ amount: 0, unit: "px" });
  const [fontWeight, setFontWeight] = useState<string>("400");
  const [textAlign, setTextAlign] = useState<TextAlignValue>("left");
  const [fontStyle, setFontStyle] = useState<string>("normal");
  const [textTransform, setTextTransform] = useState<TextTransformValue>("none");
  const [textDecoration, setTextDecoration] = useState<TextDecorationValue>("none");

  // Font Picker Dropdown State
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [fontSearch, setFontSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const fontPickerRef = useRef<HTMLDivElement | null>(null);

  const prevElementRef = useRef<Element | null>(null);
  const baselineFontFamilyRef = useRef<string>("");
  const baselineFontSizeRef = useRef<string>("");
  const baselineLineHeightRef = useRef<string>("");
  const baselineLetterSpacingRef = useRef<string>("");
  const baselineFontWeightRef = useRef<string>("");
  const baselineTextAlignRef = useRef<string>("");
  const baselineFontStyleRef = useRef<string>("");
  const baselineTextTransformRef = useRef<string>("");
  const baselineTextDecorationRef = useRef<string>("");

  useEffect(() => {
    if (!element) return;
    const isNew = element !== prevElementRef.current;
    prevElementRef.current = element;

    const rawFamily = (isStyleableElement(element) && element.style.fontFamily)
      ? element.style.fontFamily
      : readCurrentValue(element, "font-family", theme);
    const cleanedFamily = cleanFontFamilyName(rawFamily);
    setFontFamily(cleanedFamily || "Inter");
    if (isNew) baselineFontFamilyRef.current = rawFamily || cleanedFamily;

    const sizeInfo = getResponsivePropertyInfo(element, structuralPath || "", "font-size", viewport);
    const rawSize = sizeInfo.value || readCurrentValue(element, "font-size", theme);
    const parsedSize = parseLength(rawSize, 16, "px");
    setFontSize(parsedSize);
    if (isNew) baselineFontSizeRef.current = rawSize || `${parsedSize.amount}${parsedSize.unit}`;

    const lhInfo = getResponsivePropertyInfo(element, structuralPath || "", "line-height", viewport);
    const rawLH = lhInfo.value || readCurrentValue(element, "line-height", theme);
    const parsedLH = parseLength(rawLH, 24, "px");
    setLineHeight(parsedLH);
    if (isNew) baselineLineHeightRef.current = rawLH || `${parsedLH.amount}${parsedLH.unit}`;

    const lsInfo = getResponsivePropertyInfo(element, structuralPath || "", "letter-spacing", viewport);
    const rawLS = lsInfo.value || readCurrentValue(element, "letter-spacing", theme);
    const parsedLS = parseLength(rawLS, 0, "px");
    setLetterSpacing(parsedLS);
    if (isNew) baselineLetterSpacingRef.current = rawLS || `${parsedLS.amount}${parsedLS.unit}`;

    const rawFW = readCurrentValue(element, "font-weight", theme);
    setFontWeight(rawFW || "400");
    if (isNew) baselineFontWeightRef.current = rawFW || "400";

    const rawTA = readCurrentValue(element, "text-align", theme) as TextAlignValue;
    setTextAlign(rawTA || "left");
    if (isNew) baselineTextAlignRef.current = rawTA || "left";

    const win = element.ownerDocument?.defaultView || window;
    const computed = win.getComputedStyle(element);

    const rawFS = computed.fontStyle || "normal";
    setFontStyle(rawFS);
    if (isNew) baselineFontStyleRef.current = rawFS;

    const rawTT = (computed.textTransform || "none") as TextTransformValue;
    setTextTransform(rawTT);
    if (isNew) baselineTextTransformRef.current = rawTT;

    const rawTD = (computed.textDecorationLine || computed.textDecoration || "none") as TextDecorationValue;
    setTextDecoration(rawTD.includes("underline") ? "underline" : rawTD.includes("line-through") ? "line-through" : "none");
    if (isNew) baselineTextDecorationRef.current = rawTD;
  }, [element, theme, viewport, structuralPath]);

  // Outside click to close font dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (fontPickerRef.current && !fontPickerRef.current.contains(e.target as Node)) {
        setFontDropdownOpen(false);
      }
    }
    if (fontDropdownOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [fontDropdownOpen]);

  if (!element || !structuralPath) return null;

  function handleSelectFont(font: FontOption) {
    setFontFamily(font.name);
    setFontDropdownOpen(false);

    // 1. Inject font into iframe document head
    loadFontInDocument(element?.ownerDocument, font.name);

    // 2. Apply live style and commit
    applyLiveStyle(element!, "font-family", font.cssValue, theme, undefined, viewport, structuralPath!);
    commitStyleChange(
      element!,
      structuralPath!,
      "font-family",
      font.cssValue,
      theme,
      onEdit,
      baselineFontFamilyRef.current,
      undefined,
      viewport
    );
    baselineFontFamilyRef.current = font.cssValue;
  }

  function commitFontSize(amount: number, unitStr: string) {
    const unit = (unitStr as LengthUnit) || "px";
    const val = `${amount}${unit}`;
    setFontSize({ amount, unit });
    commitStyleChange(
      element!,
      structuralPath!,
      "font-size",
      val,
      theme,
      onEdit,
      baselineFontSizeRef.current,
      undefined,
      viewport
    );
    baselineFontSizeRef.current = val;
  }

  function handleResetSizeOverride() {
    if (viewport === "desktop" || viewport === "all" || !structuralPath) return;
    resetResponsivePropertyForViewport(structuralPath, "font-size", viewport, element?.ownerDocument || null);
    syncResponsiveStylesheet(element?.ownerDocument || null);
    const updatedInfo = getResponsivePropertyInfo(element!, structuralPath, "font-size", viewport);
    const parsed = parseLength(updatedInfo.value, 16, "px");
    setFontSize(parsed);
  }

  function commitLineHeight(amount: number, unitStr: string) {
    const unit = (unitStr as LengthUnit) || "px";
    const val = `${amount}${unit}`;
    setLineHeight({ amount, unit });
    commitStyleChange(
      element!,
      structuralPath!,
      "line-height",
      val,
      theme,
      onEdit,
      baselineLineHeightRef.current,
      undefined,
      viewport
    );
    baselineLineHeightRef.current = val;
  }

  function commitLetterSpacing(amount: number, unitStr: string) {
    const unit = (unitStr as LengthUnit) || "px";
    const val = `${amount}${unit}`;
    setLetterSpacing({ amount, unit });
    commitStyleChange(
      element!,
      structuralPath!,
      "letter-spacing",
      val,
      theme,
      onEdit,
      baselineLetterSpacingRef.current,
      undefined,
      viewport
    );
    baselineLetterSpacingRef.current = val;
  }

  function toggleFontStyle() {
    const next = fontStyle === "italic" ? "normal" : "italic";
    setFontStyle(next);
    applyLiveStyle(element!, "font-style", next, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "font-style" as any, next, theme, onEdit, baselineFontStyleRef.current, undefined, viewport);
    baselineFontStyleRef.current = next;
  }

  function handleTextAlignChange(val: TextAlignValue) {
    setTextAlign(val);
    applyLiveStyle(element!, "text-align", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "text-align", val, theme, onEdit, baselineTextAlignRef.current, undefined, viewport);
    baselineTextAlignRef.current = val;
  }

  function handleTextTransformChange(val: TextTransformValue) {
    const next = textTransform === val ? "none" : val;
    setTextTransform(next);
    applyLiveStyle(element!, "text-transform", next, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "text-transform" as any, next, theme, onEdit, baselineTextTransformRef.current, undefined, viewport);
    baselineTextTransformRef.current = next;
  }

  function handleTextDecorationChange(val: TextDecorationValue) {
    const next = textDecoration === val ? "none" : val;
    setTextDecoration(next);
    applyLiveStyle(element!, "text-decoration", next, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "text-decoration" as any, next, theme, onEdit, baselineTextDecorationRef.current, undefined, viewport);
    baselineTextDecorationRef.current = next;
  }

  const filteredFonts = POPULAR_FONTS.filter((f) => {
    const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(fontSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-3.5 space-y-3.5">
      <InlineTextEditor element={element} structuralPath={structuralPath} onEdit={onEdit} />

      {/* Font Family Picker (Google Fonts & System) */}
      <div ref={fontPickerRef} className="relative space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium">
          <span>Font Family</span>
          <span className="text-[10px] text-[#0099ff] font-mono">Google Fonts</span>
        </div>

        <button
          type="button"
          onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
          aria-label="Select font family"
          className="w-full bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-[#333333] focus:border-[#0099ff] rounded-lg px-2.5 py-1.5 text-left flex items-center justify-between transition-colors cursor-pointer group shadow-2xs"
        >
          <span className="text-xs font-medium text-slate-800 dark:text-white truncate font-sans">
            {fontFamily}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 transition-transform duration-150 ${fontDropdownOpen ? "rotate-180 text-[#0099ff]" : ""}`} />
        </button>

        {/* Font Selection Dropdown Modal */}
        {fontDropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-80 flex flex-col">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 ml-1" />
              <input
                type="text"
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                placeholder="Search Google fonts..."
                className="w-full bg-transparent text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none font-sans"
                autoFocus
              />
            </div>

            {/* Category Filter Pills */}
            <div className="p-1 border-b border-slate-200 dark:border-[#262626] bg-slate-100 dark:bg-[#090909] flex items-center gap-1 overflow-x-auto no-scrollbar">
              {FONT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap transition-colors cursor-pointer font-sans ${
                    selectedCategory === cat
                      ? "bg-[#0099ff] text-white font-semibold"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c1c1c]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Font Options List */}
            <div className="overflow-y-auto flex-1 p-1 space-y-0.5 divide-y divide-slate-100 dark:divide-[#262626]">
              {filteredFonts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 dark:text-zinc-500 font-sans">No matching fonts found</div>
              ) : (
                filteredFonts.map((font) => (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => handleSelectFont(font)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between cursor-pointer transition-colors ${
                      fontFamily.toLowerCase() === font.name.toLowerCase()
                        ? "bg-[#0099ff]/15 text-[#0099ff] font-semibold"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#262626] hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-sans font-medium text-slate-800 dark:text-zinc-100">
                        {font.name}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">{font.category}</span>
                    </div>
                    {fontFamily.toLowerCase() === font.name.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-[#0099ff]" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Font Size */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[13px] text-slate-800 dark:text-zinc-200 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Font Size</span>
            {viewport !== "desktop" && (() => {
              const resp = getResponsivePropertyInfo(element!, structuralPath!, "font-size", viewport);
              return resp.isOverridden ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-semibold">
                  {viewport}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-[#262626] text-slate-500 dark:text-zinc-400 font-mono">
                  {resp.inheritedFrom}
                </span>
              );
            })()}
          </div>
          <div className="flex items-center gap-1.5">
            {viewport !== "desktop" && getResponsivePropertyInfo(element!, structuralPath!, "font-size", viewport).isOverridden && (
              <button
                type="button"
                onClick={handleResetSizeOverride}
                className="text-[11px] text-[#0099ff] hover:underline cursor-pointer font-semibold"
                title="Reset to inherited size from larger viewport"
              >
                Reset
              </button>
            )}
            <ValueInput
              amount={fontSize.amount}
              unit={fontSize.unit}
              min={FONT_SIZE_RANGE[fontSize.unit]?.min ?? 6}
              max={FONT_SIZE_RANGE[fontSize.unit]?.max ?? 160}
              step={FONT_SIZE_RANGE[fontSize.unit]?.step ?? 1}
              allowedUnits={FONT_SIZE_UNITS}
              property="font-size"
              element={element}
              viewport={viewport}
              onChange={(amt, u) => {
                const unit = (u as LengthUnit) || fontSize.unit;
                setFontSize({ amount: amt, unit });
                applyLiveStyle(element, "font-size", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
              }}
              onCommit={commitFontSize}
            />
          </div>
        </div>
        <input
          type="range"
          min={FONT_SIZE_RANGE[fontSize.unit]?.min ?? 6}
          max={FONT_SIZE_RANGE[fontSize.unit]?.max ?? 120}
          step={FONT_SIZE_RANGE[fontSize.unit]?.step ?? 1}
          value={fontSize.amount}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setFontSize({ ...fontSize, amount: val });
            applyLiveStyle(element, "font-size", `${val}${fontSize.unit}`, theme, undefined, viewport, structuralPath!);
          }}
          onPointerUp={() => commitFontSize(fontSize.amount, fontSize.unit)}
          onKeyUp={() => commitFontSize(fontSize.amount, fontSize.unit)}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Line Height */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[13px] text-slate-800 dark:text-zinc-200 font-medium">
          <span>Line Height</span>
          <ValueInput
            amount={lineHeight.amount}
            unit={lineHeight.unit}
            min={LINE_HEIGHT_RANGE[lineHeight.unit]?.min ?? 8}
            max={LINE_HEIGHT_RANGE[lineHeight.unit]?.max ?? 160}
            step={LINE_HEIGHT_RANGE[lineHeight.unit]?.step ?? 1}
            allowedUnits={LINE_HEIGHT_UNITS}
            property="line-height"
            element={element}
            viewport={viewport}
            onChange={(amt, u) => {
              const unit = (u as LengthUnit) || lineHeight.unit;
              setLineHeight({ amount: amt, unit });
              applyLiveStyle(element, "line-height", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
            }}
            onCommit={commitLineHeight}
          />
        </div>
        <input
          type="range"
          min={LINE_HEIGHT_RANGE[lineHeight.unit]?.min ?? 8}
          max={LINE_HEIGHT_RANGE[lineHeight.unit]?.max ?? 120}
          step={LINE_HEIGHT_RANGE[lineHeight.unit]?.step ?? 1}
          value={lineHeight.amount}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setLineHeight({ ...lineHeight, amount: val });
            applyLiveStyle(element, "line-height", `${val}${lineHeight.unit}`, theme, undefined, viewport, structuralPath!);
          }}
          onPointerUp={() => commitLineHeight(lineHeight.amount, lineHeight.unit)}
          onKeyUp={() => commitLineHeight(lineHeight.amount, lineHeight.unit)}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Letter Spacing */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[13px] text-slate-800 dark:text-zinc-200 font-medium">
          <span>Letter Spacing</span>
          <ValueInput
            amount={letterSpacing.amount}
            unit={letterSpacing.unit}
            min={LETTER_SPACING_RANGE[letterSpacing.unit]?.min ?? -10}
            max={LETTER_SPACING_RANGE[letterSpacing.unit]?.max ?? 40}
            step={LETTER_SPACING_RANGE[letterSpacing.unit]?.step ?? 0.5}
            allowedUnits={LETTER_SPACING_UNITS}
            property="letter-spacing"
            element={element}
            viewport={viewport}
            onChange={(amt, u) => {
              const unit = (u as LengthUnit) || letterSpacing.unit;
              setLetterSpacing({ amount: amt, unit });
              applyLiveStyle(element, "letter-spacing", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
            }}
            onCommit={commitLetterSpacing}
          />
        </div>
        <input
          type="range"
          min={LETTER_SPACING_RANGE[letterSpacing.unit]?.min ?? -10}
          max={LETTER_SPACING_RANGE[letterSpacing.unit]?.max ?? 30}
          step={LETTER_SPACING_RANGE[letterSpacing.unit]?.step ?? 0.5}
          value={letterSpacing.amount}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setLetterSpacing({ ...letterSpacing, amount: val });
            applyLiveStyle(element, "letter-spacing", `${val}${letterSpacing.unit}`, theme, undefined, viewport, structuralPath!);
          }}
          onPointerUp={() => commitLetterSpacing(letterSpacing.amount, letterSpacing.unit)}
          onKeyUp={() => commitLetterSpacing(letterSpacing.amount, letterSpacing.unit)}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Weight & Alignment */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <label className="text-[13px] text-slate-800 dark:text-zinc-200 block mb-1 font-medium">Font Weight</label>
          <select
            value={fontWeight}
            onChange={(e) => {
              const val = e.target.value;
              setFontWeight(val);
              applyLiveStyle(element, "font-weight", val, theme, undefined, viewport, structuralPath);
              commitStyleChange(
                element,
                structuralPath,
                "font-weight",
                val,
                theme,
                onEdit,
                baselineFontWeightRef.current,
                undefined,
                viewport
              );
              baselineFontWeightRef.current = val;
            }}
            aria-label="Select font weight"
            className="w-full bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-800 dark:text-zinc-200 outline-none focus:border-[#0099ff] cursor-pointer"
          >
            {FONT_WEIGHT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 dark:text-zinc-400 block mb-1 font-medium">Alignment</label>
          <div className="flex items-center bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => handleTextAlignChange("left")}
              aria-label="Align Left"
              className={`flex-1 py-1 rounded flex items-center justify-center transition-colors cursor-pointer ${
                textAlign === "left"
                  ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleTextAlignChange("center")}
              aria-label="Align Center"
              className={`flex-1 py-1 rounded flex items-center justify-center transition-colors cursor-pointer ${
                textAlign === "center"
                  ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleTextAlignChange("right")}
              aria-label="Align Right"
              className={`flex-1 py-1 rounded flex items-center justify-center transition-colors cursor-pointer ${
                textAlign === "right"
                  ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleTextAlignChange("justify")}
              aria-label="Align Justify"
              className={`flex-1 py-1 rounded flex items-center justify-center transition-colors cursor-pointer ${
                textAlign === "justify"
                  ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Justify"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Style & Transforms */}
      <div className="space-y-1 pt-1">
        <label className="text-xs text-slate-500 dark:text-zinc-400 block font-medium">Style & Transforms</label>
        <div className="grid grid-cols-6 gap-1">
          {/* Italic */}
          <button
            type="button"
            onClick={toggleFontStyle}
            aria-label="Italic"
            className={`py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
              fontStyle === "italic"
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-semibold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262626]"
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => handleTextDecorationChange("underline")}
            aria-label="Underline"
            className={`py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
              textDecoration === "underline"
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-semibold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262626]"
            }`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => handleTextDecorationChange("line-through")}
            aria-label="Strikethrough"
            className={`py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
              textDecoration === "line-through"
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-semibold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262626]"
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          {/* Uppercase */}
          <button
            type="button"
            onClick={() => handleTextTransformChange("uppercase")}
            aria-label="Uppercase"
            className={`py-1.5 text-[11px] font-mono rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
              textTransform === "uppercase"
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-bold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262626]"
            }`}
            title="Uppercase"
          >
            AA
          </button>

          {/* Lowercase */}
          <button
            type="button"
            onClick={() => handleTextTransformChange("lowercase")}
            aria-label="Lowercase"
            className={`py-1.5 text-[11px] font-mono rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
              textTransform === "lowercase"
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-bold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262626]"
            }`}
            title="Lowercase"
          >
            aa
          </button>

          {/* Capitalize */}
          <button
            type="button"
            onClick={() => handleTextTransformChange("capitalize")}
            aria-label="Capitalize"
            className={`py-1.5 text-[11px] font-mono rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
              textTransform === "capitalize"
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-bold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262626]"
            }`}
            title="Capitalize"
          >
            Aa
          </button>
        </div>
      </div>
    </div>
  );
}

