import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/settings-store";

export interface DropTargetInfo {
  targetElement: Element;
  position: "inside" | "before" | "after";
}

interface PreviewFrameProps {
  html: string;
  onIframeReady: (iframe: HTMLIFrameElement | null) => void;
  onHoverElement: (el: Element | null) => void;
  onSelectElement: (el: Element) => void;
  onDragOverTarget?: (info: DropTargetInfo | null) => void;
  onDropOnTarget?: (snippet: string, targetEl: Element, position: "inside" | "before" | "after") => void;
  onMoveLayerOnTarget?: (sourceEl: Element, targetEl: Element, position: "inside" | "before" | "after") => void;
  onTextEdit?: (el: Element, oldText: string, newText: string) => void;
}

const CONTAINER_TAGS = new Set([
  "body",
  "div",
  "section",
  "main",
  "article",
  "header",
  "footer",
  "nav",
  "aside",
  "form",
  "ul",
  "ol",
  "fieldset",
  "figure",
]);

function isContainerElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (CONTAINER_TAGS.has(tag)) return true;
  if (el.children.length > 0) return true;
  return false;
}

function computeDropPosition(el: Element, clientY: number): "inside" | "before" | "after" {
  const tag = el.tagName.toLowerCase();
  if (tag === "body" || tag === "html") return "inside";

  const rect = el.getBoundingClientRect();
  const offsetY = clientY - rect.top;
  const height = Math.max(rect.height, 1);

  if (isContainerElement(el)) {
    if (offsetY < height * 0.18) return "before";
    if (offsetY > height * 0.82) return "after";
    return "inside";
  }

  // Leaf elements (headings, text, buttons, inputs, images)
  return offsetY < height * 0.5 ? "before" : "after";
}

function injectEditorHelperStyles(doc: Document) {
  if (doc.getElementById("vse-editor-helper-styles")) return;
  const styleEl = doc.createElement("style");
  styleEl.id = "vse-editor-helper-styles";
  styleEl.textContent = `
    /* Allow clicking and inspecting all elements in visual editor mode */
    body * {
      pointer-events: auto !important;
    }
  `;
  if (doc.head) {
    doc.head.appendChild(styleEl);
  } else if (doc.body) {
    doc.body.appendChild(styleEl);
  }
}

