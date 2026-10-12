import { useState, useEffect } from "react";
import type { ThemeMap, EditRecord } from "@/types";
import {
  FileCode,
  Palette,
  Type,
  Keyboard,
  Layers,
  Check,
} from "lucide-react";
import PaletteHarmonizerGroup from "./PaletteHarmonizerGroup";

interface DocumentInspectorProps {
  iframe: HTMLIFrameElement | null;
  theme: ThemeMap;
  onSelectElement?: (el: Element) => void;
  onEdit?: (record: EditRecord) => void;
}

export default function DocumentInspector({
  iframe,
  theme,
  onSelectElement,
}: DocumentInspectorProps) {
  const [pageTitle, setPageTitle] = useState("");
  const [detectedFonts, setDetectedFonts] = useState<string[]>(() => {
    const initial = new Set<string>();
    if (theme?.fonts) {
      theme.fonts.forEach((f: any) => initial.add(typeof f === "string" ? f : f.name || f.stack));
    }
    return Array.from(initial).slice(0, 5);
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      setPageTitle(doc.title || "Untitled Page");

      // Detect prominent font families in the document
      const fonts = new Set<string>();
      if (theme?.fonts) {
        theme.fonts.forEach((f: any) => fonts.add(typeof f === "string" ? f : f.name || f.stack));
      }
      const sampleEls = [doc.body, doc.querySelector("h1"), doc.querySelector("p")].filter(Boolean);
      sampleEls.forEach((el) => {
        if (!el) return;
        const font = doc.defaultView?.getComputedStyle(el).fontFamily;
        if (font) {
          const clean = font.split(",")[0].replace(/['"]/g, "").trim();
          if (clean) fonts.add(clean);
        }
      });
      setDetectedFonts(Array.from(fonts).slice(0, 5));
    } catch {}
  }, [iframe, theme]);

  const handleTitleChange = (val: string) => {
    setPageTitle(val);
    try {
      if (iframe?.contentDocument) {
        iframe.contentDocument.title = val;
      }
    } catch {}
  };

  const handleSelectBody = () => {
    try {
      if (iframe?.contentDocument?.body && onSelectElement) {
        onSelectElement(iframe.contentDocument.body);
      }
    } catch {}
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const SHORTCUTS = [
    { key: "Click", desc: "Select element on canvas" },
    { key: "Double-Click", desc: "Edit text content inline" },
    { key: "Ctrl + D", desc: "Duplicate selected element" },
    { key: "Ctrl + G", desc: "Wrap in Auto-Div flex container" },
    { key: "Del / ⌫", desc: "Delete selected element" },
    { key: "Ctrl + Z", desc: "Undo last style/DOM change" },
    { key: "Ctrl + Y", desc: "Redo style/DOM change" },
    { key: "Ctrl + \\", desc: "Toggle sidebars (Zen Mode)" },
    { key: "Ctrl + K", desc: "All keyboard shortcuts" },
  ];

  return (
    <div className="text-slate-800 dark:text-zinc-200 bg-white dark:bg-[#141414] transition-colors p-4 space-y-5">
      {/* Header Banner */}
      <div className="rounded-xl p-3.5 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/20 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#0099ff]/20 border border-[#0099ff]/40 flex items-center justify-center text-[#0099ff] shrink-0 mt-0.5">
          <FileCode className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Document Inspector</span>
            <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-full border border-sky-500/30">
              Page Global
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
            No single element is selected. Manage page-level metadata, global styling, and theme tokens.
          </p>
        </div>
      </div>

      {/* Page Title */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
          <FileCode className="w-3 h-3 text-sky-500" />
          <span>Page &lt;title&gt;</span>
        </label>
        <input
          type="text"
          value={pageTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled Page"
          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] transition-colors"
        />
      </div>

      {/* Quick Select Body Button */}
      <button
        type="button"
        onClick={handleSelectBody}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1a1a] dark:hover:bg-[#222222] border border-slate-200 dark:border-[#2a2a2a] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
      >
        <Layers className="w-3.5 h-3.5 text-indigo-500" />
        <span>Select &lt;body&gt; Element to Style Page</span>
      </button>

      {/* Detected Fonts */}
      {detectedFonts.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Type className="w-3 h-3 text-emerald-500" />
            <span>Active Font Families</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {detectedFonts.map((font, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2a2a] text-slate-700 dark:text-zinc-300"
              >
                {font}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detected Palette / Theme Colors */}
      {theme.colors && theme.colors.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-amber-500" />
            <span>Palette Swatches ({theme.colors.length})</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {theme.colors.slice(0, 16).map((color: any, idx) => {
              const colorVal = typeof color === "string" ? color : color.value;
              const colorName = typeof color === "string" ? color : color.name;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => copyToClipboard(colorVal, `color-${idx}`)}
                  title={`Copy color: ${colorName} (${colorVal})`}
                  className="group relative w-6 h-6 rounded-md border border-black/10 dark:border-white/10 shadow-xs hover:scale-110 transition-transform flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: colorVal }}
                >
                  {copiedKey === `color-${idx}` && (
                    <Check className="w-3 h-3 text-white drop-shadow" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Palette Harmonizer */}
      <div className="pt-1">
        <PaletteHarmonizerGroup defaultOpen={false} />
      </div>

      {/* Helpful Shortcuts Card */}
      <div className="rounded-xl border border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#121212]/60 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
          <Keyboard className="w-3.5 h-3.5 text-sky-500" />
          <span>Quick Keyboard Shortcuts</span>
        </div>
        <div className="space-y-1 text-xs">
          {SHORTCUTS.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-0.5">
              <span className="text-slate-500 dark:text-zinc-400 text-[11px]">{s.desc}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] text-[10px] font-mono text-slate-700 dark:text-zinc-300 font-semibold shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
