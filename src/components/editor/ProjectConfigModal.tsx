import { useRef, useState, useEffect } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { parseTailwindConfigContent } from "@/lib/tailwind/config-parser";
import { parseCssThemeContent } from "@/lib/tailwind/css-theme-parser";
import { readFileText } from "@/lib/fs/directory-picker";
import {
  Palette,
  FileCode,
  CheckCircle2,
  Trash2,
  UploadCloud,
  FileText,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";

interface ProjectConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged?: () => void;
}

export default function ProjectConfigModal({
  isOpen,
  onClose,
  onConfigChanged,
}: ProjectConfigModalProps) {
  const projectConfig = useWorkspaceStore((s) => s.projectConfig);
  const setTailwindConfig = useWorkspaceStore((s) => s.setTailwindConfig);
  const setCustomStyles = useWorkspaceStore((s) => s.setCustomStyles);

  const [activeTab, setActiveTab] = useState<"tailwind" | "css">("tailwind");
  const tailwindInputRef = useRef<HTMLInputElement | null>(null);
  const cssInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleTailwindUpload(file: File) {
    try {
      const rawContent = await readFileText(file);
      const parsed = parseTailwindConfigContent(rawContent, file.name);
      setTailwindConfig({
        fileName: file.name,
        rawContent,
        theme: parsed,
      });
      onConfigChanged?.();
    } catch {}
  }

  async function handleCssUpload(file: File) {
    try {
      const rawContent = await readFileText(file);
      const parsed = parseCssThemeContent(rawContent, file.name);
      setCustomStyles({
        fileName: file.name,
        rawContent,
        extractedTheme: {
          colors: parsed.colors,
          fonts: parsed.fonts,
        },
      });
      onConfigChanged?.();
    } catch {}
  }

  const twColors = projectConfig.tailwindConfig?.theme.colors || [];
  const twFonts = projectConfig.tailwindConfig?.theme.fonts || [];
  const cssColors = projectConfig.customStyles?.extractedTheme?.colors || [];
  const cssFonts = projectConfig.customStyles?.extractedTheme?.fonts || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#28282c] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 text-slate-800 dark:text-zinc-200 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#262626] flex items-center justify-between bg-slate-50/50 dark:bg-[#18181c]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Project Config & Styles
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Shared theme tokens and custom stylesheets injected across all workspace pages.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-[#262626] px-4 pt-2 gap-2 bg-slate-50/20 dark:bg-[#121214]">
          <button
            type="button"
            onClick={() => setActiveTab("tailwind")}
            className={`pb-2.5 px-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "tailwind"
                ? "border-[#0099ff] text-[#0099ff]"
                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Tailwind Config {projectConfig.tailwindConfig && "✓"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("css")}
            className={`pb-2.5 px-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "css"
                ? "border-[#0099ff] text-[#0099ff]"
                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Custom CSS / Stylesheet {projectConfig.customStyles && "✓"}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "tailwind" ? (
            <div className="space-y-4">
              {projectConfig.tailwindConfig ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1a1e] border border-slate-200 dark:border-[#28282c] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        {projectConfig.tailwindConfig.fileName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => tailwindInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-[#26262a] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTailwindConfig(null);
                          onConfigChanged?.();
                        }}
                        className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Remove Tailwind Config"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Extracted Theme Preview */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#28282c]">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      Extracted Palette Tokens ({twColors.length})
                    </div>
                    {twColors.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                        {twColors.map((c) => (
                          <div
                            key={c.name}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#28282c] text-[11px]"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: c.value }}
                            />
                            <span className="font-mono text-[10px]">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No custom colors detected in config extend block.</p>
                    )}

                    {twFonts.length > 0 && (
                      <div className="pt-2">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Font Stacks ({twFonts.length})
                        </div>
                        <div className="space-y-1">
                          {twFonts.map((f) => (
                            <div key={f.name} className="font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                              <strong className="text-slate-900 dark:text-white">{f.name}</strong>: {f.stack}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => tailwindInputRef.current?.click()}
                  className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#28282c] hover:border-indigo-500 dark:hover:border-[#0099ff] bg-slate-50/50 dark:bg-[#161618] text-center cursor-pointer transition-all space-y-3 group"
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-[#0099ff] transition-colors" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      Upload tailwind.config.js / ts / cjs / json
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                      Upload your project's Tailwind config to sync custom brand colors, font stacks, and tokens directly into the visual style panels.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md cursor-pointer"
                  >
                    Select Config File
                  </button>
                </div>
              )}

              <input
                ref={tailwindInputRef}
                type="file"
                accept=".js,.cjs,.mjs,.ts,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleTailwindUpload(file);
                  if (e.target) e.target.value = "";
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {projectConfig.customStyles ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1a1e] border border-slate-200 dark:border-[#28282c] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        {projectConfig.customStyles.fileName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cssInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-[#26262a] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStyles(null);
                          onConfigChanged?.();
                        }}
                        className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Remove Custom Stylesheet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Extracted CSS Variables / @theme Tokens */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#28282c]">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      Detected CSS Variables & @theme Tokens ({cssColors.length})
                    </div>
                    {cssColors.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                        {cssColors.map((c) => (
                          <div
                            key={c.name}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#28282c] text-[11px]"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: c.value }}
                            />
                            <span className="font-mono text-[10px]">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No CSS variables detected, but stylesheet is active in canvas.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => cssInputRef.current?.click()}
                  className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#28282c] hover:border-indigo-500 dark:hover:border-[#0099ff] bg-slate-50/50 dark:bg-[#161618] text-center cursor-pointer transition-all space-y-3 group"
                >
                  <FileText className="w-8 h-8 mx-auto text-slate-400 group-hover:text-[#0099ff] transition-colors" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      Upload style.css / globals.css
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                      Upload your stylesheet to automatically inject custom CSS classes, keyframes, and variables across all canvas pages.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md cursor-pointer"
                  >
                    Select CSS File
                  </button>
                </div>
              )}

              <input
                ref={cssInputRef}
                type="file"
                accept=".css"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCssUpload(file);
                  if (e.target) e.target.value = "";
                }}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-[#262626] flex items-center justify-between bg-slate-50/50 dark:bg-[#121214]">
          <span className="text-[11px] text-slate-400">
            {projectConfig.tailwindConfig || projectConfig.customStyles
              ? "✨ Shared project theme active"
              : "No custom config loaded (using standard defaults)"}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#0099ff] hover:bg-[#0088ee] text-white font-semibold text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
