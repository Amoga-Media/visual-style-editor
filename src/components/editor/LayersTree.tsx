import React, { useState, useRef, memo } from "react";
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
  Link2,
  Box,
  GripVertical,
  Search,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  PanelsTopBottom,
  Navigation,
  Sidebar,
  Heading1,
  Heading2,
  Heading3,
  Heading,
  Pilcrow,
  Quote,
  Video,
  Volume2,
  Table,
  List,
  ListOrdered,
  Tag,
  FormInput,
  SquarePen,
  MousePointerClick,
  Shapes,
  LayoutGrid,
  Columns,
} from "lucide-react";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";

const elementKeyMap = new WeakMap<Element, string>();
let keyCounter = 0;
function getStableElementKey(el: Element): string {
  let key = elementKeyMap.get(el);
  if (!key) {
    key = `layer-node-${++keyCounter}`;
    elementKeyMap.set(el, key);
  }
  return key;
}

interface LayersTreeProps {
  iframeDocument: Document | null;
  selectedElement: Element | null;
  onSelectElement: (el: Element) => void;
  onHoverElement: (el: Element | null) => void;
  onDeleteElement?: (el: Element) => void;
  onDuplicateElement?: (el: Element) => void;
  onMoveElement?: (sourceEl: Element, targetEl: Element, position: "before" | "after" | "inside") => void;
  onWrapWithDiv?: (el: Element) => void;
  onInsertChild?: (targetEl: Element, snippet: string) => void;
  onMoveUp?: (el: Element) => void;
  onMoveDown?: (el: Element) => void;
}

