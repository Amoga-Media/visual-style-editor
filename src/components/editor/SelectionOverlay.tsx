import { useEffect, useState, useRef } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { Move } from "lucide-react";

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
  onEdit?: (record: EditRecord) => void;
}

function computeOverlayRect(iframe: HTMLIFrameElement, el: Element): Rect | null {
  if (!iframe || !el || !iframe.isConnected || !el.isConnected) return null;
  const iframeRect = iframe.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  if (elRect.width === 0 && elRect.height === 0) return null;

  const rawTop = iframeRect.top + elRect.top;
  const rawLeft = iframeRect.left + elRect.left;
  const rawRight = rawLeft + elRect.width;
  const rawBottom = rawTop + elRect.height;

  // Clamp within visible iframe frame
  const clipTop = Math.max(rawTop, iframeRect.top);
  const clipLeft = Math.max(rawLeft, iframeRect.left);
  const clipRight = Math.min(rawRight, iframeRect.right);
  const clipBottom = Math.min(rawBottom, iframeRect.bottom);

  if (clipRight <= clipLeft || clipBottom <= clipTop) {
    return null;
  }

  return {
    top: clipTop,
    left: clipLeft,
    width: clipRight - clipLeft,
    height: clipBottom - clipTop,
  };
}

export default function SelectionOverlay({
  iframe,
  hoveredElement,
  selectedElement,
  dropTargetInfo,
  structuralPath,
  theme = { mode: "none", colors: [], fonts: [] },
  zoom = 1,
  onEdit,
}: SelectionOverlayProps) {
  const [hoverRect, setHoverRect] = useState<Rect | null>(null);
  const [selectedRect, setSelectedRect] = useState<Rect | null>(null);
  const [dropRect, setDropRect] = useState<Rect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCoords, setDragCoords] = useState<{ x: number; y: number } | null>(null);

  const rafIdRef = useRef<number | null>(null);
  const dragSessionRef = useRef<{
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    baselineLeft: string;
    baselineTop: string;
  } | null>(null);

  useEffect(() => {
    function recompute() {
      setHoverRect(iframe && hoveredElement ? computeOverlayRect(iframe, hoveredElement) : null);
      setSelectedRect(
        iframe && selectedElement ? computeOverlayRect(iframe, selectedElement) : null
      );
      setDropRect(
        iframe && dropTargetInfo?.targetElement
          ? computeOverlayRect(iframe, dropTargetInfo.targetElement)
          : null
      );
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
  }, [iframe, hoveredElement, selectedElement, dropTargetInfo]);

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

    dragSessionRef.current = {
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
      applyLiveStyle(selectedElement, "left", `${newLeft}px`, theme);
      applyLiveStyle(selectedElement, "top", `${newTop}px`, theme);
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
          baselineLeft
        );
        commitStyleChange(
          selectedElement,
          structuralPath,
          "top",
          `${newTop}px`,
          theme,
          onEdit,
          baselineTop
        );
      }

      setIsDragging(false);
      setDragCoords(null);
      dragSessionRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  const selectedLabel = selectedElement
    ? `${selectedElement.tagName.toLowerCase()}${selectedElement.id ? `#${selectedElement.id}` : ""}`
    : undefined;

  const dropTag = dropTargetInfo?.targetElement?.tagName.toLowerCase() || "";

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
          onPointerDown={isAbsolute ? handleStartDrag : undefined}
          style={{
            position: "fixed",
            top: selectedRect.top,
            left: selectedRect.left,
            width: selectedRect.width,
            height: selectedRect.height,
            border: isAbsolute ? "2px solid #6366f1" : "2px solid #0099ff",
            boxShadow: isAbsolute ? "0 0 10px rgba(99, 102, 241, 0.35)" : undefined,
            pointerEvents: isAbsolute ? "auto" : "none",
            cursor: isAbsolute ? (isDragging ? "grabbing" : "grab") : "default",
            boxSizing: "border-box",
            zIndex: 9999,
          }}
        >
          {/* Label Badge */}
          {selectedLabel && (
            <div
              style={{
                position: "absolute",
                top: -22,
                left: -2,
                background: isAbsolute ? "#6366f1" : "#0099ff",
                color: "#ffffff",
                fontSize: "10px",
                fontFamily: "monospace",
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: "3px 3px 0 0",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {isAbsolute && <Move style={{ width: 10, height: 10 }} />}
              <span>{isAbsolute ? `[Absolute] ${selectedLabel}` : selectedLabel}</span>
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
