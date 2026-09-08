import { useEffect, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { Link2, ExternalLink } from "lucide-react";

interface LinkGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  onEdit?: (record: EditRecord) => void;
}

export default function LinkGroup({ element, structuralPath, theme, onEdit }: LinkGroupProps) {
  const [href, setHref] = useState("");
  const [targetBlank, setTargetBlank] = useState(false);

  useEffect(() => {
    if (!element) return;
    const linkEl = (element.tagName.toLowerCase() === "a"
      ? element
      : element.closest("a")) as HTMLAnchorElement | null;

    if (linkEl) {
      setHref(linkEl.getAttribute("href") || "");
      setTargetBlank(linkEl.getAttribute("target") === "_blank");
    }
  }, [element]);

  if (!element || !structuralPath) return null;
  const isLink = element.tagName.toLowerCase() === "a" || element.closest("a") !== null;
  if (!isLink) return null;

  const targetEl = element.tagName.toLowerCase() === "a" ? element : element.closest("a")!;

  function commitAttribute(name: string, value: string, oldValue: string) {
    targetEl.setAttribute(name, value);
    onEdit?.({
      kind: "attribute",
      structuralPath: structuralPath!,
      property: name,
      attributeName: name,
      oldValue,
      newValue: value,
      timestamp: new Date().toISOString(),
    });
  }

  function handleHrefBlur() {
    const oldHref = targetEl.getAttribute("href") || "";
    if (oldHref !== href) {
      commitAttribute("href", href, oldHref);
    }
  }

  function handleTargetToggle() {
    const next = !targetBlank;
    setTargetBlank(next);
    const oldTarget = targetEl.getAttribute("target") || "";
    const newTarget = next ? "_blank" : "";
    commitAttribute("target", newTarget, oldTarget);
    if (next) {
      targetEl.setAttribute("rel", "noopener noreferrer");
    } else {
      targetEl.removeAttribute("rel");
    }
  }

  return (
    <div className="p-4 border-b border-gray-800 space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <Link2 className="w-3.5 h-3.5 text-indigo-400" />
        <span>Link & Navigation</span>
      </div>

      {/* Destination URL */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 block">Link Destination (href)</label>
        <input
          type="text"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          onBlur={handleHrefBlur}
          placeholder="https://... or #section"
          className="w-full bg-gray-900 border border-gray-700/80 hover:border-gray-600 focus:border-indigo-500 rounded px-2.5 py-1 text-xs text-gray-200 outline-none"
        />
      </div>

      {/* Target Options */}
      <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={targetBlank}
          onChange={handleTargetToggle}
          className="rounded bg-gray-900 border-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
        />
        <span className="flex items-center gap-1.5">
          <span>Open in New Tab</span>
          <ExternalLink className="w-3 h-3 text-gray-500" />
        </span>
      </label>
    </div>
  );
}
