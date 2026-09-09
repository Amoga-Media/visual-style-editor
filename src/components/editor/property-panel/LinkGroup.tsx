import { useEffect, useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import { Link2, ExternalLink } from "lucide-react";

import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";

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
  const anchorPath = computeStructuralPath(targetEl, domAdapter);

  function commitAttribute(name: string, value: string, oldValue: string) {
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

    const oldRel = targetEl.getAttribute("rel") || "";
    if (next) {
      // Add noopener and noreferrer while preserving any custom rel tokens (e.g. nofollow sponsored)
      const tokens = new Set(oldRel.split(/\s+/).filter(Boolean));
      tokens.add("noopener");
      tokens.add("noreferrer");
      const newRel = Array.from(tokens).join(" ");
      if (newRel !== oldRel) {
        commitAttribute("rel", newRel, oldRel);
      }
    } else {
      // Remove noopener and noreferrer while preserving user-authored rel tokens
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

  return (
    <div className="p-4 border-b border-[#262626] space-y-4">
      {/* Destination URL */}
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

      {/* Target Options */}
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
    </div>
  );
}
