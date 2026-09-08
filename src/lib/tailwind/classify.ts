import { parse as parseColor } from "culori";
import type { EditableProperty, ThemeMap } from "@/types";

export interface Classification {
  property: EditableProperty;
  /**
   * Absent if this class fully/uniformly governs the property; present if it
   * only governs one border side (border-t-4 -> "top") or one radius corner
   * (rounded-tl-md -> "top-left"). Sides and corners share this one field
   * (rather than a separate `corner` field) because the two are never
   * ambiguous for a given property — border-width/-style/-color only ever
   * produce the four side values, border-radius only ever produces the four
   * corner values — so class-list-mutation.ts's side-scoped filter
   * (`classification.side !== side`) works identically for both without a
   * second code path.
   */
  side?: "top" | "right" | "bottom" | "left" | "top-left" | "top-right" | "bottom-right" | "bottom-left";
  /**
   * The value portion of the class, after its prefix (and, for bracket
   * syntax, with the brackets stripped) — e.g. "red-500" for
   * "border-red-500", "17px" for "text-[17px]", "" for bare "border".
   * Exposed so callers that already have a Classification (e.g. Task 2.8's
   * `readCurrentValue`) can read the matched value back out directly,
   * instead of re-deriving the same prefix/suffix split a second time.
   */
  suffix: string;
}

