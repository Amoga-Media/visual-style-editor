import { useState } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { WorkspaceFile } from "@/types";
import {
  FileCode,
  Plus,
  Copy,
  Trash2,
  Download,
  Edit2,
  Check,
  Search,
  UploadCloud,
  FolderOpen,
  Sparkles,
  Layers,
} from "lucide-react";
import { downloadHtml } from "@/lib/fs/download";

interface PagesPanelProps {
  onSwitchPage: (fileId: string) => void;
  onAddNewPage?: (name: string, content: string) => void;
  onOpenFolderPicker?: () => void;
  onOpenFilesPicker?: () => void;
}

const STARTER_PRESETS = [
  {
    name: "about.html",
    title: "About Page",
    html: `<!doctype html><html><head><meta charset="utf-8"><script src="https://unpkg.com/@tailwindcss/browser@4"></script></head><body class="bg-slate-950 text-white min-h-screen p-8 flex flex-col justify-center items-center text-center"><div class="max-w-2xl space-y-4"><h1 class="text-4xl font-bold">About Us</h1><p class="text-slate-400">We are dedicated to building high-performance web tools with zero server lock-in.</p></div></body></html>`,
  },
  {
    name: "contact.html",
    title: "Contact Form",
    html: `<!doctype html><html><head><meta charset="utf-8"><script src="https://unpkg.com/@tailwindcss/browser@4"></script></head><body class="bg-gray-950 text-white min-h-screen flex items-center justify-center p-6"><div class="max-w-md w-full p-8 rounded-2xl bg-gray-900 border border-gray-800 space-y-4"><h2 class="text-2xl font-bold">Get in Touch</h2><input type="text" placeholder="Name" class="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white" /><textarea placeholder="Message" rows="4" class="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white"></textarea><button class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm">Send Message</button></div></body></html>`,
  },
  {
    name: "pricing.html",
    title: "Pricing Page",
    html: `<!doctype html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-950 text-white min-h-screen p-8 flex items-center justify-center"><div class="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-6"><div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"><h3 class="text-xl font-bold">Free</h3><div class="text-3xl font-extrabold">$0</div><button class="w-full py-2.5 rounded-xl bg-slate-800 text-white font-medium">Start</button></div><div class="p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500 space-y-4 shadow-xl"><h3 class="text-xl font-bold text-indigo-400">Pro</h3><div class="text-3xl font-extrabold">$19</div><button class="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium">Upgrade</button></div></div></body></html>`,
  },
];

