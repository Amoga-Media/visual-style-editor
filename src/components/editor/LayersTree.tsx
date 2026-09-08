import { useState, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Trash2,
  Copy,
  Layers,
  Code2,
  Image as ImageIcon,
  Type,
  Square,
  Link as LinkIcon,
  Box,
  GripVertical,
} from "lucide-react";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";

interface LayersTreeProps {
  iframeDocument: Document | null;
  selectedElement: Element | null;
  onSelectElement: (el: Element) => void;
  onHoverElement: (el: Element | null) => void;
  onDeleteElement?: (el: Element) => void;
  onDuplicateElement?: (el: Element) => void;
  onMoveElement?: (sourceEl: Element, targetEl: Element, position: "before" | "after" | "inside") => void;
}

function getElementIcon(tagName: string) {
  switch (tagName) {
    case "img":
    case "svg":
      return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
    case "p":
    case "span":
      return <Type className="w-3.5 h-3.5 text-sky-400" />;
    case "a":
      return <LinkIcon className="w-3.5 h-3.5 text-amber-400" />;
    case "button":
    case "input":
    case "textarea":
      return <Square className="w-3.5 h-3.5 text-purple-400" />;
    case "section":
    case "main":
    case "header":
    case "footer":
    case "nav":
      return <Layers className="w-3.5 h-3.5 text-blue-400" />;
    default:
      return <Box className="w-3.5 h-3.5 text-zinc-500" />;
  }
}

interface TreeNodeProps {
  el: Element;
  depth: number;
  selectedElement: Element | null;
  onSelectElement: (el: Element) => void;
  onHoverElement: (el: Element | null) => void;
  onDeleteElement?: (el: Element) => void;
  onDuplicateElement?: (el: Element) => void;
  onMoveElement?: (sourceEl: Element, targetEl: Element, position: "before" | "after" | "inside") => void;
}

function TreeNode({
  el,
  depth,
  selectedElement,
  onSelectElement,
  onHoverElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null);
  const isSelected = selectedElement === el;
  const tagName = el.tagName.toLowerCase();

  if (tagName === "script" || tagName === "style" || tagName === "link" || tagName === "meta") {
    return null;
  }

  const children = Array.from(el.children).filter((child) => {
    const t = child.tagName.toLowerCase();
    return t !== "script" && t !== "style" && t !== "link" && t !== "meta";
  });

  const hasChildren = children.length > 0;
  const isBody = tagName === "body";
  const idStr = el.id ? `#${el.id}` : "";
  const classStr = el.className && typeof el.className === "string"
    ? `.${el.className.split(" ").filter(Boolean).slice(0, 2).join(".")}`
    : "";

  function handleDragStart(e: React.DragEvent) {
    if (isBody) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", "layer-drag");
    (window as any).__draggedLayerElement = el;
    e.stopPropagation();
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const draggedEl = (window as any).__draggedLayerElement as Element | undefined;
    if (!draggedEl || draggedEl === el || el.contains(draggedEl)) {
      setDropPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    if (offsetY < height * 0.25) {
      setDropPosition("before");
    } else if (offsetY > height * 0.75) {
      setDropPosition("after");
    } else {
      setDropPosition("inside");
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDropPosition(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const draggedEl = (window as any).__draggedLayerElement as Element | undefined;
    const pos = dropPosition;
    setDropPosition(null);

    if (draggedEl && draggedEl !== el && !el.contains(draggedEl) && pos) {
      onMoveElement?.(draggedEl, el, pos);
    }
    (window as any).__draggedLayerElement = null;
  }

  return (
    <div className="select-none relative">
      {/* Drop indicator line before */}
      {dropPosition === "before" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-20 shadow-sm" />
      )}

      <div
        draggable={!isBody}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement(el);
        }}
        onMouseEnter={() => onHoverElement(el)}
        onMouseLeave={() => onHoverElement(null)}
        style={{ paddingLeft: `${Math.min(depth * 14 + 10, 140)}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2.5 text-xs cursor-pointer border-l-2 transition-all ${
          dropPosition === "inside"
            ? "bg-blue-500/20 border-blue-400 text-white"
            : isSelected
            ? "bg-[#1f2937]/70 border-blue-500 text-white font-medium"
            : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#181818]"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {!isBody && (
            <GripVertical className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
          )}

          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded cursor-pointer"
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {getElementIcon(tagName)}

          <span className="font-mono text-[11px] text-zinc-200 font-medium">
            {tagName}
          </span>

          {idStr && (
            <span className="font-mono text-[10px] text-blue-400 truncate max-w-[80px]">
              {idStr}
            </span>
          )}

          {classStr && (
            <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[90px]">
              {classStr}
            </span>
          )}
        </div>

        {/* Quick Actions on Hover */}
        <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
          {onDuplicateElement && !isBody && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateElement(el);
              }}
              className="p-1 rounded hover:bg-[#262626] text-zinc-400 hover:text-white"
              title="Duplicate element (Ctrl+D)"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}
          {onDeleteElement && !isBody && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteElement(el);
              }}
              className="p-1 rounded hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400"
              title="Delete element (Del)"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Drop indicator line after */}
      {dropPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-20 shadow-sm" />
      )}

      {hasChildren && expanded && (
        <div className="flex flex-col">
          {children.map((child, idx) => (
            <TreeNode
              key={idx}
              el={child}
              depth={depth + 1}
              selectedElement={selectedElement}
              onSelectElement={onSelectElement}
              onHoverElement={onHoverElement}
              onDeleteElement={onDeleteElement}
              onDuplicateElement={onDuplicateElement}
              onMoveElement={onMoveElement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LayersTree({
  iframeDocument,
  selectedElement,
  onSelectElement,
  onHoverElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
}: LayersTreeProps) {
  const body = iframeDocument?.body;

  if (!body) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500">
        <Layers className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
        <div>DOM tree unavailable</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
      <TreeNode
        el={body}
        depth={0}
        selectedElement={selectedElement}
        onSelectElement={onSelectElement}
        onHoverElement={onHoverElement}
        onDeleteElement={onDeleteElement}
        onDuplicateElement={onDuplicateElement}
        onMoveElement={onMoveElement}
      />
    </div>
  );
}

