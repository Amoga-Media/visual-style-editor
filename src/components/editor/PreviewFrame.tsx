import { useEffect, useRef } from "react";

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
  onMoveLayerOnTarget?: (sourceEl: Element, targetEl: Element, position: "inside" | "before" | "after") => void
) {
  const doc = iframe.contentDocument;
  if (!doc) return () => {};

  injectEditorHelperStyles(doc);

  const handleOver = (e: MouseEvent) => onHover(e.target as Element);
  const handleOut = () => onHover(null);
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e.target as Element);
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

  doc.addEventListener("dragenter", handleDragEnter, true);
  doc.addEventListener("dragover", handleDragOver, true);
  doc.addEventListener("dragleave", handleDragLeave, true);
  doc.addEventListener("drop", handleDrop, true);

  return () => {
    doc.removeEventListener("mouseover", handleOver, true);
    doc.removeEventListener("mouseout", handleOut, true);
    doc.removeEventListener("click", handleClick, true);

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
      onMoveLayerOnTarget
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

