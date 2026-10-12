import { useState, useRef, useEffect } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { useUndoStore } from "@/store/undo-store";
import { useChangeSetStore } from "@/store/change-set-store";
import { useWorkspaceStore } from "@/store/workspace-store";
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
  Palette,
  ChevronDown,
  FileCode,
  Layers,
  SaveAll,
  Eye,
  LogOut,
  Heart,
  MoreHorizontal,
} from "lucide-react";
import GpuStatusBadge from "./GpuStatusBadge";

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
  onOpenProjectConfig?: () => void;
  onSaveAll?: () => void;
  onSwitchPage?: (fileId: string) => void;
  iframeDocument: Document | null;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onOpenShortcuts?: () => void;
  isDimensionsHUDHidden?: boolean;
  onToggleDimensionsHUD?: () => void;
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
  onOpenProjectConfig,
  onSaveAll,
  onSwitchPage,
  iframeDocument,
  leftSidebarOpen = false,
  onToggleLeftSidebar,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onOpenShortcuts,
  isDimensionsHUDHidden = false,
  onToggleDimensionsHUD,
}: ToolbarProps) {
  const appTheme = useSettingsStore((s) => s.appTheme);
  const toggleAppTheme = useSettingsStore((s) => s.toggleAppTheme);
  const canvasMode = useSettingsStore((s) => s.canvasMode);
  const setCanvasMode = useSettingsStore((s) => s.setCanvasMode);
  const edits = useChangeSetStore((s) => s.edits);
  const past = useUndoStore((s) => s.past);
  const future = useUndoStore((s) => s.future);

  const workspaceFiles = useWorkspaceStore((s) => s.files);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const projectConfig = useWorkspaceStore((s) => s.projectConfig);

  const [copied, setCopied] = useState(false);
  const [copiedJsx, setCopiedJsx] = useState(false);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const dirtyFilesCount = workspaceFiles.filter((f) => f.isDirty || (f.id === activeFileId && edits.length > 0)).length;
  const hasCustomProjectTheme = !!(projectConfig.tailwindConfig || projectConfig.customStyles);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPageDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    if (pageDropdownOpen || moreMenuOpen) {
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }
  }, [pageDropdownOpen, moreMenuOpen]);

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
    <header className="h-13 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#222226] flex items-center justify-between px-3 sm:px-4 z-30 select-none text-slate-800 dark:text-white transition-colors shrink-0">
      {/* ZONE 1: Left Brand, Page Selector, Undo/Redo */}
      <div className="flex items-center gap-2 min-w-0">
        {fileName && onToggleLeftSidebar && (
          <button
            type="button"
            onClick={onToggleLeftSidebar}
            aria-label="Toggle Navigation Sidebar"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              leftSidebarOpen
                ? "bg-[#0099ff]/10 border-[#0099ff]/30 text-[#0099ff]"
                : "bg-slate-100 dark:bg-[#18181c] border-slate-200 dark:border-[#28282d] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="Toggle Navigation Sidebar (Ctrl+\\)"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 font-bold text-xs tracking-tight text-slate-900 dark:text-white shrink-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0099ff] via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-white/20" />
          </div>
          <span className="hidden lg:inline font-bold tracking-wide text-xs uppercase text-slate-900 dark:text-white">
            Visual Studio
          </span>
        </div>

        {/* Multi-Page Selector Dropdown */}
        {fileName && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#18181c] hover:bg-slate-200 dark:hover:bg-[#222228] border border-slate-200 dark:border-[#28282d] text-xs font-mono text-slate-800 dark:text-zinc-200 cursor-pointer transition-all truncate"
            >
              <FileCode className="w-3.5 h-3.5 text-[#0099ff] shrink-0" />
              <span className="truncate max-w-[100px] sm:max-w-[140px]" title={fileName}>
                {fileName}
              </span>
              {workspaceFiles.length > 1 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#28282d] font-sans font-bold text-slate-600 dark:text-zinc-400">
                  {workspaceFiles.length}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${pageDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {pageDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#28282c] rounded-xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Workspace Pages</span>
                  <span>{workspaceFiles.length} files</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {workspaceFiles.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => {
                        onSwitchPage?.(file.id);
                        setPageDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        file.id === activeFileId
                          ? "bg-[#0099ff]/10 text-[#0099ff] font-semibold"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      {file.isDirty && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
                      )}
                    </button>
                  ))}
                </div>
                {onChangeFile && (
                  <div className="pt-1 mt-1 border-t border-slate-200 dark:border-[#28282c]">
                    <button
                      type="button"
                      onClick={() => {
                        setPageDropdownOpen(false);
                        onChangeFile();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center gap-2 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Exit Workspace</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Undo / Redo */}
        {fileName && (
          <div className="flex items-center bg-slate-100 dark:bg-[#18181c] border border-slate-200 dark:border-[#28282d] rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => useUndoStore.getState().undo(iframeDocument)}
              disabled={past.length === 0}
              aria-label="Undo action"
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed rounded-md hover:bg-white dark:hover:bg-[#242429] transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => useUndoStore.getState().redo(iframeDocument)}
              disabled={future.length === 0}
              aria-label="Redo action"
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed rounded-md hover:bg-white dark:hover:bg-[#242429] transition-colors cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Exit Button */}
        {fileName && onChangeFile && (
          <button
            type="button"
            onClick={onChangeFile}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#18181c] hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-600 dark:text-zinc-400 hover:text-rose-500 border border-slate-200 dark:border-[#28282d] text-xs font-medium cursor-pointer transition-all shrink-0"
            title="Exit Project & Return to Home"
            aria-label="Exit Project"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Exit</span>
          </button>
        )}
      </div>

      {/* ZONE 2: Center Unified Stage Capsule (Mode + Viewports + Zoom) */}
      {fileName && (
        <div className="flex items-center bg-slate-100 dark:bg-[#141417] border border-slate-200/80 dark:border-[#25252a] rounded-xl p-1 gap-1 shadow-xs">
          {/* Edit / Interact Mode */}
          <div className="flex items-center bg-slate-200/60 dark:bg-[#1d1d22] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setCanvasMode("edit")}
              aria-label="Edit Mode"
              className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                canvasMode === "edit"
                  ? "bg-white dark:bg-[#2a2a30] text-[#0084FF] font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Visual Edit Mode (Select & Style Elements)"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setCanvasMode("interact")}
              aria-label="Interactive Preview Mode"
              className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                canvasMode === "interact"
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Interactive Preview Mode (Test Links & Modals)"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden md:inline">Interact</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5" />

          {/* Viewport Modes */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onViewportChange("desktop")}
              aria-label="Desktop Viewport"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewport === "desktop"
                  ? "bg-white dark:bg-[#2a2a30] text-[#0084FF] font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Desktop View (Fluid Fill)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewportChange("tablet")}
              aria-label="Tablet Viewport"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewport === "tablet"
                  ? "bg-white dark:bg-[#2a2a30] text-[#0084FF] font-semibold shadow-xs"
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
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewport === "mobile"
                  ? "bg-white dark:bg-[#2a2a30] text-[#0084FF] font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewportChange("all")}
              aria-label="All Viewports Side-by-Side"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewport === "all"
                  ? "bg-white dark:bg-[#2a2a30] text-[#0084FF] font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="All Viewports Side-by-Side"
            >
              <LayoutPanelTop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dimensions HUD Toggle Button */}
          {onToggleDimensionsHUD && (
            <>
              <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5" />
              <button
                type="button"
                onClick={onToggleDimensionsHUD}
                aria-label={isDimensionsHUDHidden ? "Show Dimensions Dropdown" : "Hide Dimensions Dropdown"}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  !isDimensionsHUDHidden
                    ? "bg-white dark:bg-[#2a2a30] text-[#0084FF] font-semibold shadow-xs"
                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
                title={isDimensionsHUDHidden ? "Show Dimensions Dropdown" : "Hide Dimensions Dropdown"}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Zoom Controls */}
          {onZoomIn && onZoomOut && (
            <>
              <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={onZoomOut}
                  aria-label="Zoom Out"
                  className="p-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-[#2a2a30] transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onZoomReset}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-white/80 dark:bg-[#25252b] text-slate-700 dark:text-zinc-200 hover:text-[#0084FF] dark:hover:text-[#0084FF] border border-slate-200/50 dark:border-white/5 cursor-pointer transition-colors"
                  title="Fit to Window / 100% Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={onZoomIn}
                  aria-label="Zoom In"
                  className="p-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-[#2a2a30] transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ZONE 3: Right Side - Actions & Tools Overflow */}
      <div className="flex items-center gap-2">
        {statusMessage && (
          <div className="hidden 2xl:flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {fileName && (
          <>
            {/* Save All when multiple dirty pages */}
            {dirtyFilesCount > 1 && onSaveAll && (
              <button
                type="button"
                onClick={onSaveAll}
                className="px-2.5 py-1.2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                title="Save all modified pages"
              >
                <SaveAll className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Save All</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                  {dirtyFilesCount}
                </span>
              </button>
            )}

            {/* Review & Save Button */}
            <button
              type="button"
              onClick={onOpenReview}
              disabled={edits.length === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#18181c] text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-[#28282d] hover:bg-slate-200 dark:hover:bg-[#222228] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0"
            >
              <Save className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Review & Save</span>
              {edits.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#0084FF] text-white text-[10px] font-bold">
                  {edits.length}
                </span>
              )}
            </button>

            {/* Primary CTA: Export Studio */}
            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0084FF] to-blue-600 hover:from-[#0074E0] hover:to-blue-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-[#0084FF]/20 shrink-0"
                title="Open Export Studio"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white/20" />
                <span>Export</span>
              </button>
            )}

            {/* Project Config & Custom Styles */}
            {onOpenProjectConfig && (
              <button
                type="button"
                onClick={onOpenProjectConfig}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#18181c] hover:bg-slate-200 dark:hover:bg-[#222228] border border-slate-200 dark:border-[#28282d] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer relative"
                title="Project Config & Custom Styles (tailwind.config / style.css)"
              >
                <Palette className="w-3.5 h-3.5 text-emerald-500" />
                {hasCustomProjectTheme && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
                )}
              </button>
            )}

            {/* Secondary Utilities Overflow Dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-label="More tools and settings"
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#18181c] hover:bg-slate-200 dark:hover:bg-[#222228] border border-slate-200 dark:border-[#28282d] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="More Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#28282c] rounded-xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 text-xs">
                  {/* Theme Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleAppTheme();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {appTheme === "dark" ? (
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-[#0084FF]" />
                      )}
                      <span>Appearance</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                      {appTheme}
                    </span>
                  </button>

                  {/* Copy HTML */}
                  {onCopyCode && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCopy();
                        setMoreMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Copy HTML</span>
                      </div>
                      {copied && <span className="text-emerald-500 font-bold text-[10px]">Copied</span>}
                    </button>
                  )}

                  {/* Copy JSX */}
                  {onCopyJsx && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyJsx();
                        setMoreMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {copiedJsx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5 text-[#0084FF]" />}
                        <span>Copy JSX</span>
                      </div>
                      {copiedJsx && <span className="text-emerald-500 font-bold text-[10px]">Copied</span>}
                    </button>
                  )}

                  {/* Version History */}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleHistory();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>Version History</span>
                    </div>
                    {historyCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#0084FF] text-white text-[9px] font-bold">
                        {historyCount}
                      </span>
                    )}
                  </button>

                  {/* Project Config */}
                  {onOpenProjectConfig && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenProjectConfig();
                        setMoreMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Project Styles / CSS</span>
                      </div>
                      {hasCustomProjectTheme && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  )}

                  {/* Keyboard Shortcuts */}
                  {onOpenShortcuts && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenShortcuts();
                        setMoreMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Keyboard Shortcuts</span>
                    </button>
                  )}

                  <div className="pt-1 border-t border-slate-200 dark:border-[#28282c] flex items-center justify-between px-1">
                    <GpuStatusBadge />
                    <a
                      href="/support"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-rose-500 hover:underline font-medium"
                    >
                      <Heart className="w-3 h-3 fill-current" />
                      <span>Support</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}


