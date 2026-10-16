import { useRef, useState } from "react";
import {
  supportsFileSystemAccess,
  tryGetFileSystemHandle,
  tryShowOpenFilePicker,
  type MinimalFileSystemFileHandle,
} from "@/lib/fs/file-system-access";
import { isHtmlFile } from "@/lib/fs/is-html-file";
import { processDroppedFileList, readDirectoryHandle, readWebkitDirectoryEntry, type IngestedProject } from "@/lib/fs/directory-picker";
import type { LoadedFile } from "@/types";
import { UploadCloud, FileCode, ShieldCheck, FolderOpen, Palette, ArrowRight } from "lucide-react";

interface DropZoneProps {
  onFileLoaded: (file: LoadedFile, warning?: string) => void;
  onProjectLoaded?: (project: IngestedProject) => void;
}

const SAMPLE_TEMPLATES = [
  {
    name: "developer-card.html",
    title: "Developer Profile & Stack",
    badge: "Tailwind v4",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6 antialiased">
  <div class="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
    <div class="flex items-center gap-4">
      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="Avatar" class="w-14 h-14 rounded-xl object-cover border border-zinc-700 shrink-0" />
      <div>
        <h1 class="text-lg font-bold text-zinc-100 tracking-tight">Elena Rostova</h1>
        <p class="text-xs text-zinc-400 font-mono">Staff Systems & Frontend Engineer</p>
      </div>
    </div>
    <p class="text-sm text-zinc-300 leading-relaxed">
      Building local-first developer tools, accessible design systems, and resilient client-side web architectures.
    </p>
    <div class="flex flex-wrap gap-1.5 pt-1">
      <span class="px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">TypeScript</span>
      <span class="px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">Tailwind v4</span>
      <span class="px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">Astro 5</span>
      <span class="px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">WebAssembly</span>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "docs-article.html",
    title: "Documentation Article",
    badge: "Tailwind v4",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-zinc-950 text-zinc-200 min-h-screen p-8 sm:p-12 max-w-3xl mx-auto antialiased">
  <article class="space-y-6">
    <div class="text-xs font-mono uppercase tracking-wider text-zinc-500">Architecture &bull; Local-first</div>
    <h1 class="text-3xl font-extrabold text-zinc-50 tracking-tight">AST Splicing vs Serialization</h1>
    <p class="text-base text-zinc-400 leading-relaxed">
      When building in-browser visual editors, traditional serialization rewrites the entire document, destroying PHP tags, comments, and template whitespace.
    </p>
    <div class="p-4 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto">
      const span = node.sourceCodeLocation.attrs.class;<br/>
      const nextHtml = html.slice(0, span.startOffset) + newClasses + html.slice(span.endOffset);
    </div>
    <p class="text-sm text-zinc-400 leading-relaxed">
      Targeted byte splicing guarantees that every surrounding byte remains untouched on disk.
    </p>
  </article>
</body>
</html>`,
  },
  {
    name: "metrics-card.html",
    title: "System Performance Metrics",
    badge: "Tailwind v3",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6 antialiased">
  <div class="max-w-2xl w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
      <div class="flex items-center justify-between text-xs font-mono text-zinc-400">
        <span>AST Parse Time</span>
        <span class="text-emerald-400 font-semibold">&minus;62%</span>
      </div>
      <div class="text-3xl font-bold font-mono tracking-tight text-zinc-100">1.84 ms</div>
      <div class="text-xs text-zinc-500">Parse5 native in-memory worker</div>
    </div>
    <div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
      <div class="flex items-center justify-between text-xs font-mono text-zinc-400">
        <span>Disk Write Latency</span>
        <span class="text-emerald-400 font-semibold">Native</span>
      </div>
      <div class="text-3xl font-bold font-mono tracking-tight text-zinc-100">&lt; 0.5 ms</div>
      <div class="text-xs text-zinc-500">File System Access API handle</div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "pricing-tiers.html",
    title: "Community & Team Plans",
    badge: "Tailwind v4",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6 antialiased">
  <div class="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-5">
    <div class="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-5">
      <div class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Open Source</div>
      <div class="text-3xl font-extrabold text-zinc-100">$0 <span class="text-xs font-normal text-zinc-500">/ forever</span></div>
      <ul class="space-y-2.5 text-xs text-zinc-300 font-sans">
        <li>&bull; 100% In-browser AST parser</li>
        <li>&bull; Direct local file system save</li>
        <li>&bull; Tailwind CSS v3 & v4 tokens</li>
        <li>&bull; 100% Local code sandbox</li>
      </ul>
      <button class="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold font-mono transition-colors">
        Current Edition
      </button>
    </div>
    <div class="p-7 rounded-2xl bg-zinc-900 border border-zinc-700 space-y-5 relative">
      <div class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Sponsor / Backer</div>
      <div class="text-3xl font-extrabold text-zinc-100">Optional <span class="text-xs font-normal text-zinc-500">/ on Ko-fi</span></div>
      <ul class="space-y-2.5 text-xs text-zinc-300 font-sans">
        <li>&bull; Supports continuous development</li>
        <li>&bull; Priority roadmap input on GitHub</li>
        <li>&bull; Contributor badge in releases</li>
        <li>&bull; Kept ad-free and tracking-free</li>
      </ul>
      <button class="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold font-mono transition-colors">
        Support Project
      </button>
    </div>
  </div>
</body>
</html>`,
  },
];

