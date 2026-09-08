import { X, Command, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["Ctrl", "Z"], macKeys: ["⌘", "Z"], description: "Undo last style or copy change" },
  { keys: ["Ctrl", "Shift", "Z"], macKeys: ["⌘", "⇧", "Z"], description: "Redo change" },
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-gray-400">Power up your visual editing speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS.map((item, idx) => {
            const displayKeys = isMac ? item.macKeys : item.keys;
            return (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-950/60 border border-gray-800/80 text-xs"
              >
                <span className="text-gray-300 font-medium">{item.description}</span>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  {displayKeys.map((k, kIdx) => (
                    <kbd
                      key={kIdx}
                      className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200 font-mono text-[11px] shadow-sm"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
