import { ChevronRight } from "lucide-react";

interface BreadcrumbsProps {
  element: Element | null;
  onSelectElement: (el: Element) => void;
  onHoverElement?: (el: Element | null) => void;
}

interface HierarchyNode {
  element: Element;
  tag: string;
  id?: string;
  className?: string;
}

export default function Breadcrumbs({ element, onSelectElement, onHoverElement }: BreadcrumbsProps) {
  if (!element) return null;

  const hierarchy: HierarchyNode[] = [];
  let curr: Element | null = element;

  while (curr && curr.tagName.toLowerCase() !== "html") {
    const tag = curr.tagName.toLowerCase();
    const id = curr.id ? `#${curr.id}` : undefined;
    const firstClass = curr.classList[0] ? `.${curr.classList[0]}` : undefined;
    hierarchy.unshift({ element: curr, tag, id, className: firstClass });
    curr = curr.parentElement;
  }

  return (
    <div className="h-8 bg-[#141414] border-t border-[#262626] px-4 flex items-center gap-1.5 overflow-x-auto text-xs font-mono select-none z-20 shrink-0">
      <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1 tracking-wider">Path:</span>
      {hierarchy.map((node, idx) => {
        const isLast = idx === hierarchy.length - 1;
        return (
          <div key={idx} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onSelectElement(node.element)}
              onMouseEnter={() => onHoverElement?.(node.element)}
              onMouseLeave={() => onHoverElement?.(null)}
              className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer flex items-center gap-0.5 text-[11px] ${
                isLast
                  ? "bg-[#0099ff]/15 text-[#0099ff] font-semibold border border-[#0099ff]/30"
                  : "text-zinc-400 hover:text-white hover:bg-[#1c1c1c]"
              }`}
            >
              <span>{node.tag}</span>
              {node.id && <span className="text-[#0099ff]">{node.id}</span>}
              {!node.id && node.className && <span className="text-zinc-500">{node.className}</span>}
            </button>
            {!isLast && <ChevronRight className="w-3 h-3 text-zinc-600" />}
          </div>
        );
      })}
    </div>
  );
}
