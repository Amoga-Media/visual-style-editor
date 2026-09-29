/** A Tailwind transition preset (transition-* + duration-* + easing classes). */
export interface TransitionPreset {
  id: string;
  label: string;
  classes: string[];
}

/** A Tailwind animate-* preset. */
export interface AnimationPreset {
  id: string;
  label: string;
  classes: string[];
}

/** A hover effect preset that applies hover:-prefixed classes. */
export interface HoverPreset {
  id: string;
  label: string;
  /** hover:* classes to add (will be prefixed with hover: on application) */
  hoverClasses: string[];
  /** Base (non-hover) classes for smooth transitions */
  baseClasses?: string[];
}

/** Config for building a custom transition class string. */
export interface TransitionConfig {
  property: "all" | "colors" | "opacity" | "transform" | "shadow";
  duration: 75 | 100 | 150 | 200 | 300 | 500 | 700 | 1000;
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

export const TRANSITION_PRESETS: TransitionPreset[] = [
  { id: "none", label: "None", classes: [] },
  { id: "smooth-all", label: "Smooth All", classes: ["transition-all", "duration-300", "ease-out"] },
  { id: "colors", label: "Colors", classes: ["transition-colors", "duration-200", "ease-in-out"] },
  { id: "opacity", label: "Fade", classes: ["transition-opacity", "duration-300", "ease-in-out"] },
  { id: "transform", label: "Transform", classes: ["transition-transform", "duration-200", "ease-out"] },
  { id: "shadow", label: "Shadow", classes: ["transition-shadow", "duration-300", "ease-out"] },
  { id: "snappy", label: "Snappy", classes: ["transition-all", "duration-150", "ease-in"] },
  { id: "bouncy", label: "Bouncy", classes: ["transition-all", "duration-500", "ease-[cubic-bezier(0.34,1.56,0.64,1)]"] },
];

export const ANIMATION_PRESETS: AnimationPreset[] = [
  { id: "none", label: "None", classes: [] },
  { id: "spin", label: "Spin", classes: ["animate-spin"] },
  { id: "ping", label: "Ping", classes: ["animate-ping"] },
  { id: "pulse", label: "Pulse", classes: ["animate-pulse"] },
  { id: "bounce", label: "Bounce", classes: ["animate-bounce"] },
];

export const HOVER_EFFECT_PRESETS: HoverPreset[] = [
  { id: "none", label: "None", hoverClasses: [] },
  { id: "scale-up", label: "Scale Up", hoverClasses: ["scale-105"], baseClasses: ["transition-transform", "duration-200"] },
  { id: "scale-down", label: "Press", hoverClasses: ["scale-95"], baseClasses: ["transition-transform", "duration-200"] },
  { id: "lift", label: "Lift", hoverClasses: ["-translate-y-1"], baseClasses: ["transition-transform", "duration-200"] },
  { id: "brighten", label: "Brighten", hoverClasses: ["brightness-110"], baseClasses: ["transition-all", "duration-200"] },
  { id: "dim", label: "Dim", hoverClasses: ["opacity-70"], baseClasses: ["transition-opacity", "duration-200"] },
];

/** All classes used across all transition presets — used to detect/remove active presets */
export const ALL_TRANSITION_CLASSES: string[] = [
  ...new Set(TRANSITION_PRESETS.flatMap((p) => p.classes)),
];

/** All classes used across all animation presets */
export const ALL_ANIMATION_CLASSES: string[] = [
  ...new Set(ANIMATION_PRESETS.flatMap((p) => p.classes)),
];

/** All hover classes (with hover: prefix) and base classes used across hover presets */
export const ALL_HOVER_CLASSES: string[] = [
  ...new Set([
    ...HOVER_EFFECT_PRESETS.flatMap((p) => p.hoverClasses.map((c) => `hover:${c}`)),
    ...HOVER_EFFECT_PRESETS.flatMap((p) => p.baseClasses ?? []),
  ]),
];

/**
 * Builds a Tailwind transition class string from a TransitionConfig.
 * e.g. { property: "all", duration: 300, easing: "ease-out" } → "transition-all duration-300 ease-out"
 */
export function buildTransitionClasses(cfg: TransitionConfig): string {
  const prop = cfg.property === "all" ? "all" : cfg.property;
  return [`transition-${prop}`, `duration-${cfg.duration}`, cfg.easing].join(" ");
}

/** Returns all classes that need to be removed when switching to a new transition preset. */
export function getTransitionClassesToRemove(): string[] {
  return ALL_TRANSITION_CLASSES;
}

/** Returns all classes that need to be removed when switching to a new animation preset. */
export function getAnimationClassesToRemove(): string[] {
  return ALL_ANIMATION_CLASSES;
}

/** Returns all hover classes that need to be removed when switching to a new hover preset. */
export function getHoverClassesToRemove(): string[] {
  return ALL_HOVER_CLASSES;
}
