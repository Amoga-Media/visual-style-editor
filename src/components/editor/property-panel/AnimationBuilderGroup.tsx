import { useState, useEffect } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "../Toolbar";
import { Play, Sparkles, Move, Zap, Check } from "lucide-react";
import CollapsibleGroup from "./CollapsibleGroup";
import {
  TRANSITION_PRESETS,
  ANIMATION_PRESETS,
  HOVER_EFFECT_PRESETS,
  getTransitionClassesToRemove,
  getAnimationClassesToRemove,
  getHoverClassesToRemove,
  type TransitionPreset,
  type AnimationPreset,
  type HoverPreset,
} from "@/lib/presets/animation-presets";

interface AnimationBuilderGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
  defaultOpen?: boolean;
}

export default function AnimationBuilderGroup({
  element,
  structuralPath,
  theme,
  viewport = "desktop",
  onEdit,
  defaultOpen = false,
}: AnimationBuilderGroupProps) {
  const [activeTab, setActiveTab] = useState<"transition" | "animation" | "hover">("transition");
  const [currentClasses, setCurrentClasses] = useState<string[]>([]);

  useEffect(() => {
    if (!element) return;
    setCurrentClasses(Array.from(element.classList).filter(Boolean));
  }, [element, structuralPath]);

  if (!element || !structuralPath) return null;

  function commitClasses(removeClasses: string[], addClasses: string[]) {
    const oldClassList = Array.from(element!.classList).filter(Boolean);
    const removeSet = new Set(removeClasses);
    const retained = oldClassList.filter((c) => !removeSet.has(c));

    const nextList = [...retained];
    for (const add of addClasses) {
      if (!nextList.includes(add)) {
        nextList.push(add);
      }
    }

    if (element!.namespaceURI === "http://www.w3.org/2000/svg" || "ownerSVGElement" in element!) {
      element!.setAttribute("class", nextList.join(" "));
    } else {
      element!.className = nextList.join(" ");
    }

    setCurrentClasses(nextList);

    onEdit?.({
      kind: "class",
      structuralPath: structuralPath!,
      property: "text-content" as any,
      oldClassList,
      newClassList: nextList,
      viewport,
      timestamp: new Date().toISOString(),
    });
  }

  const handleApplyTransition = (preset: TransitionPreset) => {
    commitClasses(getTransitionClassesToRemove(), preset.classes);
  };

  const handleApplyAnimation = (preset: AnimationPreset) => {
    commitClasses(getAnimationClassesToRemove(), preset.classes);
  };

  const handleApplyHover = (preset: HoverPreset) => {
    const hoverClassesPrefixed = preset.hoverClasses.map((c) => `hover:${c}`);
    const toAdd = [...hoverClassesPrefixed, ...(preset.baseClasses ?? [])];
    commitClasses(getHoverClassesToRemove(), toAdd);
  };

  const isTransitionActive = (preset: TransitionPreset) => {
    if (preset.id === "none") {
      return !preset.classes.some((c) => currentClasses.includes(c)) &&
        !getTransitionClassesToRemove().some((c) => currentClasses.includes(c));
    }
    return preset.classes.length > 0 && preset.classes.every((c) => currentClasses.includes(c));
  };

  const isAnimationActive = (preset: AnimationPreset) => {
    if (preset.id === "none") {
      return !getAnimationClassesToRemove().some((c) => currentClasses.includes(c));
    }
    return preset.classes.length > 0 && preset.classes.every((c) => currentClasses.includes(c));
  };

  const isHoverActive = (preset: HoverPreset) => {
    if (preset.id === "none") {
      return !getHoverClassesToRemove().some((c) => currentClasses.includes(c));
    }
    const hoverPrefixed = preset.hoverClasses.map((c) => `hover:${c}`);
    return hoverPrefixed.length > 0 && hoverPrefixed.every((c) => currentClasses.includes(c));
  };

  return (
    <CollapsibleGroup
      groupId="animation-builder"
      title="Animation & Transition Builder"
      icon={<Play className="w-3.5 h-3.5 text-sky-400" />}
      defaultOpen={defaultOpen}
    >
      <div className="space-y-3 p-1">
        {/* Tab Selection */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-[#181818] p-0.5 border border-slate-200 dark:border-[#262626]">
          {(["transition", "animation", "hover"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-[10px] font-medium capitalize rounded-md transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white dark:bg-[#282828] text-slate-900 dark:text-zinc-100 font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              {tab === "hover" ? "Hover FX" : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "transition" && (
          <div className="grid grid-cols-2 gap-1.5">
            {TRANSITION_PRESETS.map((p) => {
              const active = isTransitionActive(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyTransition(p)}
                  title={p.classes.join(" ") || "None"}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    active
                      ? "border-[#0084FF] bg-[#0084FF]/10 text-[#0084FF] font-semibold"
                      : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-[#0084FF]" />}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "animation" && (
          <div className="grid grid-cols-2 gap-1.5">
            {ANIMATION_PRESETS.map((p) => {
              const active = isAnimationActive(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyAnimation(p)}
                  title={p.classes.join(" ") || "None"}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    active
                      ? "border-[#0084FF] bg-[#0084FF]/10 text-[#0084FF] font-semibold"
                      : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-[#0084FF]" />}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "hover" && (
          <div className="grid grid-cols-2 gap-1.5">
            {HOVER_EFFECT_PRESETS.map((p) => {
              const active = isHoverActive(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyHover(p)}
                  title={`hover:${p.hoverClasses.join(" hover:")}`}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    active
                      ? "border-[#0084FF] bg-[#0084FF]/10 text-[#0084FF] font-semibold"
                      : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-[#0084FF]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </CollapsibleGroup>
  );
}
