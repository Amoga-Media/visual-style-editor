import { useEffect, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import type { ViewportMode } from "@/components/editor/Toolbar";
import { Image, Upload, Video, Sparkles, Film, Play, Volume2, VolumeX, RotateCcw } from "lucide-react";

interface ImageGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
}

const SAMPLE_PRESETS = [
  { label: "Modern Tech", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80" },
  { label: "Gradient Abstract", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" },
  { label: "Architecture", url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80" },
  { label: "Nature", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80" },
  { label: "Minimalist Workspace", url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80" },
];

export default function ImageGroup({ element, structuralPath, theme, viewport = "desktop", onEdit }: ImageGroupProps) {
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
    applyLiveStyle(element!, "object-fit" as any, fit, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "object-fit" as any, fit, theme, onEdit, undefined, undefined, viewport);
  }

  function handleObjectPositionChange(pos: string) {
    setObjectPosition(pos);
    applyLiveStyle(element!, "object-position" as any, pos, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "object-position" as any, pos, theme, onEdit, undefined, undefined, viewport);
  }

  return (
    <div className="p-4 border-b border-[#262626] space-y-4">
      {/* Media Preview */}
      {src && (
        <div className="relative rounded-xl border border-[#262626] bg-[#141414] p-2 overflow-hidden shadow-inner">
          {isVideo ? (
            <div className="w-full h-24 rounded-lg bg-black flex items-center justify-center text-zinc-400">
              <Film className="w-8 h-8 text-[#0099ff]" />
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className="w-full h-24 object-cover rounded-lg bg-black/40"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
        </div>
      )}

      {/* Source URL */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-400 block font-medium">
          {isVideo ? "Video Link (MP4 / YouTube / Vimeo)" : "Image Source (URL)"}
        </label>
        <input
          type="text"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          onBlur={() => commitAttribute("src", src)}
          onKeyDown={(e) => e.key === "Enter" && commitAttribute("src", src)}
          placeholder={isVideo ? "https://example.com/video.mp4" : "https://images.unsplash.com/..."}
          className="w-full bg-[#141414] border border-[#262626] hover:border-zinc-700 focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
        />
      </div>

      {/* Local File Upload (Images) */}
      {isImage && (
        <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#141414] hover:bg-[#1c1c1c] border border-[#262626] text-xs text-[#0099ff] font-medium cursor-pointer transition-colors shadow-2xs">
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
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Sparkles className="w-3 h-3 text-[#0099ff]" />
            <span>Preset Sample Images</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SAMPLE_PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.label}
                type="button"
                aria-label={`Select sample image ${p.label}`}
                onClick={() => {
                  setSrc(p.url);
                  commitAttribute("src", p.url);
                }}
                className="px-2 py-1 text-[10px] rounded-lg bg-[#141414] hover:bg-[#1c1c1c] border border-[#262626] text-zinc-300 truncate text-left transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Control Toggles */}
      {tag === "video" && (
        <div className="space-y-2 pt-1 border-t border-[#262626]">
          <label className="text-[11px] text-zinc-400 block font-medium">Video Settings</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-label="Toggle Autoplay"
              onClick={() => {
                const next = !autoplay;
                setAutoplay(next);
                commitAttribute("autoplay", next ? "" : "");
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer ${
                autoplay ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30" : "bg-[#141414] border-[#262626] text-zinc-400"
              }`}
            >
              <span>Autoplay</span>
              <Play className="w-3 h-3" />
            </button>

            <button
              type="button"
              aria-label="Toggle Loop"
              onClick={() => {
                const next = !loop;
                setLoop(next);
                commitAttribute("loop", next ? "" : "");
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer ${
                loop ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30" : "bg-[#141414] border-[#262626] text-zinc-400"
              }`}
            >
              <span>Loop</span>
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              type="button"
              aria-label="Toggle Muted"
              onClick={() => {
                const next = !muted;
                setMuted(next);
                commitAttribute("muted", next ? "" : "");
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer ${
                muted ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30" : "bg-[#141414] border-[#262626] text-zinc-400"
              }`}
            >
              <span>Muted</span>
              {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>

            <button
              type="button"
              aria-label="Toggle Controls"
              onClick={() => {
                const next = !controls;
                setControls(next);
                commitAttribute("controls", next ? "" : "");
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer ${
                controls ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30" : "bg-[#141414] border-[#262626] text-zinc-400"
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
          <label className="text-[11px] text-zinc-400 block font-medium">Alt Text (Accessibility & SEO)</label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={() => commitAttribute("alt", alt)}
            onKeyDown={(e) => e.key === "Enter" && commitAttribute("alt", alt)}
            placeholder="Descriptive caption..."
            className="w-full bg-[#141414] border border-[#262626] focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
          />
        </div>
      )}

      {/* Object Fit & Position */}
      <div className="space-y-2">
        <label className="text-[11px] text-zinc-400 block font-medium">Object Fit & Framing</label>
        <div className="grid grid-cols-4 gap-1">
          {["cover", "contain", "fill", "scale-down"].map((fit) => (
            <button
              key={fit}
              type="button"
              aria-label={`Object fit ${fit}`}
              onClick={() => handleObjectFitChange(fit)}
              className={`py-1 text-[11px] rounded-lg capitalize transition-all cursor-pointer border ${
                objectFit === fit
                  ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30 font-medium"
                  : "bg-[#141414] text-zinc-400 hover:text-white border-[#262626]"
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
