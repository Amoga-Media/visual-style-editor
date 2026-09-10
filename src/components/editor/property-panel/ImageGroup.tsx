import { useEffect, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import type { ViewportMode } from "@/components/editor/Toolbar";
import { Image, Upload, Video, Sparkles, Film, Play, Volume2, VolumeX, RotateCcw, Youtube } from "lucide-react";

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

function formatVideoEmbedUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  // YouTube watch / shorts / youtu.be
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  // Vimeo URL
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return trimmed;
}

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

    if (tag === "img" || tag === "picture") {
      const imgEl = (tag === "img" ? element : element.querySelector("img")) as HTMLImageElement | null;
      setSrc(imgEl?.getAttribute("src") || element.getAttribute("src") || "");
      setAlt(imgEl?.getAttribute("alt") || "");
    } else if (tag === "video") {
      const videoEl = element as HTMLVideoElement;
      const childSource = videoEl.querySelector("source");
      const videoSrc = videoEl.getAttribute("src") || childSource?.getAttribute("src") || (videoEl as any).currentSrc || "";
      setSrc(videoSrc);
      setAutoplay(videoEl.hasAttribute("autoplay"));
      setLoop(videoEl.hasAttribute("loop"));
      setMuted(videoEl.hasAttribute("muted"));
      setControls(videoEl.hasAttribute("controls"));
      setPoster(videoEl.getAttribute("poster") || "");
    } else if (tag === "source") {
      setSrc(element.getAttribute("src") || "");
    } else if (tag === "iframe") {
      setSrc(element.getAttribute("src") || "");
    } else {
      // Container element checking for inner video/img/iframe
      const innerVideo = element.querySelector("video") as HTMLVideoElement | null;
      const innerImg = element.querySelector("img") as HTMLImageElement | null;
      const innerIframe = element.querySelector("iframe") as HTMLIFrameElement | null;
      if (innerVideo) {
        setSrc(innerVideo.getAttribute("src") || innerVideo.querySelector("source")?.getAttribute("src") || "");
        setAutoplay(innerVideo.hasAttribute("autoplay"));
        setLoop(innerVideo.hasAttribute("loop"));
        setMuted(innerVideo.hasAttribute("muted"));
        setControls(innerVideo.hasAttribute("controls"));
        setPoster(innerVideo.getAttribute("poster") || "");
      } else if (innerImg) {
        setSrc(innerImg.getAttribute("src") || "");
        setAlt(innerImg.getAttribute("alt") || "");
      } else if (innerIframe) {
        setSrc(innerIframe.getAttribute("src") || "");
      }
    }

    const fit = (element as HTMLElement).style?.objectFit || "cover";
    setObjectFit(fit);
    const pos = (element as HTMLElement).style?.objectPosition || "center";
    setObjectPosition(pos);
  }, [element]);

  if (!element || !structuralPath) return null;
  const tag = element.tagName.toLowerCase();
  const hasInnerVideo = Boolean(element.querySelector("video"));
  const hasInnerIframe = Boolean(element.querySelector("iframe"));
  const isVideo = tag === "video" || tag === "iframe" || tag === "source" || hasInnerVideo || hasInnerIframe;
  const isImage = (tag === "img" || tag === "picture" || (!isVideo && element.querySelector("img") !== null)) && !isVideo;

  function commitAttribute(name: string, value: string) {
    if (!element) return;
    const target = element.tagName.toLowerCase() === "picture" ? (element.querySelector("img") || element) : element;
    const old = target.getAttribute(name) || "";
    if (value !== undefined && value !== null && value !== "") {
      target.setAttribute(name, value);
    } else {
      target.removeAttribute(name);
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

  function toggleBooleanAttribute(name: string, enable: boolean) {
    if (!element) return;
    const target = (tag === "video" ? element : element.querySelector("video")) as HTMLVideoElement | null;
    if (!target) return;
    const old = target.hasAttribute(name) ? "" : undefined;
    if (enable) {
      target.setAttribute(name, "");
      if (name === "autoplay") target.setAttribute("playsinline", "");
    } else {
      target.removeAttribute(name);
    }
    onEdit?.({
      kind: "attribute",
      structuralPath: structuralPath!,
      property: name,
      attributeName: name,
      oldValue: old,
      newValue: enable ? "" : "",
      timestamp: new Date().toISOString(),
    });
  }

  function handleVideoSrcCommit(newUrl: string) {
    const formatted = formatVideoEmbedUrl(newUrl);
    setSrc(formatted);

    if (tag === "iframe") {
      commitAttribute("src", formatted);
      return;
    }

    if (tag === "video") {
      const videoEl = element as HTMLVideoElement;
      commitAttribute("src", formatted);
      const childSource = videoEl.querySelector("source");
      if (childSource) {
        childSource.setAttribute("src", formatted);
      }
      try { videoEl.load(); } catch {}
      return;
    }

    if (tag === "source") {
      commitAttribute("src", formatted);
      const parentVideo = element.closest("video");
      try { parentVideo?.load(); } catch {}
      return;
    }

    // Target container with video/iframe
    const innerVideo = element.querySelector("video");
    if (innerVideo) {
      innerVideo.setAttribute("src", formatted);
      const childSource = innerVideo.querySelector("source");
      if (childSource) childSource.setAttribute("src", formatted);
      try { innerVideo.load(); } catch {}
    }
    const innerIframe = element.querySelector("iframe");
    if (innerIframe) {
      innerIframe.setAttribute("src", formatted);
    }
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

  function handlePosterUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPoster(dataUrl);
      commitAttribute("poster", dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleObjectFitChange(fit: string) {
    setObjectFit(fit);
    applyLiveStyle(element!, "object-fit" as any, fit, theme, undefined, viewport, structuralPath!);
    commitStyleChange(element!, structuralPath!, "object-fit" as any, fit, theme, onEdit, undefined, undefined, viewport);
  }

  return (
    <div className="p-4 border-b border-slate-200 dark:border-[#262626] space-y-4">
      {/* Media Preview & Link Indicator */}
      {src && (
        <div className="relative rounded-xl border border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] p-2 overflow-hidden shadow-inner">
          {isVideo ? (
            <div className="w-full h-28 rounded-lg bg-black/80 flex flex-col items-center justify-center text-zinc-300 gap-1.5 p-2 text-center">
              <Film className="w-7 h-7 text-[#0099ff]" />
              <span className="text-[10px] text-zinc-400 font-mono truncate max-w-full px-2">{src}</span>
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className="w-full h-28 object-cover rounded-lg bg-black/40"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
        </div>
      )}

      {/* Source URL Input with Auto-Formatting */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-slate-600 dark:text-zinc-400 block font-medium">
          {isVideo ? "Video URL (MP4 / WebM / YouTube / Vimeo)" : "Image Source URL"}
        </label>
        <input
          type="text"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          onBlur={() => (isVideo ? handleVideoSrcCommit(src) : commitAttribute("src", src))}
          onKeyDown={(e) => e.key === "Enter" && (isVideo ? handleVideoSrcCommit(src) : commitAttribute("src", src))}
          placeholder={isVideo ? "https://youtube.com/watch?v=... or .mp4" : "https://images.unsplash.com/..."}
          className="w-full bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-zinc-700 focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-200 outline-none"
        />
      </div>

      {/* Local File Upload (Images) */}
      {isImage && (
        <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-xs text-[#0099ff] font-medium cursor-pointer transition-colors shadow-2xs">
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

      {/* Video Specific Player Settings */}
      {isVideo && (tag === "video" || hasInnerVideo) && (
        <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-[#262626]">
          <label className="text-[11px] text-slate-600 dark:text-zinc-400 block font-medium">Video Player Controls</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-label="Toggle Autoplay"
              onClick={() => {
                const next = !autoplay;
                setAutoplay(next);
                toggleBooleanAttribute("autoplay", next);
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer transition-all ${
                autoplay
                  ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-semibold"
                  : "bg-slate-50 dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
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
                toggleBooleanAttribute("loop", next);
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer transition-all ${
                loop
                  ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-semibold"
                  : "bg-slate-50 dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
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
                toggleBooleanAttribute("muted", next);
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer transition-all ${
                muted
                  ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-semibold"
                  : "bg-slate-50 dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
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
                toggleBooleanAttribute("controls", next);
              }}
              className={`p-2 rounded-lg text-[11px] flex items-center justify-between border cursor-pointer transition-all ${
                controls
                  ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/40 font-semibold"
                  : "bg-slate-50 dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Controls</span>
              <Film className="w-3 h-3" />
            </button>
          </div>

          {/* Poster Image URL */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] text-slate-600 dark:text-zinc-400 block font-medium">Poster Thumbnail URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                onBlur={() => commitAttribute("poster", poster)}
                onKeyDown={(e) => e.key === "Enter" && commitAttribute("poster", poster)}
                placeholder="https://example.com/poster.jpg"
                className="flex-1 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-zinc-200 outline-none"
              />
              <label className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] hover:text-[#0099ff] cursor-pointer flex items-center justify-center shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handlePosterUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Quick Unsplash Preset Samples */}
      {isImage && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-zinc-400">
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
                className="px-2 py-1 text-[10px] rounded-lg bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-300 truncate text-left transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alt Text (SEO & Accessibility) */}
      {isImage && (
        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-600 dark:text-zinc-400 block font-medium">Alt Text (Accessibility &amp; SEO)</label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={() => commitAttribute("alt", alt)}
            onKeyDown={(e) => e.key === "Enter" && commitAttribute("alt", alt)}
            placeholder="Descriptive caption..."
            className="w-full bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-200 outline-none"
          />
        </div>
      )}

      {/* Object Fit & Position */}
      <div className="space-y-2">
        <label className="text-[11px] text-slate-600 dark:text-zinc-400 block font-medium">Object Fit &amp; Framing</label>
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
                  : "bg-slate-50 dark:bg-[#141414] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262626]"
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
