import { classifyUtilityClass } from "../tailwind/classify";
import type { EditableProperty, ThemeMap } from "@/types";

type Side = "top" | "right" | "bottom" | "left" | "top-left" | "top-right" | "bottom-right" | "bottom-left";

export function applyClassMutation(
  target: Element | string[],
  property: EditableProperty,
  newClass: string,
  theme: ThemeMap,
  side?: Side
): string[] {
  const currentClassList = Array.isArray(target)
    ? target
    : Array.from(target.classList);

  const filtered = currentClassList.filter((cls) => {
    if (property === "width") {
      if (cls === "w-full" || cls === "w-auto" || cls === "w-screen" || cls === "w-max" || cls === "w-min" || cls === "w-fit") {
        return false;
      }
      if (cls === "flex-1" || cls === "grow" || cls === "flex-auto") {
        return false;
      }
    }
    if (property === "height") {
      if (cls === "h-full" || cls === "h-auto" || cls === "h-screen" || cls === "h-max" || cls === "h-min" || cls === "h-fit") {
        return false;
      }
    }

    const classification = classifyUtilityClass(cls, theme);
    if (!classification) return true;
    if (classification.property !== property) return true;

    if (side) {
      return classification.side !== undefined && classification.side !== side;
    }
    return false;
  });

  const isValidClassName = newClass && !newClass.includes(" ") && !newClass.includes("'") && !newClass.includes('"');
  if (isValidClassName && !filtered.includes(newClass)) {
    filtered.push(newClass);
  }

  if (target && !(Array.isArray(target)) && "className" in target) {
    (target as Element).className = filtered.join(" ");
  }

  return filtered;
}
