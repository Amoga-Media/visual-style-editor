import { useState } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { useUndoStore } from "@/store/undo-store";
import { useChangeSetStore } from "@/store/change-set-store";
import {
  Undo,
  Redo,
  History,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  ZoomIn,
  ZoomOut,
  PanelLeft,
  HelpCircle,
  Sun,
  Moon,
} from "lucide-react";

export type ViewportMode = "desktop" | "tablet" | "mobile";

interface ToolbarProps {
  fileName: string | null;
  viewport: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  onChangeFile: () => void;
  statusMessage: string | null;
  historyCount: number;
  onToggleHistory: () => void;
  onOpenReview: () => void;
  onCopyCode?: () => void;
  iframeDocument: Document | null;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onOpenShortcuts?: () => void;
}

export default function Toolbar({
  fileName,
  viewport,
  onViewportChange,
  onChangeFile,
  statusMessage,
  historyCount,
  onToggleHistory,
  onOpenReview,
  onCopyCode,
  iframeDocument,
  leftSidebarOpen = false,
  onToggleLeftSidebar,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onOpenShortcuts,
}: ToolbarProps) {
  const snapToDefaultScale = useSettingsStore((s) => s.snapToDefaultScale);
  const toggleSnap = useSettingsStore((s) => s.toggleSnap);
  const appTheme = useSettingsStore((s) => s.appTheme);
  const toggleAppTheme = useSettingsStore((s) => s.toggleAppTheme);
  const edits = useChangeSetStore((s) => s.edits);
  const past = useUndoStore((s) => s.past);
  const future = useUndoStore((s) => s.future);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    onCopyCode?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="h-13 bg-white dark:bg-[#090909] border-b border-slate-200 dark:border-[#262626] flex items-center justify-between px-3 sm:px-4 z-30 select-none text-slate-800 dark:text-white transition-colors">
      {/* Left: Sidebar Toggle, Brand & File info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {fileName && onToggleLeftSidebar && (
          <button
            onClick={onToggleLeftSidebar}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              leftSidebarOpen
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-[#0099ff]"
                : "bg-slate-100 dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c1c1c]"
            }`}
            title="Toggle Layers & Insert Library"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 font-semibold text-xs tracking-tight text-slate-900 dark:text-white shrink-0">
          <div className="w-6 h-6 rounded-md bg-indigo-600 dark:bg-[#0099ff] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="hidden md:inline font-medium tracking-tight">
            Visual Studio
          </span>
        </div>

        {fileName && (
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-[#262626] truncate">
            <span className="text-xs font-mono text-slate-700 dark:text-zinc-300 truncate max-w-[110px] sm:max-w-[180px]" title={fileName}>
              {fileName}
            </span>
            <button
              onClick={onChangeFile}
              className="text-[11px] text-slate-500 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-[#0099ff] underline underline-offset-2 shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>
        )}

        {statusMessage && (
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Center: Device Viewport Switcher, Zoom & Undo/Redo */}
      {fileName && (
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-full p-0.5">
            <button
              onClick={() => useUndoStore.getState().undo(iframeDocument)}
              disabled={past.length === 0}
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed rounded-full hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors cursor-pointer"
              title="Undo (Ctrl+Z / Cmd+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => useUndoStore.getState().redo(iframeDocument)}
              disabled={future.length === 0}
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed rounded-full hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors cursor-pointer"
              title="Redo (Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Viewport Modes */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-full p-0.5">
            <button
              onClick={() => onViewportChange("desktop")}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "desktop" ? "bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewportChange("tablet")}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "tablet" ? "bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewportChange("mobile")}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "mobile" ? "bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          {onZoomIn && onZoomOut && (
            <div className="hidden lg:flex items-center bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-full p-0.5">
              <button
                onClick={onZoomOut}
                className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onZoomReset}
                className="px-1.5 text-[11px] font-mono text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={onZoomIn}
                className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Right: Actions & Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleAppTheme}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
          title={appTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {appTheme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {fileName && (
          <>
            <label className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer pr-1">
              <input
                type="checkbox"
                checked={snapToDefaultScale}
                onChange={toggleSnap}
                className="rounded bg-slate-100 dark:bg-[#141414] border-slate-300 dark:border-[#262626] text-indigo-600 dark:text-[#0099ff] focus:ring-indigo-500 accent-indigo-600 dark:accent-[#0099ff]"
              />
              <span>Snap</span>
            </label>

            {/* Quick Copy Code */}
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-xs text-slate-800 dark:text-zinc-200 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy HTML code to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />}
              <span className={copied ? "text-emerald-500" : ""}>{copied ? "Copied!" : "Copy HTML"}</span>
            </button>

            <button
              onClick={onToggleHistory}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-xs text-slate-800 dark:text-zinc-200 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#262626] text-[10px] text-slate-700 dark:text-zinc-300">
                  {historyCount}
                </span>
              )}
            </button>

            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onOpenReview}
              disabled={edits.length === 0}
              className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black font-semibold disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Review & Save</span>
              {edits.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white dark:bg-black text-slate-900 dark:text-white text-[10px] font-bold">
                  {edits.length}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
