import { useEffect, useRef, useState } from "react";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";
import { analyzeHtmlClientSide } from "@/lib/ast/analyze";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import { ensureWritePermission, writeToHandle } from "@/lib/fs/file-system-access";
import { downloadHtml } from "@/lib/fs/download";
import { buildPreSaveLabel, versionFilename, type VersionEntry } from "@/lib/fs/version-history";
import type { EditRecord, SaveRequestEdit, ThemeMap, LoadedFile } from "@/types";
import { useSelectionStore } from "@/store/selection-store";
import { useChangeSetStore } from "@/store/change-set-store";
import { useUndoStore } from "@/store/undo-store";
import { clearResponsiveRegistry, syncResponsiveStylesheet } from "@/lib/dom/responsive-style-engine";
import Toolbar, { type ViewportMode } from "./Toolbar";
import DropZone from "./DropZone";
import PreviewFrame, { type DropTargetInfo } from "./PreviewFrame";
import SelectionOverlay from "./SelectionOverlay";
import PropertyPanel from "./PropertyPanel";
import ReviewModal from "./ReviewModal";
import VersionHistory from "./VersionHistory";
import Breadcrumbs from "./Breadcrumbs";
import LayersTree from "./LayersTree";
import BasicComponents from "./BasicComponents";
import ComponentBlocks from "./ComponentBlocks";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import { AlertTriangle, X, Layers, PlusSquare, PanelLeftClose, Sparkles } from "lucide-react";

const EMPTY_THEME: ThemeMap = { mode: "none", colors: [], fonts: [] };

function toSaveRequestEdit(edit: EditRecord): SaveRequestEdit {
  if (edit.kind === "class") {
    return { kind: "class", structuralPath: edit.structuralPath, newClassList: edit.newClassList };
  }
  if (edit.kind === "style") {
    return { kind: "style", structuralPath: edit.structuralPath, styleProperty: edit.styleProperty, newStyleValue: edit.newStyleValue };
  }
  if (edit.kind === "text") {
    return { kind: "text", structuralPath: edit.structuralPath, newText: edit.newText };
  }
  if (edit.kind === "attribute") {
    return { kind: "attribute", structuralPath: edit.structuralPath, attributeName: edit.attributeName, newValue: edit.newValue };
  }
  if (edit.kind === "delete") {
    return { kind: "delete", structuralPath: edit.structuralPath };
  }
  if (edit.kind === "duplicate") {
    return { kind: "duplicate", structuralPath: edit.structuralPath };
  }
  if (edit.kind === "move") {
    return { kind: "move", structuralPath: edit.structuralPath, targetPath: edit.targetPath, position: edit.position };
  }
  return { kind: "insert", structuralPath: edit.structuralPath, position: edit.position, snippet: edit.snippet };
}

