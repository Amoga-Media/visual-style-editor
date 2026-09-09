import { useEffect, useRef, useState } from "react";
import type { EditableProperty, EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { getResponsivePropertyInfo } from "@/lib/dom/responsive-style-engine";
import ValueInput from "./ValueInput";
import { ChevronDown, ChevronRight, Sliders, Lock, Unlock, Space } from "lucide-react";

type Unit = "px" | "%" | "vw" | "vh" | "rem" | "em" | "pt" | "auto" | "none";

const SIZING_ALLOWED_UNITS: Unit[] = ["auto", "px", "%", "vw", "vh", "rem", "em", "pt"];
const MAX_SIZING_ALLOWED_UNITS: Unit[] = ["none", "auto", "px", "%", "vw", "vh", "rem", "em", "pt"];
const SPACING_ALLOWED_UNITS: Unit[] = ["auto", "px", "%", "rem", "em", "vw", "pt"];

const RANGE_BY_UNIT: Record<string, { min: number; max: number; step: number }> = {
  px: { min: 0, max: 1920, step: 1 },
  "%": { min: 0, max: 100, step: 1 },
  vw: { min: 0, max: 100, step: 1 },
  vh: { min: 0, max: 100, step: 1 },
  rem: { min: 0, max: 64, step: 0.25 },
  em: { min: 0, max: 64, step: 0.25 },
  pt: { min: 0, max: 1200, step: 1 },
  auto: { min: 0, max: 100, step: 1 },
  none: { min: 0, max: 100, step: 1 },
};

interface AxisValue {
  amount: number;
  unit: Unit;
}

export function handleSliderChange(element: Element, property: EditableProperty, value: string, theme?: ThemeMap, viewport: ViewportMode = "desktop", structuralPath?: string) {
  applyLiveStyle(element, property, value, theme, undefined, viewport, structuralPath);
}

export function handleSliderCommit(
  element: Element,
  arg2: any,
  arg3: any,
  arg4: any,
  arg5: any,
  arg6?: any,
  arg7?: any,
  viewport: ViewportMode = "desktop"
) {
  let structuralPath: string;
  let property: EditableProperty;
  let value: string;
  let theme: ThemeMap;
  let onEdit: ((record: EditRecord) => void) | undefined;
  let baselineOldValue: string | undefined;

  if (typeof arg2 === "string" && (typeof arg6 === "string" || typeof arg7 === "function")) {
    property = arg2 as EditableProperty;
    value = arg3 as string;
    theme = arg5 as ThemeMap;
    structuralPath = (arg6 as string) ?? "";
    onEdit = typeof arg7 === "function" ? arg7 : undefined;
  } else {
    structuralPath = arg2 as string;
    property = arg3 as EditableProperty;
    value = arg4 as string;
    theme = arg5 as ThemeMap;
    onEdit = typeof arg6 === "function" ? arg6 : undefined;
    baselineOldValue = typeof arg7 === "string" ? arg7 : undefined;
  }

  commitStyleChange(element, structuralPath, property, value, theme, onEdit, baselineOldValue, undefined, viewport);
}

function parseAxisValue(raw: string, defaultUnit: Unit = "px"): AxisValue {
  if (!raw) return { amount: 0, unit: defaultUnit };
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "none") return { amount: 0, unit: "none" };
  if (trimmed === "auto") return { amount: 0, unit: "auto" };

  const match = trimmed.match(/^([-\d.]+)\s*(px|%|vw|vh|rem|em|pt|auto|none)?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const u = (match[2]?.toLowerCase() as Unit) || defaultUnit;
    return { amount: isNaN(num) ? 0 : num, unit: u };
  }
  const bareNum = parseFloat(raw);
  return { amount: isNaN(bareNum) ? 0 : bareNum, unit: defaultUnit };
}

const MAX_WIDTH_PRESETS = [
  { label: "None", val: "none" },
  { label: "SM", val: "384px" },
  { label: "MD", val: "448px" },
  { label: "LG", val: "512px" },
  { label: "XL", val: "576px" },
  { label: "2XL", val: "672px" },
  { label: "4XL", val: "896px" },
  { label: "7XL", val: "1280px" },
  { label: "Full", val: "100%" },
];

interface LayoutGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

function getParentContainerWidth(el: Element | null): number {
  if (!el || typeof window === "undefined") return 1920;
  const parent = el.parentElement;
  if (parent) {
    const rect = parent.getBoundingClientRect();
    if (rect.width > 0) return Math.round(rect.width);
    if (parent.clientWidth > 0) return parent.clientWidth;
  }
  return 1920;
}

function getParentContainerHeight(el: Element | null): number {
  if (!el || typeof window === "undefined") return 1080;
  const parent = el.parentElement;
  if (parent) {
    const rect = parent.getBoundingClientRect();
    if (rect.height > 0) return Math.round(rect.height);
    if (parent.clientHeight > 0) return parent.clientHeight;
  }
  return 1080;
}

