import type { VersionEntry } from "@/lib/fs/version-history";
import { History, Download, X, AlertCircle } from "lucide-react";

interface VersionHistoryProps {
  entries: VersionEntry[];
  onDownload: (entry: VersionEntry) => void;
  onClose: () => void;
}

export default function VersionHistory({ entries, onDownload, onClose }: VersionHistoryProps) {
  return (
    <div className="fixed top-16 right-4 bg-[#141414] border border-[#262626] rounded-2xl p-4 w-80 shadow-2xl z-50 text-zinc-200 animate-in fade-in slide-in-from-top-2 duration-150 transition-colors">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <History className="w-3.5 h-3.5 text-[#0099ff]" />
          <span>Session Version History</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close version history"
          className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-[#1c1c1c] transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-xs text-zinc-500 py-3 text-center">No earlier versions yet.</div>
      ) : (
        <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-1 no-scrollbar">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between p-2 rounded-xl bg-[#1c1c1c] border border-[#262626] text-xs shadow-2xs"
            >
              <span className="truncate max-w-[170px] text-zinc-300 font-medium" title={entry.label}>
                {entry.label}
              </span>
              <button
                type="button"
                aria-label={`Download version ${entry.label}`}
                onClick={() => onDownload(entry)}
                className="px-2.5 py-1 rounded-lg bg-[#0099ff]/15 hover:bg-[#0099ff]/25 text-[#0099ff] border border-[#0099ff]/30 text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Save</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 pt-2 border-t border-[#262626] flex items-start gap-1.5 text-[10px] text-zinc-500 leading-tight">
        <AlertCircle className="w-3 h-3 text-zinc-500 shrink-0 mt-0.5" />
        <span>Session-only memory backups. Gone if tab is closed or reloaded.</span>
      </div>
    </div>
  );
}
