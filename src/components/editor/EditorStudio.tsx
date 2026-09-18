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
import { useSettingsStore } from "@/store/settings-store";
import { clearResponsiveRegistry, syncResponsiveStylesheet, generateResponsiveCssString } from "@/lib/dom/responsive-style-engine";
import { generateUniqueId } from "@/lib/ast/unique-id";
import { exportAsReactComponent } from "@/lib/export/html-to-jsx";
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
import PagesPanel from "./PagesPanel";
import ProjectConfigModal from "./ProjectConfigModal";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import ExportStudioModal from "./ExportStudioModal";
import DevicePresetDropdown from "./DevicePresetDropdown";
import ErrorBoundary from "./ErrorBoundary";
import { type DevicePreset, DEVICE_PRESETS, getDefaultPreset, getCategoryForWidth } from "@/lib/dom/device-presets";
import { useWorkspaceStore } from "@/store/workspace-store";
import { type IngestedProject, readDirectoryHandle, processDroppedFileList } from "@/lib/fs/directory-picker";
import { AlertTriangle, X, Layers, PlusSquare, PanelLeftClose, PanelLeftOpen, Sparkles, FileText, Files, Maximize2, Scaling, Eye } from "lucide-react";

const EMPTY_THEME: ThemeMap = { mode: "none", colors: [], fonts: [] };

export function serializeCleanDocument(doc: Document): string {
  const docClone = doc.cloneNode(true) as Document;

  // 1. Remove editor-only helper styles and scripts
  const helperStyle = docClone.getElementById("vse-editor-helper-styles");
  if (helperStyle) helperStyle.remove();
  const tailwindRuntime = docClone.getElementById("vse-tailwind-runtime");
  if (tailwindRuntime) tailwindRuntime.remove();

  // 2. Remove temporary editor-injected markers and attributes
  docClone.querySelectorAll("[contenteditable]").forEach((el) => {
    el.removeAttribute("contenteditable");
  });
  docClone.querySelectorAll("[data-vse-broken-handled]").forEach((el) => {
    el.removeAttribute("data-vse-broken-handled");
  });
  docClone.querySelectorAll("[data-vse-hovered], [data-vse-selected], [data-vse-drop-target], [data-vse-drag-over], [data-vse-move-token], [data-vse-viewport], [data-vse-path]").forEach((el) => {
    el.removeAttribute("data-vse-hovered");
    el.removeAttribute("data-vse-selected");
    el.removeAttribute("data-vse-drop-target");
    el.removeAttribute("data-vse-drag-over");
    el.removeAttribute("data-vse-move-token");
    el.removeAttribute("data-vse-viewport");
    el.removeAttribute("data-vse-path");
  });

  // 3. Ensure responsive stylesheet contains clean standalone media queries
  const responsiveCss = generateResponsiveCssString();
  const existingResponsiveStyle = docClone.getElementById("vse-responsive-styles");
  if (responsiveCss && responsiveCss.trim().length > 0) {
    if (existingResponsiveStyle) {
      existingResponsiveStyle.textContent = "\n" + responsiveCss.trim() + "\n";
    } else {
      const styleEl = docClone.createElement("style");
      styleEl.id = "vse-responsive-styles";
      styleEl.textContent = "\n" + responsiveCss.trim() + "\n";
      if (docClone.head) {
        docClone.head.appendChild(styleEl);
      } else if (docClone.body) {
        docClone.body.appendChild(styleEl);
      }
    }
  } else if (existingResponsiveStyle) {
    existingResponsiveStyle.remove();
  }

  // 4. Clean DOCTYPE
  const docType = docClone.doctype
    ? `<!DOCTYPE ${docClone.doctype.name || "html"}${docClone.doctype.publicId ? ` PUBLIC "${docClone.doctype.publicId}"` : ""}${docClone.doctype.systemId ? ` "${docClone.doctype.systemId}"` : ""}>\n`
    : "<!DOCTYPE html>\n";

  return docType + docClone.documentElement.outerHTML;
}