function getMaxWidthPxConstraint(maxWidth: AxisValue, parentWidth: number): number | null {
  if (maxWidth.unit === "none" || maxWidth.unit === "auto" || maxWidth.amount <= 0) {
    return null;
  }
  if (maxWidth.unit === "px") return maxWidth.amount;
  if (maxWidth.unit === "%") return Math.round((parentWidth * maxWidth.amount) / 100);
  if (maxWidth.unit === "vw" && typeof window !== "undefined") return Math.round((window.innerWidth * maxWidth.amount) / 100);
  if (maxWidth.unit === "rem" || maxWidth.unit === "em") return Math.round(maxWidth.amount * 16);
  return null;
}

function getMaxHeightPxConstraint(maxHeight: AxisValue, parentHeight: number): number | null {
  if (maxHeight.unit === "none" || maxHeight.unit === "auto" || maxHeight.amount <= 0) {
    return null;
  }
  if (maxHeight.unit === "px") return maxHeight.amount;
  if (maxHeight.unit === "%") return Math.round((parentHeight * maxHeight.amount) / 100);
  if (maxHeight.unit === "vh" && typeof window !== "undefined") return Math.round((window.innerHeight * maxHeight.amount) / 100);
  if (maxHeight.unit === "rem" || maxHeight.unit === "em") return Math.round(maxHeight.amount * 16);
  return null;
}

function getWidthSliderMax(unit: Unit, maxWidth: AxisValue, parentWidth: number): number {
  if (unit === "%") return 100;
  if (unit === "vw" || unit === "vh") return 100;
  if (unit === "rem" || unit === "em") return 64;
  if (unit === "pt") return 1200;

  const maxPx = getMaxWidthPxConstraint(maxWidth, parentWidth);
  if (maxPx !== null && maxPx > 0) {
    return maxPx;
  }
  return parentWidth > 0 ? parentWidth : 1920;
}

function getMaxWidthSliderMax(unit: Unit, parentWidth: number): number {
  if (unit === "%") return 100;
  if (unit === "vw" || unit === "vh") return 100;
  if (unit === "rem" || unit === "em") return 64;
  if (unit === "pt") return 1200;
  return parentWidth > 0 ? parentWidth : 1920;
}

function getHeightSliderMax(unit: Unit, maxHeight: AxisValue, parentHeight: number): number {
  if (unit === "%") return 100;
  if (unit === "vw" || unit === "vh") return 100;
  if (unit === "rem" || unit === "em") return 64;
  if (unit === "pt") return 1200;

  const maxPx = getMaxHeightPxConstraint(maxHeight, parentHeight);
  if (maxPx !== null && maxPx > 0) {
    return maxPx;
  }
  return parentHeight > 0 ? parentHeight : 1080;
}

function getMaxHeightSliderMax(unit: Unit, parentHeight: number): number {
  if (unit === "%") return 100;
  if (unit === "vw" || unit === "vh") return 100;
  if (unit === "rem" || unit === "em") return 64;
  if (unit === "pt") return 1200;
  return parentHeight > 0 ? parentHeight : 1080;
}

