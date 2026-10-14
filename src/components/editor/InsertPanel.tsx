import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Box,
  Square,
  Columns,
  Grid,
  Rows,
  Heading,
  Type,
  AlignLeft,
  MousePointerClick,
  Tag,
  User,
  CreditCard,
  MessageSquareQuote,
  Mail,
  Sparkles,
  LayoutTemplate,
  Split,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  X,
  FileCode2,
} from "lucide-react";
import { COMPONENT_BLOCKS, type ComponentBlock } from "./ComponentBlocks";

export type InsertPosition = "inside" | "after" | "before";

export interface InsertItem {
  id: string;
  name: string;
  kind: "element" | "block";
  category: "Structure" | "Typography" | "Forms" | "Media" | "Marketing" | "Cards";
  icon: any;
  description: string;
  snippet: string;
}

const ELEMENT_PRIMITIVES: InsertItem[] = [
  {
    id: "container",
    name: "Container Frame",
    kind: "element",
    category: "Structure",
    icon: Box,
    description: "Sleek rounded box container with subtle border",
    snippet: `<div class="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-white flex flex-col gap-3">
  <h3 class="text-lg font-semibold tracking-tight">Frame Title</h3>
  <p class="text-sm text-zinc-400">Add any elements inside this container.</p>
</div>`,
  },
  {
    id: "section",
    name: "Page Section",
    kind: "element",
    category: "Structure",
    icon: Square,
    description: "Full-width section with max-width container",
    snippet: `<section class="py-16 px-6 max-w-6xl mx-auto flex flex-col gap-6">
  <h2 class="text-3xl font-bold tracking-tight text-white">Section Heading</h2>
  <p class="text-base text-zinc-400 max-w-2xl">A clean section for content, features, or callouts.</p>
</section>`,
  },
  {
    id: "grid-2",
    name: "2-Column Grid",
    kind: "element",
    category: "Structure",
    icon: Columns,
    description: "Responsive 2-column layout",
    snippet: `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
  <div class="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
    <h4 class="font-semibold mb-2">Column One</h4>
    <p class="text-sm text-zinc-400">Left column content block.</p>
  </div>
  <div class="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
    <h4 class="font-semibold mb-2">Column Two</h4>
    <p class="text-sm text-zinc-400">Right column content block.</p>
  </div>
</div>`,
  },
  {
    id: "grid-3",
    name: "3-Column Grid",
    kind: "element",
    category: "Structure",
    icon: Grid,
    description: "Responsive 3-column cards",
    snippet: `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
  <div class="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white">
    <h4 class="font-semibold mb-1">Feature A</h4>
    <p class="text-xs text-zinc-400">Card description.</p>
  </div>
  <div class="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white">
    <h4 class="font-semibold mb-1">Feature B</h4>
    <p class="text-xs text-zinc-400">Card description.</p>
  </div>
  <div class="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white">
    <h4 class="font-semibold mb-1">Feature C</h4>
    <p class="text-xs text-zinc-400">Card description.</p>
  </div>
</div>`,
  },
  {
    id: "flex-row",
    name: "Flex Row",
    kind: "element",
    category: "Structure",
    icon: Rows,
    description: "Horizontal flex alignment container",
    snippet: `<div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
  <span class="text-sm font-medium text-white">Item Left</span>
  <span class="text-xs text-zinc-400">Item Right</span>
</div>`,
  },
  {
    id: "heading-1",
    name: "Display Heading 1",
    kind: "element",
    category: "Typography",
    icon: Heading,
    description: "Large bold title (h1)",
    snippet: `<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
  Build Better Fast
</h1>`,
  },
  {
    id: "heading-2",
    name: "Section Heading 2",
    kind: "element",
    category: "Typography",
    icon: Type,
    description: "Medium section headline (h2)",
    snippet: `<h2 class="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
  Engineered for Precision
</h2>`,
  },
  {
    id: "paragraph",
    name: "Body Text Paragraph",
    kind: "element",
    category: "Typography",
    icon: AlignLeft,
    description: "Standard readable text paragraph",
    snippet: `<p class="text-base text-zinc-400 leading-relaxed max-w-prose">
  Visual Style Editor gives you full in-browser control over your CSS and Tailwind styles with instant live updates.
</p>`,
  },
  {
    id: "button-primary",
    name: "Primary Button",
    kind: "element",
    category: "Forms",
    icon: MousePointerClick,
    description: "Accent colored interactive CTA button",
    snippet: `<button class="px-5 py-2.5 rounded-xl bg-[#0099ff] hover:bg-[#0088ee] text-white font-semibold text-sm transition-all shadow-md shadow-[#0099ff]/20 cursor-pointer">
  Get Started Now
</button>`,
  },
  {
    id: "badge",
    name: "Pill Tag / Badge",
    kind: "element",
    category: "Typography",
    icon: Tag,
    description: "Subtle indicator badge",
    snippet: `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
  ● Live Preview
</span>`,
  },
  {
    id: "avatar",
    name: "User Avatar",
    kind: "element",
    category: "Media",
    icon: User,
    description: "Avatar with active status dot",
    snippet: `<div class="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#0099ff] to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
  <span>JD</span>
  <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950"></span>
</div>`,
  },
  {
    id: "image-card",
    name: "Responsive Image",
    kind: "element",
    category: "Media",
    icon: ImageIcon,
    description: "Curved aspect-ratio image container",
    snippet: `<div class="w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80" alt="Sample" class="w-full h-full object-cover" />
</div>`,
  },
];