function toSaveRequestEdit(edit: EditRecord): SaveRequestEdit {
  if (edit.kind === "class") {
    return { kind: "class", structuralPath: edit.structuralPath, newClassList: edit.newClassList };
  }
  if (edit.kind === "style") {
    return {
      kind: "style",
      structuralPath: edit.structuralPath,
      styleProperty: edit.styleProperty,
      newStyleValue: edit.newStyleValue,
      viewport: edit.viewport,
    };
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
  const [exportOpen, setExportOpen] = useState(false);
  const [saveConflicts, setSaveConflicts] = useState<string[] | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [leftSidebarTab, setLeftSidebarTab] = useState<"pages" | "layers" | "primitives" | "templates">("pages");
  const [zoom, setZoom] = useState(1);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [uiPanelsVisible, setUiPanelsVisible] = useState(true);
  const [activePreset, setActivePreset] = useState<DevicePreset>(() => getDefaultPreset("desktop"));
  const [customDimensions, setCustomDimensions] = useState<{ width: number; height: number } | null>(null);
  const [dimensionsCapsulePos, setDimensionsCapsulePos] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vse_dimensions_pos");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });
  const [isDimensionsCapsuleHidden, setIsDimensionsCapsuleHidden] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vse_dimensions_hidden") === "true";
    }
    return false;
  });
  const [isDraggingCapsule, setIsDraggingCapsule] = useState(false);
  const capsuleContainerRef = useRef<HTMLDivElement | null>(null);
  const capsuleDragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const [canvasGutter, setCanvasGutter] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vse_canvas_gutter");
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 200) return parsed;
      }
    }
    return 0; // Default 0: Eliminate black space outside the canvas
  });
  const [gutterToast, setGutterToast] = useState<string | null>(null);
  const [isResizingArtboard, setIsResizingArtboard] = useState(false);
  const versionIdRef = useRef(0);
  const projectConfig = useWorkspaceStore((s) => s.projectConfig);

  // Resizable Sidebars Width State
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vse_left_panel_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 220 && parsed <= 550) return parsed;
      }
    }
    return 320;
  });

  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vse_right_panel_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 260 && parsed <= 600) return parsed;
      }
    }
    return 320;
  });

  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  function handleLeftResizeStart(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}

    setIsResizingSidebar(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    let latestWidth = leftSidebarWidth;

    function handlePointerMove(ev: PointerEvent) {
      const newW = Math.max(220, Math.min(550, ev.clientX));
      latestWidth = newW;
      setLeftSidebarWidth(newW);
    }

    function handlePointerUp(ev: PointerEvent) {
      try {
        if (handleEl.hasPointerCapture(ev.pointerId)) {
          handleEl.releasePointerCapture(ev.pointerId);
        }
      } catch {}

      setIsResizingSidebar(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem("vse_left_panel_width", latestWidth.toString());
      } catch {}

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  function handleRightResizeStart(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}

    setIsResizingSidebar(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    let latestWidth = rightSidebarWidth;

    function handlePointerMove(ev: PointerEvent) {
      const newW = Math.max(260, Math.min(600, window.innerWidth - ev.clientX));
      latestWidth = newW;
      setRightSidebarWidth(newW);
    }

    function handlePointerUp(ev: PointerEvent) {
      try {
        if (handleEl.hasPointerCapture(ev.pointerId)) {
          handleEl.releasePointerCapture(ev.pointerId);
        }
      } catch {}

      setIsResizingSidebar(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem("vse_right_panel_width", latestWidth.toString());
      } catch {}

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  function handleCapsuleDragStart(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = capsuleContainerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    capsuleDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: dimensionsCapsulePos ? dimensionsCapsulePos.x : rect.left,
      initY: dimensionsCapsulePos ? dimensionsCapsulePos.y : rect.top,
    };
    setIsDraggingCapsule(true);

    function handlePointerMove(ev: PointerEvent) {
      if (!capsuleDragStartRef.current) return;
      const dx = ev.clientX - capsuleDragStartRef.current.startX;
      const dy = ev.clientY - capsuleDragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 260, capsuleDragStartRef.current.initX + dx));
      const newY = Math.max(50, Math.min(window.innerHeight - 70, capsuleDragStartRef.current.initY + dy));
      const pos = { x: newX, y: newY };
      setDimensionsCapsulePos(pos);
      try {
        localStorage.setItem("vse_dimensions_pos", JSON.stringify(pos));
      } catch {}
    }

    function handlePointerUp() {
      setIsDraggingCapsule(false);
      capsuleDragStartRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  function handleResetCapsulePosition() {
    setDimensionsCapsulePos(null);
    try {
      localStorage.removeItem("vse_dimensions_pos");
    } catch {}
  }

  function handleToggleDimensionsCapsule() {
    setIsDimensionsCapsuleHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("vse_dimensions_hidden", String(next));
      } catch {}
      return next;
    });
  }

  const hover = useSelectionStore((s) => s.hover);
  const select = useSelectionStore((s) => s.select);
  const edits = useChangeSetStore((s) => s.edits);
  const recordEdit = useChangeSetStore((s) => s.recordEdit);
  const clearEdits = useChangeSetStore((s) => s.clear);
  const canvasMode = useSettingsStore((s) => s.canvasMode);
  const uiScale = useSettingsStore((s) => s.uiScale);
  const increaseUiScale = useSettingsStore((s) => s.increaseUiScale);
  const decreaseUiScale = useSettingsStore((s) => s.decreaseUiScale);
  const resetUiScale = useSettingsStore((s) => s.resetUiScale);

  // Auto-restore persisted workspace session on initial mount
  useEffect(() => {
    const didRestore = useWorkspaceStore.getState().loadPersistedSession();
    if (didRestore) {
      const active = useWorkspaceStore.getState().getActiveFile();
      if (active) {
        setOpenFile({
          name: active.name,
          content: active.content,
          handle: null,
        });
        setLoadToken((t) => t + 1);
        versionIdRef.current = 0;
        setVersionHistory(
          active.versionHistory || [{ id: 1, label: "Restored Session", html: active.content }]
        );
        try {
          const data = analyzeHtmlClientSide(active.content, useWorkspaceStore.getState().projectConfig);
          setTheme(data.theme);
        } catch {
          setTheme(EMPTY_THEME);
        }
        setStatusMessage(`Restored ${useWorkspaceStore.getState().files.length} pages from previous session`);
      }
    }
  }, []);

  // Save active document state on beforeunload
  useEffect(() => {
    function handleBeforeUnload() {
      const currentFileId = useWorkspaceStore.getState().activeFileId;
      if (currentFileId && iframeEl?.contentDocument) {
        const currentEdits = useChangeSetStore.getState().edits;
        if (currentEdits.length > 0) {
          const cleanHtml = serializeCleanDocument(iframeEl.contentDocument);
          useWorkspaceStore.getState().syncActiveFileState(currentFileId, {
            edits: currentEdits,
            content: cleanHtml,
          });
        }
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [iframeEl]);

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

  function handleProjectLoaded(project: IngestedProject) {
    resetSessionState();
    useWorkspaceStore.getState().resetWorkspace();

    if (project.tailwindConfig) {
      useWorkspaceStore.getState().setTailwindConfig(project.tailwindConfig);
    }
    if (project.customStyles) {
      useWorkspaceStore.getState().setCustomStyles(project.customStyles);
    }

    if (project.htmlFiles.length > 0) {
      useWorkspaceStore.getState().addFiles(project.htmlFiles);
      const firstFile = project.htmlFiles[0];
      setOpenFile({
        name: firstFile.name,
        content: firstFile.content,
        handle: firstFile.handle,
      });
      setLoadToken((t) => t + 1);
      versionIdRef.current = 0;
      setVersionHistory([{ id: nextVersionId(), label: "Original (as opened)", html: firstFile.content }]);

      try {
        const data = analyzeHtmlClientSide(firstFile.content, useWorkspaceStore.getState().projectConfig);
        setTheme(data.theme);
      } catch {
        setTheme(EMPTY_THEME);
      }
    } else {
      // Config/CSS only uploaded without HTML files: create a default starter page so user can immediately style with their theme!
      const defaultStarterHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-8">
  <div class="max-w-2xl text-center space-y-4">
    <h1 class="text-4xl font-bold">Custom Theme Workspace</h1>
    <p class="text-slate-400">Your custom Tailwind config and styles are active across the project.</p>
  </div>
</body>
</html>`;
      const id = useWorkspaceStore.getState().addFile({ name: "index.html", content: defaultStarterHtml });
      setOpenFile({ name: "index.html", content: defaultStarterHtml, handle: null });
      setLoadToken((t) => t + 1);
      versionIdRef.current = 0;
      setVersionHistory([{ id: nextVersionId(), label: "Original (as opened)", html: defaultStarterHtml }]);
      try {
        const data = analyzeHtmlClientSide(defaultStarterHtml, useWorkspaceStore.getState().projectConfig);
        setTheme(data.theme);
      } catch {
        setTheme(EMPTY_THEME);
      }
    }

    setStatusMessage(`Loaded project with ${useWorkspaceStore.getState().files.length} pages.`);
  }

  function handleFileLoaded(file: LoadedFile, warning?: string) {
    resetSessionState();
    useWorkspaceStore.getState().resetWorkspace();
    useWorkspaceStore.getState().addFile({
      name: file.name,
      content: file.content,
      handle: file.handle,
    });
    setOpenFile(file);
    setLoadToken((t) => t + 1);
    versionIdRef.current = 0;
    setVersionHistory([{ id: nextVersionId(), label: "Original (as opened)", html: file.content }]);
    if (warning) setStatusMessage(warning);

    // 100% In-Browser AST Theme Analysis
    try {
      const data = analyzeHtmlClientSide(file.content, useWorkspaceStore.getState().projectConfig);
      setTheme(data.theme);
    } catch {
      setTheme(EMPTY_THEME);
    }
  }

  function handleSwitchPage(nextFileId: string) {
    const currentFileId = useWorkspaceStore.getState().activeFileId;
    const currentFile = useWorkspaceStore.getState().files.find((f) => f.id === currentFileId);

    // 1. Flush current in-memory edits & document state to workspace store
    if (currentFileId && iframeEl?.contentDocument) {
      const currentEdits = useChangeSetStore.getState().edits;
      const undoPast = useUndoStore.getState().past;
      const undoFuture = useUndoStore.getState().future;
      const cleanHtml = serializeCleanDocument(iframeEl.contentDocument);

      useWorkspaceStore.getState().syncActiveFileState(currentFileId, {
        edits: currentEdits,
        undoPast,
        undoFuture,
        versionHistory,
        content: currentEdits.length > 0 ? cleanHtml : currentFile?.content,
      });
    }

    // 2. Switch active file in workspace store
    useWorkspaceStore.getState().switchActiveFile(nextFileId);
    const nextFile = useWorkspaceStore.getState().files.find((f) => f.id === nextFileId);
    if (!nextFile) return;

    // 3. Reset canvas selection & UI state
    setHoveredEl(null);
    setSelectedEl(null);
    setSelectedPath(null);
    setDropTargetInfo(null);
    setReviewOpen(false);
    setSaveConflicts(null);
    hover(null);
    select(null);
    clearResponsiveRegistry();

    // 4. Mount new file & restore page-specific edits
    setOpenFile({
      name: nextFile.name,
      content: nextFile.content,
      handle: nextFile.handle,
    });
    setLoadToken((t) => t + 1);

    clearEdits();
    if (nextFile.edits && nextFile.edits.length > 0) {
      for (const edit of nextFile.edits) {
        recordEdit(edit);
      }
    }

    setVersionHistory(
      nextFile.versionHistory || [{ id: nextVersionId(), label: "Original (as opened)", html: nextFile.content }]
    );

    try {
      const data = analyzeHtmlClientSide(nextFile.content, useWorkspaceStore.getState().projectConfig);
      setTheme(data.theme);
    } catch {
      setTheme(EMPTY_THEME);
    }
  }

  async function handleSaveAll() {
    const files = useWorkspaceStore.getState().files;
    const dirtyFiles = files.filter(
      (f) => f.isDirty || (f.id === useWorkspaceStore.getState().activeFileId && edits.length > 0)
    );

    if (dirtyFiles.length === 0) {
      setStatusMessage("All workspace pages are up to date.");
      return;
    }

    let savedCount = 0;
    for (const f of dirtyFiles) {
      let finalHtml = f.content;
      if (f.id === useWorkspaceStore.getState().activeFileId && iframeEl?.contentDocument) {
        finalHtml = serializeCleanDocument(iframeEl.contentDocument);
      }

      let savedInPlace = false;
      if (f.handle) {
        try {
          const permitted = await ensureWritePermission(f.handle);
          if (permitted) {
            await writeToHandle(f.handle, finalHtml);
            savedInPlace = true;
          }
        } catch {}
      }

      if (!savedInPlace) {
        downloadHtml(finalHtml, f.name);
      }

      useWorkspaceStore.getState().markFileSaved(f.id, finalHtml);
      savedCount++;
    }

    clearEdits();
    setStatusMessage(`Saved ${savedCount} workspace pages!`);
    setTimeout(() => setStatusMessage(null), 3500);
  }

  async function handleFolderPicker() {
    if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle) {
          const project = await readDirectoryHandle(dirHandle);
          if (project.htmlFiles.length > 0 || project.tailwindConfig || project.customStyles) {
            handleProjectLoaded(project);
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }
  }

  function handleFilesPicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".html,.htm,.css,.js,.cjs,.mjs,.ts,.json";
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length > 0) {
        const project = await processDroppedFileList(files);
        if (project.htmlFiles.length > 0) {
          useWorkspaceStore.getState().addFiles(project.htmlFiles);
          if (project.tailwindConfig) useWorkspaceStore.getState().setTailwindConfig(project.tailwindConfig);
          if (project.customStyles) useWorkspaceStore.getState().setCustomStyles(project.customStyles);
          setStatusMessage(`Added ${project.htmlFiles.length} pages to workspace.`);
        }
      }
    };
    input.click();
  }

  function handleChangeFile() {
    if (edits.length > 0 && !window.confirm("You have unsaved edits that will be lost. Drop a different file anyway?")) {
      return;
    }
    useWorkspaceStore.getState().resetWorkspace();
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

  function handleBatchEdit(records: EditRecord[]) {
    if (records.length === 0) return;
    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    for (const r of records) {
      recordEdit(r);
    }
  }

  function handleDeleteElement(el: Element) {
    const tagName = el.tagName.toLowerCase();
    if (tagName === "body" || tagName === "html") return;
    const path = computeStructuralPath(el, domAdapter);
    const parent = el.parentElement;
    const parentPath = parent ? computeStructuralPath(parent, domAdapter) : undefined;
    const siblingIndex = parent ? Array.from(parent.children).indexOf(el) : undefined;
    const serializedHtml = (el as HTMLElement).outerHTML;

    // Selection transition:
    // 1. Next sibling if exists
    // 2. Previous sibling if next does not exist
    // 3. Parent element if no siblings exist (and parent !== body && parent !== html)
    // 4. Deselected if deleting root
    const nextSibling = el.nextElementSibling;
    const prevSibling = el.previousElementSibling;
    let nextTarget: Element | null = null;
    if (nextSibling) {
      nextTarget = nextSibling;
    } else if (prevSibling) {
      nextTarget = prevSibling;
    } else if (parent && parent.tagName.toLowerCase() !== "body" && parent.tagName.toLowerCase() !== "html") {
      nextTarget = parent;
    }

    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "delete",
      structuralPath: path,
      parentPath,
      siblingIndex,
      serializedHtml,
      timestamp: new Date().toISOString(),
    });
    el.remove();

    if (nextTarget && nextTarget.isConnected) {
      setSelectedEl(nextTarget);
      const nextPath = computeStructuralPath(nextTarget, domAdapter);
      setSelectedPath(nextPath);
      select(nextPath);
    } else {
      setSelectedEl(null);
      setSelectedPath(null);
      select(null);
    }

    setStatusMessage(`Deleted <${tagName}>`);
    setTimeout(() => setStatusMessage(null), 2500);
  }

  function handleDuplicateElement(el: Element) {
    const tagName = el.tagName.toLowerCase();
    if (tagName === "body" || tagName === "html") return;
    const path = computeStructuralPath(el, domAdapter);
    const parent = el.parentElement;
    const parentPath = parent ? computeStructuralPath(parent, domAdapter) : undefined;
    const siblingIndex = parent ? Array.from(parent.children).indexOf(el) + 1 : undefined;

    const doc = el.ownerDocument;
    const existingDocIds = new Set<string>();
    doc.querySelectorAll("[id]").forEach((node) => {
      if (node.id) existingDocIds.add(node.id);
    });

    const clone = el.cloneNode(true) as Element;
    if (clone.id) {
      clone.id = generateUniqueId(clone.id, existingDocIds);
    }
    clone.querySelectorAll("[id]").forEach((child) => {
      if (child.id) {
        child.id = generateUniqueId(child.id, existingDocIds);
      }
    });

    el.after(clone);
    const duplicatePath = computeStructuralPath(clone, domAdapter);

    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "duplicate",
      structuralPath: path,
      parentPath,
      siblingIndex,
      duplicateId: clone.id || undefined,
      duplicatePath,
      timestamp: new Date().toISOString(),
    });

    handleSelectElement(clone);
    setStatusMessage(`Duplicated <${tagName}>`);
    setTimeout(() => setStatusMessage(null), 2500);
  }

  function handleMoveUp(el: Element) {
    const prev = el.previousElementSibling;
    if (!prev) return;
    handleMoveElement(el, prev, "before");
  }

  function handleMoveDown(el: Element) {
    const next = el.nextElementSibling;
    if (!next) return;
    handleMoveElement(el, next, "after");
  }

  function handleWrapWithDiv(el: Element) {
    const tagName = el.tagName.toLowerCase();
    if (tagName === "body" || tagName === "html") return;
    const parent = el.parentElement;
    if (!parent) return;

    const path = computeStructuralPath(el, domAdapter);
    const doc = el.ownerDocument || document;
    const wrapper = doc.createElement("div");
    wrapper.className = "flex flex-col";

    parent.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "insert",
      structuralPath: path,
      position: "before",
      snippet: `<div class="flex flex-col">${(el as HTMLElement).outerHTML}</div>`,
      timestamp: new Date().toISOString(),
    });

    handleSelectElement(wrapper);
    setStatusMessage(`Wrapped <${tagName}> in Auto-Div container (flex-col)`);
    setTimeout(() => setStatusMessage(null), 2500);
  }

  function handleMoveElement(sourceEl: Element, targetEl: Element, position: "before" | "after" | "inside") {
    const tagName = sourceEl.tagName.toLowerCase();
    const targetTag = targetEl.tagName.toLowerCase();
    if (tagName === "body" || tagName === "html") return;

    const sourcePath = computeStructuralPath(sourceEl, domAdapter);
    const targetPath = computeStructuralPath(targetEl, domAdapter);

    const oldParent = sourceEl.parentElement;
    const oldParentPath = oldParent ? computeStructuralPath(oldParent, domAdapter) : undefined;
    const oldSiblingIndex = oldParent ? Array.from(oldParent.children).indexOf(sourceEl) : undefined;

    let moveToken = sourceEl.getAttribute("data-vse-move-token");
    if (!moveToken) {
      moveToken = `move-elem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      sourceEl.setAttribute("data-vse-move-token", moveToken);
    }

    if (position === "inside") {
      targetEl.appendChild(sourceEl);
    } else if (position === "before") {
      targetEl.parentElement?.insertBefore(sourceEl, targetEl);
    } else {
      targetEl.parentElement?.insertBefore(sourceEl, targetEl.nextSibling);
    }

    const newParent = sourceEl.parentElement;
    const newParentPath = newParent ? computeStructuralPath(newParent, domAdapter) : undefined;
    const newSiblingIndex = newParent ? Array.from(newParent.children).indexOf(sourceEl) : undefined;
    const newPath = computeStructuralPath(sourceEl, domAdapter);

    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "move",
      structuralPath: sourcePath,
      targetPath: targetPath,
      position,
      oldParentPath,
      oldSiblingIndex,
      newParentPath,
      newSiblingIndex,
      newPath,
      moveToken,
      elementId: sourceEl.id || undefined,
      timestamp: new Date().toISOString(),
    });

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
    const temp = doc.createElement("div");
    temp.innerHTML = snippet;
    const newChild = temp.firstElementChild;
    if (!newChild) return;

    if (position === "inside") {
      target.appendChild(newChild);
    } else if (position === "before" && target.parentElement && target.tagName.toLowerCase() !== "body") {
      target.parentElement.insertBefore(newChild, target);
    } else if (position === "after" && target.parentElement && target.tagName.toLowerCase() !== "body") {
      target.parentElement.insertBefore(newChild, target.nextSibling);
    } else {
      doc.body.appendChild(newChild);
    }

    const insertedPath = computeStructuralPath(newChild, domAdapter);
    const parentEl = newChild.parentElement;
    const parentPath = parentEl ? computeStructuralPath(parentEl, domAdapter) : undefined;
    const siblingIndex = parentEl ? Array.from(parentEl.children).indexOf(newChild) : undefined;

    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "insert",
      structuralPath: path,
      position,
      snippet,
      insertedPath,
      parentPath,
      siblingIndex,
      timestamp: new Date().toISOString(),
    });

    handleSelectElement(newChild);
    setStatusMessage(`Added <${newChild.tagName.toLowerCase()}> into <${target.tagName.toLowerCase()}>`);
    setTimeout(() => setStatusMessage(null), 2500);
  }

  function handleDirectTextEdit(el: Element, oldText: string, newText: string) {
    const path = computeStructuralPath(el, domAdapter);
    useUndoStore.getState().pushHistory(useChangeSetStore.getState().edits);
    recordEdit({
      kind: "text",
      structuralPath: path,
      property: "text-content",
      oldText,
      newText,
      timestamp: new Date().toISOString(),
    });
    setStatusMessage("Text updated");
    setTimeout(() => setStatusMessage(null), 2000);
  }

  function handleDiscardAll() {
    setSelectedEl(null);
    setSelectedPath(null);
    select(null);
    setLoadToken((t) => t + 1);
    setStatusMessage("All changes discarded");
    setTimeout(() => setStatusMessage(null), 2500);
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

  function getCurrentExportHtml(): string {
    if (!openFile) {
      if (iframeEl?.contentDocument) {
        try {
          const clean = serializeCleanDocument(iframeEl.contentDocument);
          if (clean && clean.trim().length > 0) return clean;
        } catch {}
      }
      return "";
    }

    const responsiveCss = generateResponsiveCssString();

    // 1. Prioritize pristine AST Splicing whenever edits or responsive styles exist and can be cleanly applied
    if (edits.length > 0 || (responsiveCss && responsiveCss.trim().length > 0)) {
      const saveEdits = edits.map(toSaveRequestEdit);
      const res = applyEditsClientSide(openFile.content, saveEdits, {
        responsiveCss,
      });
      if (res.ok && res.html && (!res.conflicts || res.conflicts.length === 0)) {
        return res.html;
      }
    } else {
      // Zero edits made - return original pristine source directly
      return openFile.content;
    }

    // 2. Fallback to clean serialized DOM if AST splicing encountered conflicts
    if (iframeEl?.contentDocument) {
      try {
        const clean = serializeCleanDocument(iframeEl.contentDocument);
        if (clean && clean.trim().length > 0) {
          return clean;
        }
      } catch {}
    }

    return openFile.content;
  }

  async function handleCopyCode() {
    if (!openFile) return;
    const code = getCurrentExportHtml();
    try {
      await navigator.clipboard.writeText(code);
      setStatusMessage("HTML copied to clipboard!");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {}
  }

  async function handleCopyJsx() {
    if (!openFile) return;
    const code = getCurrentExportHtml();
    const cleanName = openFile.name.replace(/\.html?$/i, "").replace(/[^a-zA-Z0-9]/g, "_");
    const compName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || "ExportedComponent";
    const jsxCode = exportAsReactComponent(code, { componentName: compName, typescript: true });
    try {
      await navigator.clipboard.writeText(jsxCode);
      setStatusMessage("React JSX / TSX copied to clipboard!");
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

    let updatedHtml = "";

    // 1. Prioritize pristine AST Splicing whenever edits exist
    if (edits.length > 0) {
      const saveEdits = edits.map(toSaveRequestEdit);
      const result = applyEditsClientSide(openFile.content, saveEdits);
      if (result.ok && result.html && (!result.conflicts || result.conflicts.length === 0)) {
        updatedHtml = result.html;
      }
    } else {
      // Zero edits made - preserve pristine original content
      updatedHtml = openFile.content;
    }

    // 2. Fallback to clean serialized DOM if AST splicing encountered unresolved conflicts
    if (!updatedHtml && iframeEl?.contentDocument) {
      try {
        updatedHtml = serializeCleanDocument(iframeEl.contentDocument);
      } catch {}
    }

    if (!updatedHtml) {
      updatedHtml = openFile.content;
    }

    setSaveConflicts(null);
    const preSaveHtml = openFile.content;
    setVersionHistory((prev) => [...prev, { id: nextVersionId(), label: buildPreSaveLabel(), html: preSaveHtml }]);
    clearEdits();
    useUndoStore.getState().reset();
    setReviewOpen(false);
    persistUpdatedHtml(openFile, updatedHtml);
  }

  // Keyboard Shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z / Delete / Duplicate / Escape / ? / Ctrl++ / Ctrl+-)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const targetEl = e.target instanceof HTMLElement ? e.target : (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      const isTyping = Boolean(
        targetEl && (
          targetEl.tagName === "INPUT" ||
          targetEl.tagName === "TEXTAREA" ||
          targetEl.tagName === "SELECT" ||
          targetEl.isContentEditable === true ||
          (typeof targetEl.getAttribute === "function" && targetEl.getAttribute("contenteditable") === "true")
        )
      );

      if (e.key === "Escape") {
        if (isTyping && targetEl && "blur" in targetEl) {
          targetEl.blur();
          return;
        }
        if (exportOpen) {
          setExportOpen(false);
          return;
        }
        if (configModalOpen) {
          setConfigModalOpen(false);
          return;
        }
        if (reviewOpen) {
          setReviewOpen(false);
          return;
        }
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (historyOpen) {
          setHistoryOpen(false);
          return;
        }
        setSelectedEl(null);
        setSelectedPath(null);
        select(null);
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

      // Toggle UI Panels via Ctrl + \ (or Cmd + \)
      if (isModifier && (e.key === "\\" || e.code === "Backslash") && !isTyping) {
        e.preventDefault();
        setUiPanelsVisible((v) => !v);
        return;
      }

      // Keyboard Shortcuts popup via Ctrl + K (or Cmd + K)
      if (isModifier && e.key.toLowerCase() === "k" && !isTyping) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }

      if (isModifier && e.key.toLowerCase() === "d" && !isTyping && selectedEl) {
        e.preventDefault();
        handleDuplicateElement(selectedEl);
        return;
      }

      // Group in Auto-Div container via Ctrl + G (or Cmd + G)
      if (isModifier && e.key.toLowerCase() === "g" && !isTyping && selectedEl) {
        e.preventDefault();
        handleWrapWithDiv(selectedEl);
        return;
      }

      if (isModifier && !isTyping) {
        // UI Scaling via Ctrl + + / Ctrl + - / Ctrl + 0
        if (e.key === "+" || e.key === "=" || e.key === "NumpadAdd") {
          e.preventDefault();
          increaseUiScale();
          return;
        }
        if (e.key === "-" || e.key === "_" || e.key === "NumpadSubtract") {
          e.preventDefault();
          decreaseUiScale();
          return;
        }
        if (e.key === "0" || e.key === "Numpad0") {
          e.preventDefault();
          resetUiScale();
          return;
        }
      }

      if (!isModifier || isTyping) return;

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
  }, [iframeEl, selectedEl, increaseUiScale, decreaseUiScale, resetUiScale]);

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
        doc.documentElement.setAttribute("data-vse-viewport", mode === "all" ? "desktop" : mode);
      }
      syncResponsiveStylesheet(doc);
    }
    setViewport(mode);
    if (mode !== "all") {
      setActivePreset(getDefaultPreset(mode));
      setCustomDimensions(null);
    }
  }

  function handleSelectPreset(preset: DevicePreset) {
    setActivePreset(preset);
    setCustomDimensions(null);
    if (viewport !== preset.category && viewport !== "all") {
      handleViewportChange(preset.category);
    }
  }

  function handleApplyCustomDimensions(width: number, height: number) {
    setCustomDimensions({ width, height });
    const cat = getCategoryForWidth(width);
    if (viewport !== cat && viewport !== "all") {
      handleViewportChange(cat);
    }
  }

  function handlePresetCategoryChange(cat: "desktop" | "tablet" | "mobile") {
    handleViewportChange(cat);
  }

  // Effective viewport for the property panel: in "all" mode, default to "desktop" editing
  const [activeEditViewport, setActiveEditViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Canvas pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // The viewport the property panel should use
  const effectiveCategory = customDimensions
    ? getCategoryForWidth(customDimensions.width)
    : viewport === "all"
    ? activeEditViewport
    : (viewport as "desktop" | "tablet" | "mobile");

  const propertyViewport = effectiveCategory;

  const isDesktop = effectiveCategory === "desktop";

  const currentWidth = customDimensions
    ? customDimensions.width
    : activePreset && activePreset.width > 0
    ? activePreset.width
    : viewport === "tablet"
    ? 768
    : viewport === "mobile"
    ? 390
    : 1440;

  const currentHeight = customDimensions
    ? customDimensions.height
    : activePreset && activePreset.height > 0
    ? activePreset.height
    : viewport === "tablet"
    ? 1024
    : viewport === "mobile"
    ? 844
    : 900;

  // Ctrl+Scroll Canvas Zoom handler & Ctrl+Shift+Scroll Empty Space (Gutter) handler
  useEffect(() => {
    let toastTimer: ReturnType<typeof setTimeout> | null = null;

    function handleWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        if (e.shiftKey) {
          // Ctrl + Shift + Scroll: Adjust black empty space around the canvas
          const deltaGutter = e.deltaY > 0 ? 8 : -8;
          setCanvasGutter((prev) => {
            const next = Math.max(0, Math.min(160, prev + deltaGutter));
            try {
              localStorage.setItem("vse_canvas_gutter", next.toString());
            } catch {}
            setGutterToast(next === 0 ? "Empty Space: 0px (Flush Edge-to-Edge)" : `Empty Space: ${next}px`);
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(() => setGutterToast(null), 1500);
            return next;
          });
        } else {
          // Ctrl + Scroll: Zoom canvas workspace in / out
          const delta = e.deltaY > 0 ? -0.05 : 0.05;
          setZoom((z) => Math.min(Math.max(Number((z + delta).toFixed(2)), 0.25), 3));
        }
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    const iframeDoc = iframeEl?.contentDocument;
    const iframeWin = iframeEl?.contentWindow;
    iframeDoc?.addEventListener("wheel", handleWheel, { passive: false });
    iframeWin?.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      if (toastTimer) clearTimeout(toastTimer);
      window.removeEventListener("wheel", handleWheel);
      iframeDoc?.removeEventListener("wheel", handleWheel);
      iframeWin?.removeEventListener("wheel", handleWheel);
    };
  }, [iframeEl]);

  // Interactive Artboard Drag-to-Resize Handler
  function handleArtboardResizeStart(
    e: React.PointerEvent<HTMLDivElement>,
    direction: "width" | "height" | "corner"
  ) {
    e.preventDefault();
    e.stopPropagation();
    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}

    setIsResizingArtboard(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = currentWidth;
    const startH = currentHeight;
    const currentZoom = zoom;
    const currentUiScale = uiScale;

    document.body.style.cursor =
      direction === "width" ? "ew-resize" : direction === "height" ? "ns-resize" : "nwse-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(ev: PointerEvent) {
      const dx = (ev.clientX - startX) / (currentZoom * currentUiScale);
      const dy = (ev.clientY - startY) / (currentZoom * currentUiScale);

      let newW = startW;
      let newH = startH;

      if (direction === "width" || direction === "corner") {
        newW = Math.max(320, Math.min(3840, Math.round(startW + dx)));
      }
      if (direction === "height" || direction === "corner") {
        newH = Math.max(300, Math.min(3840, Math.round(startH + dy)));
      }

      setCustomDimensions({ width: newW, height: newH });
      const cat = getCategoryForWidth(newW);
      if (viewport !== cat && viewport !== "all") {
        setViewport(cat);
      }
    }

    function handlePointerUp(ev: PointerEvent) {
      try {
        if (handleEl.hasPointerCapture(ev.pointerId)) {
          handleEl.releasePointerCapture(ev.pointerId);
        }
      } catch {}
      setIsResizingArtboard(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  // Middle-click / Space+drag pan handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function handleDown(e: PointerEvent) {
      if (e.button === 1 || (e.button === 0 && e.target === canvas)) {
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
        canvas!.setPointerCapture(e.pointerId);
      }
    }
    function handleMove(e: PointerEvent) {
      if (!isPanningRef.current) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({ x: panStartRef.current.ox + dx, y: panStartRef.current.oy + dy });
    }
    function handleUp() {
      isPanningRef.current = false;
    }
    canvas.addEventListener("pointerdown", handleDown);
    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("pointerup", handleUp);
    return () => {
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleUp);
    };
  }, [panOffset]);

  // Synchronize active viewport mode with the preview iframe document element for live style isolation
  useEffect(() => {
    if (!iframeEl || !iframeEl.contentDocument) return;
    const doc = iframeEl.contentDocument;
    if (doc.documentElement) {
      // In "all" mode, set viewport to "desktop" on the base iframe
      doc.documentElement.setAttribute("data-vse-viewport", viewport === "all" ? "desktop" : viewport);
    }
    syncResponsiveStylesheet(doc);
  }, [viewport, iframeEl]);

  return (
    <div
      style={{
        zoom: uiScale,
        width: uiScale === 1 ? "100vw" : `${(100 / uiScale).toFixed(3)}vw`,
        height: uiScale === 1 ? "100vh" : `${(100 / uiScale).toFixed(3)}vh`,
      }}
      className="flex flex-col bg-slate-100 dark:bg-[#090909] text-slate-900 dark:text-white overflow-hidden font-sans transition-colors"
    >
      <Toolbar
        fileName={openFile?.name ?? null}
        viewport={viewport}
        onViewportChange={handleViewportChange}
        onChangeFile={handleChangeFile}
        onOpenProjectConfig={() => setConfigModalOpen(true)}
        onSaveAll={handleSaveAll}
        onSwitchPage={handleSwitchPage}
        statusMessage={statusMessage}
        historyCount={versionHistory.length}
        onToggleHistory={() => setHistoryOpen((o) => !o)}
        onOpenReview={() => setReviewOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onCopyCode={handleCopyCode}
        onCopyJsx={handleCopyJsx}
        iframeDocument={iframeEl?.contentDocument ?? null}
        leftSidebarOpen={leftSidebarOpen}
        onToggleLeftSidebar={() => setLeftSidebarOpen((o) => !o)}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(Number((z + 0.1).toFixed(2)), 2))}
        onZoomOut={() => setZoom((z) => Math.max(Number((z - 0.1).toFixed(2)), 0.25))}
        onZoomReset={() => setZoom(1)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        isDimensionsHUDHidden={isDimensionsCapsuleHidden}
        onToggleDimensionsHUD={handleToggleDimensionsCapsule}
      />

      <div className="flex flex-1 min-h-0 relative">
        {/* Left Sidebar: Pages, Layers Tree & Component Blocks */}
        {openFile && leftSidebarOpen && uiPanelsVisible && (
          <aside
            style={{ width: `${leftSidebarWidth}px` }}
            className="border-r border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] flex flex-col shrink-0 z-20 overflow-hidden shadow-2xl animate-in slide-in-from-left-4 duration-200 relative"
          >
            {/* Tab Header */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#090909] gap-1">
              <div className="flex-1 grid grid-cols-4 gap-0.5 bg-slate-200/70 dark:bg-[#141414] p-0.5 rounded-lg border border-slate-300/60 dark:border-[#262626]">
                <button
                  type="button"
                  onClick={() => setLeftSidebarTab("pages")}
                  aria-label="Pages tab"
                  className={`py-1 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                    leftSidebarTab === "pages"
                      ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] dark:text-white shadow-2xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                  title="Pages (Multi-page workspace)"
                >
                  <Files className="w-3 h-3 shrink-0" />
                  <span className="truncate">Pages</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeftSidebarTab("layers")}
                  aria-label="Layers Tree tab"
                  className={`py-1 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                    leftSidebarTab === "layers"
                      ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] dark:text-white shadow-2xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                  title="Layers (DOM Tree)"
                >
                  <Layers className="w-3 h-3 shrink-0" />
                  <span className="truncate">Layers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeftSidebarTab("primitives")}
                  aria-label="Primitives tab"
                  className={`py-1 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                    leftSidebarTab === "primitives"
                      ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] dark:text-white shadow-2xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                  title="Primitives (HTML elements)"
                >
                  <PlusSquare className="w-3 h-3 shrink-0" />
                  <span className="truncate">Prims</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeftSidebarTab("templates")}
                  aria-label="Templates tab"
                  className={`py-1 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                    leftSidebarTab === "templates"
                      ? "bg-white dark:bg-[#1c1c1c] text-[#0099ff] dark:text-white shadow-2xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                  title="Templates (UI Component Blocks)"
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span className="truncate">Blocks</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLeftSidebarOpen(false)}
                aria-label="Collapse sidebar"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-200 dark:hover:bg-[#1c1c1c] cursor-pointer transition-colors shrink-0"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Body */}
            <ErrorBoundary>
              {leftSidebarTab === "pages" ? (
                <PagesPanel
                  onSwitchPage={handleSwitchPage}
                  onOpenFolderPicker={handleFolderPicker}
                  onOpenFilesPicker={handleFilesPicker}
                />
              ) : leftSidebarTab === "layers" ? (
                <LayersTree
                  iframeDocument={iframeEl?.contentDocument ?? null}
                  selectedElement={selectedEl}
                  onSelectElement={handleSelectElement}
                  onHoverElement={handleHoverElement}
                  onDeleteElement={handleDeleteElement}
                  onDuplicateElement={handleDuplicateElement}
                  onMoveElement={handleMoveElement}
                  onWrapWithDiv={handleWrapWithDiv}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ) : leftSidebarTab === "primitives" ? (
                <BasicComponents
                  onInsert={handleInsertPrimitive}
                  selectedElement={selectedEl}
                />
              ) : (
                <ComponentBlocks onInsertBlock={handleInsertBlock} />
              )}
            </ErrorBoundary>
          </aside>
        )}

        {/* Left Sidebar Drag Resize Handle */}
        {openFile && leftSidebarOpen && uiPanelsVisible && (
          <div
            onPointerDown={handleLeftResizeStart}
            className="w-1.5 hover:w-2.5 bg-transparent hover:bg-[#0099ff]/40 active:bg-[#0099ff] cursor-col-resize z-30 transition-colors group shrink-0 relative flex items-center justify-center -ml-1 select-none touch-none"
            title="Drag to resize left panel"
          >
            <div className="w-0.5 h-10 bg-slate-300 dark:bg-[#333333] group-hover:bg-[#0099ff] rounded-full transition-colors" />
          </div>
        )}

        {/* Main Canvas Area + Breadcrumbs */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Floating Sidebar Re-open Pill */}
          {openFile && !leftSidebarOpen && uiPanelsVisible && (
            <button
              type="button"
              onClick={() => setLeftSidebarOpen(true)}
              aria-label="Open left navigator"
              className="absolute left-3 top-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border border-slate-200 dark:border-[#333] text-slate-700 dark:text-zinc-200 text-xs font-medium shadow-lg hover:border-[#0099ff] hover:text-[#0099ff] transition-all cursor-pointer select-none"
              title="Open Navigator & Layers"
            >
              <PanelLeftOpen className="w-3.5 h-3.5 text-[#0099ff]" />
              <span>Navigator</span>
            </button>
          )}

          <div
            ref={canvasRef}
            className="flex-1 relative flex items-center justify-center canvas-dot-grid overflow-auto transition-all duration-150"
            style={{
              padding: `${canvasGutter}px`,
              cursor: isPanningRef.current ? "grabbing" : undefined,
            }}
          >
            {openFile ? (
              <div
                style={{
                  transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                  transformOrigin: "center center",
                }}
                className="w-full h-full flex items-center justify-center"
              >
                {viewport === "all" ? (
                  /* ========== Multi-Viewport: 3 Artboards Side-by-Side ========== */
                  <div className="flex items-start gap-8 px-4">
                    {(["desktop", "tablet", "mobile"] as const).map((vp) => {
                      const vpWidth = vp === "desktop" ? "1200px" : vp === "tablet" ? "768px" : "375px";
                      const vpLabel = vp === "desktop" ? "Desktop" : vp === "tablet" ? "Tablet" : "Phone";
                      const vpDims = vp === "desktop" ? "1200 × ∞" : vp === "tablet" ? "768 × 1024" : "375 × 812";
                      const vpColor = vp === "desktop" ? "text-[#0099ff]" : vp === "tablet" ? "text-amber-400" : "text-emerald-400";
                      const vpBorderColor = activeEditViewport === vp ? "border-[#0099ff] ring-1 ring-[#0099ff]/30 shadow-2xl" : "border-slate-200 dark:border-[#262626]";
                      const maxH = vp === "desktop" ? "max-h-[80vh]" : vp === "tablet" ? "max-h-[1024px]" : "max-h-[812px]";

                      return (
                        <div key={vp} className="flex flex-col items-center shrink-0">
                          {/* Artboard Header */}
                          <button
                            type="button"
                            onClick={() => setActiveEditViewport(vp)}
                            aria-label={`Select ${vpLabel} viewport for editing`}
                            className={`mb-2 px-3 py-1 rounded-full border text-[11px] font-mono flex items-center gap-1.5 shadow-2xs select-none cursor-pointer transition-all ${
                              activeEditViewport === vp
                                ? "bg-white dark:bg-[#1c1c1c] border-[#0099ff] text-slate-900 dark:text-white font-semibold shadow-md"
                                : "bg-white/80 dark:bg-[#141414]/80 border-slate-200 dark:border-[#262626] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                            }`}
                          >
                            <span className={`font-semibold ${vpColor}`}>▶</span>
                            <span>{vpLabel}</span>
                            <span className="text-slate-400 dark:text-zinc-600">•</span>
                            <span className={vpColor}>{vpDims}</span>
                          </button>

                          {/* Artboard Frame */}
                          <div
                            className={`bg-white relative shadow-2xl flex flex-col border-2 rounded-xl overflow-hidden transition-all ${vpBorderColor} ${maxH}`}
                            style={{ width: vpWidth, height: vp === "desktop" ? "calc(100vh - 12rem)" : vp === "tablet" ? "calc(100vh - 12rem)" : "calc(100vh - 12rem)" }}
                          >
                            <div className="flex-1 w-full h-full relative overflow-hidden">
                              <PreviewFrame
                                key={`${loadToken}-${vp}`}
                                html={openFile.content}
                                customCss={projectConfig.customStyles?.rawContent}
                                onIframeReady={(iframe) => {
                                  if (vp === "desktop") setIframeEl(iframe);
                                  if (iframe?.contentDocument?.documentElement) {
                                    iframe.contentDocument.documentElement.setAttribute("data-vse-viewport", vp);
                                    syncResponsiveStylesheet(iframe.contentDocument);
                                  }
                                }}
                                onHoverElement={handleHoverElement}
                                onSelectElement={(el) => {
                                  setActiveEditViewport(vp);
                                  handleSelectElement(el);
                                }}
                                onDragOverTarget={setDropTargetInfo}
                                onDropOnTarget={handleDropOnTarget}
                                onMoveLayerOnTarget={handleMoveElement}
                                onTextEdit={handleDirectTextEdit}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ========== Single Viewport ========== */
                  <div className="w-full h-full flex items-center justify-center relative">
                    {/* Ephemeral Canvas Gutter / Empty Space Toast */}
                    {gutterToast && (
                      <div className="absolute top-3 right-4 z-40 px-3 py-1.5 rounded-full bg-slate-900/95 dark:bg-[#1c1c1c]/95 text-white text-xs font-mono font-medium shadow-2xl border border-white/20 backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in-95 pointer-events-none">
                        <Maximize2 className="w-3.5 h-3.5 text-[#0099ff]" />
                        <span>{gutterToast}</span>
                      </div>
                    )}

                    {/* Live Artboard Resizing Dimensions Pill */}
                    {isResizingArtboard && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full bg-slate-900/95 dark:bg-[#1c1c1c]/95 text-white text-xs font-mono font-semibold shadow-2xl border border-[#0099ff]/50 backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in-95 pointer-events-none">
                        <Scaling className="w-3.5 h-3.5 text-[#0099ff]" />
                        <span>{currentWidth} × {currentHeight} px</span>
                      </div>
                    )}

                    {/* Floating Device Preset HUD Capsule */}
                    {!isDimensionsCapsuleHidden ? (
                      <div
                        ref={capsuleContainerRef}
                        style={
                          dimensionsCapsulePos
                            ? {
                                position: "fixed",
                                left: `${dimensionsCapsulePos.x}px`,
                                top: `${dimensionsCapsulePos.y}px`,
                                zIndex: 40,
                              }
                            : undefined
                        }
                        className={
                          dimensionsCapsulePos
                            ? "pointer-events-auto select-none"
                            : "absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
                        }
                      >
                        <DevicePresetDropdown
                          category={effectiveCategory}
                          activePreset={activePreset}
                          customDimensions={customDimensions}
                          onSelectPreset={handleSelectPreset}
                          onApplyCustomDimensions={handleApplyCustomDimensions}
                          onCategoryChange={handlePresetCategoryChange}
                          onHide={handleToggleDimensionsCapsule}
                          onDragStart={handleCapsuleDragStart}
                          onResetPosition={handleResetCapsulePosition}
                          isCustomPosition={dimensionsCapsulePos !== null}
                        />
                      </div>
                    ) : (
                      /* Mini floating restore button when hidden */
                      <button
                        type="button"
                        onClick={handleToggleDimensionsCapsule}
                        title="Show Dimensions Dropdown"
                        aria-label="Show Dimensions Dropdown"
                        className="absolute top-3 right-4 z-30 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#141414]/95 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] border border-slate-200 dark:border-[#262626] text-[11px] font-mono text-slate-700 dark:text-zinc-300 shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer group hover:border-[#0099ff]/50 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0099ff]" />
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">Dimensions</span>
                      </button>
                    )}

                    {isDesktop && !customDimensions && (activePreset?.width === 0 || activePreset?.id === "desktop-fill") ? (
                      /* Desktop Fluid (Fill 100%): Seamless edge-to-edge canvas with zero wasted border */
                      <div
                        style={{
                          transform: "translateZ(0)",
                          willChange: "transform",
                          contain: "layout paint",
                        }}
                        className="w-full h-full bg-white relative flex flex-col overflow-hidden rounded-none border-0 shadow-none"
                      >
                        <div className="flex-1 w-full h-full relative overflow-hidden">
                          <PreviewFrame
                            key={loadToken}
                            html={openFile.content}
                            customCss={projectConfig.customStyles?.rawContent}
                            onIframeReady={setIframeEl}
                            onHoverElement={handleHoverElement}
                            onSelectElement={handleSelectElement}
                            onDragOverTarget={setDropTargetInfo}
                            onDropOnTarget={handleDropOnTarget}
                            onMoveLayerOnTarget={handleMoveElement}
                            onTextEdit={handleDirectTextEdit}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Resizable Artboard (Desktop Preset, Tablet, Mobile, or Custom Resized) */
                      <div
                        style={{
                          width: `${currentWidth}px`,
                          height: `${currentHeight}px`,
                          transform: "translateZ(0)",
                          willChange: "transform",
                          contain: "layout paint",
                        }}
                        className={`bg-white relative flex flex-col shadow-2xl transition-all ${
                          isResizingArtboard ? "transition-none" : "duration-200"
                        } ${
                          effectiveCategory === "desktop"
                            ? "rounded-xl border border-slate-200/80 dark:border-[#262626] overflow-hidden shrink-0"
                            : effectiveCategory === "tablet"
                            ? "rounded-2xl border-[8px] border-slate-900 dark:border-[#1c1c1c] overflow-hidden shrink-0"
                            : "rounded-[2.5rem] border-[10px] border-slate-900 dark:border-[#1c1c1c] overflow-hidden shrink-0"
                        }`}
                      >
                        {/* Phone Notch/Speaker */}
                        {effectiveCategory === "mobile" && (
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
                            customCss={projectConfig.customStyles?.rawContent}
                            onIframeReady={setIframeEl}
                            onHoverElement={handleHoverElement}
                            onSelectElement={handleSelectElement}
                            onDragOverTarget={setDropTargetInfo}
                            onDropOnTarget={handleDropOnTarget}
                            onMoveLayerOnTarget={handleMoveElement}
                            onTextEdit={handleDirectTextEdit}
                          />
                        </div>

                        {/* Phone Home Bar */}
                        {effectiveCategory === "mobile" && (
                          <div className="w-full bg-white py-1 flex justify-center z-10 shrink-0">
                            <div className="w-28 h-1 bg-black/40 rounded-full"></div>
                          </div>
                        )}

                        {/* Interactive Drag-to-Resize Handles on Artboard Frame */}
                        {/* Right Drag Handle (Width) */}
                        <div
                          onPointerDown={(e) => handleArtboardResizeStart(e, "width")}
                          className="absolute -right-3 top-0 bottom-0 w-6 flex items-center justify-center cursor-ew-resize z-30 group select-none touch-none"
                          title="Drag to resize artboard width (Double click for fluid 100%)"
                          onDoubleClick={() => {
                            setActivePreset(DEVICE_PRESETS.find((p) => p.id === "desktop-fill") || activePreset);
                            setCustomDimensions(null);
                          }}
                        >
                          <div className="w-1.5 h-12 rounded-full bg-slate-400/40 dark:bg-zinc-600/40 group-hover:bg-[#0099ff] group-active:bg-[#0099ff] transition-colors shadow-sm flex items-center justify-center">
                            <div className="w-0.5 h-6 bg-white/70 rounded-full" />
                          </div>
                        </div>

                        {/* Bottom Drag Handle (Height) */}
                        <div
                          onPointerDown={(e) => handleArtboardResizeStart(e, "height")}
                          className="absolute left-0 right-0 -bottom-3 h-6 flex items-center justify-center cursor-ns-resize z-30 group select-none touch-none"
                          title="Drag to resize artboard height"
                        >
                          <div className="h-1.5 w-12 rounded-full bg-slate-400/40 dark:bg-zinc-600/40 group-hover:bg-[#0099ff] group-active:bg-[#0099ff] transition-colors shadow-sm flex items-center justify-center">
                            <div className="h-0.5 w-6 bg-white/70 rounded-full" />
                          </div>
                        </div>

                        {/* Bottom-Right Corner Drag Handle (Width + Height) */}
                        <div
                          onPointerDown={(e) => handleArtboardResizeStart(e, "corner")}
                          className="absolute -right-3 -bottom-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-30 group select-none touch-none"
                          title="Drag to resize width & height"
                        >
                          <div className="w-3.5 h-3.5 rounded-sm border-r-2 border-b-2 border-slate-400/60 dark:border-zinc-500/60 group-hover:border-[#0099ff] group-active:border-[#0099ff] transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <DropZone onFileLoaded={handleFileLoaded} onProjectLoaded={handleProjectLoaded} />
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

        {/* Highlight & Drop Overlay with Contextual Action HUD */}
        <SelectionOverlay
          iframe={iframeEl}
          hoveredElement={canvasMode === "interact" ? null : hoveredEl}
          selectedElement={canvasMode === "interact" ? null : selectedEl}
          dropTargetInfo={canvasMode === "interact" ? null : dropTargetInfo}
          structuralPath={selectedPath}
          theme={theme}
          zoom={zoom}
          viewport={propertyViewport}
          onEdit={handleEdit}
          onBatchEdit={handleBatchEdit}
          onMoveElement={handleMoveElement}
          onSelectElement={handleSelectElement}
          onDuplicate={handleDuplicateElement}
          onDelete={handleDeleteElement}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onWrapWithDiv={handleWrapWithDiv}
        />

        {/* Right Sidebar Drag Resize Handle */}
        {openFile && uiPanelsVisible && (
          <div
            onPointerDown={handleRightResizeStart}
            className="w-1.5 hover:w-2.5 bg-transparent hover:bg-[#0099ff]/40 active:bg-[#0099ff] cursor-col-resize z-30 transition-colors group shrink-0 relative flex items-center justify-center -mr-1 select-none touch-none"
            title="Drag to resize property panel"
          >
            <div className="w-0.5 h-10 bg-slate-300 dark:bg-[#333333] group-hover:bg-[#0099ff] rounded-full transition-colors" />
          </div>
        )}

        {/* Global Transparent Drag Backdrop to prevent pointer events being captured by iframes */}
        {isResizingSidebar && (
          <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto" />
        )}

        {/* Right Sidebar: Property Panel */}
        {openFile && uiPanelsVisible && (
          <aside
            style={{ width: `${rightSidebarWidth}px` }}
            className="border-l border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] flex flex-col shrink-0 z-20 overflow-hidden shadow-2xl"
          >
            <div className="flex-1 overflow-y-auto">
              <ErrorBoundary>
                <PropertyPanel
                  element={selectedEl}
                  structuralPath={selectedPath}
                  theme={theme}
                  viewport={propertyViewport}
                  iframe={iframeEl}
                  onEdit={handleEdit}
                  onSelectElement={handleSelectElement}
                  onDelete={handleDeleteElement}
                  onDuplicate={handleDuplicateElement}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              </ErrorBoundary>
            </div>
          </aside>
        )}
      </div>

      {/* Hidden Panels Quick Restore Pill */}
      {!uiPanelsVisible && openFile && (
        <div className="fixed bottom-4 left-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => setUiPanelsVisible(true)}
            className="px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#141414]/90 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] text-xs text-slate-700 dark:text-zinc-300 font-mono shadow-2xl backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all hover:border-[#0099ff]/50"
            title="Show Panels (Ctrl+\)"
          >
            <span>UI Panels Hidden</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-[#262626] text-[10px] text-slate-800 dark:text-zinc-300 font-mono font-semibold">
              Ctrl + \
            </kbd>
          </button>
        </div>
      )}

      {/* Review Modal */}
      {reviewOpen && (
        <ReviewModal
          iframeDocument={iframeEl?.contentDocument ?? null}
          onSave={handleSave}
          onClose={() => setReviewOpen(false)}
          onDiscardAll={handleDiscardAll}
        />
      )}

      {/* Export Studio Modal */}
      {exportOpen && (
        <ExportStudioModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          html={getCurrentExportHtml()}
          fileName={openFile?.name}
          iframeDocument={iframeEl?.contentDocument ?? null}
          onSave={handleSave}
          isDirty={edits.length > 0 || Boolean(openFile && useWorkspaceStore.getState().files.find((f) => f.id === useWorkspaceStore.getState().activeFileId)?.isDirty)}
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

      {/* Project Config & Custom Styles Modal */}
      <ProjectConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfigChanged={() => {
          if (openFile) {
            const reAnalyzed = analyzeHtmlClientSide(openFile.content, projectConfig);
            setTheme(reAnalyzed.theme);
          }
        }}
      />

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
