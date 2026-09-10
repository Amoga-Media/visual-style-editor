import { useEffect, useState, useRef } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import type { ViewportMode } from "@/components/editor/Toolbar";
import { Move, GripVertical, Scaling } from "lucide-react";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface DropTargetInfo {
  targetElement: Element;
  position: "inside" | "before" | "after";
}

interface SelectionOverlayProps {
  iframe: HTMLIFrameElement | null;
  hoveredElement: Element | null;
  selectedElement: Element | null;
  dropTargetInfo?: DropTargetInfo | null;
  structuralPath?: string | null;
  theme?: ThemeMap;
  zoom?: number;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
  onBatchEdit?: (records: EditRecord[]) => void;
  onMoveElement?: (sourceEl: HTMLElement, targetEl: HTMLElement, position: "before" | "after" | "inside") => void;
}

function computeOverlayRect(iframe: HTMLIFrameElement, el: Element, zoom = 1): Rect | null {
  if (!iframe || !el || !iframe.isConnected || !el.isConnected) return null;
  const iframeRect = iframe.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  if (elRect.width === 0 && elRect.height === 0) return null;

  const iframeWin = iframe.ownerDocument?.defaultView || window;
  const computedIframe = iframeWin.getComputedStyle(iframe);
  const borderLeft = parseFloat(computedIframe.borderLeftWidth) || 0;
  const borderTop = parseFloat(computedIframe.borderTopWidth) || 0;

  const z = zoom || 1;
  const rawTop = iframeRect.top + borderTop * z + elRect.top * z;
  const rawLeft = iframeRect.left + borderLeft * z + elRect.left * z;
  const rawWidth = elRect.width * z;
  const rawHeight = elRect.height * z;

  return {
    top: rawTop,
    left: rawLeft,
    width: rawWidth,
    height: rawHeight,
  };
}

type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const RESIZE_HANDLES: Array<{ id: HandleId; cursor: string; style: React.CSSProperties }> = [
  { id: "nw", cursor: "nwse-resize", style: { top: -4, left: -4 } },
  { id: "n", cursor: "ns-resize", style: { top: -4, left: "calc(50% - 4px)" } },
  { id: "ne", cursor: "nesw-resize", style: { top: -4, right: -4 } },
  { id: "e", cursor: "ew-resize", style: { top: "calc(50% - 4px)", right: -4 } },
  { id: "se", cursor: "nwse-resize", style: { bottom: -4, right: -4 } },
  { id: "s", cursor: "ns-resize", style: { bottom: -4, left: "calc(50% - 4px)" } },
  { id: "sw", cursor: "nesw-resize", style: { bottom: -4, left: -4 } },
  { id: "w", cursor: "ew-resize", style: { top: "calc(50% - 4px)", left: -4 } },
];

function rectsEqual(a: Rect | null, b: Rect | null, epsilon = 0.25): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < epsilon &&
    Math.abs(a.left - b.left) < epsilon &&
    Math.abs(a.width - b.width) < epsilon &&
    Math.abs(a.height - b.height) < epsilon
  );
}