function attachSelectionAndDragListeners(
  iframe: HTMLIFrameElement,
  onHover: (el: Element | null) => void,
  onClick: (el: Element) => void,
  onDragOverTarget?: (info: DropTargetInfo | null) => void,
  onDropOnTarget?: (snippet: string, targetEl: Element, position: "inside" | "before" | "after") => void,
  onMoveLayerOnTarget?: (sourceEl: Element, targetEl: Element, position: "inside" | "before" | "after") => void,
  onTextEdit?: (el: Element, oldText: string, newText: string) => void
) {
  const doc = iframe.contentDocument;
  if (!doc) return () => {};

  injectEditorHelperStyles(doc);

  const handleOver = (e: MouseEvent) => {
    if (useSettingsStore.getState().canvasMode === "interact") {
      onHover(null);
      return;
    }
    onHover(e.target as Element);
  };
  const handleOut = () => onHover(null);
  const handleClick = (e: MouseEvent) => {
    if (useSettingsStore.getState().canvasMode === "interact") {
      return; // allow natural click interactions for accordions, menus, links
    }
    e.preventDefault();
    e.stopPropagation();
    onClick(e.target as Element);
  };

  const handleDblClick = (e: MouseEvent) => {
    if (useSettingsStore.getState().canvasMode === "interact") {
      return;
    }
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const tag = target.tagName.toLowerCase();
    const excludedTags = new Set([
      "button", "a", "input", "textarea", "select", "svg", "video",
      "iframe", "img", "canvas", "audio", "body", "html", "head"
    ]);
    if (excludedTags.has(tag)) return;
    if (target.isContentEditable) return;

    // Check if element has interactive children
    if (target.querySelector("button, a, input, textarea, select, video, iframe")) return;

    // Only allow for leaf or simple text containers
    if (
      target.children.length > 0 &&
      Array.from(target.children).some(
        (c) => !["span", "strong", "em", "b", "i", "u", "small", "code", "mark"].includes(c.tagName.toLowerCase())
      )
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const originalText = target.textContent || "";
    target.contentEditable = "true";
    target.focus();

    // Select all text
    const selection = doc.defaultView?.getSelection();
    if (selection) {
      const range = doc.createRange();
      range.selectNodeContents(target);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    let committed = false;

    function finishEdit(save: boolean) {
      if (committed || !target) return;
      committed = true;
      target.contentEditable = "false";
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("blur", onBlur);

      const newText = target.textContent || "";
      if (!save) {
        target.textContent = originalText;
        return;
      }
      if (newText !== originalText) {
        onTextEdit?.(target, originalText, newText);
      }
    }

    function onKeyDown(evt: KeyboardEvent) {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        finishEdit(true);
      } else if (evt.key === "Escape") {
        evt.preventDefault();
        finishEdit(false);
      }
    }

    function onBlur() {
      finishEdit(true);
    }

    target.addEventListener("keydown", onKeyDown);
    target.addEventListener("blur", onBlur);
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }

    let target = (doc.elementFromPoint(e.clientX, e.clientY) || e.target) as Element | null;
    if (!target || target.tagName.toLowerCase() === "html" || target.tagName.toLowerCase() === "head") {
      target = doc.body;
    }

    if (!target) {
      onDragOverTarget?.(null);
      return;
    }

    const position = computeDropPosition(target, e.clientY);
    onDragOverTarget?.({ targetElement: target, position });
  };

  const handleDragLeave = (e: DragEvent) => {
    // Only clear if mouse is leaving the document completely
    if (!e.relatedTarget || e.relatedTarget === doc.documentElement) {
      onDragOverTarget?.(null);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOverTarget?.(null);

    let target = (doc.elementFromPoint(e.clientX, e.clientY) || e.target) as Element | null;
    if (!target || target.tagName.toLowerCase() === "html" || target.tagName.toLowerCase() === "head") {
      target = doc.body;
    }
    if (!target) return;

    const position = computeDropPosition(target, e.clientY);

    // 1. Check if dragging an existing layer
    const draggedLayer = (window as any).__draggedLayerElement as Element | undefined;
    if (draggedLayer) {
      if (draggedLayer !== target && !target.contains(draggedLayer)) {
        onMoveLayerOnTarget?.(draggedLayer, target, position);
      }
      (window as any).__draggedLayerElement = null;
      return;
    }

    // 2. Check if dragging a component snippet
    const snippet =
      (window as any).__draggedComponentSnippet ||
      e.dataTransfer?.getData("application/x-visual-editor-snippet") ||
      e.dataTransfer?.getData("text/plain");

    if (snippet && typeof snippet === "string" && snippet.trim().length > 0) {
      onDropOnTarget?.(snippet, target, position);
      (window as any).__draggedComponentSnippet = null;
      (window as any).__draggedComponentName = null;
    }
  };

  doc.addEventListener("mouseover", handleOver, true);
  doc.addEventListener("mouseout", handleOut, true);
  doc.addEventListener("click", handleClick, true);
  doc.addEventListener("dblclick", handleDblClick, true);

  doc.addEventListener("dragenter", handleDragEnter, true);
  doc.addEventListener("dragover", handleDragOver, true);
  doc.addEventListener("dragleave", handleDragLeave, true);
  doc.addEventListener("drop", handleDrop, true);

  return () => {
    doc.removeEventListener("mouseover", handleOver, true);
    doc.removeEventListener("mouseout", handleOut, true);
    doc.removeEventListener("click", handleClick, true);
    doc.removeEventListener("dblclick", handleDblClick, true);

    doc.removeEventListener("dragenter", handleDragEnter, true);
    doc.removeEventListener("dragover", handleDragOver, true);
    doc.removeEventListener("dragleave", handleDragLeave, true);
    doc.removeEventListener("drop", handleDrop, true);
  };
}

export default function PreviewFrame({
  html,
  onIframeReady,
  onHoverElement,
  onSelectElement,
  onDragOverTarget,
  onDropOnTarget,
  onMoveLayerOnTarget,
  onTextEdit,
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => {
    onHoverElement(null);
    onIframeReady(null);
    return () => {
      cleanupRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLoad() {
    cleanupRef.current();
    const iframe = iframeRef.current;
    if (!iframe) return;
    cleanupRef.current = attachSelectionAndDragListeners(
      iframe,
      onHoverElement,
      onSelectElement,
      onDragOverTarget,
      onDropOnTarget,
      onMoveLayerOnTarget,
      onTextEdit
    );
    onIframeReady(iframe);
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      onLoad={handleLoad}
      title="Preview"
      style={{ border: "none", width: "100%", height: "100%", display: "block" }}
    />
  );
}