export default function DropZone({ onFileLoaded, onProjectLoaded }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const configInputRef = useRef<HTMLInputElement | null>(null);

  async function handleProjectIngestion(project: IngestedProject) {
    if (onProjectLoaded) {
      onProjectLoaded(project);
      return;
    }
    if (project.htmlFiles.length > 0) {
      const first = project.htmlFiles[0];
      onFileLoaded({ name: first.name, content: first.content, handle: first.handle as any });
    }
  }

  async function handleFilePicker() {
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  async function handleFolderPicker() {
    setError(null);
    if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle) {
          const project = await readDirectoryHandle(dirHandle);
          if (project.htmlFiles.length === 0 && !project.tailwindConfig && !project.customStyles) {
            setError("No HTML or CSS/Tailwind config files found in the chosen folder.");
            return;
          }
          await handleProjectIngestion(project);
          return;
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }
    if (folderInputRef.current) folderInputRef.current.value = "";
    folderInputRef.current?.click();
  }

  async function handleConfigPicker() {
    setError(null);
    if (configInputRef.current) configInputRef.current.value = "";
    configInputRef.current?.click();
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);

    const items = e.dataTransfer.items;
    const files = e.dataTransfer.files;

    if (items && items.length > 0) {
      const rawFiles: File[] = [];
      const handles: (FileSystemFileHandle | null)[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind !== "file") continue;

        const entry = (item as any).webkitGetAsEntry?.();
        if (entry?.isDirectory) {
          const dirFiles = await readWebkitDirectoryEntry(entry);
          rawFiles.push(...dirFiles);
        } else {
          const file = item.getAsFile();
          if (file) {
            rawFiles.push(file);
            const handle = await tryGetFileSystemHandle(item);
            handles.push(handle as unknown as FileSystemFileHandle | null);
          }
        }
      }

      if (rawFiles.length > 0) {
        const project = await processDroppedFileList(rawFiles, handles);
        if (project.htmlFiles.length === 0 && !project.tailwindConfig && !project.customStyles) {
          setError("No HTML, Tailwind config, or CSS files found in the drop.");
          return;
        }
        await handleProjectIngestion(project);
        return;
      }
    } else if (files && files.length > 0) {
      const rawFiles = Array.from(files);
      const project = await processDroppedFileList(rawFiles);
      if (project.htmlFiles.length === 0 && !project.tailwindConfig && !project.customStyles) {
        setError("No HTML, Tailwind config, or CSS files found in the drop.");
        return;
      }
      await handleProjectIngestion(project);
      return;
    }

    setError("No files detected in the drop. Try dropping .html or .css files.");
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-4xl mx-auto transition-colors">
      {/* Main Drop Surface */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`w-full max-w-2xl rounded-2xl p-8 sm:p-12 transition-all duration-200 border text-center ${
          isDragOver
            ? "scale-[1.01] border-dashed"
            : ""
        }`}
        style={{
          backgroundColor: "var(--surface-1)",
          borderColor: isDragOver ? "var(--border-focus)" : "var(--border)",
          boxShadow: isDragOver ? "var(--shadow-lg)" : "var(--shadow-sm)",
        }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 border transition-colors"
          style={{
            backgroundColor: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--ink-1)",
          }}
        >
          <UploadCloud className="w-6 h-6" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--ink-1)" }}>
          Drop HTML files or open a project
        </h2>
        <p className="text-sm max-w-md mx-auto mb-6 leading-relaxed" style={{ color: "var(--ink-2)" }}>
          Drag & drop any <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)", color: "var(--ink-1)" }}>.html</code> file, a local folder, or code generated by Claude / Cursor. Runs 100% in your browser.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleFilePicker}
            className="btn btn-primary"
          >
            <FileCode className="w-4 h-4" />
            <span>Select HTML file</span>
          </button>

          <button
            type="button"
            onClick={handleFolderPicker}
            className="btn btn-secondary"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open project folder</span>
          </button>

          <button
            type="button"
            onClick={handleConfigPicker}
            className="btn btn-ghost"
            title="Load custom Tailwind config or style.css"
          >
            <Palette className="w-4 h-4" />
            <span>Load styles / config</span>
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".html,.htm,text/html"
          onChange={async (e) => {
            if (e.target.files && e.target.files.length > 0) {
              const project = await processDroppedFileList(Array.from(e.target.files));
              await handleProjectIngestion(project);
            }
            if (e.target) e.target.value = "";
          }}
          className="hidden"
        />

        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is standard for folder picker inputs
          webkitdirectory="true"
          multiple
          onChange={async (e) => {
            if (e.target.files && e.target.files.length > 0) {
              const project = await processDroppedFileList(Array.from(e.target.files));
              await handleProjectIngestion(project);
            }
            if (e.target) e.target.value = "";
          }}
          className="hidden"
        />

        <input
          ref={configInputRef}
          type="file"
          multiple
          accept=".js,.cjs,.mjs,.ts,.json,.css"
          onChange={async (e) => {
            if (e.target.files && e.target.files.length > 0) {
              const project = await processDroppedFileList(Array.from(e.target.files));
              await handleProjectIngestion(project);
            }
            if (e.target) e.target.value = "";
          }}
          className="hidden"
        />

        {error && (
          <div
            className="mt-4 text-xs p-3 rounded-lg border font-mono text-left"
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              borderColor: "rgba(220, 38, 38, 0.2)",
              color: "var(--error)",
            }}
          >
            {error}
          </div>
        )}

        <div
          className="mt-6 pt-5 border-t flex items-center justify-center gap-2 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--ink-3)" }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: "var(--success)" }} />
          <span>Local browser sandbox &bull; Zero server uploads &bull; Directly saves to disk</span>
        </div>
      </div>

      {/* Sample Templates */}
      <div className="w-full max-w-2xl mt-10">
        <div
          className="text-label mb-3 text-center"
          style={{ color: "var(--ink-3)" }}
        >
          Or start with a sample document
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SAMPLE_TEMPLATES.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => onFileLoaded({ name: sample.name, content: sample.html, handle: null })}
              className="p-3.5 rounded-xl border text-left transition-all duration-150 group flex items-center justify-between cursor-pointer"
              style={{
                backgroundColor: "var(--surface-1)",
                borderColor: "var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="truncate pr-2">
                <div
                  className="text-xs sm:text-sm font-semibold tracking-tight transition-colors truncate"
                  style={{ color: "var(--ink-1)" }}
                >
                  {sample.title}
                </div>
                <div className="text-[11px] font-mono mt-0.5 truncate" style={{ color: "var(--ink-3)" }}>
                  {sample.name}
                </div>
              </div>
              <span
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border shrink-0"
                style={{
                  backgroundColor: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--ink-2)",
                }}
              >
                {sample.badge}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