export default function PagesPanel({
  onSwitchPage,
  onAddNewPage,
  onOpenFolderPicker,
  onOpenFilesPicker,
}: PagesPanelProps) {
  const files = useWorkspaceStore((s) => s.files);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const duplicateFile = useWorkspaceStore((s) => s.duplicateFile);
  const removeFile = useWorkspaceStore((s) => s.removeFile);
  const renameFile = useWorkspaceStore((s) => s.renameFile);
  const addFile = useWorkspaceStore((s) => s.addFile);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPageName, setNewPageName] = useState("");

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function startRename(file: WorkspaceFile) {
    setEditingId(file.id);
    setEditingName(file.name);
  }

  function commitRename(fileId: string) {
    if (editingName.trim()) {
      let finalName = editingName.trim();
      if (!finalName.endsWith(".html") && !finalName.endsWith(".htm")) {
        finalName += ".html";
      }
      renameFile(fileId, finalName);
    }
    setEditingId(null);
  }

  function handleCreateBlankPage() {
    let name = newPageName.trim() || "untitled.html";
    if (!name.endsWith(".html") && !name.endsWith(".htm")) {
      name += ".html";
    }
    const defaultHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-8">
  <div class="text-center space-y-4">
    <h1 class="text-4xl font-bold">New Page</h1>
    <p class="text-slate-400">Start building by dragging elements or double-clicking text.</p>
  </div>
</body>
</html>`;
    const newId = addFile({ name, content: defaultHtml });
    onSwitchPage(newId);
    setShowAddModal(false);
    setNewPageName("");
  }

  function handleCreatePreset(preset: typeof STARTER_PRESETS[0]) {
    const newId = addFile({ name: preset.name, content: preset.html });
    onSwitchPage(newId);
    setShowAddModal(false);
  }

  return (
    <div className="flex flex-col h-full select-none text-xs">
      {/* Header & Search */}
      <div className="p-3 border-b border-slate-200 dark:border-[#262626] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-zinc-200">
            <Layers className="w-3.5 h-3.5 text-[#0099ff]" />
            <span>Workspace Pages ({files.length})</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-2 py-1 rounded-md bg-[#0099ff]/10 hover:bg-[#0099ff]/20 text-[#0099ff] border border-[#0099ff]/30 font-medium flex items-center gap-1 transition-all cursor-pointer"
            title="Add New HTML Page"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-[#0099ff]"
          />
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-zinc-500 space-y-2">
            <FileCode className="w-8 h-8 mx-auto stroke-1 opacity-50" />
            <p className="text-xs">No pages match your search</p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isActive = file.id === activeFileId;
            const isEditing = editingId === file.id;

            return (
              <div
                key={file.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!isEditing && file.id !== activeFileId) {
                    onSwitchPage(file.id);
                  }
                }}
                className={`group relative flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#0099ff]/10 border-[#0099ff]/40 text-[#0099ff] font-semibold"
                    : "bg-transparent hover:bg-slate-100 dark:hover:bg-[#181818] border-transparent text-slate-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  <FileCode className={`w-4 h-4 shrink-0 ${isActive ? "text-[#0099ff]" : "text-slate-400 dark:text-zinc-500"}`} />
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      autoFocus
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => commitRename(file.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(file.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-1.5 py-0.5 rounded bg-white dark:bg-[#1a1a1a] border border-[#0099ff] text-slate-900 dark:text-white text-xs focus:outline-none"
                    />
                  ) : (
                    <div className="truncate flex items-center gap-1.5 min-w-0">
                      <span className="truncate text-xs">{file.name}</span>
                      {file.isDirty && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
                      )}
                    </div>
                  )}
                </div>

                {/* Page Action Icons */}
                <div
                  className={`flex items-center gap-1 shrink-0 ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } transition-opacity`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => startRename(file)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    title="Rename Page"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newId = duplicateFile(file.id);
                      if (newId) onSwitchPage(newId);
                    }}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadHtml(file.content, file.name)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    title="Download HTML"
                  >
                    <Download className="w-3 h-3" />
                  </button>

                  {files.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500"
                      title="Remove from Workspace"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Ingest Actions at bottom */}
      <div className="p-2 border-t border-slate-200 dark:border-[#262626] grid grid-cols-2 gap-1.5 bg-slate-50/50 dark:bg-[#101012]">
        <button
          type="button"
          onClick={onOpenFilesPicker}
          className="px-2 py-1.5 rounded-lg bg-white dark:bg-[#18181a] border border-slate-200 dark:border-[#28282c] hover:border-slate-400 text-slate-700 dark:text-zinc-300 font-medium flex items-center justify-center gap-1.5 text-[11px] transition-all cursor-pointer"
        >
          <UploadCloud className="w-3 h-3 text-[#0099ff]" />
          <span>Add HTML</span>
        </button>

        <button
          type="button"
          onClick={onOpenFolderPicker}
          className="px-2 py-1.5 rounded-lg bg-white dark:bg-[#18181a] border border-slate-200 dark:border-[#28282c] hover:border-slate-400 text-slate-700 dark:text-zinc-300 font-medium flex items-center justify-center gap-1.5 text-[11px] transition-all cursor-pointer"
        >
          <FolderOpen className="w-3 h-3 text-indigo-400" />
          <span>Add Folder</span>
        </button>
      </div>

      {/* Add Page Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#28282c] rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#262626] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0099ff]" />
                Add Page to Workspace
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Blank Page Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">New Page Filename</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. contact.html"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateBlankPage()}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1a1a1e] border border-slate-200 dark:border-[#28282c] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0099ff]"
                />
                <button
                  type="button"
                  onClick={handleCreateBlankPage}
                  className="px-4 py-2 rounded-xl bg-[#0099ff] hover:bg-[#0088ee] text-white font-semibold text-xs"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#262626]">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Or Start from Preset
              </span>
              <div className="space-y-1.5">
                {STARTER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleCreatePreset(preset)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1a1a1e] hover:bg-slate-100 dark:hover:bg-[#222226] border border-slate-200 dark:border-[#28282c] flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">{preset.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{preset.name}</div>
                    </div>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
