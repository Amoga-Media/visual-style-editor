import { useState, useMemo } from "react";
import { useSettingsStore, type AppTheme } from "@/store/settings-store";
import { listAutoSaveKeys, clearAllAutoSaves } from "@/lib/fs/auto-save";
import {
  X,
  Settings,
  Sun,
  Moon,
  Monitor,
  Maximize2,
  Grid,
  ShieldCheck,
  Keyboard,
  RotateCcw,
  Trash2,
  Check,
  Search,
  Sparkles,
  Command,
  ZoomIn,
  Sliders,
  AlertTriangle,
  Layers,
  MousePointer,
  Type,
} from "lucide-react";

export type SettingsTabId = "appearance" | "canvas" | "behavior" | "shortcuts";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTabId;
  uiPanelsVisible?: boolean;
  onToggleUiPanels?: () => void;
  zoom?: number;
  onZoomReset?: () => void;
}

interface ShortcutItem {
  category: "Interface & Navigation" | "Canvas Controls" | "Element Actions" | "Value Stepping";
  keys: string[];
  macKeys: string[];
  description: string;
}

const SHORTCUTS_DIRECTORY: ShortcutItem[] = [
  // Interface & Navigation
  { category: "Interface & Navigation", keys: ["Ctrl", "\\"], macKeys: ["⌘", "\\"], description: "Toggle UI panels (hide/show left & right sidebars)" },
  { category: "Interface & Navigation", keys: ["Ctrl", ","], macKeys: ["⌘", ","], description: "Open Studio Settings modal" },
  { category: "Interface & Navigation", keys: ["Ctrl", "K"], macKeys: ["⌘", "K"], description: "Open keyboard shortcuts guide" },
  { category: "Interface & Navigation", keys: ["?"], macKeys: ["?"], description: "Quick access shortcuts cheatsheet" },
  { category: "Interface & Navigation", keys: ["Ctrl", "Shift", "W"], macKeys: ["⌘", "⇧", "W"], description: "Close project / Exit workspace to DropZone" },

  // Canvas Controls
  { category: "Canvas Controls", keys: ["Ctrl", "Scroll"], macKeys: ["⌘", "Scroll"], description: "Smooth zoom canvas workspace in / out" },
  { category: "Canvas Controls", keys: ["Ctrl", "Shift", "Scroll"], macKeys: ["⌘", "⇧", "Scroll"], description: "Resize canvas empty margin / gutter" },
  { category: "Canvas Controls", keys: ["Ctrl", "+"], macKeys: ["⌘", "+"], description: "Zoom canvas in (+10%)" },
  { category: "Canvas Controls", keys: ["Ctrl", "-"], macKeys: ["⌘", "-"], description: "Zoom canvas out (-10%)" },
  { category: "Canvas Controls", keys: ["Ctrl", "0"], macKeys: ["⌘", "0"], description: "Reset canvas zoom to 100% (1:1)" },
  { category: "Canvas Controls", keys: ["Space", "Drag"], macKeys: ["Space", "Drag"], description: "Pan infinite canvas artboard" },

  // Element Actions
  { category: "Element Actions", keys: ["Ctrl", "Z"], macKeys: ["⌘", "Z"], description: "Undo last style, copy, or structural change" },
  { category: "Element Actions", keys: ["Ctrl", "Shift", "Z"], macKeys: ["⌘", "⇧", "Z"], description: "Redo change (or Ctrl + Y)" },
  { category: "Element Actions", keys: ["Ctrl", "D"], macKeys: ["⌘", "D"], description: "Duplicate selected element" },
  { category: "Element Actions", keys: ["Ctrl", "G"], macKeys: ["⌘", "G"], description: "Group in Auto-Div container (flex-col)" },
  { category: "Element Actions", keys: ["Delete"], macKeys: ["⌫"], description: "Delete selected DOM element" },
  { category: "Element Actions", keys: ["Escape"], macKeys: ["Esc"], description: "Deselect active element / close open modals" },

  // Value Stepping
  { category: "Value Stepping", keys: ["Double Click"], macKeys: ["Double Click"], description: "Edit text copy inline directly on canvas" },
  { category: "Value Stepping", keys: ["▲ / ▼"], macKeys: ["▲ / ▼"], description: "Step numeric input values up / down by 1 unit" },
  { category: "Value Stepping", keys: ["Shift", "▲ / ▼"], macKeys: ["⇧", "▲ / ▼"], description: "Step numeric values by 10× units" },
];

