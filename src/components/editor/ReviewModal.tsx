import type { EditRecord } from "@/types";
import { useChangeSetStore } from "@/store/change-set-store";
import { useUndoStore } from "@/store/undo-store";
import { resolveElementByStructuralPath } from "@/lib/dom/resolve-live-path";
import { X, Save, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";

export function friendlyLabel(structuralPath: string): string {
  if (structuralPath.startsWith("#")) return structuralPath;
  const segments = structuralPath.split(">");
  return segments[segments.length - 1] ?? structuralPath;
}

export function revertAllEdits(edits: EditRecord[], iframeDocument: Document | null): void {
  if (!iframeDocument) return;

  // Class-kind edits
  const earliestClassEditByPath = new Map<string, EditRecord & { kind: "class" }>();
  for (const edit of edits) {
    if (edit.kind !== "class") continue;
    const existing = earliestClassEditByPath.get(edit.structuralPath);
    if (!existing || edit.timestamp < existing.timestamp) {
      earliestClassEditByPath.set(edit.structuralPath, edit);
    }
  }
  for (const [structuralPath, earliest] of earliestClassEditByPath) {
    const el = resolveElementByStructuralPath(iframeDocument, structuralPath);
    if (!el) continue;
    el.className = earliest.oldClassList.join(" ");
  }

  // Style-kind edits
  const earliestStyleEditByKey = new Map<string, EditRecord & { kind: "style" }>();
  for (const edit of edits) {
    if (edit.kind !== "style") continue;
    const key = `${edit.structuralPath}::${edit.styleProperty}`;
    const existing = earliestStyleEditByKey.get(key);
    if (!existing || edit.timestamp < existing.timestamp) {
      earliestStyleEditByKey.set(key, edit);
    }
  }
  for (const earliest of earliestStyleEditByKey.values()) {
    const el = resolveElementByStructuralPath(iframeDocument, earliest.structuralPath);
    if (!el || !("style" in el)) continue;
    const htmlEl = el as HTMLElement;
    if (earliest.oldStyleValue) {
      htmlEl.style.setProperty(earliest.styleProperty, earliest.oldStyleValue);
    } else {
      htmlEl.style.removeProperty(earliest.styleProperty);
    }
  }

  // Text-kind edits
  const earliestTextEditByPath = new Map<string, EditRecord & { kind: "text" }>();
  for (const edit of edits) {
    if (edit.kind !== "text") continue;
    const existing = earliestTextEditByPath.get(edit.structuralPath);
    if (!existing || edit.timestamp < existing.timestamp) {
      earliestTextEditByPath.set(edit.structuralPath, edit);
    }
  }
  for (const [structuralPath, earliest] of earliestTextEditByPath) {
    const el = resolveElementByStructuralPath(iframeDocument, structuralPath);
    if (!el) continue;
    el.textContent = earliest.oldText;
  }
}

interface ReviewModalProps {
  iframeDocument: Document | null;
  onSave?: () => void;
  onClose?: () => void;
}

export default function ReviewModal({ iframeDocument, onSave, onClose }: ReviewModalProps) {
  const edits = useChangeSetStore((s) => s.edits);
  const clear = useChangeSetStore((s) => s.clear);

  function handleDiscardAll() {
    if (window.confirm("Are you sure you want to discard all changes made in this session?")) {
      revertAllEdits(edits, iframeDocument);
      clear();
      useUndoStore.getState().reset();
      onClose?.();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
              {edits.length}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Review Changes</h3>
              <p className="text-xs text-gray-400">Inspect before/after modifications before saving.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Changes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {edits.map((edit, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-950/70 border border-gray-800/80 rounded-xl space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-medium text-indigo-400">{friendlyLabel(edit.structuralPath)}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                  {edit.property}
                </span>
              </div>

              {edit.kind === "class" && (
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-rose-400/80 truncate max-w-[45%]" title={edit.oldClassList.join(" ")}>
                    {edit.oldClassList.join(" ") || "none"}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-500 shrink-0" />
                  <span className="text-emerald-400 font-semibold truncate max-w-[45%]" title={edit.newClassList.join(" ")}>
                    {edit.newClassList.join(" ")}
                  </span>
                </div>
              )}

              {edit.kind === "style" && (
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-rose-400/80 truncate max-w-[45%]" title={edit.oldStyleValue}>
                    {edit.styleProperty}: {edit.oldStyleValue || "none"};
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-500 shrink-0" />
                  <span className="text-emerald-400 font-semibold truncate max-w-[45%]" title={edit.newStyleValue}>
                    {edit.styleProperty}: {edit.newStyleValue};
                  </span>
                </div>
              )}

              {edit.kind === "text" && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-rose-400/80 truncate max-w-[45%]" title={edit.oldText}>
                    "{edit.oldText}"
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-500 shrink-0" />
                  <span className="text-emerald-400 font-semibold truncate max-w-[45%]" title={edit.newText}>
                    "{edit.newText}"
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/40 flex items-center justify-between">
          <button
            onClick={handleDiscardAll}
            className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard All Changes</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Keep Editing
            </button>
            <button
              onClick={onSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