export default function LayoutGroup({ element, structuralPath, theme, viewport = "desktop", onEdit }: LayoutGroupProps) {
  const [width, setWidth] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [height, setHeight] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [lockAspect, setLockAspect] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [aspectRatioCss, setAspectRatioCss] = useState<string>("auto");
  const [minWidth, setMinWidth] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [maxWidth, setMaxWidth] = useState<AxisValue>({ amount: 0, unit: "none" });
  const [minHeight, setMinHeight] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [maxHeight, setMaxHeight] = useState<AxisValue>({ amount: 0, unit: "none" });
  const [showConstraints, setShowConstraints] = useState(false);

  // 4-side Padding
  const [padding, setPadding] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [padT, setPadT] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [padR, setPadR] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [padB, setPadB] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [padL, setPadL] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [linkedPadding, setLinkedPadding] = useState<boolean>(true);

  // 4-side Margin
  const [margin, setMargin] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [marT, setMarT] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [marR, setMarR] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [marB, setMarB] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [marL, setMarL] = useState<AxisValue>({ amount: 0, unit: "px" });
  const [linkedMargin, setLinkedMargin] = useState<boolean>(true);

  const prevElementRef = useRef<Element | null>(null);

  const parentW = getParentContainerWidth(element);
  const parentH = getParentContainerHeight(element);

  useEffect(() => {
    if (!element) return;
    prevElementRef.current = element;

    const win = element.ownerDocument?.defaultView || window;
    const computed = win.getComputedStyle(element);

    const rawW = getResponsivePropertyInfo(element, structuralPath || "", "width", viewport).value || readCurrentValue(element, "width", theme);
    const parsedW = parseAxisValue(rawW, "px");
    if (parsedW.amount === 0 && computed.width && parsedW.unit !== "auto" && parsedW.unit !== "none") {
      parsedW.amount = parseFloat(computed.width) || 0;
    }
    if (parsedW.unit === "%") {
      parsedW.amount = Math.min(parsedW.amount, 100);
    } else if (parsedW.unit === "px") {
      const maxWConstraint = getMaxWidthPxConstraint(parseAxisValue(readCurrentValue(element, "max-width", theme)), parentW) || parentW;
      if (maxWConstraint > 0 && parsedW.amount > maxWConstraint) {
        parsedW.amount = maxWConstraint;
      }
    }
    setWidth(parsedW);

    const rawH = getResponsivePropertyInfo(element, structuralPath || "", "height", viewport).value || readCurrentValue(element, "height", theme);
    const parsedH = parseAxisValue(rawH, "px");
    if (parsedH.amount === 0 && computed.height && parsedH.unit !== "auto" && parsedH.unit !== "none") {
      parsedH.amount = parseFloat(computed.height) || 0;
    }
    if (parsedH.unit === "%") {
      parsedH.amount = Math.min(parsedH.amount, 100);
    }
    setHeight(parsedH);

    if (parsedW.amount > 0 && parsedH.amount > 0) {
      setAspectRatio(Number((parsedW.amount / parsedH.amount).toFixed(4)));
    }

    const rawAR = readCurrentValue(element, "aspect-ratio" as any, theme) || computed.aspectRatio || "auto";
    setAspectRatioCss(rawAR);

    const rawMinW = getResponsivePropertyInfo(element, structuralPath || "", "min-width", viewport).value || readCurrentValue(element, "min-width", theme);
    setMinWidth(parseAxisValue(rawMinW));

    const rawMaxW = getResponsivePropertyInfo(element, structuralPath || "", "max-width", viewport).value || readCurrentValue(element, "max-width", theme);
    setMaxWidth(parseAxisValue(rawMaxW, "none"));

    const rawMinH = getResponsivePropertyInfo(element, structuralPath || "", "min-height", viewport).value || readCurrentValue(element, "min-height", theme);
    setMinHeight(parseAxisValue(rawMinH));

    const rawMaxH = getResponsivePropertyInfo(element, structuralPath || "", "max-height", viewport).value || readCurrentValue(element, "max-height", theme);
    setMaxHeight(parseAxisValue(rawMaxH, "none"));

    // Padding
    const rawP = getResponsivePropertyInfo(element, structuralPath || "", "padding", viewport).value || readCurrentValue(element, "padding", theme);
    const parsedP = parseAxisValue(rawP);
    setPadding(parsedP);
    setPadT(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "padding-top", viewport).value || readCurrentValue(element, "padding-top", theme), parsedP.unit));
    setPadR(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "padding-right", viewport).value || readCurrentValue(element, "padding-right", theme), parsedP.unit));
    setPadB(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "padding-bottom", viewport).value || readCurrentValue(element, "padding-bottom", theme), parsedP.unit));
    setPadL(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "padding-left", viewport).value || readCurrentValue(element, "padding-left", theme), parsedP.unit));

    // Margin
    const rawM = getResponsivePropertyInfo(element, structuralPath || "", "margin", viewport).value || readCurrentValue(element, "margin", theme);
    const parsedM = parseAxisValue(rawM);
    setMargin(parsedM);
    setMarT(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "margin-top", viewport).value || readCurrentValue(element, "margin-top", theme), parsedM.unit));
    setMarR(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "margin-right", viewport).value || readCurrentValue(element, "margin-right", theme), parsedM.unit));
    setMarB(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "margin-bottom", viewport).value || readCurrentValue(element, "margin-bottom", theme), parsedM.unit));
    setMarL(parseAxisValue(getResponsivePropertyInfo(element, structuralPath || "", "margin-left", viewport).value || readCurrentValue(element, "margin-left", theme), parsedM.unit));
  }, [element, theme, viewport, structuralPath]);

  if (!element || !structuralPath) return null;

  function handleWidthLiveChange(rawAmount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || width.unit;
    const maxBound = getWidthSliderMax(unit, maxWidth, parentW);
    const amount = (unit === "px" || unit === "%") && maxBound > 0 ? Math.min(rawAmount, maxBound) : rawAmount;

    setWidth({ amount, unit });
    const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amount}${unit}`;
    applyLiveStyle(element!, "width", val, theme, undefined, viewport, structuralPath!);

    if (lockAspect && aspectRatio > 0 && unit === "px") {
      const scaledH = Math.round(amount / aspectRatio);
      setHeight({ amount: scaledH, unit: "px" });
      applyLiveStyle(element!, "height", `${scaledH}px`, theme, undefined, viewport, structuralPath!);
    }
  }

  function commitWidth(rawAmount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    const maxBound = getWidthSliderMax(unit, maxWidth, parentW);
    const amount = (unit === "px" || unit === "%") && maxBound > 0 ? Math.min(rawAmount, maxBound) : rawAmount;

    setWidth({ amount, unit });
    const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amount}${unit}`;
    applyLiveStyle(element!, "width", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "width", val, theme, onEdit, undefined, undefined, viewport);

    if (lockAspect && aspectRatio > 0 && unit === "px") {
      const scaledH = Math.round(amount / aspectRatio);
      setHeight({ amount: scaledH, unit: "px" });
      commitStyleChange(element!, structuralPath!, "height", `${scaledH}px`, theme, onEdit, undefined, undefined, viewport);
    }
  }

  function handleHeightLiveChange(rawAmount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || height.unit;
    const maxBound = getHeightSliderMax(unit, maxHeight, parentH);
    const amount = (unit === "px" || unit === "%") && maxBound > 0 ? Math.min(rawAmount, maxBound) : rawAmount;

    setHeight({ amount, unit });
    const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amount}${unit}`;
    applyLiveStyle(element!, "height", val, theme, undefined, viewport, structuralPath!);

    if (lockAspect && aspectRatio > 0 && unit === "px") {
      const scaledW = Math.round(amount * aspectRatio);
      setWidth({ amount: scaledW, unit: "px" });
      applyLiveStyle(element!, "width", `${scaledW}px`, theme, undefined, viewport, structuralPath!);
    }
  }

  function commitHeight(rawAmount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    const maxBound = getHeightSliderMax(unit, maxHeight, parentH);
    const amount = (unit === "px" || unit === "%") && maxBound > 0 ? Math.min(rawAmount, maxBound) : rawAmount;

    setHeight({ amount, unit });
    const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amount}${unit}`;
    applyLiveStyle(element!, "height", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "height", val, theme, onEdit, undefined, undefined, viewport);

    if (lockAspect && aspectRatio > 0 && unit === "px") {
      const scaledW = Math.round(amount * aspectRatio);
      setWidth({ amount: scaledW, unit: "px" });
      commitStyleChange(element!, structuralPath!, "width", `${scaledW}px`, theme, onEdit, undefined, undefined, viewport);
    }
  }

  function commitMinWidth(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setMinWidth({ amount, unit });
    const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amount}${unit}`;
    applyLiveStyle(element!, "min-width", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "min-width", val, theme, onEdit, undefined, undefined, viewport);
  }

  function commitMaxWidth(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setMaxWidth({ amount, unit });
    const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amount}${unit}`;
    applyLiveStyle(element!, "max-width", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "max-width", val, theme, onEdit, undefined, undefined, viewport);

    // If new max-width limits current width in px/%, adjust width visually
    if (unit === "px" && amount > 0 && width.unit === "px" && width.amount > amount) {
      handleWidthLiveChange(amount, "px");
      commitWidth(amount, "px");
    }
  }

  function commitMinHeight(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setMinHeight({ amount, unit });
    const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amount}${unit}`;
    applyLiveStyle(element!, "min-height", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "min-height", val, theme, onEdit, undefined, undefined, viewport);
  }

  function commitMaxHeight(amount: number, unitStr: string) {
    const unit = (unitStr as Unit) || "px";
    setMaxHeight({ amount, unit });
    const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amount}${unit}`;
    applyLiveStyle(element!, "max-height", val, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "max-height", val, theme, onEdit, undefined, undefined, viewport);

    if (unit === "px" && amount > 0 && height.unit === "px" && height.amount > amount) {
      handleHeightLiveChange(amount, "px");
      commitHeight(amount, "px");
    }
  }

  function handleToggleAutoWidth() {
    if (width.unit === "auto") {
      const compW = element ? parseFloat(element.ownerDocument?.defaultView?.getComputedStyle(element).width || "0") : 0;
      const fallbackW = compW > 0 ? Math.round(compW) : Math.min(parentW, 800);
      const valObj: AxisValue = { amount: fallbackW, unit: "px" };
      setWidth(valObj);
      applyLiveStyle(element!, "width", `${fallbackW}px`, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "width", `${fallbackW}px`, theme, onEdit, undefined, undefined, viewport);
    } else {
      setWidth({ amount: 0, unit: "auto" });
      applyLiveStyle(element!, "width", "auto", theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "width", "auto", theme, onEdit, undefined, undefined, viewport);

      if (element) {
        const tagName = element.tagName.toLowerCase();
        if (["p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "label", "a", "li", "button"].includes(tagName)) {
          const comp = element.ownerDocument?.defaultView?.getComputedStyle(element);
          if (comp?.whiteSpace === "nowrap") {
            applyLiveStyle(element, "white-space", "normal", theme, undefined, viewport, structuralPath!);
            commitStyleChange(element, structuralPath!, "white-space", "normal", theme, onEdit, undefined, undefined, viewport);
          }
        }
      }
    }
  }

  function handleToggleAutoHeight() {
    if (height.unit === "auto") {
      const compH = element ? parseFloat(element.ownerDocument?.defaultView?.getComputedStyle(element).height || "0") : 0;
      const fallbackH = compH > 0 ? Math.round(compH) : 300;
      const valObj: AxisValue = { amount: fallbackH, unit: "px" };
      setHeight(valObj);
      applyLiveStyle(element!, "height", `${fallbackH}px`, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "height", `${fallbackH}px`, theme, onEdit, undefined, undefined, viewport);
    } else {
      setHeight({ amount: 0, unit: "auto" });
      applyLiveStyle(element!, "height", "auto", theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "height", "auto", theme, onEdit, undefined, undefined, viewport);
    }
  }

  function handleToggleMaxWidth() {
    if (maxWidth.unit !== "none" && maxWidth.amount > 0) {
      setMaxWidth({ amount: 0, unit: "none" });
      applyLiveStyle(element!, "max-width", "none", theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "max-width", "none", theme, onEdit, undefined, undefined, viewport);
    } else {
      const defaultVal: AxisValue = { amount: Math.min(parentW, 1200), unit: "px" };
      setMaxWidth(defaultVal);
      applyLiveStyle(element!, "max-width", `${defaultVal.amount}px`, theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "max-width", `${defaultVal.amount}px`, theme, onEdit, undefined, undefined, viewport);
    }
  }

  function handleToggleMaxHeight() {
    if (maxHeight.unit !== "none" && maxHeight.amount > 0) {
      setMaxHeight({ amount: 0, unit: "none" });
      applyLiveStyle(element!, "max-height", "none", theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "max-height", "none", theme, onEdit, undefined, undefined, viewport);
    } else {
      const defaultVal: AxisValue = { amount: 600, unit: "px" };
      setMaxHeight(defaultVal);
      applyLiveStyle(element!, "max-height", "600px", theme, undefined, viewport, structuralPath!);
      commitStyleChange(element!, structuralPath!, "max-height", "600px", theme, onEdit, undefined, undefined, viewport);
    }
  }

  function applyMaxWidthPreset(preset: typeof MAX_WIDTH_PRESETS[0]) {
    if (preset.val === "none") {
      setMaxWidth({ amount: 0, unit: "none" });
      commitStyleChange(element!, structuralPath!, "max-width", "none", theme, onEdit, undefined, undefined, viewport);
    } else {
      const parsed = parseAxisValue(preset.val);
      setMaxWidth(parsed);
      commitStyleChange(element!, structuralPath!, "max-width", preset.val, theme, onEdit, undefined, undefined, viewport);
    }
  }

  // Padding commits
  function commitUniformPadding(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || padding.unit;
    const valObj = { amount, unit };
    setPadding(valObj);
    setPadT(valObj);
    setPadR(valObj);
    setPadB(valObj);
    setPadL(valObj);
    commitStyleChange(element!, structuralPath!, "padding", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  function commitSidePadding(property: "padding-top" | "padding-right" | "padding-bottom" | "padding-left", amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || padding.unit;
    const valObj = { amount, unit };
    if (property === "padding-top") setPadT(valObj);
    if (property === "padding-right") setPadR(valObj);
    if (property === "padding-bottom") setPadB(valObj);
    if (property === "padding-left") setPadL(valObj);
    commitStyleChange(element!, structuralPath!, property, `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  // Margin commits
  function commitUniformMargin(amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || margin.unit;
    const valObj = { amount, unit };
    setMargin(valObj);
    setMarT(valObj);
    setMarR(valObj);
    setMarB(valObj);
    setMarL(valObj);
    commitStyleChange(element!, structuralPath!, "margin", `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  function commitSideMargin(property: "margin-top" | "margin-right" | "margin-bottom" | "margin-left", amount: number, unitStr?: string) {
    const unit = (unitStr as Unit) || margin.unit;
    const valObj = { amount, unit };
    if (property === "margin-top") setMarT(valObj);
    if (property === "margin-right") setMarR(valObj);
    if (property === "margin-bottom") setMarB(valObj);
    if (property === "margin-left") setMarL(valObj);
    commitStyleChange(element!, structuralPath!, property, `${amount}${unit}`, theme, onEdit, undefined, undefined, viewport);
  }

  return (
    <div className="p-3.5 space-y-3.5">
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => {
            const next = !lockAspect;
            setLockAspect(next);
            if (next && width.amount > 0 && height.amount > 0) {
              setAspectRatio(Number((width.amount / height.amount).toFixed(4)));
            }
          }}
          aria-label={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
          className={`text-[12px] flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
            lockAspect
              ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/40 font-semibold"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] border border-transparent"
          }`}
          title={lockAspect ? "Aspect Ratio Locked (Proportional scaling on)" : "Aspect Ratio Unlocked (Click to lock ratio)"}
        >
          {lockAspect ? <Lock className="w-3.5 h-3.5 text-[#0099ff]" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>Lock Ratio</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConstraints(!showConstraints)}
          aria-label="Toggle size constraints"
          className={`text-[12px] flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
            showConstraints
              ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-semibold"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#1c1c1c]"
          }`}
          title="Toggle Min/Max Size Constraints"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Constraints</span>
        </button>
      </div>

      {/* Quick Sizing Actions Bar */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-slate-500 dark:text-zinc-400 block font-mono uppercase tracking-wider font-semibold">Quick Sizing Actions</label>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={handleToggleAutoWidth}
            aria-label="Auto Width"
            className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer border ${
              width.unit === "auto"
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30 font-semibold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#262626] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1c1c]"
            }`}
            title={width.unit === "auto" ? "Unset Auto Width" : "Set width to auto"}
          >
            {width.unit === "auto" ? "Auto Width: On" : "Auto Width"}
          </button>
          <button
            type="button"
            onClick={handleToggleAutoHeight}
            aria-label="Auto Height"
            className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer border ${
              height.unit === "auto"
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30 font-semibold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#262626] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1c1c]"
            }`}
            title={height.unit === "auto" ? "Unset Auto Height" : "Set height to auto"}
          >
            {height.unit === "auto" ? "Auto Height: On" : "Auto Height"}
          </button>
          <button
            type="button"
            onClick={handleToggleMaxWidth}
            aria-label="Max Width"
            className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer border ${
              maxWidth.unit !== "none" && maxWidth.amount > 0
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30 font-semibold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#262626] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1c1c]"
            }`}
            title={maxWidth.unit !== "none" ? "Disable Max Width" : "Enable Max Width constraint"}
          >
            {maxWidth.unit !== "none" && maxWidth.amount > 0 ? "Max Width: On" : "+ Max Width"}
          </button>
          <button
            type="button"
            onClick={handleToggleMaxHeight}
            aria-label="Max Height"
            className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer border ${
              maxHeight.unit !== "none" && maxHeight.amount > 0
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30 font-semibold"
                : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#262626] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1c1c]"
            }`}
            title={maxHeight.unit !== "none" ? "Disable Max Height" : "Enable Max Height constraint"}
          >
            {maxHeight.unit !== "none" && maxHeight.amount > 0 ? "Max Height: On" : "+ Max Height"}
          </button>
        </div>
      </div>

      {/* 1. Max Width (First, as requested) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[13px] text-slate-800 dark:text-zinc-200 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Max Width</span>
            {maxWidth.unit !== "none" && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-mono font-semibold">active</span>
            )}
          </div>
          <ValueInput
            amount={maxWidth.amount}
            unit={maxWidth.unit}
            step={RANGE_BY_UNIT[maxWidth.unit]?.step ?? 1}
            allowedUnits={MAX_SIZING_ALLOWED_UNITS}
            property="max-width"
            element={element}
            viewport={viewport}
            onChange={(amt, u) => {
              const unit = (u as Unit) || maxWidth.unit;
              setMaxWidth({ amount: amt, unit });
              const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amt}${unit}`;
              applyLiveStyle(element, "max-width", val, theme, undefined, viewport, structuralPath!);
            }}
            onCommit={commitMaxWidth}
          />
        </div>
        {maxWidth.unit !== "none" && maxWidth.unit !== "auto" && (
          <input
            type="range"
            min={0}
            max={getMaxWidthSliderMax(maxWidth.unit, parentW)}
            step={RANGE_BY_UNIT[maxWidth.unit]?.step ?? 1}
            value={maxWidth.amount}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setMaxWidth({ ...maxWidth, amount: val });
              applyLiveStyle(element, "max-width", `${val}${maxWidth.unit}`, theme, undefined, viewport, structuralPath!);
            }}
            onPointerUp={() => commitMaxWidth(maxWidth.amount, maxWidth.unit)}
            className="w-full accent-[#0099ff] cursor-pointer"
          />
        )}
      </div>

      {/* 2. Width */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[13px] text-slate-800 dark:text-zinc-200 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Width</span>
            {lockAspect && <Lock className="w-3 h-3 text-[#0099ff]" />}
          </div>
          <ValueInput
            amount={width.amount}
            unit={width.unit}
            step={RANGE_BY_UNIT[width.unit]?.step ?? 1}
            allowedUnits={SIZING_ALLOWED_UNITS}
            property="width"
            element={element}
            viewport={viewport}
            onChange={handleWidthLiveChange}
            onCommit={commitWidth}
          />
        </div>
        {width.unit !== "auto" && (
          <input
            type="range"
            min={0}
            max={getWidthSliderMax(width.unit, maxWidth, parentW)}
            step={RANGE_BY_UNIT[width.unit]?.step ?? 1}
            value={width.amount}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              handleWidthLiveChange(val, width.unit);
            }}
            onPointerUp={() => commitWidth(width.amount, width.unit)}
            className="w-full accent-[#0099ff] cursor-pointer"
          />
        )}
      </div>

      {/* 3. Max Height */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[13px] text-slate-800 dark:text-zinc-200 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Max Height</span>
            {maxHeight.unit !== "none" && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-mono font-semibold">active</span>
            )}
          </div>
          <ValueInput
            amount={maxHeight.amount}
            unit={maxHeight.unit}
            step={RANGE_BY_UNIT[maxHeight.unit]?.step ?? 1}
            allowedUnits={MAX_SIZING_ALLOWED_UNITS}
            property="max-height"
            element={element}
            viewport={viewport}
            onChange={(amt, u) => {
              const unit = (u as Unit) || maxHeight.unit;
              setMaxHeight({ amount: amt, unit });
              const val = unit === "auto" ? "auto" : unit === "none" ? "none" : `${amt}${unit}`;
              applyLiveStyle(element, "max-height", val, theme, undefined, viewport, structuralPath!);
            }}
            onCommit={commitMaxHeight}
          />
        </div>
        {maxHeight.unit !== "none" && maxHeight.unit !== "auto" && (
          <input
            type="range"
            min={0}
            max={getMaxHeightSliderMax(maxHeight.unit, parentH)}
            step={RANGE_BY_UNIT[maxHeight.unit]?.step ?? 1}
            value={maxHeight.amount}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setMaxHeight({ ...maxHeight, amount: val });
              applyLiveStyle(element, "max-height", `${val}${maxHeight.unit}`, theme, undefined, viewport, structuralPath!);
            }}
            onPointerUp={() => commitMaxHeight(maxHeight.amount, maxHeight.unit)}
            className="w-full accent-[#0099ff] cursor-pointer"
          />
        )}
      </div>

      {/* 4. Height */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Height</span>
            {lockAspect && <Lock className="w-2.5 h-2.5 text-[#0099ff]" />}
          </div>
          <ValueInput
            amount={height.amount}
            unit={height.unit}
            step={RANGE_BY_UNIT[height.unit]?.step ?? 1}
            allowedUnits={SIZING_ALLOWED_UNITS}
            property="height"
            element={element}
            viewport={viewport}
            onChange={handleHeightLiveChange}
            onCommit={commitHeight}
          />
        </div>
        {height.unit !== "auto" && (
          <input
            type="range"
            min={0}
            max={getHeightSliderMax(height.unit, maxHeight, parentH)}
            step={RANGE_BY_UNIT[height.unit]?.step ?? 1}
            value={height.amount}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              handleHeightLiveChange(val, height.unit);
            }}
            onPointerUp={() => commitHeight(height.amount, height.unit)}
            className="w-full accent-[#0099ff] cursor-pointer"
          />
        )}
      </div>

      {/* Constraints Drawer (Min/Max Width & Height) */}
      {showConstraints && (
        <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#242424] space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Size Constraints
          </div>

          {/* Max Width Quick Presets */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 dark:text-zinc-400 block">Max Width Presets</label>
            <div className="grid grid-cols-5 gap-1">
              {MAX_WIDTH_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyMaxWidthPreset(p)}
                  className="py-1 text-[10px] rounded-lg bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#252525] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#282828] transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min Width & Max Width Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Min Width</span>
              <ValueInput
                amount={minWidth.amount}
                unit={minWidth.unit}
                min={0}
                max={2000}
                step={1}
                allowedUnits={SIZING_ALLOWED_UNITS}
                property="min-width"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || minWidth.unit;
                  setMinWidth({ amount: amt, unit });
                  applyLiveStyle(element, "min-width", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitMinWidth}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Max Width</span>
              <ValueInput
                amount={maxWidth.amount}
                unit={maxWidth.unit}
                min={0}
                max={2000}
                step={1}
                allowedUnits={SIZING_ALLOWED_UNITS}
                property="max-width"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || maxWidth.unit;
                  setMaxWidth({ amount: amt, unit });
                  applyLiveStyle(element, "max-width", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitMaxWidth}
              />
            </div>
          </div>

          {/* Min Height & Max Height Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Min Height</span>
              <ValueInput
                amount={minHeight.amount}
                unit={minHeight.unit}
                min={0}
                max={2000}
                step={1}
                allowedUnits={SIZING_ALLOWED_UNITS}
                property="min-height"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || minHeight.unit;
                  setMinHeight({ amount: amt, unit });
                  applyLiveStyle(element, "min-height", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitMinHeight}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Max Height</span>
              <ValueInput
                amount={maxHeight.amount}
                unit={maxHeight.unit}
                min={0}
                max={2000}
                step={1}
                allowedUnits={SIZING_ALLOWED_UNITS}
                property="max-height"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || maxHeight.unit;
                  setMaxHeight({ amount: amt, unit });
                  applyLiveStyle(element, "max-height", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitMaxHeight}
              />
            </div>
          </div>
        </div>
      )}

      {/* Padding 4-Side Box Model */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
          <span>Padding</span>
          <button
            onClick={() => setLinkedPadding(!linkedPadding)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              linkedPadding ? "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
            }`}
            title={linkedPadding ? "Linked (All Sides)" : "Unlinked (4 Sides)"}
          >
            {linkedPadding ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>

        {linkedPadding ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>All Sides</span>
              <ValueInput
                amount={padding.amount}
                unit={padding.unit}
                step={1}
                allowedUnits={SPACING_ALLOWED_UNITS}
                property="padding"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || padding.unit;
                  setPadding({ amount: amt, unit });
                  applyLiveStyle(element, "padding", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitUniformPadding}
              />
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(128, Math.ceil(padding.amount * 1.25))}
              step={1}
              value={padding.amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPadding({ ...padding, amount: val });
                applyLiveStyle(element, "padding", `${val}${padding.unit}`, theme, undefined, viewport, structuralPath!);
              }}
              onPointerUp={() => commitUniformPadding(padding.amount, padding.unit)}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#242424] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Top</span>
                <ValueInput
                  amount={padT.amount}
                  unit={padT.unit}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="padding-top"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || padT.unit;
                    setPadT({ amount: amt, unit });
                    applyLiveStyle(element, "padding-top", `${amt}${unit}`, theme, "top", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSidePadding("padding-top", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Right</span>
                <ValueInput
                  amount={padR.amount}
                  unit={padR.unit}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="padding-right"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || padR.unit;
                    setPadR({ amount: amt, unit });
                    applyLiveStyle(element, "padding-right", `${amt}${unit}`, theme, "right", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSidePadding("padding-right", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Bottom</span>
                <ValueInput
                  amount={padB.amount}
                  unit={padB.unit}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="padding-bottom"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || padB.unit;
                    setPadB({ amount: amt, unit });
                    applyLiveStyle(element, "padding-bottom", `${amt}${unit}`, theme, "bottom", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSidePadding("padding-bottom", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Left</span>
                <ValueInput
                  amount={padL.amount}
                  unit={padL.unit}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="padding-left"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || padL.unit;
                    setPadL({ amount: amt, unit });
                    applyLiveStyle(element, "padding-left", `${amt}${unit}`, theme, "left", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSidePadding("padding-left", amt, u)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Margin 4-Side Box Model */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
          <span>Margin</span>
          <button
            onClick={() => setLinkedMargin(!linkedMargin)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              linkedMargin ? "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
            }`}
            title={linkedMargin ? "Linked (All Sides)" : "Unlinked (4 Sides)"}
          >
            {linkedMargin ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>

        {linkedMargin ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>All Sides</span>
              <ValueInput
                amount={margin.amount}
                unit={margin.unit}
                step={1}
                allowedUnits={SPACING_ALLOWED_UNITS}
                property="margin"
                element={element}
                viewport={viewport}
                onChange={(amt, u) => {
                  const unit = (u as Unit) || margin.unit;
                  setMargin({ amount: amt, unit });
                  applyLiveStyle(element, "margin", `${amt}${unit}`, theme, undefined, viewport, structuralPath!);
                }}
                onCommit={commitUniformMargin}
              />
            </div>
            <input
              type="range"
              min={Math.min(-128, Math.floor(margin.amount * 1.25))}
              max={Math.max(256, Math.ceil(margin.amount * 1.25))}
              step={1}
              value={margin.amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setMargin({ ...margin, amount: val });
                applyLiveStyle(element, "margin", `${val}${margin.unit}`, theme, undefined, viewport, structuralPath!);
              }}
              onPointerUp={() => commitUniformMargin(margin.amount, margin.unit)}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#242424] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Top</span>
                <ValueInput
                  amount={marT.amount}
                  unit={marT.unit}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="margin-top"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || marT.unit;
                    setMarT({ amount: amt, unit });
                    applyLiveStyle(element, "margin-top", `${amt}${unit}`, theme, "top", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideMargin("margin-top", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Right</span>
                <ValueInput
                  amount={marR.amount}
                  unit={marR.unit}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="margin-right"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || marR.unit;
                    setMarR({ amount: amt, unit });
                    applyLiveStyle(element, "margin-right", `${amt}${unit}`, theme, "right", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideMargin("margin-right", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Bottom</span>
                <ValueInput
                  amount={marB.amount}
                  unit={marB.unit}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="margin-bottom"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || marB.unit;
                    setMarB({ amount: amt, unit });
                    applyLiveStyle(element, "margin-bottom", `${amt}${unit}`, theme, "bottom", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideMargin("margin-bottom", amt, u)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Left</span>
                <ValueInput
                  amount={marL.amount}
                  unit={marL.unit}
                  step={1}
                  allowedUnits={SPACING_ALLOWED_UNITS}
                  property="margin-left"
                  element={element}
                  viewport={viewport}
                  onChange={(amt, u) => {
                    const unit = (u as Unit) || marL.unit;
                    setMarL({ amount: amt, unit });
                    applyLiveStyle(element, "margin-left", `${amt}${unit}`, theme, "left", viewport, structuralPath!);
                  }}
                  onCommit={(amt, u) => commitSideMargin("margin-left", amt, u)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