const BLOCK_ITEMS: InsertItem[] = COMPONENT_BLOCKS.map((b) => ({
  id: b.id,
  name: b.title,
  kind: "block",
  category: b.category === "cards" ? "Cards" : "Marketing",
  icon: b.icon,
  description: b.description,
  snippet: b.snippet,
}));

const ALL_INSERT_ITEMS: InsertItem[] = [...ELEMENT_PRIMITIVES, ...BLOCK_ITEMS];

interface InsertPanelProps {
  onInsertElement: (snippet: string, position: InsertPosition) => void;
  selectedElement: Element | null;
}

export default function InsertPanel({ onInsertElement, selectedElement }: InsertPanelProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "element" | "block">("all");
  const [position, setPosition] = useState<InsertPosition>("inside");

  const filteredItems = useMemo(() => {
    return ALL_INSERT_ITEMS.filter((item) => {
      if (filterType !== "all" && item.kind !== filterType) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [search, filterType]);

  function handleInsert(item: InsertItem) {
    onInsertElement(item.snippet, position);
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, item: InsertItem) {
    e.dataTransfer.setData("text/html", item.snippet);
    e.dataTransfer.setData("text/plain", item.snippet);
    e.dataTransfer.setData("application/vse-snippet", item.snippet);
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#141414] text-slate-800 dark:text-zinc-200">
      {/* 1. Header with Search and Mode Toggle */}
      <div className="p-3 border-b border-slate-200 dark:border-[#262626] space-y-2.5 bg-slate-50 dark:bg-[#0c0c0e]">
        {/* Instant Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search elements & blocks..."
            aria-label="Search elements and blocks"
            className="w-full bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-[#2e2e33] rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills: All / Elements / Blocks */}
        <div className="grid grid-cols-3 p-0.5 bg-slate-200/70 dark:bg-[#18181b] rounded-xl border border-slate-300/50 dark:border-[#262626] text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`py-1 rounded-lg transition-all text-center cursor-pointer ${
              filterType === "all"
                ? "bg-white dark:bg-[#27272a] text-[#0099ff] dark:text-white shadow-2xs font-bold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            All ({ALL_INSERT_ITEMS.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("element")}
            className={`py-1 rounded-lg transition-all text-center cursor-pointer ${
              filterType === "element"
                ? "bg-white dark:bg-[#27272a] text-[#0099ff] dark:text-white shadow-2xs font-bold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            Elements ({ELEMENT_PRIMITIVES.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("block")}
            className={`py-1 rounded-lg transition-all text-center cursor-pointer ${
              filterType === "block"
                ? "bg-white dark:bg-[#27272a] text-[#0099ff] dark:text-white shadow-2xs font-bold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            Blocks ({BLOCK_ITEMS.length})
          </button>
        </div>

        {/* Target Insertion Placement Context */}
        <div className="flex items-center justify-between px-2 py-1 bg-white dark:bg-[#161618] rounded-lg border border-slate-200 dark:border-[#262626] text-[10px]">
          <span className="text-slate-500 dark:text-zinc-400 font-medium truncate max-w-[120px]">
            {selectedElement ? `Target: <${selectedElement.tagName.toLowerCase()}>` : "Target: Canvas Body"}
          </span>
          <div className="flex items-center gap-1 font-semibold">
            {(["inside", "after", "before"] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setPosition(pos)}
                className={`px-1.5 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                  position === pos
                    ? "bg-[#0099ff]/15 text-[#0099ff] font-bold"
                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Scrollable Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
            No components matching &ldquo;{search}&rdquo;
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = item.icon;
            const isBlock = item.kind === "block";

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => handleInsert(item)}
                className="group p-2.5 rounded-xl border border-slate-200/80 dark:border-[#262626] bg-slate-50/50 dark:bg-[#18181b]/50 hover:bg-white dark:hover:bg-[#1e1e22] hover:border-[#0099ff]/40 dark:hover:border-[#0099ff]/40 transition-all cursor-pointer shadow-2xs hover:shadow-md relative flex items-start gap-2.5 select-none"
              >
                {/* Icon box */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                    isBlock
                      ? "bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20"
                      : "bg-[#0099ff]/10 border-[#0099ff]/20 text-[#0099ff] group-hover:bg-[#0099ff]/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 border ${
                        isBlock
                          ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                          : "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30"
                      }`}
                    >
                      {item.kind}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Quick Add Button */}
                <button
                  type="button"
                  aria-label={`Insert ${item.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInsert(item);
                  }}
                  className="absolute right-2 top-2.5 p-1 rounded-lg bg-slate-200/80 dark:bg-[#28282c] group-hover:bg-[#0099ff] text-slate-600 dark:text-zinc-300 group-hover:text-white transition-all shadow-xs cursor-pointer"
                  title={`Insert ${item.name} (${position})`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