export default function EditorStudio() {
  const [openFile, setOpenFile] = useState<LoadedFile | null>(null);
  const [loadToken, setLoadToken] = useState(0);
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null);
  const [hoveredEl, setHoveredEl] = useState<Element | null>(null);
  const [selectedEl, setSelectedEl] = useState<Element | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [dropTargetInfo, setDropTargetInfo] = useState<DropTargetInfo | null>(null);
  const [theme, setTheme] = useState<ThemeMap>(EMPTY_THEME);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saveConflicts, setSaveConflicts] = useState<string[] | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [leftSidebarTab, setLeftSidebarTab] = useState<"layers" | "primitives" | "templates">("layers");
  const [zoom, setZoom] = useState(1);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const versionIdRef = useRef(0);

  const hover = useSelectionStore((s) => s.hover);
  const select = useSelectionStore((s) => s.select);
  const edits = useChangeSetStore((s) => s.edits);
  const recordEdit = useChangeSetStore((s) => s.recordEdit);
  const clearEdits = useChangeSetStore((s) => s.clear);

  function nextVersionId(): number {
    versionIdRef.current += 1;
    return versionIdRef.current;
  }

  function resetSessionState() {
    setHoveredEl(null);
    setSelectedEl(null);
    setSelectedPath(null);
    setDropTargetInfo(null);
    setReviewOpen(false);
    setSaveConflicts(null);
    setStatusMessage(null);
    setVersionHistory([]);
    setHistoryOpen(false);
    setZoom(1);
    hover(null);
    select(null);
    clearEdits();
    clearResponsiveRegistry();
    useUndoStore.getState().reset();
  }

  function handleFileLoaded(file: LoadedFile, warning?: string) {
    resetSessionState();
    setOpenFile(file);
    setLoadToken((t) => t + 1);
    versionIdRef.current = 0;
    setVersionHistory([{ id: nextVersionId(), label: "Original (as opened)", html: file.content }]);
    if (warning) setStatusMessage(warning);

    // 100% In-Browser AST Theme Analysis (0ms network latency!)
    try {
      const data = analyzeHtmlClientSide(file.content);
      setTheme(data.theme);
    } catch {
      setTheme(EMPTY_THEME);
    }
  }

  function handleChangeFile() {
    if (edits.length > 0 && !window.confirm("You have unsaved edits that will be lost. Drop a different file anyway?")) {
      return;
    }
    setOpenFile(null);
    setIframeEl(null);
    setTheme(EMPTY_THEME);
    resetSessionState();
  }

  function handleHoverElement(el: Element | null) {
    setHoveredEl(el);
    hover(el ? computeStructuralPath(el, domAdapter) : null);
  }

  function handleSelectElement(el: Element) {
    setSelectedEl(el);
    const path = computeStructuralPath(el, domAdapter);
    setSelectedPath(path);
    select(path);
  }

  function handleEdit(record: EditRecord) {
    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit(record);
  }

  function handleDeleteElement(el: Element) {
    const tagName = el.tagName.toLowerCase();
    if (tagName === "body" || tagName === "html") return;
    const path = computeStructuralPath(el, domAdapter);
    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "delete",
      structuralPath: path,
      timestamp: new Date().toISOString(),
    });
    el.remove();
    setSelectedEl(null);
    setSelectedPath(null);
    select(null);
    setStatusMessage(`Deleted <${tagName}>`);
    setTimeout(() => setStatusMessage(null), 2500);
  }

  function handleDuplicateElement(el: Element) {
    const tagName = el.tagName.toLowerCase();
    if (tagName === "body" || tagName === "html") return;
    const path = computeStructuralPath(el, domAdapter);
    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "duplicate",
      structuralPath: path,
      timestamp: new Date().toISOString(),
    });
    const clone = el.cloneNode(true) as Element;
    if (clone.id) clone.id = `${clone.id}-copy`;
    el.after(clone);
    handleSelectElement(clone);
    setStatusMessage(`Duplicated <${tagName}>`);
    setTimeout(() => setStatusMessage(null), 2500);
  }

  function handleMoveUp(el: Element) {
    const prev = el.previousElementSibling;
    if (!prev) return;
    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    el.parentElement?.insertBefore(el, prev);
    handleSelectElement(el);
  }

  function handleMoveDown(el: Element) {
    const next = el.nextElementSibling;
    if (!next) return;
    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    el.parentElement?.insertBefore(next, el);
    handleSelectElement(el);
  }

  function handleMoveElement(sourceEl: Element, targetEl: Element, position: "before" | "after" | "inside") {
    const tagName = sourceEl.tagName.toLowerCase();
    const targetTag = targetEl.tagName.toLowerCase();
    if (tagName === "body" || tagName === "html") return;

    const sourcePath = computeStructuralPath(sourceEl, domAdapter);
    const targetPath = computeStructuralPath(targetEl, domAdapter);

    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "move",
      structuralPath: sourcePath,
      targetPath: targetPath,
      position,
      timestamp: new Date().toISOString(),
    });

    if (position === "inside") {
      targetEl.appendChild(sourceEl);
    } else if (position === "before") {
      targetEl.parentElement?.insertBefore(sourceEl, targetEl);
    } else {
      targetEl.parentElement?.insertBefore(sourceEl, targetEl.nextSibling);
    }

    handleSelectElement(sourceEl);
    setStatusMessage(`Moved <${tagName}> ${position} <${targetTag}>`);
    setTimeout(() => setStatusMessage(null), 2500);
  }

  function handleDropOnTarget(snippet: string, targetEl: Element, position: "inside" | "before" | "after") {
    const doc = iframeEl?.contentDocument;
    if (!doc) return;
    const target = targetEl || selectedEl || doc.body;
    if (!target) return;

    const path = computeStructuralPath(target, domAdapter);
    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "insert",
      structuralPath: path,
      position,
      snippet,
      timestamp: new Date().toISOString(),
    });

    const temp = doc.createElement("div");
    temp.innerHTML = snippet;
    const newChild = temp.firstElementChild;
    if (newChild) {
      if (position === "inside") {
        target.appendChild(newChild);
      } else if (position === "before" && target.parentElement && target.tagName.toLowerCase() !== "body") {
        target.parentElement.insertBefore(newChild, target);
      } else if (position === "after" && target.parentElement && target.tagName.toLowerCase() !== "body") {
        target.parentElement.insertBefore(newChild, target.nextSibling);
      } else {
        doc.body.appendChild(newChild);
      }
      handleSelectElement(newChild);
      setStatusMessage(`Added <${newChild.tagName.toLowerCase()}> into <${target.tagName.toLowerCase()}>`);
      setTimeout(() => setStatusMessage(null), 2500);
    }
  }

  function handleInsertPrimitive(snippet: string, position: "inside" | "after" | "before") {
    handleDropOnTarget(snippet, selectedEl || (iframeEl?.contentDocument?.body as Element), position);
  }

  function handleInsertBlock(snippet: string) {
    handleInsertPrimitive(snippet, selectedEl ? "after" : "inside");
  }

  function handleDownloadVersion(entry: VersionEntry) {
    if (!openFile) return;
    downloadHtml(versionFilename(entry.label, openFile.name), entry.html);
  }

  async function handleCopyCode() {
    if (!openFile) return;
    let code = openFile.content;
    if (edits.length > 0) {
      const res = applyEditsClientSide(openFile.content, edits.map(toSaveRequestEdit));
      if (res.ok) code = res.html;
    }
    try {
      await navigator.clipboard.writeText(code);
      setStatusMessage("HTML copied to clipboard!");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {}
  }

  async function persistUpdatedHtml(file: LoadedFile, html: string) {
    if (file.handle) {
      const granted = await ensureWritePermission(file.handle);
      if (granted) {
        try {
          await writeToHandle(file.handle, html);
          setOpenFile({ ...file, content: html });
          setStatusMessage(`Saved directly to ${file.name}`);
          return;
        } catch {}
      }
      downloadHtml(file.name, html);
      setOpenFile({ ...file, content: html });
      setStatusMessage(
        granted
          ? `Downloaded copy of ${file.name}`
          : `Browser fallback: downloaded copy of ${file.name}`
      );
      return;
    }
    downloadHtml(file.name, html);
    setOpenFile({ ...file, content: html });
    setStatusMessage(`Downloaded ${file.name}`);
  }

  function handleSave() {
    if (!openFile) return;
    const saveEdits = edits.map(toSaveRequestEdit);

    // 100% In-Browser AST Splicing (0ms network latency!)
    const result = applyEditsClientSide(openFile.content, saveEdits);
    if (result.ok) {
      setSaveConflicts(null);
      const preSaveHtml = openFile.content;
      setVersionHistory((prev) => [...prev, { id: nextVersionId(), label: buildPreSaveLabel(), html: preSaveHtml }]);
      clearEdits();
      useUndoStore.getState().reset();
      setReviewOpen(false);
      persistUpdatedHtml(openFile, result.html);
    } else {
      setSaveConflicts(result.conflicts.map((c) => `${c.structuralPath} (${c.reason})`));
    }
  }

  // Keyboard Shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z / Delete / Duplicate / Escape / ?)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = (e.target as HTMLElement) || document.activeElement;
      const isTyping =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (e.key === "Escape") {
        setSelectedEl(null);
        setSelectedPath(null);
        select(null);
        setShortcutsOpen(false);
        return;
      }

      if (e.key === "?" && !isTyping) {
        setShortcutsOpen((o) => !o);
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !isTyping && selectedEl) {
        e.preventDefault();
        handleDeleteElement(selectedEl);
        return;
      }

      const isModifier = e.metaKey || e.ctrlKey;
      if (isModifier && e.key.toLowerCase() === "d" && !isTyping && selectedEl) {
        e.preventDefault();
        handleDuplicateElement(selectedEl);
        return;
      }

      if (!isModifier) return;

      const doc = iframeEl?.contentDocument ?? null;

      // Redo via Ctrl+Y or Ctrl+Shift+Z
      if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        useUndoStore.getState().redo(doc);
        return;
      }

      // Undo via Ctrl+Z
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        useUndoStore.getState().undo(doc);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    const iframeDoc = iframeEl?.contentDocument;
    const iframeWin = iframeEl?.contentWindow;
    iframeDoc?.addEventListener("keydown", handleKeyDown);
    iframeWin?.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      iframeDoc?.removeEventListener("keydown", handleKeyDown);
      iframeWin?.removeEventListener("keydown", handleKeyDown);
    };
  }, [iframeEl, selectedEl]);

  // Window drag/drop safety
  useEffect(() => {
    function preventDefault(e: DragEvent) {
      e.preventDefault();
    }
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  function handleViewportChange(mode: ViewportMode) {
    if (iframeEl?.contentDocument) {
      const doc = iframeEl.contentDocument;
      if (doc.documentElement) {
        doc.documentElement.setAttribute("data-vse-viewport", mode);
      }
      syncResponsiveStylesheet(doc);
    }
    setViewport(mode);
  }

  // Synchronize active viewport mode with the preview iframe document element for live style isolation
  useEffect(() => {
    if (!iframeEl || !iframeEl.contentDocument) return;
    const doc = iframeEl.contentDocument;
    if (doc.documentElement) {
      doc.documentElement.setAttribute("data-vse-viewport", viewport);
    }
    syncResponsiveStylesheet(doc);
  }, [viewport, iframeEl]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-[#090909] text-slate-900 dark:text-white overflow-hidden font-sans transition-colors">
      <Toolbar
        fileName={openFile?.name ?? null}
        viewport={viewport}
        onViewportChange={handleViewportChange}
        onChangeFile={handleChangeFile}
        statusMessage={statusMessage}
        historyCount={versionHistory.length}
        onToggleHistory={() => setHistoryOpen((o) => !o)}
        onOpenReview={() => setReviewOpen(true)}
        onCopyCode={handleCopyCode}
        iframeDocument={iframeEl?.contentDocument ?? null}
        leftSidebarOpen={leftSidebarOpen}
        onToggleLeftSidebar={() => setLeftSidebarOpen((o) => !o)}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(Number((z + 0.1).toFixed(2)), 1.5))}
        onZoomOut={() => setZoom((z) => Math.max(Number((z - 0.1).toFixed(2)), 0.5))}
        onZoomReset={() => setZoom(1)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <div className="flex flex-1 min-h-0 relative">
        {/* Left Sidebar: Layers Tree & Component Blocks */}
        {openFile && leftSidebarOpen && (
          <aside className="w-80 border-r border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] flex flex-col shrink-0 z-20 overflow-hidden shadow-2xl animate-in slide-in-from-left-4 duration-200">
            {/* Tab Header */}
            <div className="flex items-center justify-between p-2.5 border-b border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#090909]">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141414] p-0.5 rounded-full border border-slate-200 dark:border-[#262626]">
                <button
                  onClick={() => setLeftSidebarTab("layers")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    leftSidebarTab === "layers"
                      ? "bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Layers</span>
                </button>
                <button
                  onClick={() => setLeftSidebarTab("primitives")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    leftSidebarTab === "primitives"
                      ? "bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>Primitives</span>
                </button>
                <button
                  onClick={() => setLeftSidebarTab("templates")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    leftSidebarTab === "templates"
                      ? "bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Templates</span>
                </button>
              </div>

              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-[#1c1c1c] cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Body */}
            {leftSidebarTab === "layers" ? (
              <LayersTree
                iframeDocument={iframeEl?.contentDocument ?? null}
                selectedElement={selectedEl}
                onSelectElement={handleSelectElement}
                onHoverElement={handleHoverElement}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                onMoveElement={handleMoveElement}
              />
            ) : leftSidebarTab === "primitives" ? (
              <BasicComponents
                onInsert={handleInsertPrimitive}
                selectedElement={selectedEl}
              />
            ) : (
              <ComponentBlocks onInsertBlock={handleInsertBlock} />
            )}
          </aside>
        )}

        {/* Main Canvas Area + Breadcrumbs */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="flex-1 relative flex items-center justify-center canvas-dot-grid p-2 sm:p-4 overflow-auto">
            {openFile ? (
              <div
                style={{
                  transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="w-full h-full flex items-center justify-center"
              >
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  {viewport !== "desktop" && (
                    <div className="mb-2 px-3 py-1 rounded-full bg-[#141414]/90 border border-[#262626] text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 shadow-md select-none shrink-0">
                      <span>{viewport === "tablet" ? "Tablet View" : "Mobile View"}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[#0099ff] font-semibold">
                        {viewport === "tablet" ? "768 × 1024" : "375 × 812"}
                      </span>
                    </div>
                  )}

                  <div
                    className={`bg-white relative transition-all duration-300 shadow-2xl flex flex-col ${
                      viewport === "desktop"
                        ? "w-full h-full"
                        : viewport === "tablet"
                        ? "w-[768px] h-[calc(100vh-10rem)] max-h-[1024px] rounded-2xl border-[8px] border-[#1c1c1c] shadow-black/80 overflow-hidden shrink-0"
                        : "w-[375px] h-[calc(100vh-10rem)] max-h-[812px] rounded-[2.5rem] border-[10px] border-[#1c1c1c] shadow-black/80 overflow-hidden shrink-0"
                    }`}
                  >
                    {/* Phone Notch/Speaker */}
                    {viewport === "mobile" && (
                      <div className="w-full bg-white flex justify-center pt-2 pb-1 z-10 shrink-0">
                        <div className="w-24 h-4 bg-[#141414] rounded-full flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#262626]"></div>
                          <div className="w-10 h-1.5 rounded-full bg-[#262626]"></div>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 w-full h-full relative overflow-hidden">
                      <PreviewFrame
                        key={loadToken}
                        html={openFile.content}
                        onIframeReady={setIframeEl}
                        onHoverElement={handleHoverElement}
                        onSelectElement={handleSelectElement}
                        onDragOverTarget={setDropTargetInfo}
                        onDropOnTarget={handleDropOnTarget}
                        onMoveLayerOnTarget={handleMoveElement}
                      />
                    </div>

                    {/* Phone Home Bar */}
                    {viewport === "mobile" && (
                      <div className="w-full bg-white py-1 flex justify-center z-10 shrink-0">
                        <div className="w-28 h-1 bg-black/40 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <DropZone onFileLoaded={handleFileLoaded} />
            )}
          </div>

          {/* Interactive DOM Breadcrumbs */}
          {openFile && (
            <Breadcrumbs
              element={selectedEl}
              onSelectElement={handleSelectElement}
              onHoverElement={handleHoverElement}
            />
          )}
        </div>

        {/* Highlight & Drop Overlay */}
        <SelectionOverlay
          iframe={iframeEl}
          hoveredElement={hoveredEl}
          selectedElement={selectedEl}
          dropTargetInfo={dropTargetInfo}
          structuralPath={selectedPath}
          theme={theme}
          zoom={zoom}
          onEdit={handleEdit}
        />

        {/* Right Sidebar: Property Panel */}
        {openFile && (
          <aside className="w-80 border-l border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] flex flex-col shrink-0 z-20 overflow-hidden shadow-2xl">
            <div className="flex-1 overflow-y-auto">
              <PropertyPanel
                element={selectedEl}
                structuralPath={selectedPath}
                theme={theme}
                viewport={viewport}
                onEdit={handleEdit}
                onDelete={handleDeleteElement}
                onDuplicate={handleDuplicateElement}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Review Modal */}
      {reviewOpen && (
        <ReviewModal
          iframeDocument={iframeEl?.contentDocument ?? null}
          onSave={handleSave}
          onClose={() => setReviewOpen(false)}
        />
      )}

      {/* Version History Drawer */}
      {historyOpen && (
        <VersionHistory
          entries={versionHistory}
          onDownload={handleDownloadVersion}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {shortcutsOpen && (
        <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}

      {/* Save Conflict Notification */}
      {saveConflicts && (
        <div className="fixed bottom-4 right-4 bg-[#141414] border border-rose-500/30 text-rose-400 p-4 rounded-2xl max-w-sm shadow-2xl z-50 animate-in fade-in space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Save Conflicts Encountered
            </span>
            <button onClick={() => setSaveConflicts(null)} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-zinc-300">
            {saveConflicts.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
