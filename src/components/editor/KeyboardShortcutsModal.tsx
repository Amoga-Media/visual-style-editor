import { X, Command, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["Ctrl", "\\"], macKeys: ["⌘", "\\"], description: "Toggle UI (hide/show left & right sidebars)" },
  { keys: ["Ctrl", "K"], macKeys: ["⌘", "K"], description: "Open keyboard shortcuts guide" },
  { keys: ["Ctrl", "Z"], macKeys: ["⌘", "Z"], description: "Undo last style or copy change" },
  { keys: ["Ctrl", "Shift", "Z"], macKeys: ["⌘", "⇧", "Z"], description: "Redo change (or Ctrl+Y)" },
  { keys: ["Ctrl", "Scroll"], macKeys: ["⌘", "Scroll"], description: "Zoom canvas workspace in / out" },
  { keys: ["Ctrl", "+"], macKeys: ["⌘", "+"], description: "Increase webapp interface size" },
  { keys: ["Ctrl", "-"], macKeys: ["⌘", "-"], description: "Decrease webapp interface size" },
  { keys: ["Ctrl", "0"], macKeys: ["⌘", "0"], description: "Reset interface size to 100%" },
  { keys: ["Ctrl", "D"], macKeys: ["⌘", "D"], description: "Duplicate selected element" },
  { keys: ["Delete"], macKeys: ["⌫"], description: "Delete selected element" },
  { keys: ["Escape"], macKeys: ["Esc"], description: "Deselect active element / close modals" },
  { keys: ["Double Click"], macKeys: ["Double Click"], description: "Edit text copy inline directly on canvas" },
  { keys: ["▲ / ▼"], macKeys: ["▲ / ▼"], description: "Step numeric input values up / down" },
  { keys: ["Shift", "▲ / ▼"], macKeys: ["⇧", "▲ / ▼"], description: "Step numeric values by 10× units" },
  { keys: ["?"], macKeys: ["?"], description: "Open keyboard shortcuts guide" },
];

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-[#262626] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0099ff]/15 border border-[#0099ff]/30 text-[#0099ff] flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-zinc-400">Power up your visual editing speed</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close keyboard shortcuts modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1c1c1c] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
          {SHORTCUTS.map((item, idx) => {
            const displayKeys = isMac ? item.macKeys : item.keys;
            return (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#1c1c1c] border border-[#262626] text-xs shadow-2xs"
              >
                <span className="text-zinc-300 font-medium">{item.description}</span>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  {displayKeys.map((k, kIdx) => (
                    <kbd
                      key={kIdx}
                      className="px-2 py-1 rounded-lg bg-[#141414] border border-[#262626] text-zinc-200 font-mono text-[11px] font-semibold shadow-2xs"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-[#262626] flex justify-end">
          <button
            type="button"
            aria-label="Close shortcuts modal"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
