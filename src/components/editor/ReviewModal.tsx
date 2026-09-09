import type { EditRecord } from "@/types";
import { useChangeSetStore } from "@/store/change-set-store";
import { useUndoStore } from "@/store/undo-store";
import { resolveElementByStructuralPath } from "@/lib/dom/resolve-live-path";
import { describeEdit } from "@/lib/dom/describe-edit";
import { clearResponsiveRegistry } from "@/lib/dom/responsive-style-engine";
import { X, Save, Trash2, ArrowRight } from "lucide-react";

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
  onDiscardAll?: () => void;
}

export default function ReviewModal({ iframeDocument, onSave, onClose, onDiscardAll }: ReviewModalProps) {
  const edits = useChangeSetStore((s) => s.edits);
  const clear = useChangeSetStore((s) => s.clear);

  function handleDiscardAll() {
    if (window.confirm("Are you sure you want to discard all changes made in this session?")) {
      revertAllEdits(edits, iframeDocument);
      clear();
      clearResponsiveRegistry();
      useUndoStore.getState().reset();
      onDiscardAll?.();
      onClose?.();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-[#262626] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#1c1c1c]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 flex items-center justify-center font-bold text-sm">
              {edits.length}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Review Changes</h3>
              <p className="text-xs text-zinc-400">Inspect before/after modifications before saving.</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close review modal"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#1c1c1c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Changes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {edits.map((edit, idx) => {
            const desc = describeEdit(edit);
            return (
              <div
                key={idx}
                className="p-3 bg-[#1c1c1c] border border-[#262626] rounded-2xl space-y-2 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-[#0099ff]">
                    {friendlyLabel(edit.structuralPath)}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[#262626] text-zinc-400">
                    {desc.category}
                  </span>
                </div>

                <div className="text-[11px] text-zinc-300 font-medium">
                  {desc.summary}
                </div>

                {(desc.before !== undefined || desc.after !== undefined) && (
                  <div className="flex items-center gap-2 font-mono text-[11px] pt-1">
                    {desc.before !== undefined && (
                      <span className="text-rose-400/80 truncate max-w-[45%]" title={desc.before}>
                        {desc.before || "none"}
                      </span>
                    )}
                    {desc.before !== undefined && desc.after !== undefined && (
                      <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0" />
                    )}
                    {desc.after !== undefined && (
                      <span className="text-emerald-400 font-semibold truncate max-w-[45%]" title={desc.after}>
                        {desc.after || "none"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#1c1c1c]/50 flex items-center justify-between">
          <button
            type="button"
            aria-label="Discard all changes"
            onClick={handleDiscardAll}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard All Changes</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Keep editing"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-[#1c1c1c] transition-colors cursor-pointer"
            >
              Keep Editing
            </button>
            <button
              type="button"
              aria-label="Save and apply changes"
              onClick={onSave}
              className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-black transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
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
