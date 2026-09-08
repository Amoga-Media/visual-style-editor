import { useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { Code2, Plus, Trash2, Sparkles } from "lucide-react";

interface AdvancedCssGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  onEdit?: (record: EditRecord) => void;
}

const COMMON_CSS_SNIPPETS = [
  { label: "Glass Backdrop", prop: "backdrop-filter", val: "blur(12px)" },
  { label: "Grayscale Filter", prop: "filter", val: "grayscale(100%)" },
  { label: "Perspective 3D", prop: "transform", val: "perspective(600px) rotateY(10deg)" },
  { label: "Pointer Events None", prop: "pointer-events", val: "none" },
  { label: "User Select None", prop: "user-select", val: "none" },
];

export default function AdvancedCssGroup({
  element,
  structuralPath,
  theme,
  onEdit,
}: AdvancedCssGroupProps) {
  const [newProp, setNewProp] = useState("");
  const [newVal, setNewVal] = useState("");

  if (!element || !structuralPath) return null;

  const styleAttr = element.getAttribute("style") || "";
  const inlineStyles: { key: string; value: string }[] = [];

  styleAttr.split(";").forEach((declaration) => {
    const trimmed = declaration.trim();
    if (!trimmed) return;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const k = trimmed.slice(0, colonIdx).trim();
      const v = trimmed.slice(colonIdx + 1).trim();
      if (k && v) inlineStyles.push({ key: k, value: v });
    }
  });

  function handleAddProperty(prop: string, val: string) {
    const cleanP = prop.trim().toLowerCase();
    const cleanV = val.trim();
    if (!cleanP || !cleanV) return;

    applyLiveStyle(element!, cleanP as any, cleanV, theme);
    commitStyleChange(element!, structuralPath!, cleanP as any, cleanV, theme, onEdit);
    setNewProp("");
    setNewVal("");
  }

  function handleRemoveProperty(prop: string) {
    (element as HTMLElement).style?.removeProperty(prop);
    commitStyleChange(element!, structuralPath!, prop as any, "", theme, onEdit);
  }

  return (
    <div className="p-4 border-b border-slate-200 dark:border-[#222] space-y-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
        <Code2 className="w-3.5 h-3.5 text-indigo-400" />
        <span>Advanced Custom CSS</span>
      </div>

      {/* Quick CSS Snippets */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Quick CSS Effects</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_CSS_SNIPPETS.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              onClick={() => handleAddProperty(snippet.prop, snippet.val)}
              className="px-2 py-1 text-[10px] rounded-lg bg-slate-100 dark:bg-[#161616] hover:bg-slate-200 dark:hover:bg-[#202020] border border-slate-200 dark:border-[#282828] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              {snippet.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom CSS Rule */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] text-slate-600 dark:text-zinc-400 block">Add Custom Property</label>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="property (e.g. filter)"
            value={newProp}
            onChange={(e) => setNewProp(e.target.value)}
            className="flex-1 min-w-0 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-zinc-200 font-mono outline-none"
          />
          <span className="text-slate-400 dark:text-zinc-500 font-mono">:</span>
          <input
            type="text"
            placeholder="value (e.g. blur(4px))"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProperty(newProp, newVal)}
            className="flex-1 min-w-0 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-zinc-200 font-mono outline-none"
          />
          <button
            type="button"
            onClick={() => handleAddProperty(newProp, newVal)}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0 shadow-sm"
            title="Apply CSS Property"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Current Inline Styles List */}
      {inlineStyles.length > 0 && (
        <div className="space-y-1 pt-1">
          <label className="text-[10px] text-slate-500 dark:text-zinc-500 block uppercase font-mono">
            Active Inline Declarations ({inlineStyles.length})
          </label>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {inlineStyles.map(({ key, value }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#222] text-xs font-mono text-slate-700 dark:text-zinc-300"
              >
                <div className="truncate min-w-0">
                  <span className="text-indigo-600 dark:text-indigo-400">{key}</span>
                  <span className="text-slate-400 dark:text-zinc-500">: </span>
                  <span className="truncate">{value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProperty(key)}
                  className="text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 p-1 rounded cursor-pointer transition-colors"
                  title={`Remove ${key}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
