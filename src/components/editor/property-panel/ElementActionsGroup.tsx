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
    <div className="p-4 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Element Actions</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onDuplicate}
          className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/40 text-gray-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          title="Duplicate Element (Ctrl+D)"
        >
          <Copy className="w-3.5 h-3.5 text-indigo-400" />
          <span>Duplicate</span>
        </button>

        <button
          onClick={onDelete}
          className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-rose-950/40 border border-gray-800 hover:border-rose-500/40 text-rose-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          title="Delete Element (Del)"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Delete</span>
        </button>
      </div>

      {(onMoveUp || onMoveDown) && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onMoveUp}
            disabled={!element.previousElementSibling}
            className="px-2.5 py-1.5 rounded-lg bg-gray-900/60 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-800/80 text-gray-300 text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
            title="Move Before Previous Sibling"
          >
            <ArrowUp className="w-3 h-3 text-gray-400" />
            <span>Move Up</span>
          </button>

          <button
            onClick={onMoveDown}
            disabled={!element.nextElementSibling}
            className="px-2.5 py-1.5 rounded-lg bg-gray-900/60 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-800/80 text-gray-300 text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
            title="Move After Next Sibling"
          >
            <ArrowDown className="w-3 h-3 text-gray-400" />
            <span>Move Down</span>
          </button>
        </div>
      )}
    </div>
  );
}
