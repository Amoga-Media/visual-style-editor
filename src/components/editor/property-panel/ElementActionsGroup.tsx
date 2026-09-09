import { Copy, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { EditRecord } from "@/types";

interface ElementActionsGroupProps {
  element: Element;
  structuralPath: string;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export default function ElementActionsGroup({
  element,
  structuralPath,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ElementActionsGroupProps) {
  const tagName = element.tagName.toLowerCase();
  if (tagName === "body" || tagName === "html") return null;

  return (
    <div className="p-4 border-b border-[#262626] space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label="Duplicate element"
          onClick={onDuplicate}
          className="px-3 py-2 rounded-xl bg-[#141414] hover:bg-[#1c1c1c] border border-[#262626] hover:border-[#0099ff]/40 text-zinc-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          title="Duplicate Element (Ctrl+D)"
        >
          <Copy className="w-3.5 h-3.5 text-[#0099ff]" />
          <span>Duplicate</span>
        </button>

        <button
          type="button"
          aria-label="Delete element"
          onClick={onDelete}
          className="px-3 py-2 rounded-xl bg-[#141414] hover:bg-rose-950/30 border border-[#262626] hover:border-rose-500/40 text-rose-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          title="Delete Element (Del)"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Delete</span>
        </button>
      </div>

      {(onMoveUp || onMoveDown) && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            aria-label="Move element up"
            onClick={onMoveUp}
            disabled={!element.previousElementSibling}
            className="px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1c1c1c] disabled:opacity-30 disabled:cursor-not-allowed border border-[#262626] text-zinc-300 text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
            title="Move Before Previous Sibling"
          >
            <ArrowUp className="w-3 h-3 text-zinc-400" />
            <span>Move Up</span>
          </button>

          <button
            type="button"
            aria-label="Move element down"
            onClick={onMoveDown}
            disabled={!element.nextElementSibling}
            className="px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1c1c1c] disabled:opacity-30 disabled:cursor-not-allowed border border-[#262626] text-zinc-300 text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
            title="Move After Next Sibling"
          >
            <ArrowDown className="w-3 h-3 text-zinc-400" />
            <span>Move Down</span>
          </button>
        </div>
      )}
    </div>
  );
}