function getElementIcon(el: Element) {
  const tagName = el.tagName.toLowerCase();
  const classStr = typeof el.className === "string" ? el.className.toLowerCase() : "";

  // Check for flex or grid containers
  if (classStr.includes("grid")) {
    return <LayoutGrid className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (classStr.includes("flex") && (classStr.includes("flex-row") || !classStr.includes("flex-col"))) {
    return <Columns className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
  }

  switch (tagName) {
    // Structural / Layout (Purple/Indigo)
    case "section":
      return <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    case "header":
    case "footer":
      return <PanelsTopBottom className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case "nav":
      return <Navigation className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
    case "aside":
    case "sidebar":
      return <Sidebar className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case "main":
    case "article":
      return <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />;

    // Typography (Sky/Emerald/Teal)
    case "h1":
      return <Heading1 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case "h2":
      return <Heading2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case "h3":
      return <Heading3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case "h4":
    case "h5":
    case "h6":
      return <Heading className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
    case "p":
      return <Pilcrow className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case "span":
      return <Type className="w-3.5 h-3.5 text-sky-300 shrink-0" />;
    case "blockquote":
      return <Quote className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    case "code":
    case "pre":
      return <Code2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />;

    // Media (Rose/Pink/Violet)
    case "img":
      return <ImageIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    case "svg":
    case "path":
      return <Shapes className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    case "video":
      return <Video className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
    case "audio":
      return <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />;

    // Interactive & Forms (Amber/Orange/Yellow)
    case "a":
      return <Link2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case "button":
      return <MousePointerClick className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    case "input":
      return <FormInput className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    case "textarea":
      return <SquarePen className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    case "label":
      return <Tag className="w-3.5 h-3.5 text-teal-400 shrink-0" />;

    // Lists & Tables (Cyan/Blue)
    case "ul":
      return <List className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    case "ol":
    case "li":
      return <ListOrdered className="w-3.5 h-3.5 text-cyan-300 shrink-0" />;
    case "table":
    case "tr":
    case "td":
    case "th":
      return <Table className="w-3.5 h-3.5 text-blue-400 shrink-0" />;

    default:
      return <Box className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />;
  }
}

function matchesSearch(el: Element, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const tag = el.tagName.toLowerCase();
  if (tag.includes(q)) return true;
  if (el.id && el.id.toLowerCase().includes(q)) return true;
  if (typeof el.className === "string" && el.className.toLowerCase().includes(q)) return true;
  const text = el.textContent?.trim().slice(0, 100).toLowerCase() || "";
  if (text.includes(q)) return true;
  return false;
}

function subtreeMatchesSearch(el: Element, query: string): boolean {
  if (!query) return true;
  if (matchesSearch(el, query)) return true;
  for (const child of Array.from(el.children)) {
    if (subtreeMatchesSearch(child, query)) return true;
  }
  return false;
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
  onWrapWithDiv?: (el: Element) => void;
  onInsertChild?: (targetEl: Element, snippet: string) => void;
  onMoveUp?: (el: Element) => void;
  onMoveDown?: (el: Element) => void;
  searchQuery?: string;
}

const TreeNode = memo(function TreeNode({
  el,
  depth,
  selectedElement,
  onSelectElement,
  onHoverElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
  onWrapWithDiv,
  onInsertChild,
  onMoveUp,
  onMoveDown,
  searchQuery = "",
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const isSelected = selectedElement === el;
  const tagName = el.tagName.toLowerCase();

  if (tagName === "script" || tagName === "style" || tagName === "link" || tagName === "meta") {
    return null;
  }

  if (searchQuery && !subtreeMatchesSearch(el, searchQuery)) {
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
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#0099ff] z-20 shadow-sm shadow-blue-500/50" />
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
        className={`group flex items-center justify-between py-1.5 pr-2.5 text-xs cursor-pointer transition-all ${
          dropPosition === "inside"
            ? "bg-[#0099ff]/15 border-l-2 border-[#0099ff] text-slate-900 dark:text-white font-semibold"
            : isSelected
            ? "bg-[#0099ff]/12 dark:bg-[#0099ff]/15 border-l-2 border-[#0099ff] text-slate-900 dark:text-white font-semibold shadow-xs"
            : "border-l-2 border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-[#1a1a1a]"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {!isBody && (
            <GripVertical className="w-3 h-3 text-slate-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0" />
          )}

          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="p-0.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 rounded cursor-pointer shrink-0"
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {getElementIcon(el)}

          <span className="font-mono text-[13px] text-slate-900 dark:text-zinc-100 font-semibold">
            {tagName}
          </span>

          {idStr && (
            <span className="font-mono text-[12px] text-[#0099ff] font-medium truncate max-w-[90px]">
              {idStr}
            </span>
          )}

          {classStr && (
            <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-400 truncate max-w-[100px]">
              {classStr}
            </span>
          )}

          {isSelected && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#0099ff] text-[10px] text-white font-bold shrink-0 shadow-2xs">
              ACTIVE
            </span>
          )}
        </div>

        {/* Quick Actions on Hover & Selection */}
        <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
          {/* Wrap with Auto-Div (Cmd+G / Group in Container) */}
          {onWrapWithDiv && !isBody && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onWrapWithDiv(el);
              }}
              className="p-1 rounded text-slate-400 dark:text-zinc-500 hover:text-[#0099ff] hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors"
              title="Wrap with Auto-Div Container (Ctrl+G)"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Move Up */}
          {onMoveUp && !isBody && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(el);
              }}
              className="p-1 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors"
              title="Move layer up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Move Down */}
          {onMoveDown && !isBody && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(el);
              }}
              className="p-1 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors"
              title="Move layer down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicate */}
          {onDuplicateElement && !isBody && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateElement(el);
              }}
              className="p-1 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors"
              title="Duplicate layer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete */}
          {onDeleteElement && !isBody && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteElement(el);
              }}
              className="p-1 rounded text-slate-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors"
              title="Delete layer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Drop indicator line after */}
      {dropPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0099ff] z-20 shadow-sm shadow-blue-500/50" />
      )}

      {hasChildren && expanded && (
        <div className="flex flex-col">
          {children.map((child) => (
            <TreeNode
              key={getStableElementKey(child)}
              el={child}
              depth={depth + 1}
              selectedElement={selectedElement}
              onSelectElement={onSelectElement}
              onHoverElement={onHoverElement}
              onDeleteElement={onDeleteElement}
              onDuplicateElement={onDuplicateElement}
              onMoveElement={onMoveElement}
              onWrapWithDiv={onWrapWithDiv}
              onInsertChild={onInsertChild}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default function LayersTree({
  iframeDocument,
  selectedElement,
  onSelectElement,
  onHoverElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
  onWrapWithDiv,
  onInsertChild,
  onMoveUp,
  onMoveDown,
}: LayersTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search Input & Quick Actions */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-[#262626] flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search layers…"
            className="w-full bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-lg pl-8 pr-7 py-1.5 text-[13px] text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-[#0099ff]/50 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Global Wrap with Auto-Div Button */}
        {selectedElement && onWrapWithDiv && (
          <button
            type="button"
            onClick={() => onWrapWithDiv(selectedElement)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] hover:border-[#0099ff]/50 text-slate-600 dark:text-zinc-300 hover:text-[#0099ff] transition-colors cursor-pointer shrink-0"
            title="Wrap Selected Layer in Auto-Div (Ctrl+G)"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        <TreeNode
          el={body}
          depth={0}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          onHoverElement={onHoverElement}
          onDeleteElement={onDeleteElement}
          onDuplicateElement={onDuplicateElement}
          onMoveElement={onMoveElement}
          onWrapWithDiv={onWrapWithDiv}
          onInsertChild={onInsertChild}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}


