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
  Code,
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
  LayoutPanelTop,
  MousePointerClick,
  Play,
} from "lucide-react";

export type ViewportMode = "desktop" | "tablet" | "mobile" | "all";

interface ToolbarProps {
  fileName: string | null;
  viewport: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  onChangeFile: () => void;
  statusMessage: string | null;
  historyCount: number;
  onToggleHistory: () => void;
  onOpenReview: () => void;
  onOpenExport?: () => void;
  onCopyCode?: () => void;
  onCopyJsx?: () => void;
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
  onOpenExport,
  onCopyCode,
  onCopyJsx,
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
  const canvasMode = useSettingsStore((s) => s.canvasMode);
  const setCanvasMode = useSettingsStore((s) => s.setCanvasMode);
  const edits = useChangeSetStore((s) => s.edits);
  const past = useUndoStore((s) => s.past);
  const future = useUndoStore((s) => s.future);
  const [copied, setCopied] = useState(false);
  const [copiedJsx, setCopiedJsx] = useState(false);

  function handleCopy() {
    onCopyCode?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyJsx() {
    onCopyJsx?.();
    setCopiedJsx(true);
    setTimeout(() => setCopiedJsx(false), 2000);
  }

  return (
    <header className="h-12 bg-white dark:bg-[#090909] border-b border-slate-200 dark:border-[#262626] flex items-center justify-between px-3 sm:px-4 z-30 select-none text-slate-800 dark:text-white transition-colors">
      {/* Left: Sidebar Toggle, Brand & File info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {fileName && onToggleLeftSidebar && (
          <button
            type="button"
            onClick={onToggleLeftSidebar}
            aria-label="Toggle Layers & Library Sidebar"
            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
              leftSidebarOpen
                ? "bg-[#0099ff]/15 border-[#0099ff]/40 text-[#0099ff]"
                : "bg-slate-100 dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c1c1c]"
            }`}
            title="Toggle Layers & Insert Library"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 font-semibold text-xs tracking-tight text-slate-900 dark:text-white shrink-0">
          <div className="w-6 h-6 rounded-full bg-[#0099ff] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-white/20" />
          </div>
          <span className="hidden sm:inline font-bold tracking-tight text-xs uppercase text-slate-900 dark:text-white">
            Visual Studio
          </span>
        </div>

        {fileName && (
          <div className="flex items-center gap-2 pl-2.5 border-l border-slate-200 dark:border-[#262626] truncate">
            <span className="text-xs font-mono text-slate-700 dark:text-zinc-300 truncate max-w-[110px] sm:max-w-[180px]" title={fileName}>
              {fileName}
            </span>
            <button
              type="button"
              onClick={onChangeFile}
              className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-[#0099ff] underline underline-offset-2 shrink-0 cursor-pointer transition-colors"
            >
              Change
            </button>
          </div>
        )}

        {statusMessage && (
          <div className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
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
              type="button"
              onClick={() => useUndoStore.getState().undo(iframeDocument)}
              disabled={past.length === 0}
              aria-label="Undo action"
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed rounded-full hover:bg-white dark:hover:bg-[#1c1c1c] transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => useUndoStore.getState().redo(iframeDocument)}
              disabled={future.length === 0}
              aria-label="Redo action"
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed rounded-full hover:bg-white dark:hover:bg-[#1c1c1c] transition-colors cursor-pointer"
              title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canvas Mode: Edit vs Interact */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setCanvasMode("edit")}
              aria-label="Edit Mode"
              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                canvasMode === "edit"
                  ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Visual Edit Mode (Select, Drag, and Style Elements)"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setCanvasMode("interact")}
              aria-label="Interactive Preview Mode"
              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                canvasMode === "interact"
                  ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Interactive Preview Mode (Test Accordions, Links, Modals, Menus)"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden md:inline">Interact</span>
            </button>
          </div>

          {/* Viewport Modes */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-full p-0.5">
            <button
              type="button"
              onClick={() => onViewportChange("desktop")}
              aria-label="Desktop Viewport"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "desktop"
                  ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] font-semibold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Desktop View (Global Base)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewportChange("tablet")}
              aria-label="Tablet Viewport"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "tablet"
                  ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] font-semibold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewportChange("mobile")}
              aria-label="Mobile Viewport"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "mobile"
                  ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] font-semibold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-slate-300 dark:bg-[#262626] mx-0.5" />
            <button
              type="button"
              onClick={() => onViewportChange("all")}
              aria-label="All Viewports Side-by-Side"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "all"
                  ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] font-semibold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="All Screens Side-by-Side (Desktop + Tablet + Mobile)"
            >
              <LayoutPanelTop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          {onZoomIn && onZoomOut && (
            <div className="hidden lg:flex items-center bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-full p-0.5">
              <button
                type="button"
                onClick={onZoomOut}
                aria-label="Zoom Out"
                className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-[#1c1c1c] transition-colors cursor-pointer"
                title="Zoom Out (Ctrl+Scroll Down)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onZoomReset}
                className="px-2 text-[11px] font-mono font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={onZoomIn}
                aria-label="Zoom In"
                className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-[#1c1c1c] transition-colors cursor-pointer"
                title="Zoom In (Ctrl+Scroll Up)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Right: Actions & Theme Toggle */}
      <div className="flex items-center gap-1.5">
        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleAppTheme}
          aria-label={appTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
          title={appTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {appTheme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#0099ff]" />}
        </button>

        {fileName && (
          <>
            <label className="hidden xl:flex items-center gap-1 text-[11px] text-slate-600 dark:text-zinc-400 cursor-pointer pr-1">
              <input
                type="checkbox"
                checked={snapToDefaultScale}
                onChange={toggleSnap}
                className="rounded bg-slate-100 dark:bg-[#141414] border-slate-300 dark:border-[#262626] text-[#0099ff] focus:ring-[#0099ff] accent-[#0099ff]"
              />
              <span>Snap</span>
            </label>

            {/* Quick Copy Code */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-xs text-slate-800 dark:text-zinc-200 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Copy HTML code to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />}
              <span className={copied ? "text-emerald-400 font-semibold" : ""}>{copied ? "Copied!" : "Copy HTML"}</span>
            </button>

            {onCopyJsx && (
              <button
                type="button"
                onClick={handleCopyJsx}
                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-xs text-slate-800 dark:text-zinc-200 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Export as React JSX / TSX Component"
              >
                {copiedJsx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-[#0099ff]" />}
                <span className={copiedJsx ? "text-emerald-400 font-semibold" : ""}>{copiedJsx ? "Copied JSX!" : "Copy JSX"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleHistory}
              aria-label="Version history drawer"
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-xs text-slate-800 dark:text-zinc-200 font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#262626] text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                  {historyCount}
                </span>
              )}
            </button>

            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                aria-label="Keyboard shortcuts"
                className="p-1.5 rounded-full bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#0099ff] to-[#6366f1] hover:from-[#0088e6] hover:to-[#5254e0] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
                title="Open Export Studio (HTML, React, Next.js, Astro, PNG)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Export Studio</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReview}
              disabled={edits.length === 0}
              className="px-3.5 py-1 rounded-full bg-white text-black font-semibold hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Review & Save</span>
              {edits.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#0099ff] text-white text-[10px] font-bold">
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

