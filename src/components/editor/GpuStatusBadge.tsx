import { useEffect, useState, useRef } from "react";
import { Cpu, Zap, CheckCircle2, AlertCircle, Layers, HardDrive } from "lucide-react";
import { getGpuHardwareInfo, type GpuHardwareInfo } from "@/lib/gpu/gpu-engine";

export default function GpuStatusBadge() {
  const [gpuInfo, setGpuInfo] = useState<GpuHardwareInfo | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    getGpuHardwareInfo().then((info) => {
      if (mounted) setGpuInfo(info);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  if (!gpuInfo) return null;

  const isGpuActive = gpuInfo.isAvailable && gpuInfo.api !== "Software/None";

  // Clean, human-readable GPU label
  let shortRenderer = gpuInfo.renderer;
  if (shortRenderer.includes("ANGLE (")) {
    const match = shortRenderer.match(/ANGLE \((.+?)\)/);
    if (match && match[1]) {
      shortRenderer = match[1].split(",")[0].trim();
    }
  }
  if (shortRenderer.length > 22) {
    shortRenderer = shortRenderer.slice(0, 20) + "…";
  }

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      <button
        type="button"
        onClick={() => setPopoverOpen((p) => !p)}
        aria-label="GPU Hardware Acceleration Status"
        title={`GPU Hardware: ${gpuInfo.renderer} (${gpuInfo.api}) - Click for details`}
        className={`px-2 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer select-none border ${
          isGpuActive
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:bg-slate-200"
        }`}
      >
        {isGpuActive ? (
          <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500/30" />
        ) : (
          <Cpu className="w-3 h-3 text-slate-400" />
        )}
        <span className="hidden xl:inline font-semibold">{isGpuActive ? "GPU" : "CPU"}</span>
        <span className="hidden 2xl:inline text-[10px] text-slate-600 dark:text-zinc-300 font-normal">
          {shortRenderer}
        </span>
      </button>

      {/* Popover Details */}
      {popoverOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl text-left">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/30" />
              Hardware Acceleration
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isGpuActive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {gpuInfo.api}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <div className="text-[10px] font-sans font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Graphics Device
              </div>
              <div className="text-slate-800 dark:text-zinc-200 font-medium break-words mt-0.5">
                {gpuInfo.renderer}
              </div>
            </div>

            {gpuInfo.vendor && gpuInfo.vendor !== "Standard GPU" && (
              <div>
                <div className="text-[10px] font-sans font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Vendor
                </div>
                <div className="text-slate-700 dark:text-zinc-300 mt-0.5">
                  {gpuInfo.vendor}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
              <div>
                <div className="text-[10px] font-sans font-medium text-slate-400 dark:text-zinc-500">
                  Max Texture
                </div>
                <div className="text-slate-700 dark:text-zinc-300 font-semibold mt-0.5">
                  {gpuInfo.maxTextureSize}px
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sans font-medium text-slate-400 dark:text-zinc-500">
                  VRAM Tier
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  {gpuInfo.memoryTier}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] font-sans text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Sub-pixel GPU compositing enabled (60/120 FPS)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
