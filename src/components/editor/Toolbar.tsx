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
  const snapToDefaultScale = useSettingsStore((s) => s.snapToDefaultScale);
  const toggleSnap = useSettingsStore((s) => s.toggleSnap);
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
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const dirtyFilesCount = workspaceFiles.filter((f) => f.isDirty || (f.id === activeFileId && edits.length > 0)).length;
  const hasCustomProjectTheme = !!(projectConfig.tailwindConfig || projectConfig.customStyles);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPageDropdownOpen(false);
      }
    }
    if (pageDropdownOpen) {
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }
  }, [pageDropdownOpen]);

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
      {/* Left: Sidebar Toggle, Brand & File info / Page Dropdown */}
      <div className="flex items-center gap-2 min-w-0">
        {fileName && onToggleLeftSidebar && (
          <button
            type="button"
            onClick={onToggleLeftSidebar}
            aria-label="Toggle Layers & Library Sidebar"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              leftSidebarOpen
                ? "bg-[#0099ff]/15 border-[#0099ff]/40 text-[#0099ff]"
                : "bg-slate-100 dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c1c1c]"
            }`}
            title="Toggle Layers & Pages Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 font-semibold text-xs tracking-tight text-slate-900 dark:text-white shrink-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0099ff] to-indigo-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-white/20" />
          </div>
          <span className="hidden xl:inline font-bold tracking-tight text-xs uppercase text-slate-900 dark:text-white">
            Visual Studio
          </span>
        </div>

        {/* Multi-Page Selector Dropdown */}
        {fileName && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-xs font-mono text-slate-800 dark:text-zinc-200 cursor-pointer transition-all truncate"
            >
              <FileCode className="w-3.5 h-3.5 text-[#0099ff] shrink-0" />
              <span className="truncate max-w-[90px] sm:max-w-[140px]" title={fileName}>
                {fileName}
              </span>
              {workspaceFiles.length > 1 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#222] font-sans font-bold text-slate-600 dark:text-zinc-400">
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
                      <span>Exit Project (Close Workspace)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Exit / Close Project Button */}
        {fileName && onChangeFile && (
          <button
            type="button"
            onClick={onChangeFile}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#141414] hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-600 dark:text-zinc-400 hover:text-rose-500 border border-slate-200 dark:border-[#262626] text-xs font-medium cursor-pointer transition-all shrink-0"
            title="Exit Project & Return to Home (Ctrl+Shift+W)"
            aria-label="Exit Project"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        )}

        {/* Undo / Redo */}
        {fileName && (
          <div className="flex items-center bg-slate-100 dark:bg-[#141416] border border-slate-200 dark:border-white/[0.08] rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => useUndoStore.getState().undo(iframeDocument)}
              disabled={past.length === 0}
              aria-label="Undo action"
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed rounded-md hover:bg-white dark:hover:bg-[#202024] transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => useUndoStore.getState().redo(iframeDocument)}
              disabled={future.length === 0}
              aria-label="Redo action"
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed rounded-md hover:bg-white dark:hover:bg-[#202024] transition-colors cursor-pointer"
              title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {statusMessage && (
          <div className="hidden 2xl:flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* ZONE 2: Unified Stage Controls Capsule (Mode + Viewport + Zoom) */}
      {fileName && (
        <div className="flex items-center bg-slate-100 dark:bg-[#141416] border border-slate-200 dark:border-white/[0.08] rounded-xl p-1 gap-1 shadow-xs">
          {/* Canvas Mode: Edit vs Interact */}
          <div className="flex items-center bg-slate-200/60 dark:bg-[#1a1a1e] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setCanvasMode("edit")}
              aria-label="Edit Mode"
              className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                canvasMode === "edit"
                  ? "bg-white dark:bg-[#26262b] text-[#0084FF] font-semibold shadow-xs"
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
              className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                canvasMode === "interact"
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Interactive Preview Mode (Test Accordions, Links, Modals, Menus)"
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
                  ? "bg-white dark:bg-[#26262b] text-[#0084FF] font-semibold shadow-xs"
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
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewport === "tablet"
                  ? "bg-white dark:bg-[#26262b] text-[#0084FF] font-semibold shadow-xs"
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
                  ? "bg-white dark:bg-[#26262b] text-[#0084FF] font-semibold shadow-xs"
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
                  ? "bg-white dark:bg-[#26262b] text-[#0084FF] font-semibold shadow-xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="All Screens Side-by-Side (Desktop + Tablet + Mobile)"
            >
              <LayoutPanelTop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Dimensions HUD Capsule */}
          {onToggleDimensionsHUD && (
            <>
              <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5" />
              <button
                type="button"
                onClick={onToggleDimensionsHUD}
                aria-label={isDimensionsHUDHidden ? "Show Dimensions Dropdown" : "Hide Dimensions Dropdown"}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  !isDimensionsHUDHidden
                    ? "bg-white dark:bg-[#26262b] text-[#0084FF] font-semibold shadow-xs"
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
              <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5 hidden lg:block" />
              <div className="hidden lg:flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={onZoomOut}
                  aria-label="Zoom Out"
                  className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-[#26262b] transition-colors cursor-pointer"
                  title="Zoom Out"
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
                  className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-[#26262b] transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ZONE 3: Utilities, Save & Primary Export CTA */}
      <div className="flex items-center gap-2">
        {/* Utilities Group: Theme, History, Config, Help */}
        <div className="flex items-center bg-slate-100 dark:bg-[#141416] border border-slate-200 dark:border-white/[0.08] rounded-lg p-0.5 shadow-2xs">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleAppTheme}
            aria-label={appTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-1.5 rounded-md text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-[#202024] transition-colors cursor-pointer"
            title={appTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {appTheme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#0084FF]" />}
          </button>

          {fileName && (
            <>
              {/* History button */}
              <button
                type="button"
                onClick={onToggleHistory}
                aria-label="Version history drawer"
                className="p-1.5 rounded-md text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-[#202024] transition-colors cursor-pointer relative"
                title="Version History"
              >
                <History className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                {historyCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0084FF] absolute top-1 right-1" />
                )}
              </button>

              {/* Project Styles & Config */}
              {onOpenProjectConfig && (
                <button
                  type="button"
                  onClick={onOpenProjectConfig}
                  className="p-1.5 rounded-md text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-[#202024] transition-colors cursor-pointer relative"
                  title="Project Config & Custom Styles (tailwind.config / style.css)"
                >
                  <Palette className="w-3.5 h-3.5" />
                  {hasCustomProjectTheme && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
                  )}
                </button>
              )}

              {/* Shortcuts (?) */}
              {onOpenShortcuts && (
                <button
                  type="button"
                  onClick={onOpenShortcuts}
                  aria-label="Keyboard shortcuts"
                  className="p-1.5 rounded-md text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#202024] transition-colors cursor-pointer"
                  title="Keyboard Shortcuts (?)"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* GPU Hardware Acceleration Badge */}
        <GpuStatusBadge />

        {fileName && (
          <>
            {/* Copy Segmented Pill: HTML / JSX */}
            <div className="hidden xl:flex items-center bg-slate-100 dark:bg-[#141416] border border-slate-200 dark:border-white/[0.08] rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-md text-xs text-slate-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-[#202024] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy HTML code to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />}
                <span className={copied ? "text-emerald-500 font-semibold" : ""}>{copied ? "Copied" : "HTML"}</span>
              </button>
              {onCopyJsx && (
                <button
                  type="button"
                  onClick={handleCopyJsx}
                  className="px-2.5 py-1 rounded-md text-xs text-slate-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-[#202024] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  title="Export as React JSX / TSX Component"
                >
                  {copiedJsx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5 text-[#0084FF]" />}
                  <span className={copiedJsx ? "text-emerald-500 font-semibold" : ""}>{copiedJsx ? "Copied" : "JSX"}</span>
                </button>
              )}
            </div>

            {/* Save All when multiple dirty pages */}
            {dirtyFilesCount > 1 && onSaveAll && (
              <button
                type="button"
                onClick={onSaveAll}
                className="px-2.5 py-1.2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                title="Save all modified workspace pages (Ctrl+Shift+S)"
              >
                <SaveAll className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Save All</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                  {dirtyFilesCount}
                </span>
              </button>
            )}

            {/* Support Link */}
            <a
              href="/support"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-all cursor-pointer"
              title="Support this free tool"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <span className="hidden md:inline">Support</span>
            </a>

            {/* Review & Save Button */}
            <button
              type="button"
              onClick={onOpenReview}
              disabled={edits.length === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#18181c] text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#222228] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0"
            >
              <Save className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Review & Save</span>
              {edits.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#0084FF] text-white text-[10px] font-bold">
                  {edits.length}
                </span>
              )}
            </button>

            {/* High-Contrast Primary CTA: Export Studio */}
            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0084FF] to-blue-600 hover:from-[#0074E0] hover:to-blue-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-[#0084FF]/25 shrink-0"
                title="Open Export Studio (HTML, React, Next.js, Astro, PNG)"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white/20" />
                <span className="hidden sm:inline">Export Studio</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}

