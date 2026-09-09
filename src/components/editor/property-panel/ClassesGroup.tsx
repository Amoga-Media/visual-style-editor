import { useState, useEffect } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { Tag, Plus, X, Edit3, Layers, Check, ChevronDown, ChevronRight } from "lucide-react";
import { classifyUtilityClass } from "@/lib/tailwind/classify";

interface ClassesGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  onEdit?: (record: EditRecord) => void;
}

interface InheritedProperty {
  property: string;
  value: string;
  sourceTag: string;
  sourceId?: string;
}

export default function ClassesGroup({
  element,
  structuralPath,
  theme,
  onEdit,
}: ClassesGroupProps) {
  const [classes, setClasses] = useState<string[]>([]);
  const [newClassInput, setNewClassInput] = useState("");
  const [isRawEditing, setIsRawEditing] = useState(false);
  const [rawStringInput, setRawStringInput] = useState("");
  const [showInherited, setShowInherited] = useState(false);
  const [inheritedStyles, setInheritedStyles] = useState<InheritedProperty[]>([]);

  // Sync classes whenever element or structuralPath changes
  useEffect(() => {
    if (!element) return;
    const currentClassList = Array.from(element.classList).filter(Boolean);
    setClasses(currentClassList);
    setRawStringInput(currentClassList.join(" "));

    // Calculate inherited styles from parent elements
    const inherited: InheritedProperty[] = [];
    const INHERITED_PROPS = ["font-family", "color", "line-height", "text-align", "letter-spacing", "font-weight", "cursor"];
    let curr = element.parentElement;
    const win = element.ownerDocument?.defaultView || window;

    while (curr && curr.tagName.toLowerCase() !== "html") {
      const computed = win.getComputedStyle(curr);
      const tag = curr.tagName.toLowerCase();
      const id = curr.id ? `#${curr.id}` : undefined;

      for (const prop of INHERITED_PROPS) {
        const val = computed.getPropertyValue(prop);
        if (val && !inherited.some((item) => item.property === prop)) {
          inherited.push({
            property: prop,
            value: val,
            sourceTag: tag,
            sourceId: id,
          });
        }
      }
      curr = curr.parentElement;
    }
    setInheritedStyles(inherited);
  }, [element, structuralPath]);

  if (!element || !structuralPath) return null;

  function commitNewClassList(nextList: string[]) {
    const oldClassList = Array.from(element!.classList).filter(Boolean);
    const cleaned = nextList.map((c) => c.trim()).filter(Boolean);

    // Live DOM update
    if (element!.namespaceURI === "http://www.w3.org/2000/svg" || "ownerSVGElement" in element!) {
      element!.setAttribute("class", cleaned.join(" "));
    } else {
      element!.className = cleaned.join(" ");
    }

    setClasses(cleaned);
    setRawStringInput(cleaned.join(" "));

    onEdit?.({
      kind: "class",
      structuralPath: structuralPath!,
      property: "text-content" as any, // fallback valid EditableProperty
      oldClassList,
      newClassList: cleaned,
      timestamp: new Date().toISOString(),
    });
  }

  function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassInput.trim()) return;
    const tokens = newClassInput.split(/\s+/).filter(Boolean);
    const nextList = [...classes];
    for (const token of tokens) {
      if (!nextList.includes(token)) {
        nextList.push(token);
      }
    }
    commitNewClassList(nextList);
    setNewClassInput("");
  }

  function handleRemoveClass(classToRemove: string) {
    const nextList = classes.filter((c) => c !== classToRemove);
    commitNewClassList(nextList);
  }

  function handleSaveRawString() {
    const tokens = rawStringInput.split(/\s+/).filter(Boolean);
    commitNewClassList(tokens);
    setIsRawEditing(false);
  }

  return (
    <div className="p-4 border-b border-[#262626] space-y-3">
      {/* Action Row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium">Class Badges ({classes.length})</span>
        <button
          type="button"
          aria-label={isRawEditing ? "Switch to badge view" : "Switch to raw class editor"}
          onClick={() => setIsRawEditing((prev) => !prev)}
          className={`text-[11px] px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
            isRawEditing
              ? "bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 font-medium"
              : "text-zinc-400 hover:text-white"
          }`}
          title="Toggle raw class string editing"
        >
          <Edit3 className="w-3 h-3" />
          <span>{isRawEditing ? "Badges" : "Raw"}</span>
        </button>
      </div>

      {/* Raw Class String Editor Mode */}
      {isRawEditing ? (
        <div className="space-y-2">
          <textarea
            value={rawStringInput}
            onChange={(e) => setRawStringInput(e.target.value)}
            rows={3}
            aria-label="Raw class list string"
            className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 font-mono text-xs text-zinc-200 focus:outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] resize-y"
            placeholder="e.g. flex items-center justify-between p-4 bg-white"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              aria-label="Cancel raw class edit"
              onClick={() => {
                setRawStringInput(classes.join(" "));
                setIsRawEditing(false);
              }}
              className="px-2 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              aria-label="Apply raw class changes"
              onClick={handleSaveRawString}
              className="px-2.5 py-1 text-xs bg-[#0099ff] hover:bg-[#33adff] text-white font-medium rounded-md cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      ) : (
        /* Token Badges & Quick Add Form */
        <div className="space-y-2">
          {/* Class Badges Cloud */}
          <div className="flex flex-wrap gap-1.5 min-h-[28px] max-h-36 overflow-y-auto p-1.5 bg-[#141414] rounded-lg border border-[#262626]">
            {classes.length === 0 ? (
              <span className="text-xs text-zinc-500 italic px-1">No classes attached</span>
            ) : (
              classes.map((cls) => {
                const classification = classifyUtilityClass(cls, theme);
                return (
                  <span
                    key={cls}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-[#1c1c1c] text-zinc-200 border border-[#262626] group hover:border-zinc-600 transition-colors"
                  >
                    <span title={classification ? `Property: ${classification.property}` : "Custom/arbitrary class"}>
                      {cls}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove class ${cls}`}
                      onClick={() => handleRemoveClass(cls)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer p-0.5 -mr-0.5 rounded"
                      title={`Remove class ${cls}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })
            )}
          </div>

          {/* Quick Add Class Input */}
          <form onSubmit={handleAddClass} className="flex gap-1.5">
            <input
              type="text"
              value={newClassInput}
              onChange={(e) => setNewClassInput(e.target.value)}
              placeholder="Add class (e.g. shadow-lg rounded-xl)"
              aria-label="Add class input"
              className="flex-1 bg-[#141414] border border-[#262626] rounded-md px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff]"
            />
            <button
              type="submit"
              aria-label="Add class button"
              disabled={!newClassInput.trim()}
              className="px-2.5 py-1 bg-[#0099ff] hover:bg-[#33adff] disabled:opacity-40 text-white rounded-md text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      )}

      {/* Inherited Styles Inspector */}
      <div className="pt-1">
        <button
          type="button"
          aria-label="Toggle inherited styles view"
          onClick={() => setShowInherited((prev) => !prev)}
          className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {showInherited ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Layers className="w-3 h-3 text-[#0099ff]" />
          <span>Inherited Styles & Hierarchy ({inheritedStyles.length})</span>
        </button>

        {showInherited && (
          <div className="mt-2 space-y-1 bg-[#141414] border border-[#262626] rounded-lg p-2 text-xs">
            {inheritedStyles.length === 0 ? (
              <span className="text-zinc-500 italic">No inherited styles found</span>
            ) : (
              inheritedStyles.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 py-0.5 border-b border-[#262626] last:border-0 font-mono text-[11px]">
                  <span className="text-zinc-400">{item.property}</span>
                  <div className="flex items-center gap-1 truncate text-right">
                    <span className="text-zinc-200 truncate max-w-[130px] font-medium" title={item.value}>
                      {item.value}
                    </span>
                    <span className="text-[10px] text-[#0099ff] shrink-0 font-sans">
                      ({item.sourceTag}{item.sourceId ? ` ${item.sourceId}` : ""})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