const TEXT_ALIGN_VALUES = new Set(["left", "center", "right", "justify", "start", "end"]);
const FONT_SIZE_TOKENS = new Set(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"]);
const FONT_WEIGHT_TOKENS = new Set(["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black"]);
const BORDER_STYLE_TOKENS = new Set(["solid", "dashed", "dotted", "double", "none"]);
const SIDE_LETTER: Record<string, Classification["side"]> = { t: "top", r: "right", b: "bottom", l: "left" };
const CORNER_LETTER: Record<string, Classification["side"]> = {
  tl: "top-left",
  tr: "top-right",
  br: "bottom-right",
  bl: "bottom-left",
};

function isLength(value: string): boolean {
  return /^-?\d*\.?\d+(px|rem|em|%|ch|vw|vh)$/.test(value);
}

function isColorLike(value: string, theme?: ThemeMap): boolean {
  if (theme?.colors?.some((c) => c.name === value)) return true;
  if (/^[a-z]+-\d{2,3}$/.test(value)) return true; // e.g. red-500, matched against default palette elsewhere
  try {
    return parseColor(value) !== undefined;
  } catch {
    return false;
  }
}

/**
 * Classifies a single Tailwind utility class name against the ambiguous
 * shared prefixes this tool cares about: text-, border-, font-.
 * Returns null for classes outside this tool's editable-property set.
 */
// Every non-bracket prefix this function recognizes, longest first. A naive
// "everything but the last hyphen-segment is the prefix" split (segment
// count minus one) breaks in two ways this list fixes: (1) a bare
// single-segment classname like "border" has no trailing segment to peel
// off, so the naive split collapses prefix to "" and the whole class goes
// unclassified; (2) a suffix that itself contains a hyphen — Tailwind's
// default palette names are "<color>-<shade>", e.g. "red-500" — causes the
// naive split to peel off only "500", leaving a bogus prefix like
// "text-red" or "border-red" that matches no branch. Matching against the
// actual known prefixes (longest first, so "border-t" wins over "border"
// and "rounded-tl" wins over "rounded") sidesteps both: the prefix is
// whatever's actually recognized, and the suffix is simply "everything
// after it," hyphens and all.
const POSITION_TOKENS = new Set(["static", "fixed", "absolute", "relative", "sticky"]);

const KNOWN_PREFIXES = [
  "border-t", "border-r", "border-b", "border-l", "border",
  "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl", "rounded",
  "backdrop-blur",
  "min-w", "max-w", "min-h", "max-h",
  "pt", "pr", "pb", "pl", "px", "py", "p",
  "mt", "mr", "mb", "ml", "mx", "my", "m",
  "top", "right", "bottom", "left", "inset",
  "overflow-x", "overflow-y", "overflow",
  "cursor", "rotate", "scale", "z",
  "opacity", "gap", "w", "h", "leading", "tracking", "bg", "text", "font",
].sort((a, b) => b.length - a.length);

function splitPrefixSuffix(className: string): { prefix: string; suffix: string } {
  for (const candidate of KNOWN_PREFIXES) {
    if (className === candidate) return { prefix: candidate, suffix: "" };
    if (className.startsWith(`${candidate}-`)) {
      return { prefix: candidate, suffix: className.slice(candidate.length + 1) };
    }
  }
  // No known prefix matched at all (e.g. "flex", "hover:bg-red-500") — fall
  // back to the old naive split. It won't match any branch's equality/regex
  // checks below either way, so this just preserves "return null for
  // unrelated classes" without needing its own dedicated branch.
  const prefix = className.split("-").slice(0, -1).join("-");
  return { prefix, suffix: className.slice(prefix.length + 1) };
}

export function classifyUtilityClass(className: string, theme: ThemeMap): Classification | null {
  if (POSITION_TOKENS.has(className)) {
    return { property: "position", suffix: className };
  }

  const bracketMatch = className.match(/^([a-z-]+)-\[(.+)\]$/);
  const { prefix, suffix } = bracketMatch
    ? { prefix: bracketMatch[1], suffix: bracketMatch[2] }
    : splitPrefixSuffix(className);

  if (prefix === "w") return { property: "width", suffix };
  if (prefix === "h") return { property: "height", suffix };
  if (prefix === "min-w") return { property: "min-width", suffix };
  if (prefix === "max-w") return { property: "max-width", suffix };
  if (prefix === "min-h") return { property: "min-height", suffix };
  if (prefix === "max-h") return { property: "max-height", suffix };
  if (prefix === "top") return { property: "top", suffix };
  if (prefix === "right") return { property: "right", suffix };
  if (prefix === "bottom") return { property: "bottom", suffix };
  if (prefix === "left") return { property: "left", suffix };
  if (prefix === "z") return { property: "z-index", suffix };
  if (prefix === "overflow") return { property: "overflow", suffix };
  if (prefix === "cursor") return { property: "cursor", suffix };
  if (prefix === "backdrop-blur") return { property: "backdrop-blur", suffix: suffix || "md" };
  if (prefix === "rotate") return { property: "rotate", suffix };
  if (prefix === "scale") return { property: "scale", suffix };

  if (prefix === "p") return { property: "padding", suffix };
  if (prefix === "pt") return { property: "padding-top", suffix };
  if (prefix === "pr") return { property: "padding-right", suffix };
  if (prefix === "pb") return { property: "padding-bottom", suffix };
  if (prefix === "pl") return { property: "padding-left", suffix };
  if (prefix === "px" || prefix === "py") return { property: "padding", suffix };
  if (prefix === "m") return { property: "margin", suffix };
  if (prefix === "mt") return { property: "margin-top", suffix };
  if (prefix === "mr") return { property: "margin-right", suffix };
  if (prefix === "mb") return { property: "margin-bottom", suffix };
  if (prefix === "ml") return { property: "margin-left", suffix };
  if (prefix === "mx" || prefix === "my") return { property: "margin", suffix };
  if (prefix === "opacity") return { property: "opacity", suffix };
  if (prefix === "gap") return { property: "gap", suffix };
  if (prefix === "leading") return { property: "line-height", suffix };
  if (prefix === "tracking") return { property: "letter-spacing", suffix };
  if (prefix === "bg") return { property: "background-color", suffix };

  if (prefix === "text") {
    if (TEXT_ALIGN_VALUES.has(suffix)) return { property: "text-align", suffix };
    if (FONT_SIZE_TOKENS.has(suffix)) return { property: "font-size", suffix };
    if (bracketMatch) return { property: isLength(suffix) ? "font-size" : "text-color", suffix };
    if (isColorLike(suffix, theme)) return { property: "text-color", suffix };
    return null;
  }

  if (prefix === "font") {
    if (FONT_WEIGHT_TOKENS.has(suffix)) return { property: "font-weight", suffix };
    if (bracketMatch && /^\d+$/.test(suffix)) return { property: "font-weight", suffix };
    if (theme?.fonts?.some((f) => f.name === suffix) || ["sans", "serif", "mono"].includes(suffix)) {
      return { property: "font-family", suffix };
    }
    return null;
  }

  if (prefix === "rounded") return { property: "border-radius", suffix };
  if (/^rounded-(tl|tr|br|bl)$/.test(prefix)) {
    const corner = CORNER_LETTER[prefix.slice(-2)];
    return { property: "border-radius", side: corner, suffix };
  }

  if (prefix === "border" || /^border-[trbl]$/.test(prefix)) {
    const sideLetter = prefix.length > 6 ? prefix.slice(-1) : undefined;
    const side = sideLetter ? SIDE_LETTER[sideLetter] : undefined;

    if (suffix === "") return { property: "border-width", side, suffix }; // bare "border"
    if (BORDER_STYLE_TOKENS.has(suffix)) return { property: "border-style", side, suffix };
    if (/^\d+$/.test(suffix)) return { property: "border-width", side, suffix };
    if (bracketMatch) return { property: isLength(suffix) ? "border-width" : "border-color", side, suffix };
    if (isColorLike(suffix, theme)) return { property: "border-color", side, suffix };
    return null;
  }

  return null;
}
