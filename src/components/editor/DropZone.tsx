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
import { UploadCloud, FileCode, Sparkles, ShieldCheck, FolderOpen, Palette, FileText } from "lucide-react";

interface DropZoneProps {
  onFileLoaded: (file: LoadedFile, warning?: string) => void;
  onProjectLoaded?: (project: IngestedProject) => void;
}

const SAMPLE_TEMPLATES = [
  {
    name: "saas-landing.html",
    title: "AI SaaS Landing Page",
    badge: "Tailwind v4",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex flex-col justify-center items-center p-8">
  <div class="max-w-4xl text-center space-y-6">
    <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
      ✨ 100% Free In-Browser Visual Editor
    </div>
    <h1 id="hero-title" class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
      Build and style websites <span class="text-indigo-400">at the speed of thought</span>
    </h1>
    <p id="hero-desc" class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
      Double-click any text to edit copy, or drag visual sliders to tweak colors, margins, and typography in real-time.
    </p>
    <div class="flex flex-wrap justify-center gap-3 pt-2">
      <button id="cta-primary" class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/25">
        Get Started Free
      </button>
      <button id="cta-secondary" class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold transition-all">
        Live Demo
      </button>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "pricing-matrix.html",
    title: "SaaS Pricing Matrix",
    badge: "Tailwind v3",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-950 text-white min-h-screen flex items-center justify-center p-6">
  <div class="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
    <div id="starter-card" class="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Starter</span>
      <div>
        <span class="text-4xl font-extrabold text-white">$0</span>
        <span class="text-gray-400 text-sm"> / forever</span>
      </div>
      <ul class="space-y-3 text-sm text-gray-300">
        <li>✓ 100% In-Browser AST Engine</li>
        <li>✓ Direct Local File Sync</li>
        <li>✓ Export Clean Tailwind HTML</li>
      </ul>
      <button class="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors">
        Start Free
      </button>
    </div>
    <div id="pro-card" class="bg-gray-900 border-2 border-indigo-500 rounded-2xl p-8 space-y-6 shadow-2xl relative">
      <div class="flex justify-between items-center">
        <span class="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Pro Edition</span>
        <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Most Popular</span>
      </div>
      <div>
        <span class="text-4xl font-extrabold text-white">$29</span>
        <span class="text-gray-400 text-sm"> / month</span>
      </div>
      <ul class="space-y-3 text-sm text-gray-300">
        <li>✓ Everything in Starter</li>
        <li>✓ Priority Support & Updates</li>
        <li>✓ Unlimited Custom Presets</li>
      </ul>
      <button class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
        Upgrade Now
      </button>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "portfolio-brand.html",
    title: "Creator Portfolio",
    badge: "Tailwind v4",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen p-8 max-w-3xl mx-auto flex flex-col justify-center space-y-8">
  <div class="flex items-center gap-4">
    <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-2xl shadow-lg">
      JD
    </div>
    <div>
      <h1 class="text-2xl font-bold text-white">John Doe</h1>
      <p class="text-sm text-zinc-400">Senior Product Designer & Frontend Developer</p>
    </div>
  </div>
  <p class="text-base text-zinc-300 leading-relaxed">
    Crafting human-centric digital interfaces and delightful web applications. Specialized in design systems, micro-interactions, and high-performance Astro frontends.
  </p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
      <h3 class="font-bold text-white">Visual Design System</h3>
      <p class="text-xs text-zinc-400">Tokens, responsive components & layout primitives.</p>
    </div>
    <div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
      <h3 class="font-bold text-white">Interactive Web Apps</h3>
      <p class="text-xs text-zinc-400">Zero-server cost client-side engineering.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "waitlist-hero.html",
    title: "Startup Waitlist Page",
    badge: "Tailwind v4",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-black text-white min-h-screen flex flex-col justify-center items-center p-6">
  <div class="max-w-xl text-center space-y-6">
    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      🚀 Launching Summer 2026
    </span>
    <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight">
      Next-Gen Visual Development
    </h1>
    <p class="text-sm text-gray-400">
      Join 4,000+ designers and indie hackers on the early access list.
    </p>
    <form class="flex gap-2 max-w-md mx-auto" onsubmit="return false;">
      <input type="email" placeholder="you@company.com" class="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500" />
      <button class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
        Join Waitlist
      </button>
    </form>
  </div>
</body>
</html>`,
  },
  {
    name: "link-in-bio.html",
    title: "Mobile Link-in-Bio",
    badge: "Tailwind v3",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex justify-center p-6">
  <div class="w-full max-w-sm flex flex-col items-center text-center space-y-4 pt-8">
    <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-2xl font-bold shadow-xl">
      ✨
    </div>
    <div>
      <h1 class="text-lg font-bold text-white">@alexdesign</h1>
      <p class="text-xs text-slate-400">Designer, Maker & Creative Developer</p>
    </div>
    <div class="w-full space-y-3 pt-4">
      <a href="#" class="block w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium text-white transition-all shadow">
        🎨 Design Portfolio
      </a>
      <a href="#" class="block w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium text-white transition-all shadow">
        ⚡ Free Web Templates
      </a>
      <a href="#" class="block w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium text-white transition-all shadow">
        📬 Subscribe to Newsletter
      </a>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "newsletter-card.html",
    title: "Newsletter Subscription",
    badge: "Tailwind v4",
    html: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-gray-950 text-white min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full p-8 rounded-3xl bg-gray-900 border border-gray-800 text-center space-y-5 shadow-2xl">
    <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-xl">
      📬
    </div>
    <h2 class="text-2xl font-bold text-white">The Frontend Dispatch</h2>
    <p class="text-xs text-gray-400 leading-relaxed">
      A weekly dose of modern CSS techniques, zero-server architecture, and web design inspiration.
    </p>
    <div class="space-y-2">
      <input type="email" placeholder="Enter your email" class="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
      <button class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors">
        Subscribe for Free
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
      <div className="w-full max-w-2xl p-2 rounded-[2.25rem] bg-slate-200/60 dark:bg-[#1a1a1e] border border-slate-300/60 dark:border-[#27272c] shadow-2xl transition-all">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`w-full rounded-[calc(2.25rem-0.5rem)] p-8 sm:p-10 transition-all ${
            isDragOver
              ? "border-2 border-dashed border-indigo-500 bg-indigo-500/10 scale-[1.01]"
              : "border border-slate-200/80 dark:border-[#27272a] hover:border-indigo-400 dark:hover:border-[#0099ff]/50 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-xl shadow-lg"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-indigo-100 dark:from-indigo-600/15 dark:to-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            Drop HTML pages & project files
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Drag and drop multiple <code className="text-indigo-600 dark:text-indigo-300 font-mono font-semibold">.html</code> files, an entire project folder, or your <code className="text-indigo-600 dark:text-indigo-300 font-mono font-semibold">tailwind.config</code> & <code className="text-indigo-600 dark:text-indigo-300 font-mono font-semibold">style.css</code>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleFilePicker}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              Choose HTML Files
            </button>

            <button
              type="button"
              onClick={handleFolderPicker}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#1e1e24] dark:hover:bg-[#282830] active:scale-95 text-slate-200 dark:text-white border border-slate-700 dark:border-[#33333d] font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              Open Project Folder
            </button>

            <button
              type="button"
              onClick={handleConfigPicker}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141416] dark:hover:bg-[#1c1c20] active:scale-95 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-[#2a2a30] font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
              title="Upload tailwind.config.js or style.css"
            >
              <Palette className="w-4 h-4 text-emerald-500" />
              Upload Config / CSS
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
            <div className="mt-4 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-200 dark:border-rose-500/20 font-medium">
              {error}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[#242424] flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>100% In-Browser & Private • Multi-page workspace & custom Tailwind config support</span>
          </div>
        </div>
      </div>

      {/* Sample Templates */}
      <div className="w-full max-w-2xl mt-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 justify-center">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Or start with a free template</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_TEMPLATES.map((sample) => (
            <button
              key={sample.name}
              onClick={() => onFileLoaded({ name: sample.name, content: sample.html, handle: null })}
              className="p-4 rounded-2xl bg-white/90 dark:bg-[#121215]/90 border border-slate-200/90 dark:border-[#26262a] hover:border-indigo-400 dark:hover:border-[#0099ff]/50 hover:bg-slate-50 dark:hover:bg-[#18181c] hover:shadow-lg hover:shadow-indigo-500/5 text-left transition-all group flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-[#0099ff] transition-colors">
                  {sample.title}
                </div>
                <div className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{sample.name}</div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                {sample.badge}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