export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = "appearance",
  uiPanelsVisible = true,
  onToggleUiPanels,
  zoom = 1,
  onZoomReset,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [clearToast, setClearToast] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Settings Store Subscriptions
  const appTheme = useSettingsStore((s) => s.appTheme);
  const setAppTheme = useSettingsStore((s) => s.setAppTheme);
  const uiScale = useSettingsStore((s) => s.uiScale);
  const setUiScale = useSettingsStore((s) => s.setUiScale);
  const resetUiScale = useSettingsStore((s) => s.resetUiScale);
  const canvasGutter = useSettingsStore((s) => s.canvasGutter);
  const setCanvasGutter = useSettingsStore((s) => s.setCanvasGutter);
  const showDotGrid = useSettingsStore((s) => s.showDotGrid);
  const setShowDotGrid = useSettingsStore((s) => s.setShowDotGrid);
  const showDimensionsHUD = useSettingsStore((s) => s.showDimensionsHUD);
  const setShowDimensionsHUD = useSettingsStore((s) => s.setShowDimensionsHUD);
  const autoSaveEnabled = useSettingsStore((s) => s.autoSaveEnabled);
  const setAutoSaveEnabled = useSettingsStore((s) => s.setAutoSaveEnabled);
  const inlineTextEditEnabled = useSettingsStore((s) => s.inlineTextEditEnabled);
  const setInlineTextEditEnabled = useSettingsStore((s) => s.setInlineTextEditEnabled);
  const resetAllSettings = useSettingsStore((s) => s.resetAllSettings);

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  // Stored snapshots count
  const storedSnapshotsCount = useMemo(() => {
    if (!isOpen) return 0;
    return listAutoSaveKeys().length;
  }, [isOpen, clearToast]);

  // Filtered shortcuts for Tab 4
  const filteredShortcuts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SHORTCUTS_DIRECTORY;
    return SHORTCUTS_DIRECTORY.filter(
      (item) =>
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keys.some((k) => k.toLowerCase().includes(q)) ||
        item.macKeys.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  function handleClearSessions() {
    const count = clearAllAutoSaves();
    setClearToast(`Cleared ${count} stored autosave snapshot${count === 1 ? "" : "s"}.`);
    setTimeout(() => setClearToast(null), 3000);
  }

  function handleResetAllDefaults() {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetAllSettings();
    setConfirmingReset(false);
    setClearToast("Restored all studio settings to default values.");
    setTimeout(() => setClearToast(null), 3000);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Concentric Double-Bezel Architecture */}
      <div className="max-w-2xl w-full bg-[#141416] border border-white/10 rounded-3xl p-1.5 shadow-2xl backdrop-blur-2xl text-white animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="bg-[#1c1c20] border border-white/5 rounded-[1.25rem] flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-inner">
                <Settings className="w-4 h-4 text-[#0099ff]" />
              </div>
              <div>
                <h2 id="settings-modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Studio Settings
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/5">
                    Ctrl + ,
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">Configure workspace ergonomics, interface scaling, and controls</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close studio settings"
              className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-white/5 bg-[#17171a] shrink-0 overflow-x-auto no-scrollbar">
            {(
              [
                { id: "appearance", label: "Appearance & UI", icon: Sun },
                { id: "canvas", label: "Canvas & Workspace", icon: Maximize2 },
                { id: "behavior", label: "Behavior & Safety", icon: ShieldCheck },
                { id: "shortcuts", label: "Shortcuts Directory", icon: Keyboard },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setConfirmingReset(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white text-black shadow-xs font-bold"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-zinc-300 no-scrollbar">
            {/* Feedback notification toast */}
            {clearToast && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between animate-in fade-in text-xs font-medium">
                <span className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  {clearToast}
                </span>
                <button onClick={() => setClearToast(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* TAB 1: APPEARANCE & INTERFACE */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                {/* Theme Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Interface Theme</h3>
                      <p className="text-[11px] text-zinc-400">Select studio color palette and contrast profile</p>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/5">
                      {appTheme === "dark" ? "Dark Carbon" : "Paper Light"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Dark Theme Card */}
                    <button
                      type="button"
                      onClick={() => setAppTheme("dark")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        appTheme === "dark"
                          ? "bg-zinc-900 border-[#0099ff] ring-1 ring-[#0099ff]/30 shadow-lg"
                          : "bg-zinc-900/50 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4 text-[#0099ff]" />
                          <span className="font-bold text-white text-xs">Dark Carbon</span>
                        </div>
                        {appTheme === "dark" && (
                          <span className="w-4 h-4 rounded-full bg-[#0099ff] flex items-center justify-center text-white text-[10px]">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                        Deep OLED black (#09090b) with high-contrast hairline borders for professional focus.
                      </p>
                      {/* Mini Preview Wireframe */}
                      <div className="h-8 rounded-lg bg-black/60 border border-white/10 p-1 flex items-center gap-1">
                        <div className="w-4 h-full rounded bg-zinc-800" />
                        <div className="flex-1 h-full rounded bg-zinc-900 flex items-center justify-center">
                          <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
                        </div>
                        <div className="w-5 h-full rounded bg-zinc-800" />
                      </div>
                    </button>

                    {/* Light Theme Card */}
                    <button
                      type="button"
                      onClick={() => setAppTheme("light")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        appTheme === "light"
                          ? "bg-zinc-800 border-[#0099ff] ring-1 ring-[#0099ff]/30 shadow-lg"
                          : "bg-zinc-900/50 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-white text-xs">Paper Light</span>
                        </div>
                        {appTheme === "light" && (
                          <span className="w-4 h-4 rounded-full bg-[#0099ff] flex items-center justify-center text-white text-[10px]">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                        Neutral warm paper (#fafafa) with high legibility for bright studio environments.
                      </p>
                      {/* Mini Preview Wireframe */}
                      <div className="h-8 rounded-lg bg-zinc-200 border border-zinc-300 p-1 flex items-center gap-1">
                        <div className="w-4 h-full rounded bg-zinc-300" />
                        <div className="flex-1 h-full rounded bg-white flex items-center justify-center">
                          <div className="w-12 h-1.5 rounded-full bg-zinc-400" />
                        </div>
                        <div className="w-5 h-full rounded bg-zinc-300" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Interface Scale Slider */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white">Interface Scale</h3>
                      <p className="text-[11px] text-zinc-400">
                        Adjust overall size of editor sidebars, tools, and font sizes.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-white/10 font-mono font-bold text-white text-xs">
                        {Math.round(uiScale * 100)}%
                      </span>
                      {uiScale !== 1 && (
                        <button
                          type="button"
                          onClick={resetUiScale}
                          className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={uiScale}
                    onChange={(e) => setUiScale(parseFloat(e.target.value))}
                    className="w-full accent-white"
                  />

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setUiScale(0.75)}
                      className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        uiScale === 0.75 ? "bg-white text-black font-bold border-white" : "border-white/10 hover:border-white/20 text-zinc-400"
                      }`}
                    >
                      75% Compact
                    </button>
                    <button
                      type="button"
                      onClick={() => setUiScale(1.0)}
                      className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        uiScale === 1.0 ? "bg-white text-black font-bold border-white" : "border-white/10 hover:border-white/20 text-zinc-400"
                      }`}
                    >
                      100% Default
                    </button>
                    <button
                      type="button"
                      onClick={() => setUiScale(1.25)}
                      className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        uiScale === 1.25 ? "bg-white text-black font-bold border-white" : "border-white/10 hover:border-white/20 text-zinc-400"
                      }`}
                    >
                      125% Large
                    </button>
                    <button
                      type="button"
                      onClick={() => setUiScale(1.5)}
                      className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        uiScale === 1.5 ? "bg-white text-black font-bold border-white" : "border-white/10 hover:border-white/20 text-zinc-400"
                      }`}
                    >
                      150% Maximum
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">
                    Tip: Replaces the confusing browser zoom shortcuts. Provides crisp 1:1 screen pixel alignment.
                  </p>
                </div>

                {/* Workspace Panels Toggle */}
                {onToggleUiPanels && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Workspace Sidebars</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-zinc-300">
                          Ctrl + \
                        </kbd>
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Toggle visibility of left Navigator and right Property Inspector sidebars for distraction-free canvas preview.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onToggleUiPanels}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        uiPanelsVisible
                          ? "bg-white text-black shadow-xs font-bold"
                          : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/10"
                      }`}
                    >
                      {uiPanelsVisible ? "Visible" : "Hidden"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CANVAS & WORKSPACE */}
            {activeTab === "canvas" && (
              <div className="space-y-6">
                {/* Canvas Gutter / Margin Slider */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white">Canvas Gutter (Empty Space)</h3>
                      <p className="text-[11px] text-zinc-400">
                        Controls empty space padding around the canvas frame.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-white/10 font-mono font-bold text-white text-xs">
                        {canvasGutter === 0 ? "0px (Flush)" : `${canvasGutter}px`}
                      </span>
                      {canvasGutter !== 0 && (
                        <button
                          type="button"
                          onClick={() => setCanvasGutter(0)}
                          className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Flush
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="160"
                    step="8"
                    value={canvasGutter}
                    onChange={(e) => setCanvasGutter(parseInt(e.target.value, 10))}
                    className="w-full accent-white"
                  />

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setCanvasGutter(0)}
                      className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        canvasGutter === 0 ? "bg-white text-black font-bold border-white" : "border-white/10 hover:border-white/20 text-zinc-400"
                      }`}
                    >
                      0px Flush
                    </button>
                    <button
                      type="button"
                      onClick={() => setCanvasGutter(40)}
                      className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        canvasGutter === 40 ? "bg-white text-black font-bold border-white" : "border-white/10 hover:border-white/20 text-zinc-400"
                      }`}
                    >
                      40px Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setCanvasGutter(80)}
                      className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        canvasGutter === 80 ? "bg-white text-black font-bold border-white" : "border-white/10 hover:border-white/20 text-zinc-400"
                      }`}
                    >
                      80px Spacious
                    </button>
                    <button
                      type="button"
                      onClick={() => setCanvasGutter(160)}
                      className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        canvasGutter === 160 ? "bg-white text-black font-bold border-white" : "border-white/10 hover:border-white/20 text-zinc-400"
                      }`}
                    >
                      160px Max
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">
                    Tip: Replaces the confusing Ctrl + Shift + Scroll shortcut. Eliminates black borders around your layout.
                  </p>
                </div>

                {/* Canvas Background Style */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-white">Canvas Texture</h3>
                    <p className="text-[11px] text-zinc-400">Choose between the 20px spatial dot grid or a clean plain canvas</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDotGrid(true)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        showDotGrid
                          ? "bg-zinc-800 border-[#0099ff] ring-1 ring-[#0099ff]/30 shadow-md text-white font-bold"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Grid className="w-4 h-4 text-[#0099ff]" />
                        <span>Dot Grid</span>
                      </div>
                      {showDotGrid && <Check className="w-3.5 h-3.5 text-[#0099ff]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDotGrid(false)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        !showDotGrid
                          ? "bg-zinc-800 border-[#0099ff] ring-1 ring-[#0099ff]/30 shadow-md text-white font-bold"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-zinc-400" />
                        <span>Plain Canvas</span>
                      </div>
                      {!showDotGrid && <Check className="w-3.5 h-3.5 text-[#0099ff]" />}
                    </button>
                  </div>
                </div>

                {/* Dimensions HUD Capsule */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white">Device Dimensions Capsule</h3>
                    <p className="text-[11px] text-zinc-400">
                      Show floating pill displaying active artboard resolution & quick viewport presets.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDimensionsHUD(!showDimensionsHUD)}
                    className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                      showDimensionsHUD
                        ? "bg-white text-black shadow-xs font-bold"
                        : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/10"
                    }`}
                  >
                    {showDimensionsHUD ? "Enabled" : "Hidden"}
                  </button>
                </div>

                {/* Canvas Zoom Readout */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Canvas Zoom Level</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-zinc-300">
                        Ctrl + Scroll
                      </kbd>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Current zoom magnification level for the stage. Press Ctrl + 0 to reset to 100%.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-white/10 font-mono font-bold text-white text-xs">
                      {Math.round(zoom * 100)}%
                    </span>
                    {onZoomReset && zoom !== 1 && (
                      <button
                        type="button"
                        onClick={onZoomReset}
                        className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Reset (Ctrl + 0)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BEHAVIOR & SAFETY */}
            {activeTab === "behavior" && (
              <div className="space-y-6">
                {/* Auto-Save Toggle */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Auto-Save Crash Protection</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Debounces changes and automatically saves local recovery snapshots to prevent data loss.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                      autoSaveEnabled
                        ? "bg-emerald-500 text-white shadow-xs font-bold"
                        : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/10"
                    }`}
                  >
                    {autoSaveEnabled ? "Active" : "Disabled"}
                  </button>
                </div>

                {/* Inline Text Editing */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <Type className="w-3.5 h-3.5 text-[#0099ff]" />
                      <span>Double-Click Inline Text Editing</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Double-click text directly inside the canvas artboard to edit headlines and copy in-place.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInlineTextEditEnabled(!inlineTextEditEnabled)}
                    className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                      inlineTextEditEnabled
                        ? "bg-white text-black shadow-xs font-bold"
                        : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/10"
                    }`}
                  >
                    {inlineTextEditEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {/* Stored Autosave Sessions */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white">Stored Autosave Sessions</h3>
                    <p className="text-[11px] text-zinc-400">
                      {storedSnapshotsCount === 0
                        ? "No saved recovery snapshots currently in browser storage."
                        : `${storedSnapshotsCount} file snapshot${storedSnapshotsCount === 1 ? "" : "s"} stored locally in your browser.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearSessions}
                    disabled={storedSnapshotsCount === 0}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 border border-white/10 text-zinc-300 font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Sessions</span>
                  </button>
                </div>

                {/* Factory Reset */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Restore Factory Defaults</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Resets interface scale (100%), canvas gutter (0px), theme (Dark), and toggles to default settings.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetAllDefaults}
                    className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer whitespace-nowrap ${
                      confirmingReset
                        ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                        : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {confirmingReset ? "Confirm Reset?" : "Reset All Settings"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: KEYBOARD SHORTCUTS DIRECTORY */}
            {activeTab === "shortcuts" && (
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search shortcuts (e.g. zoom, duplicate, undo, panel)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff]/30 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Categorized List */}
                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                  {filteredShortcuts.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500">
                      No shortcuts matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredShortcuts.map((item, idx) => {
                      const displayKeys = isMac ? item.macKeys : item.keys;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/5 text-xs hover:border-white/10 transition-colors"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-zinc-200 font-medium">{item.description}</span>
                            <span className="text-[10px] text-zinc-500">{item.category}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-4">
                            {displayKeys.map((k, kIdx) => (
                              <kbd
                                key={kIdx}
                                className="px-2 py-1 rounded-lg bg-[#141416] border border-white/15 text-zinc-200 font-mono text-[11px] font-semibold shadow-xs"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-white/5 bg-[#17171a] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <Sparkles className="w-3 h-3 text-[#0099ff]" />
              <span>Settings persist automatically in local storage</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
