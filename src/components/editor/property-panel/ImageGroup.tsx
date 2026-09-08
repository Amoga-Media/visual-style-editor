import { useEffect, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { Image, Upload, Video, Sparkles, Film, Play, Volume2, VolumeX, RotateCcw } from "lucide-react";

interface ImageGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  onEdit?: (record: EditRecord) => void;
}

const SAMPLE_PRESETS = [
  { label: "Modern Tech", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80" },
  { label: "Gradient Abstract", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" },
  { label: "Architecture", url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80" },
  { label: "Nature", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80" },
  { label: "Minimalist Workspace", url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80" },
];

export default function ImageGroup({ element, structuralPath, theme, onEdit }: ImageGroupProps) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [objectFit, setObjectFit] = useState("cover");
  const [objectPosition, setObjectPosition] = useState("center");

  // Video specific attributes
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);
  const [muted, setMuted] = useState(false);
  const [controls, setControls] = useState(true);
  const [poster, setPoster] = useState("");

  useEffect(() => {
    if (!element) return;
    const tag = element.tagName.toLowerCase();

    if (tag === "img") {
      const imgEl = element as HTMLImageElement;
      setSrc(imgEl.getAttribute("src") || "");
      setAlt(imgEl.getAttribute("alt") || "");
    } else if (tag === "video") {
      const videoEl = element as HTMLVideoElement;
      setSrc(videoEl.getAttribute("src") || "");
      setAutoplay(videoEl.hasAttribute("autoplay"));
      setLoop(videoEl.hasAttribute("loop"));
      setMuted(videoEl.hasAttribute("muted"));
      setControls(videoEl.hasAttribute("controls"));
      setPoster(videoEl.getAttribute("poster") || "");
    } else if (tag === "iframe") {
      setSrc(element.getAttribute("src") || "");
    }

    const fit = (element as HTMLElement).style?.objectFit || "cover";
    setObjectFit(fit);
    const pos = (element as HTMLElement).style?.objectPosition || "center";
    setObjectPosition(pos);
  }, [element]);

  if (!element || !structuralPath) return null;
  const tag = element.tagName.toLowerCase();
  const isImage = tag === "img" || tag === "picture";
  const isVideo = tag === "video" || tag === "iframe";

  function commitAttribute(name: string, value: string) {
    const old = element?.getAttribute(name) || "";
    if (value) {
      element?.setAttribute(name, value);
    } else {
      element?.removeAttribute(name);
    }
    onEdit?.({
      kind: "attribute",
      structuralPath: structuralPath!,
      property: name,
      attributeName: name,
      oldValue: old,
      newValue: value,
      timestamp: new Date().toISOString(),
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSrc(dataUrl);
      commitAttribute("src", dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleObjectFitChange(fit: string) {
    setObjectFit(fit);
    applyLiveStyle(element!, "object-fit" as any, fit, theme);
    commitStyleChange(element!, structuralPath!, "object-fit" as any, fit, theme, onEdit);
  }

  function handleObjectPositionChange(pos: string) {
    setObjectPosition(pos);
    applyLiveStyle(element!, "object-position" as any, pos, theme);
    commitStyleChange(element!, structuralPath!, "object-position" as any, pos, theme, onEdit);
  }

  return (
    <div className="p-4 border-b border-slate-200 dark:border-[#222] space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
        {isVideo ? <Video className="w-3.5 h-3.5 text-indigo-400" /> : <Image className="w-3.5 h-3.5 text-indigo-400" />}
        <span>{isVideo ? "Video & Media Player" : "Image & Media"}</span>
      </div>

      {/* Media Preview */}
      {src && (
        <div className="relative rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-100 dark:bg-gray-900/80 p-2 overflow-hidden shadow-inner">
          {isVideo ? (
            <div className="w-full h-24 rounded-lg bg-black flex items-center justify-center text-zinc-400">
              <Film className="w-8 h-8 text-indigo-400" />
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className="w-full h-24 object-cover rounded-lg bg-black/10 dark:bg-black/40"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
        </div>
      )}

      {/* Source URL */}
      <div className="space-y-1.5">
        <label className="text-xs text-slate-600 dark:text-gray-400 block">
          {isVideo ? "Video Link (MP4 / YouTube / Vimeo)" : "Image Source (URL)"}
        </label>
        <input
          type="text"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          onBlur={() => commitAttribute("src", src)}
          onKeyDown={(e) => e.key === "Enter" && commitAttribute("src", src)}
          placeholder={isVideo ? "https://example.com/video.mp4" : "https://images.unsplash.com/..."}
          className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-gray-200 outline-none"
        />
      </div>

      {/* Local File Upload (Images) */}
      {isImage && (
        <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-gray-900 hover:bg-slate-200 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-800 text-xs text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer transition-colors shadow-sm">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image File</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      )}

      {/* Quick Unsplash Preset Samples */}
      {isImage && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Preset Sample Images</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SAMPLE_PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setSrc(p.url);
                  commitAttribute("src", p.url);
                }}
                className="px-2 py-1 text-[10px] rounded-lg bg-slate-100 dark:bg-[#161616] hover:bg-slate-200 dark:hover:bg-[#202020] border border-slate-200 dark:border-[#282828] text-slate-700 dark:text-zinc-300 truncate text-left transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Control Toggles */}
      {tag === "video" && (
        <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-gray-800">
          <label className="text-xs text-slate-600 dark:text-gray-400 block font-medium">Video Settings</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !autoplay;
                setAutoplay(next);
                commitAttribute("autoplay", next ? "" : "");
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer ${
                autoplay ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/40" : "bg-slate-100 dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400"
              }`}
            >
              <span>Autoplay</span>
              <Play className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !loop;
                setLoop(next);
                commitAttribute("loop", next ? "" : "");
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer ${
                loop ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/40" : "bg-slate-100 dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400"
              }`}
            >
              <span>Loop</span>
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !muted;
                setMuted(next);
                commitAttribute("muted", next ? "" : "");
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer ${
                muted ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/40" : "bg-slate-100 dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400"
              }`}
            >
              <span>Muted</span>
              {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !controls;
                setControls(next);
                commitAttribute("controls", next ? "" : "");
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer ${
                controls ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/40" : "bg-slate-100 dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400"
              }`}
            >
              <span>Controls</span>
              <Film className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Alt Text (SEO & Accessibility) */}
      {isImage && (
        <div className="space-y-1.5">
          <label className="text-xs text-slate-600 dark:text-gray-400 block">Alt Text (Accessibility & SEO)</label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={() => commitAttribute("alt", alt)}
            onKeyDown={(e) => e.key === "Enter" && commitAttribute("alt", alt)}
            placeholder="Descriptive caption..."
            className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-gray-200 outline-none"
          />
        </div>
      )}

      {/* Object Fit & Position */}
      <div className="space-y-2">
        <label className="text-xs text-slate-600 dark:text-gray-400 block">Object Fit & Framing</label>
        <div className="grid grid-cols-4 gap-1">
          {["cover", "contain", "fill", "scale-down"].map((fit) => (
            <button
              key={fit}
              onClick={() => handleObjectFitChange(fit)}
              className={`py-1 text-[11px] rounded-lg capitalize transition-all cursor-pointer border ${
                objectFit === fit
                  ? "bg-indigo-600 text-white font-semibold border-indigo-500 shadow-sm"
                  : "bg-slate-100 dark:bg-gray-900 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-gray-800"
              }`}
            >
              {fit}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
