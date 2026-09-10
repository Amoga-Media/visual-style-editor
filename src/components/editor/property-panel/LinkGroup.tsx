import { useEffect, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { Link2, ExternalLink, Unlink, Plus } from "lucide-react";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";

interface LinkGroupProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  onEdit?: (record: EditRecord) => void;
  onSelectElement?: (el: Element) => void;
}

export default function LinkGroup({ element, structuralPath, theme, onEdit, onSelectElement }: LinkGroupProps) {
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
    } else {
      setHref("");
      setTargetBlank(false);
    }
  }, [element]);

  if (!element || !structuralPath) return null;

  const isAnchor = element.tagName.toLowerCase() === "a";
  const parentAnchor = !isAnchor ? element.closest("a") : null;
  const targetEl = isAnchor ? element : parentAnchor;

  function commitAttribute(name: string, value: string, oldValue: string) {
    if (!targetEl) return;
    const anchorPath = computeStructuralPath(targetEl, domAdapter);
    if (value) {
      targetEl.setAttribute(name, value);
    } else {
      targetEl.removeAttribute(name);
    }
    onEdit?.({
      kind: "attribute",
      structuralPath: anchorPath,
      property: name,
      attributeName: name,
      oldValue,
      newValue: value,
      timestamp: new Date().toISOString(),
    });
  }

  function handleHrefBlur() {
    if (!targetEl) return;
    const oldHref = targetEl.getAttribute("href") || "";
    if (oldHref !== href) {
      commitAttribute("href", href, oldHref);
    }
  }

  function handleTargetToggle() {
    if (!targetEl) {
      setTargetBlank((v) => !v);
      return;
    }
    const next = !targetBlank;
    setTargetBlank(next);
    const oldTarget = targetEl.getAttribute("target") || "";
    const newTarget = next ? "_blank" : "";
    commitAttribute("target", newTarget, oldTarget);

    const oldRel = targetEl.getAttribute("rel") || "";
    if (next) {
      const tokens = new Set(oldRel.split(/\s+/).filter(Boolean));
      tokens.add("noopener");
      tokens.add("noreferrer");
      const newRel = Array.from(tokens).join(" ");
      if (newRel !== oldRel) {
        commitAttribute("rel", newRel, oldRel);
      }
    } else {
      const remaining = oldRel
        .split(/\s+/)
        .filter(Boolean)
        .filter((t) => t !== "noopener" && t !== "noreferrer");
      const newRel = remaining.join(" ");
      if (newRel !== oldRel) {
        commitAttribute("rel", newRel, oldRel);
      }
    }
  }

  function handleWrapWithLink() {
    if (!element || !element.parentElement) return;
    const doc = element.ownerDocument;
    const anchor = doc.createElement("a");
    const linkDestination = href.trim() || "#";
    anchor.setAttribute("href", linkDestination);
    if (targetBlank) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    }

    const currentPath = computeStructuralPath(element, domAdapter);
    element.replaceWith(anchor);
    anchor.appendChild(element);

    const newPath = computeStructuralPath(anchor, domAdapter);

    onEdit?.({
      kind: "insert",
      structuralPath: currentPath,
      position: "inside",
      snippet: anchor.outerHTML,
      insertedPath: newPath,
      timestamp: new Date().toISOString(),
    });

    onSelectElement?.(anchor);
  }

  function handleUnwrapLink() {
    if (!targetEl || !targetEl.parentElement) return;
    const parent = targetEl.parentElement;
    const anchorPath = computeStructuralPath(targetEl, domAdapter);

    const firstChild = targetEl.firstElementChild;
    while (targetEl.firstChild) {
      parent.insertBefore(targetEl.firstChild, targetEl);
    }
    targetEl.remove();

    onEdit?.({
      kind: "delete",
      structuralPath: anchorPath,
      timestamp: new Date().toISOString(),
    });

    if (firstChild && firstChild.isConnected) {
      onSelectElement?.(firstChild);
    } else if (parent && parent.isConnected) {
      onSelectElement?.(parent);
    }
  }

  return (
    <div className="p-4 border-b border-[#262626] space-y-4">
      {targetEl ? (
        /* Element is or is inside an anchor */
        <>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#0099ff] font-medium flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              <span>{isAnchor ? "Anchor Link <a>" : "Inside Link <a>"}</span>
            </span>
            <button
              type="button"
              onClick={handleUnwrapLink}
              className="text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Remove hyperlink container and unwrap contents"
            >
              <Unlink className="w-3 h-3" />
              <span>Unlink</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 block font-medium">Link Destination (href)</label>
            <input
              type="text"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              onBlur={handleHrefBlur}
              placeholder="https://... or #section"
              className="w-full bg-[#141414] border border-[#262626] hover:border-zinc-700 focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={targetBlank}
              onChange={handleTargetToggle}
              aria-label="Open in new tab"
              className="rounded bg-[#141414] border-[#262626] text-[#0099ff] focus:ring-[#0099ff] accent-[#0099ff]"
            />
            <span className="flex items-center gap-1.5 font-medium">
              <span>Open in New Tab</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </span>
          </label>
        </>
      ) : (
        /* Element is NOT an anchor - provide Add Hyperlink capability */
        <div className="space-y-3">
          <div className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Add Hyperlink to &lt;{element.tagName.toLowerCase()}&gt;</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 block font-medium">Destination URL (href)</label>
            <input
              type="text"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="https://... or #section"
              className="w-full bg-[#141414] border border-[#262626] hover:border-zinc-700 focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={targetBlank}
              onChange={() => setTargetBlank((v) => !v)}
              aria-label="Open in new tab"
              className="rounded bg-[#141414] border-[#262626] text-[#0099ff] focus:ring-[#0099ff] accent-[#0099ff]"
            />
            <span className="flex items-center gap-1.5 font-medium">
              <span>Open in New Tab</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </span>
          </label>

          <button
            type="button"
            onClick={handleWrapWithLink}
            className="w-full py-1.5 px-3 rounded-lg bg-[#0099ff] hover:bg-[#33adff] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Wrap with Link &lt;a&gt;</span>
          </button>
        </div>
      )}
    </div>
  );
}
