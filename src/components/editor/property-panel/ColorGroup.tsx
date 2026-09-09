import { useEffect, useRef, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { readCurrentValue } from "@/lib/dom/computed-style";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import ColorPicker from "./ColorPicker";

export type ColorProperty = "text-color" | "background-color" | "border-color";

interface ColorGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  property: ColorProperty;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

import type { ViewportMode } from "../Toolbar";
import { getResponsivePropertyInfo } from "@/lib/dom/responsive-style-engine";

export default function ColorGroup({
  element,
  structuralPath,
  theme,
  property,
  viewport = "desktop",
  onEdit,
}: ColorGroupProps) {
  const [currentColor, setCurrentColor] = useState<string>("#000000");
  const baselineColorRef = useRef<string>("");
  const prevElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!element) return;
    const isNew = element !== prevElementRef.current;
    prevElementRef.current = element;

    let raw = "";
    if (structuralPath) {
      const respInfo = getResponsivePropertyInfo(element, structuralPath, property, viewport);
      raw = respInfo.value;
    }
    if (!raw) {
      raw = readCurrentValue(element, property, theme);
    }
    setCurrentColor(raw || (property === "background-color" ? "transparent" : "#000000"));
    if (isNew) baselineColorRef.current = raw || (property === "background-color" ? "transparent" : "#000000");
  }, [element, property, theme, viewport, structuralPath]);

  if (!element || !structuralPath) return null;

  function handleLiveChange(val: string) {
    setCurrentColor(val);
    applyLiveStyle(element!, property, val, theme, undefined, viewport, structuralPath!);
  }

  function handleCommit(val: string) {
    const oldBaseline = baselineColorRef.current;
    setCurrentColor(val);
    // Update baseline BEFORE committing so the edit record captures correct old→new
    baselineColorRef.current = val;
    commitStyleChange(
      element!,
      structuralPath!,
      property,
      val,
      theme,
      onEdit,
      oldBaseline,
      undefined,
      viewport
    );
  }

  return (
    <ColorPicker
      value={currentColor}
      onChange={handleLiveChange}
      onCommit={handleCommit}
      allowTransparent={true}
    />
  );
}

