import { useState, useRef } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Code,
  FileCode,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { exportAsReactComponent, exportAsNextComponent } from "@/lib/export/html-to-jsx";
import { convertHtmlToAstro } from "@/lib/export/html-to-astro";

export type ExportFormat = "html" | "react" | "next" | "astro" | "png";
export type PreviewViewport = "desktop" | "tablet" | "mobile" | "all";

interface ExportStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  fileName?: string | null;
  iframeDocument?: Document | null;
}

export default function ExportStudioModal({
  isOpen,
  onClose,
  html,
  fileName = "design",
  iframeDocument,
}: ExportStudioModalProps) {
  const [format, setFormat] = useState<ExportFormat>("html");
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [copied, setCopied] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  if (!isOpen) return null;

  const baseName = (fileName || "design").replace(/\.[^/.]+$/, "");

  // Generate code content based on active format
  const codeContent = (() => {
    switch (format) {
      case "react":
        return exportAsReactComponent(html, { componentName: "VisualComponent", typescript: true });
      case "next":
        return exportAsNextComponent(html, "VisualPage");
      case "astro":
        return convertHtmlToAstro(html, "VisualComponent");
      case "html":
      default:
        return html;
    }
  })();

  const fileExtension = (() => {
    switch (format) {
      case "react":
        return "tsx";
      case "next":
        return "tsx";
      case "astro":
        return "astro";
      case "png":
        return "png";
      case "html":
      default:
        return "html";
    }
  })();

  const downloadFileName = `${baseName || "visual-design"}.${fileExtension}`;

  function handleCopy() {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadCode() {
    const mimeType = format === "html" ? "text/html" : "text/plain";
    const blob = new Blob([codeContent], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleExportPng() {
    setIsExportingImage(true);
    setImageError(null);
    try {
      const doc = previewIframeRef.current?.contentDocument || iframeDocument;
      let allCss = "";
      let bodyContent = "";

      if (doc) {
        doc.querySelectorAll("style, link[rel='stylesheet']").forEach((styleNode) => {
          if (styleNode.id === "vse-editor-helper-styles") return;
          if (styleNode.tagName.toLowerCase() === "style") {
            allCss += (styleNode.textContent || "") + "\n";
          }
        });
        const clonedBody = doc.body.cloneNode(true) as HTMLElement;
        clonedBody.querySelectorAll("#vse-editor-helper-styles").forEach((n) => n.remove());
        const serializer = new XMLSerializer();
        bodyContent = serializer.serializeToString(clonedBody);
      } else {
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(html, "text/html");
        parsedDoc.querySelectorAll("style").forEach((s) => {
          if (s.id !== "vse-editor-helper-styles") allCss += (s.textContent || "") + "\n";
        });
        const serializer = new XMLSerializer();
        bodyContent = serializer.serializeToString(parsedDoc.body || parsedDoc.documentElement);
      }

      const width = 1200;
      const height = 900;
      const svgDoc = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: ${width}px; min-height: ${height}px; background-color: #ffffff; color: #000000; box-sizing: border-box; position: relative;">
              <style>
                ${allCss}
              </style>
              ${bodyContent}
            </div>
          </foreignObject>
        </svg>
      `;

      const svgBlob = new Blob([svgDoc], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        try {
          const scale = 2;
          const canvas = document.createElement("canvas");
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.scale(scale, scale);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                const pngUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = pngUrl;
                a.download = `${baseName || "design"}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(pngUrl);
              } else {
                setImageError("Canvas conversion failed.");
              }
              setIsExportingImage(false);
            }, "image/png");
          } else {
            setImageError("Canvas 2D context unavailable.");
            setIsExportingImage(false);
          }
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setImageError("Failed to rasterize HTML into PNG image.");
        setIsExportingImage(false);
      };

      img.src = url;
    } catch (err: any) {
      setImageError(err?.message || "PNG export encountered an error.");
      setIsExportingImage(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-150 select-none">
      <div className="bg-[#0f0f11] border border-[#262626] rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-14 px-5 border-b border-[#262626] flex items-center justify-between bg-[#141417]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0099ff] to-[#6366f1] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Export Studio</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30">
                  Production Ready
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Preview and export your responsive design across formats.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Export Studio"
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="px-5 py-2.5 bg-[#121214] border-b border-[#262626] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Format Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#1a1a1e] rounded-full border border-[#2a2a30]">
            <button
              type="button"
              onClick={() => setFormat("html")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                format === "html"
                  ? "bg-[#0099ff] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML + CSS</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat("react")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                format === "react"
                  ? "bg-[#0099ff] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>React (TSX)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat("next")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                format === "next"
                  ? "bg-[#0099ff] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Next.js</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat("astro")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                format === "astro"
                  ? "bg-[#0099ff] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Astro</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat("png")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                format === "png"
                  ? "bg-[#0099ff] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>PNG Image</span>
            </button>
          </div>

          {/* Viewport Tabs for Live Preview */}
          <div className="flex items-center gap-1 bg-[#1a1a1e] rounded-full p-0.5 border border-[#2a2a30]">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              aria-label="Desktop Preview"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "desktop" ? "bg-[#0099ff] text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="Desktop (1200px)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport("tablet")}
              aria-label="Tablet Preview"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "tablet" ? "bg-[#0099ff] text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="Tablet (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              aria-label="Mobile Preview"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewport === "mobile" ? "bg-[#0099ff] text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="Phone (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport("all")}
              aria-label="Multi-Device Preview"
              className={`px-2 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                viewport === "all" ? "bg-[#0099ff] text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="Side-by-side All Devices"
            >
              All Views
            </button>
          </div>
        </div>

        {/* Modal Main Body (Split: Preview & Code/Actions) */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left: Device Simulator Preview */}
          <div className="flex-1 bg-[#09090b] relative flex items-center justify-center p-4 overflow-auto border-b lg:border-b-0 lg:border-r border-[#262626]">
            {viewport === "all" ? (
              /* All Viewports Side by Side */
              <div className="flex items-start gap-6 py-4 overflow-x-auto max-w-full">
                {/* Desktop Artboard */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1">
                    <span className="text-[#0099ff]">●</span> Desktop (1200px)
                  </div>
                  <div className="w-[480px] h-[340px] bg-white rounded-xl shadow-2xl overflow-hidden border border-[#262626]">
                    <iframe
                      srcDoc={html}
                      title="Desktop Preview"
                      style={{ width: "1200px", height: "850px", transform: "scale(0.4)", transformOrigin: "0 0", border: "none" }}
                    />
                  </div>
                </div>

                {/* Tablet Artboard */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1">
                    <span className="text-amber-400">●</span> Tablet (768px)
                  </div>
                  <div className="w-[307px] h-[340px] bg-white rounded-xl shadow-2xl overflow-hidden border border-[#262626]">
                    <iframe
                      srcDoc={html}
                      title="Tablet Preview"
                      style={{ width: "768px", height: "850px", transform: "scale(0.4)", transformOrigin: "0 0", border: "none" }}
                    />
                  </div>
                </div>

                {/* Mobile Artboard */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1">
                    <span className="text-emerald-400">●</span> Mobile (375px)
                  </div>
                  <div className="w-[150px] h-[340px] bg-white rounded-xl shadow-2xl overflow-hidden border border-[#262626]">
                    <iframe
                      srcDoc={html}
                      title="Mobile Preview"
                      style={{ width: "375px", height: "850px", transform: "scale(0.4)", transformOrigin: "0 0", border: "none" }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Single Viewport Device Frame */
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div
                  className={`bg-white relative shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
                    viewport === "desktop"
                      ? "w-full h-full rounded-xl border border-[#262626]"
                      : viewport === "tablet"
                      ? "w-[768px] h-[95%] max-h-[800px] rounded-2xl border-[6px] border-[#1c1c1f]"
                      : "w-[375px] h-[95%] max-h-[720px] rounded-[2.5rem] border-[8px] border-[#1c1c1f]"
                  }`}
                >
                  {/* Phone Notch */}
                  {viewport === "mobile" && (
                    <div className="w-full bg-white flex justify-center pt-2 pb-1 shrink-0">
                      <div className="w-20 h-3.5 bg-[#141414] rounded-full flex items-center justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#262626]"></div>
                        <div className="w-8 h-1 rounded-full bg-[#262626]"></div>
                      </div>
                    </div>
                  )}

                  <iframe
                    ref={previewIframeRef}
                    srcDoc={html}
                    title="Export Live Preview"
                    className="w-full h-full border-none block"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Code Inspector / Export Actions */}
          <div className="w-full lg:w-[480px] bg-[#121214] flex flex-col shrink-0">
            {/* Action Bar */}
            <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#17171a]/50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-white">{downloadFileName}</span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-[#262626]">
                  {format.toUpperCase()}
                </span>
              </div>

              {format === "png" ? (
                <button
                  type="button"
                  onClick={handleExportPng}
                  disabled={isExportingImage}
                  className="px-4 py-1.5 rounded-full bg-[#0099ff] hover:bg-[#0088e6] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingImage ? "Rendering..." : "Download PNG"}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-full bg-[#1c1c20] hover:bg-[#26262c] text-zinc-200 border border-[#2a2a32] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    <span className={copied ? "text-emerald-400 font-semibold" : ""}>{copied ? "Copied!" : "Copy Code"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCode}
                    className="px-4 py-1.5 rounded-full bg-[#0099ff] hover:bg-[#0088e6] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            {/* Code Body / Instructions */}
            {format === "png" ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 text-zinc-300">
                <div className="w-16 h-16 rounded-3xl bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">High-Resolution PNG Snapshot</h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Generate a pixel-perfect 2x image export of your design layout for presentations, design mockups, and client reviews.
                  </p>
                  {imageError && (
                    <p className="text-xs text-rose-400 mt-2 bg-rose-500/10 border border-rose-500/20 py-1.5 px-3 rounded-xl">
                      {imageError}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleExportPng}
                  disabled={isExportingImage}
                  className="px-6 py-2.5 rounded-full bg-[#0099ff] hover:bg-[#0088e6] text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingImage ? "Rendering Image..." : "Download High-Res PNG"}</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-4 font-mono text-[11px] text-zinc-300 leading-relaxed bg-[#0b0b0d]">
                <pre className="overflow-x-auto whitespace-pre no-scrollbar">
                  <code>{codeContent}</code>
                </pre>
              </div>
            )}

            {/* Footer tips */}
            <div className="p-3 bg-[#17171a]/80 border-t border-[#262626] flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Includes embedded responsive media queries & Google Fonts</span>
              </span>
              <span className="text-zinc-500">{codeContent.length} chars</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
