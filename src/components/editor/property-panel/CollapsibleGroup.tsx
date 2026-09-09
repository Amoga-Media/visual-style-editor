import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronRight, Plus } from "lucide-react";

// Persist open/close state per group across re-renders
const groupStateMap = new Map<string, boolean>();

interface CollapsibleGroupProps {
  /** Unique group identifier for state persistence */
  groupId: string;
  /** Group title */
  title: string;
  /** Icon element displayed next to title */
  icon?: ReactNode;
  /** Whether the group starts open by default (first render only) */
  defaultOpen?: boolean;
  /** Badge text (e.g. "3 props" or "Override") */
  badge?: string;
  /** Badge color class override */
  badgeColor?: string;
  /** Children content */
  children: ReactNode;
}

export default function CollapsibleGroup({
  groupId,
  title,
  icon,
  defaultOpen = true,
  badge,
  badgeColor,
  children,
}: CollapsibleGroupProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const persisted = groupStateMap.get(groupId);
    return persisted !== undefined ? persisted : defaultOpen;
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | "auto">(isOpen ? "auto" : 0);

  useEffect(() => {
    groupStateMap.set(groupId, isOpen);
  }, [groupId, isOpen]);

  useEffect(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
      const timer = setTimeout(() => setContentHeight("auto"), 200);
      return () => clearTimeout(timer);
    } else {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setContentHeight(0);
        });
      });
    }
  }, [isOpen]);

  function toggle() {
    setIsOpen((prev) => !prev);
  }

  return (
    <div className="border-b border-slate-200 dark:border-[#262626]">
      {/* Group Header */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={`Toggle ${title} properties`}
        className="w-full flex items-center justify-between px-3.5 py-2 group cursor-pointer select-none transition-colors hover:bg-slate-50 dark:hover:bg-[#1c1c1c] active:bg-slate-100 dark:active:bg-[#181818]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight
            className={`w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${
              isOpen ? "rotate-90 text-[#0099ff]" : ""
            }`}
          />
          {icon && (
            <span className="text-slate-500 dark:text-zinc-400 shrink-0">{icon}</span>
          )}
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            {title}
          </span>
          {badge && (
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                badgeColor ||
                "bg-slate-100 dark:bg-[#262626] text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-[#333333]"
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        <Plus
          className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-all duration-200 ${
            isOpen
              ? "rotate-45 text-[#0099ff]"
              : "group-hover:text-slate-600 dark:group-hover:text-zinc-300"
          }`}
        />
      </button>

      {/* Animated Content Area */}
      <div
        ref={contentRef}
        style={{
          height: contentHeight === "auto" ? "auto" : `${contentHeight}px`,
          overflow: contentHeight === "auto" ? "visible" : "hidden",
          transition: contentHeight === "auto" ? "none" : "height 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}

