import { useState } from "react";
import {
  Square,
  Type,
  Heading,
  AlignLeft,
  MousePointerClick,
  Image,
  Columns,
  Rows,
  Grid,
  FileText,
  Link,
  Plus,
  Box,
  Layers
} from "lucide-react";

interface BasicComponentsProps {
  onInsert: (snippet: string, position: "inside" | "after" | "before") => void;
  selectedElement: Element | null;
}

interface ComponentDef {
  id: string;
  name: string;
  category: "Structure" | "Typography" | "Forms" | "Media";
  icon: any;
  description: string;
  snippet: string;
}

const PRIMITIVES: ComponentDef[] = [
  {
    id: "container",
    name: "Container Frame",
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
    category: "Typography",
    icon: Type,
    description: "Medium section headline (h2)",
    snippet: `<h2 class="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
  Interactive Features
</h2>`,
  },
  {
    id: "paragraph",
    name: "Text Paragraph",
    category: "Typography",
    icon: AlignLeft,
    description: "Clean body text block",
    snippet: `<p class="text-base text-zinc-300 leading-relaxed max-w-prose">
  Design and publish high-performance web pages directly in the browser with real-time feedback.
</p>`,
  },
  {
    id: "pill-btn",
    name: "Framer Pill Button",
    category: "Forms",
    icon: MousePointerClick,
    description: "White primary CTA pill",
    snippet: `<button class="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all shadow-sm cursor-pointer">
  Get Started Free
</button>`,
  },
  {
    id: "secondary-btn",
    name: "Secondary Pill Button",
    category: "Forms",
    icon: MousePointerClick,
    description: "Dark charcoal button with subtle border",
    snippet: `<button class="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm border border-zinc-700 transition-all cursor-pointer">
  Learn More
</button>`,
  },
  {
    id: "input-field",
    name: "Text Input",
    category: "Forms",
    icon: FileText,
    description: "Modern form input with focus ring",
    snippet: `<div class="space-y-1.5 w-full">
  <label class="text-xs font-medium text-zinc-300 block">Email Address</label>
  <input type="email" placeholder="you@company.com" class="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-blue-500" />
</div>`,
  },
  {
    id: "textarea-field",
    name: "Textarea Area",
    category: "Forms",
    icon: FileText,
    description: "Multiline textarea field",
    snippet: `<div class="space-y-1.5 w-full">
  <label class="text-xs font-medium text-zinc-300 block">Message</label>
  <textarea rows="3" placeholder="Write your message here..." class="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"></textarea>
</div>`,
  },
  {
    id: "image-card",
    name: "Media Image",
    category: "Media",
    icon: Image,
    description: "Responsive rounded photo frame",
    snippet: `<div class="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" alt="Abstract gradient visual" class="w-full h-56 object-cover" />
</div>`,
  },
  {
    id: "link-item",
    name: "Action Link",
    category: "Media",
    icon: Link,
    description: "Interactive inline link",
    snippet: `<a href="#" class="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
  Explore documentation &rarr;
</a>`,
  },
];

export default function BasicComponents({ onInsert, selectedElement }: BasicComponentsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [position, setPosition] = useState<"inside" | "after" | "before">("after");

  const categories = ["All", "Structure", "Typography", "Forms", "Media"];
  const filtered = activeCategory === "All" ? PRIMITIVES : PRIMITIVES.filter((p) => p.category === activeCategory);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#141414] text-slate-800 dark:text-white transition-colors">
      {/* Category Pills */}
      <div className="p-3 border-b border-slate-200 dark:border-[#262626] space-y-2.5 bg-slate-50/50 dark:bg-[#090909]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Insert Elements</span>
          <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-[#1c1c1c] p-0.5 rounded-lg border border-slate-300/50 dark:border-[#262626] text-[11px]">
            <button
              type="button"
              onClick={() => setPosition("after")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                position === "after"
                  ? "bg-white dark:bg-[#262626] text-slate-900 dark:text-white font-semibold shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              After
            </button>
            <button
              type="button"
              onClick={() => setPosition("inside")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                position === "inside"
                  ? "bg-white dark:bg-[#262626] text-slate-900 dark:text-white font-semibold shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Inside
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === c
                  ? "bg-[#0099ff] text-white font-semibold shadow-xs"
                  : "bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#262626]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="text-[10px] text-slate-400 dark:text-zinc-400 flex items-center justify-between px-1 pt-0.5">
          <span>Drag into canvas, or click + to insert</span>
        </div>
      </div>

      {/* Components Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData("application/x-visual-editor-snippet", item.snippet);
                e.dataTransfer.setData("text/plain", item.snippet);
                e.dataTransfer.effectAllowed = "copy";
                (window as any).__draggedComponentSnippet = item.snippet;
                (window as any).__draggedComponentName = item.name;
              }}
              onDragEnd={() => {
                (window as any).__draggedComponentSnippet = null;
                (window as any).__draggedComponentName = null;
              }}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] hover:bg-slate-100 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#262626] hover:border-[#0099ff]/50 active:scale-[0.98] transition-all group cursor-grab active:cursor-grabbing flex items-center justify-between select-none shadow-2xs"
              onClick={() => onInsert(item.snippet, position)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-200/60 dark:bg-[#141414] flex items-center justify-center text-slate-600 dark:text-zinc-300 group-hover:text-[#0099ff] group-hover:bg-[#0099ff]/10 transition-colors shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-500 line-clamp-1">{item.description}</div>
                </div>
              </div>
              <button
                type="button"
                className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-[#262626] group-hover:bg-[#0099ff] flex items-center justify-center text-slate-600 dark:text-zinc-400 group-hover:text-white transition-all shadow-xs shrink-0 cursor-pointer ml-2"
                title={`Insert ${item.name}`}
                aria-label={`Insert ${item.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onInsert(item.snippet, position);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