export default function SelectionOverlay({
  iframe,
  hoveredElement,
  selectedElement,
  dropTargetInfo,
  structuralPath,
  theme = { mode: "none", colors: [], fonts: [] },
  zoom = 1,
  viewport = "desktop",
  onEdit,
  onBatchEdit,
  onMoveElement,
}: SelectionOverlayProps) {
  const [hoverRect, setHoverRect] = useState<Rect | null>(null);
  const [selectedRect, setSelectedRect] = useState<Rect | null>(null);
  const [dropRect, setDropRect] = useState<Rect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCoords, setDragCoords] = useState<{ x: number; y: number } | null>(null);
  const [isResizeMode, setIsResizeMode] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDimensions, setResizeDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderIndicator, setReorderIndicator] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    label: string;
  } | null>(null);

  const rafIdRef = useRef<number | null>(null);
  const dragSessionRef = useRef<{
    pointerId: number;
    targetEl: HTMLElement;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    baselineLeft: string;
    baselineTop: string;
  } | null>(null);

  type ResizeState = "idle" | "starting" | "resizing" | "committed";

  const resizeSessionRef = useRef<{
    handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
    pointerId: number;
    handleEl: HTMLElement;
    state: ResizeState;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    aspectRatio: number;
    baselineWidth: string;
    baselineHeight: string;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    hasMoved: boolean;
  } | null>(null);

  const reorderSessionRef = useRef<{
    startX: number;
    startY: number;
    pointerId: number;
    handleEl: HTMLElement;
    isDragging: boolean;
    targetSibling: Element | null;
    insertPosition: "before" | "after" | null;
  } | null>(null);

  // Clean up any active session if selected element or viewport changes
  useEffect(() => {
    if (resizeSessionRef.current) {
      if (selectedElement) {
        (selectedElement as HTMLElement).style.width = resizeSessionRef.current.baselineWidth;
        (selectedElement as HTMLElement).style.height = resizeSessionRef.current.baselineHeight;
      }
      try {
        if (resizeSessionRef.current.handleEl?.hasPointerCapture(resizeSessionRef.current.pointerId)) {
          resizeSessionRef.current.handleEl.releasePointerCapture(resizeSessionRef.current.pointerId);
        }
      } catch {}
      resizeSessionRef.current = null;
      setIsResizing(false);
      setResizeDimensions(null);
    }

    if (dragSessionRef.current) {
      try {
        if (dragSessionRef.current.targetEl?.hasPointerCapture(dragSessionRef.current.pointerId)) {
          dragSessionRef.current.targetEl.releasePointerCapture(dragSessionRef.current.pointerId);
        }
      } catch {}
      dragSessionRef.current = null;
      setIsDragging(false);
      setDragCoords(null);
    }

    if (reorderSessionRef.current) {
      try {
        if (reorderSessionRef.current.handleEl?.hasPointerCapture(reorderSessionRef.current.pointerId)) {
          reorderSessionRef.current.handleEl.releasePointerCapture(reorderSessionRef.current.pointerId);
        }
      } catch {}
      reorderSessionRef.current = null;
      setIsReordering(false);
      setReorderIndicator(null);
    }

    if (!selectedElement) {
      setIsResizeMode(false);
    }
  }, [selectedElement, viewport]);

  useEffect(() => {
    function recompute() {
      const nextHover = iframe && hoveredElement ? computeOverlayRect(iframe, hoveredElement, zoom) : null;
      const nextSelected = iframe && selectedElement ? computeOverlayRect(iframe, selectedElement, zoom) : null;
      const nextDrop = iframe && dropTargetInfo?.targetElement ? computeOverlayRect(iframe, dropTargetInfo.targetElement, zoom) : null;

      setHoverRect((prev) => (rectsEqual(prev, nextHover) ? prev : nextHover));
      setSelectedRect((prev) => (rectsEqual(prev, nextSelected) ? prev : nextSelected));
      setDropRect((prev) => (rectsEqual(prev, nextDrop) ? prev : nextDrop));
    }

    recompute();

    const contentWindow = iframe?.contentWindow ?? null;
    window.addEventListener("scroll", recompute, true);
    window.addEventListener("resize", recompute);
    contentWindow?.addEventListener("scroll", recompute, true);
    contentWindow?.addEventListener("resize", recompute);

    const doc = iframe?.contentDocument;
    let observer: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    if (doc) {
      observer = new MutationObserver(recompute);
      observer.observe(doc.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ["style", "class", "width", "height"],
      });
    }

    if (selectedElement && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(recompute);
      resizeObserver.observe(selectedElement);
    }

    if (hoveredElement || selectedElement || dropTargetInfo) {
      let isRunning = true;
      function trackAnimation() {
        if (!isRunning) return;
        recompute();
        rafIdRef.current = requestAnimationFrame(trackAnimation);
      }
      rafIdRef.current = requestAnimationFrame(trackAnimation);
      return () => {
        isRunning = false;
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        window.removeEventListener("scroll", recompute, true);
        window.removeEventListener("resize", recompute);
        contentWindow?.removeEventListener("scroll", recompute, true);
        contentWindow?.removeEventListener("resize", recompute);
        observer?.disconnect();
        resizeObserver?.disconnect();
      };
    }

    return () => {
      window.removeEventListener("scroll", recompute, true);
      window.removeEventListener("resize", recompute);
      contentWindow?.removeEventListener("scroll", recompute, true);
      contentWindow?.removeEventListener("resize", recompute);
      observer?.disconnect();
      resizeObserver?.disconnect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [iframe, hoveredElement, selectedElement, dropTargetInfo, zoom]);

  // Check if selected element is positioned absolute/fixed
  const win = selectedElement?.ownerDocument?.defaultView || (typeof window !== "undefined" ? window : null);
  const computedPos = selectedElement && win ? win.getComputedStyle(selectedElement).position : "static";
  const isAbsolute = computedPos === "absolute" || computedPos === "fixed";

  function handleStartDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!selectedElement || !isAbsolute) return;
    e.preventDefault();
    e.stopPropagation();

    const targetEl = selectedElement as HTMLElement;
    const computed = win?.getComputedStyle(targetEl);

    const initialLeft = parseFloat(computed?.left || "0") || targetEl.offsetLeft || 0;
    const initialTop = parseFloat(computed?.top || "0") || targetEl.offsetTop || 0;

    const dragHandleEl = e.currentTarget;
    try {
      dragHandleEl.setPointerCapture(e.pointerId);
    } catch {}

    dragSessionRef.current = {
      pointerId: e.pointerId,
      targetEl: dragHandleEl,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft,
      initialTop,
      baselineLeft: computed?.left || `${initialLeft}px`,
      baselineTop: computed?.top || `${initialTop}px`,
    };

    setIsDragging(true);
    setDragCoords({ x: Math.round(initialLeft), y: Math.round(initialTop) });

    function onPointerMove(moveEvent: PointerEvent) {
      if (!dragSessionRef.current || !selectedElement) return;
      const { startX, startY, initialLeft, initialTop } = dragSessionRef.current;
      const dx = (moveEvent.clientX - startX) / (zoom || 1);
      const dy = (moveEvent.clientY - startY) / (zoom || 1);

      const newLeft = Math.round(initialLeft + dx);
      const newTop = Math.round(initialTop + dy);

      setDragCoords({ x: newLeft, y: newTop });
      applyLiveStyle(selectedElement, "left", `${newLeft}px`, theme, undefined, viewport, structuralPath || undefined);
      applyLiveStyle(selectedElement, "top", `${newTop}px`, theme, undefined, viewport, structuralPath || undefined);
    }

    function onPointerUp(upEvent: PointerEvent) {
      if (dragSessionRef.current && selectedElement && structuralPath) {
        const { startX, startY, initialLeft, initialTop, baselineLeft, baselineTop } = dragSessionRef.current;
        const dx = (upEvent.clientX - startX) / (zoom || 1);
        const dy = (upEvent.clientY - startY) / (zoom || 1);

        const newLeft = Math.round(initialLeft + dx);
        const newTop = Math.round(initialTop + dy);

        commitStyleChange(
          selectedElement,
          structuralPath,
          "left",
          `${newLeft}px`,
          theme,
          onEdit,
          baselineLeft,
          undefined,
          viewport
        );
        commitStyleChange(
          selectedElement,
          structuralPath,
          "top",
          `${newTop}px`,
          theme,
          onEdit,
          baselineTop,
          undefined,
          viewport
        );
      }

      cleanup();
    }

    function onCancel() {
      if (dragSessionRef.current && selectedElement) {
        (selectedElement as HTMLElement).style.left = dragSessionRef.current.baselineLeft;
        (selectedElement as HTMLElement).style.top = dragSessionRef.current.baselineTop;
      }
      cleanup();
    }

    function cleanup() {
      if (dragSessionRef.current) {
        try {
          if (dragSessionRef.current.targetEl.hasPointerCapture(dragSessionRef.current.pointerId)) {
            dragSessionRef.current.targetEl.releasePointerCapture(dragSessionRef.current.pointerId);
          }
        } catch {}
      }
      setIsDragging(false);
      setDragCoords(null);
      dragSessionRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onCancel);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onCancel);
  }

  // BUG-025 & BUG-026: Direct canvas drag reordering for flex/flow items
  function handleStartReorder(e: React.PointerEvent<HTMLDivElement>) {
    if (!selectedElement || isAbsolute || !onMoveElement || !iframe) return;
    e.preventDefault();
    e.stopPropagation();

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}

    reorderSessionRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      handleEl,
      isDragging: false,
      targetSibling: null,
      insertPosition: null,
    };

    function onPointerMove(moveEvent: PointerEvent) {
      const session = reorderSessionRef.current;
      if (!session || !selectedElement || !iframe) return;

      const dist = Math.hypot(moveEvent.clientX - session.startX, moveEvent.clientY - session.startY);
      if (!session.isDragging && dist > 5) {
        session.isDragging = true;
        setIsReordering(true);
      }

      if (!session.isDragging) return;

      const parent = selectedElement.parentElement;
      if (!parent || parent.children.length <= 1) return;

      const winEl = selectedElement.ownerDocument?.defaultView || window;
      const parentComputed = winEl.getComputedStyle(parent);
      const isFlexRow =
        (parentComputed.display === "flex" || parentComputed.display === "inline-flex") &&
        (!parentComputed.flexDirection || parentComputed.flexDirection.startsWith("row"));

      const siblings = Array.from(parent.children).filter((c) => c !== selectedElement);
      if (siblings.length === 0) return;

      let closestSibling: Element | null = null;
      let closestPos: "before" | "after" = "before";
      let minDistance = Infinity;

      const iframeRect = iframe.getBoundingClientRect();

      const z = zoom || 1;
      for (const sib of siblings) {
        const sibRect = sib.getBoundingClientRect();

        if (isFlexRow) {
          const midX = iframeRect.left + sibRect.left * z + (sibRect.width * z) / 2;
          const d = Math.abs(moveEvent.clientX - midX);
          if (d < minDistance) {
            minDistance = d;
            closestSibling = sib;
            closestPos = moveEvent.clientX < midX ? "before" : "after";
          }
        } else {
          const midY = iframeRect.top + sibRect.top * z + (sibRect.height * z) / 2;
          const d = Math.abs(moveEvent.clientY - midY);
          if (d < minDistance) {
            minDistance = d;
            closestSibling = sib;
            closestPos = moveEvent.clientY < midY ? "before" : "after";
          }
        }
      }

      if (closestSibling) {
        session.targetSibling = closestSibling;
        session.insertPosition = closestPos;

        const sibOverlayRect = computeOverlayRect(iframe, closestSibling, zoom);
        if (sibOverlayRect) {
          const sibTag = closestSibling.tagName.toLowerCase();
          if (isFlexRow) {
            setReorderIndicator({
              left: closestPos === "before" ? sibOverlayRect.left - 2 : sibOverlayRect.left + sibOverlayRect.width - 2,
              top: sibOverlayRect.top,
              width: 4,
              height: sibOverlayRect.height,
              label: `${closestPos === "before" ? "←" : "→"} Insert ${closestPos} <${sibTag}>`,
            });
          } else {
            setReorderIndicator({
              left: sibOverlayRect.left,
              top: closestPos === "before" ? sibOverlayRect.top - 2 : sibOverlayRect.top + sibOverlayRect.height - 2,
              width: sibOverlayRect.width,
              height: 4,
              label: `${closestPos === "before" ? "↑" : "↓"} Insert ${closestPos} <${sibTag}>`,
            });
          }
        }
      }
    }

    function onPointerUp() {
      const session = reorderSessionRef.current;
      if (session && session.isDragging && session.targetSibling && session.insertPosition && selectedElement && onMoveElement) {
        onMoveElement(
          selectedElement as HTMLElement,
          session.targetSibling as HTMLElement,
          session.insertPosition
        );
      }
      cleanup();
    }

    function onCancel() {
      cleanup();
    }

    function onKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        cleanup();
      }
    }

    function cleanup() {
      const session = reorderSessionRef.current;
      if (session) {
        try {
          if (session.handleEl.hasPointerCapture(session.pointerId)) {
            session.handleEl.releasePointerCapture(session.pointerId);
          }
        } catch {}
      }
      setIsReordering(false);
      setReorderIndicator(null);
      reorderSessionRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onCancel);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onCancel);
  }

  const selectedLabel = selectedElement
    ? `${selectedElement.tagName.toLowerCase()}${selectedElement.id ? `#${selectedElement.id}` : ""}`
    : undefined;

  const dropTag = dropTargetInfo?.targetElement?.tagName.toLowerCase() || "";

  function handleStartResize(handleId: HandleId, e: React.PointerEvent<HTMLDivElement>) {
    if (!selectedElement) return;
    e.preventDefault();
    e.stopPropagation();

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}

    const targetEl = selectedElement as HTMLElement;
    const computed = win?.getComputedStyle(targetEl);
    const initialWidth = targetEl.offsetWidth || parseFloat(computed?.width || "0") || 100;
    const initialHeight = targetEl.offsetHeight || parseFloat(computed?.height || "0") || 100;

    const modifiesWidth = handleId.includes("e") || handleId.includes("w");
    const modifiesHeight = handleId.includes("s") || handleId.includes("n");

    setIsResizing(true);
    setResizeDimensions({ width: Math.round(initialWidth), height: Math.round(initialHeight) });

    const startX = e.clientX;
    const startY = e.clientY;
    let latestW = Math.round(initialWidth);
    let latestH = Math.round(initialHeight);

    function onPointerMove(moveEvent: PointerEvent) {
      if (!selectedElement) return;
      const dx = (moveEvent.clientX - startX) / (zoom || 1);
      const dy = (moveEvent.clientY - startY) / (zoom || 1);

      let newWidth = initialWidth;
      let newHeight = initialHeight;

      if (handleId.includes("e")) newWidth = Math.max(10, Math.round(initialWidth + dx));
      if (handleId.includes("w")) newWidth = Math.max(10, Math.round(initialWidth - dx));
      if (handleId.includes("s")) newHeight = Math.max(10, Math.round(initialHeight + dy));
      if (handleId.includes("n")) newHeight = Math.max(10, Math.round(initialHeight - dy));

      latestW = newWidth;
      latestH = newHeight;
      setResizeDimensions({ width: newWidth, height: newHeight });

      if (modifiesWidth) {
        applyLiveStyle(selectedElement, "width", `${newWidth}px`, theme, undefined, viewport, structuralPath || undefined);
      }
      if (modifiesHeight) {
        applyLiveStyle(selectedElement, "height", `${newHeight}px`, theme, undefined, viewport, structuralPath || undefined);
      }
    }

    function onPointerUp() {
      if (selectedElement && structuralPath) {
        if (modifiesWidth) {
          commitStyleChange(selectedElement, structuralPath, "width", `${latestW}px`, theme, onEdit, `${initialWidth}px`, undefined, viewport);
        }
        if (modifiesHeight) {
          commitStyleChange(selectedElement, structuralPath, "height", `${latestH}px`, theme, onEdit, `${initialHeight}px`, undefined, viewport);
        }
      }
      cleanup();
    }

    function cleanup() {
      try {
        if (handleEl.hasPointerCapture(e.pointerId)) {
          handleEl.releasePointerCapture(e.pointerId);
        }
      } catch {}
      setIsResizing(false);
      setResizeDimensions(null);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  return (
    <>
      {hoverRect && hoveredElement !== selectedElement && !dropTargetInfo && (
        <div
          style={{
            position: "fixed",
            top: hoverRect.top,
            left: hoverRect.left,
            width: hoverRect.width,
            height: hoverRect.height,
            border: "2px solid #3b82f6",
            pointerEvents: "none",
            boxSizing: "border-box",
            zIndex: 9998,
          }}
        />
      )}

      {selectedRect && !dropTargetInfo && (
        <div
          style={{
            position: "fixed",
            top: selectedRect.top,
            left: selectedRect.left,
            width: selectedRect.width,
            height: selectedRect.height,
            border: isAbsolute ? "2px solid #6366f1" : "2px solid #0099ff",
            boxShadow: isAbsolute ? "0 0 10px rgba(99, 102, 241, 0.35)" : undefined,
            pointerEvents: "none",
            boxSizing: "border-box",
            zIndex: 9999,
          }}
        >
          {/* Label Badge with Drag Handle & Resize Mode Toggle */}
          {selectedLabel && (
            <div
              style={{
                position: "absolute",
                top: -25,
                left: -2,
                background: isAbsolute ? "#6366f1" : "#0099ff",
                color: "#ffffff",
                fontSize: "10px",
                fontFamily: "monospace",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px 4px 0 0",
                whiteSpace: "nowrap",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                userSelect: "none",
              }}
            >
              {/* Drag Handle: Position move for Absolute, sibling reordering for Flex/Flow */}
              <div
                onPointerDown={isAbsolute ? handleStartDrag : handleStartReorder}
                title={isAbsolute ? "Drag to move position" : "Drag to reorder among siblings"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: isDragging || isReordering ? "grabbing" : "grab",
                  padding: "1px 3px",
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                {isAbsolute ? <Move style={{ width: 11, height: 11 }} /> : <GripVertical style={{ width: 11, height: 11 }} />}
              </div>

              <span>{isAbsolute ? `[Absolute] ${selectedLabel}` : selectedLabel}</span>

              {/* Visual Resize Mode Toggle Button (BUG-024) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsResizeMode((prev) => !prev);
                }}
                title={isResizeMode ? "Disable visual resize handles" : "Enable visual resize handles"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: "1px 5px",
                  fontSize: "9px",
                  fontWeight: 600,
                  backgroundColor: isResizeMode ? "#ffffff" : "rgba(255, 255, 255, 0.2)",
                  color: isResizeMode ? (isAbsolute ? "#6366f1" : "#0099ff") : "#ffffff",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Scaling style={{ width: 10, height: 10 }} />
                <span>{isResizeMode ? "Resize ON" : "Resize"}</span>
              </button>
            </div>
          )}

          {/* Floating Coordinate Tooltip during Canvas Drag */}
          {isDragging && dragCoords && (
            <div
              style={{
                position: "absolute",
                bottom: -28,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#18181b",
                color: "#ffffff",
                border: "1px solid #6366f1",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                zIndex: 10001,
              }}
            >
              X: {dragCoords.x}px &nbsp;|&nbsp; Y: {dragCoords.y}px
            </div>
          )}

          {/* 8 Resize Handles - only shown in Visual Resize Mode (BUG-024) */}
          {isResizeMode && !dropTargetInfo && RESIZE_HANDLES.map((h) => (
            <div
              key={h.id}
              onPointerDown={(e) => handleStartResize(h.id, e)}
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                backgroundColor: "#ffffff",
                border: "1.5px solid #0099ff",
                borderRadius: 1,
                cursor: h.cursor,
                pointerEvents: "auto",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                zIndex: 10002,
                ...h.style,
              }}
              title={`Resize (${h.id.toUpperCase()})`}
            />
          ))}

          {/* Floating Dimension Tooltip during Resize */}
          {isResizing && resizeDimensions && (
            <div
              style={{
                position: "absolute",
                bottom: -28,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#18181b",
                color: "#ffffff",
                border: "1px solid #0099ff",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                zIndex: 10003,
              }}
            >
              {resizeDimensions.width} × {resizeDimensions.height} px
            </div>
          )}
        </div>
      )}

      {/* Real-Time Drag Reorder Indicator Line (BUG-025 & BUG-026) */}
      {reorderIndicator && (
        <div
          style={{
            position: "fixed",
            top: reorderIndicator.top,
            left: reorderIndicator.left,
            width: reorderIndicator.width,
            height: reorderIndicator.height,
            backgroundColor: "#6366f1",
            borderRadius: "2px",
            pointerEvents: "none",
            zIndex: 10005,
            boxShadow: "0 0 8px #6366f1",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -24,
              left: 0,
              backgroundColor: "#6366f1",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            }}
          >
            {reorderIndicator.label}
          </div>
        </div>
      )}

      {/* Real-Time Drop Guide Indicator */}
      {dropRect && dropTargetInfo && (
        <>
          {dropTargetInfo.position === "inside" ? (
            <div
              style={{
                position: "fixed",
                top: dropRect.top,
                left: dropRect.left,
                width: dropRect.width,
                height: dropRect.height,
                border: "2px dashed #0099ff",
                backgroundColor: "rgba(0, 153, 255, 0.15)",
                borderRadius: "8px",
                pointerEvents: "none",
                boxSizing: "border-box",
                zIndex: 10000,
                boxShadow: "0 0 12px rgba(0, 153, 255, 0.3)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -24,
                  left: 0,
                  backgroundColor: "#0099ff",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "4px 4px 0 0",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                }}
              >
                📥 Insert inside &lt;{dropTag}&gt;
              </div>
            </div>
          ) : dropTargetInfo.position === "before" ? (
            <div
              style={{
                position: "fixed",
                top: dropRect.top - 2,
                left: dropRect.left,
                width: dropRect.width,
                height: 4,
                backgroundColor: "#0099ff",
                borderRadius: "2px",
                pointerEvents: "none",
                zIndex: 10000,
                boxShadow: "0 0 8px #0099ff",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -22,
                  left: 0,
                  backgroundColor: "#0099ff",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                ↑ Insert before &lt;{dropTag}&gt;
              </div>
            </div>
          ) : (
            <div
              style={{
                position: "fixed",
                top: dropRect.top + dropRect.height - 2,
                left: dropRect.left,
                width: dropRect.width,
                height: 4,
                backgroundColor: "#0099ff",
                borderRadius: "2px",
                pointerEvents: "none",
                zIndex: 10000,
                boxShadow: "0 0 8px #0099ff",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 0,
                  backgroundColor: "#0099ff",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                ↓ Insert after &lt;{dropTag}&gt;
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
