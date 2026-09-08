import { create } from "zustand";
import type { EditRecord } from "@/types";
import { useChangeSetStore } from "./change-set-store";
import { resolveElementByStructuralPath } from "../lib/dom/resolve-live-path";
import { setResponsiveStyle, syncResponsiveStylesheet } from "../lib/dom/responsive-style-engine";

export function findLiveElement(root: Document, path: string): Element | null {
  if (!root || !path) return null;

  // 1. Try data-vse-path selector
  try {
    const byVsePath = root.querySelector(`[data-vse-path="${path}"]`);
    if (byVsePath) return byVsePath;
  } catch {}

  // 2. Try id if path is #id
  if (path.startsWith("#")) {
    const byId = root.getElementById(path.slice(1));
    if (byId) return byId;
  }

  // 3. Try standard querySelector
  try {
    const byQuery = root.querySelector(path);
    if (byQuery) return byQuery;
  } catch {}

  // 4. Try resolveElementByStructuralPath
  try {
    const byStructural = resolveElementByStructuralPath(root, path);
    if (byStructural) return byStructural;
  } catch {}

  return null;
}

export function reconcileDom(from: EditRecord[], to: EditRecord[], iframeDocument: Document | null): void {
  if (!iframeDocument) return;

  function keyFor(edit: EditRecord): string {
    if (edit.kind === "class") return `${edit.structuralPath}::class::${edit.property || "classes"}`;
    if (edit.kind === "style") return `${edit.structuralPath}::style::${edit.styleProperty || edit.property}::${edit.viewport || "desktop"}`;
    if (edit.kind === "attribute") return `${edit.structuralPath}::attribute::${edit.attributeName || edit.property}`;
    if (edit.kind === "text") return `${edit.structuralPath}::text::content`;
    return `${edit.structuralPath}::${edit.kind}::${edit.timestamp || Math.random()}`;
  }

  const fromByKey = new Map(from.map((e) => [keyFor(e), e]));
  const toByKey = new Map(to.map((e) => [keyFor(e), e]));
  const allKeys = new Set([...fromByKey.keys(), ...toByKey.keys()]);

  let responsiveUpdated = false;

  for (const key of allKeys) {
    const target = toByKey.get(key);
    const source = fromByKey.get(key);
    const structuralPath = (target ?? source)?.structuralPath;
    if (!structuralPath) continue;

    const el = findLiveElement(iframeDocument, structuralPath);
    if (!el) continue;

    if (target) {
      if (target.kind === "class") {
        el.className = target.newClassList.join(" ");
      } else if (target.kind === "style") {
        const vp = target.viewport || "desktop";
        if (vp !== "desktop") {
          setResponsiveStyle(el, target.structuralPath, target.property, target.newStyleValue, vp);
          responsiveUpdated = true;
        } else {
          if ("style" in el) {
            (el as HTMLElement).style.setProperty(target.styleProperty, target.newStyleValue, "important");
            if (target.styleProperty === "color" || target.property === "text-color") {
              try { (el as HTMLElement).style.setProperty("-webkit-text-fill-color", target.newStyleValue, "important"); } catch {}
            }
          }
          setResponsiveStyle(el, target.structuralPath, target.property, target.newStyleValue, "desktop");
          responsiveUpdated = true;
        }
      } else if (target.kind === "attribute") {
        el.setAttribute(target.attributeName, target.newValue);
      } else if (target.kind === "text") {
        el.textContent = target.newText;
      }
    } else if (source) {
      if (source.kind === "class") {
        el.className = source.oldClassList.join(" ");
      } else if (source.kind === "style") {
        const vp = source.viewport || "desktop";
        if (vp !== "desktop") {
          setResponsiveStyle(el, source.structuralPath, source.property, source.oldStyleValue || "", vp);
          responsiveUpdated = true;
        } else {
          if ("style" in el) {
            if (source.oldStyleValue) {
              (el as HTMLElement).style.setProperty(source.styleProperty, source.oldStyleValue, "important");
              if (source.styleProperty === "color" || source.property === "text-color") {
                try { (el as HTMLElement).style.setProperty("-webkit-text-fill-color", source.oldStyleValue, "important"); } catch {}
              }
            } else {
              (el as HTMLElement).style.removeProperty(source.styleProperty);
              if (source.styleProperty === "color" || source.property === "text-color") {
                try { (el as HTMLElement).style.removeProperty("-webkit-text-fill-color"); } catch {}
              }
            }
          }
          setResponsiveStyle(el, source.structuralPath, source.property, source.oldStyleValue || "", "desktop");
          responsiveUpdated = true;
        }
      } else if (source.kind === "attribute") {
        if (source.oldValue) {
          el.setAttribute(source.attributeName, source.oldValue);
        } else {
          el.removeAttribute(source.attributeName);
        }
      } else if (source.kind === "text") {
        el.textContent = source.oldText;
      }
    }
  }

  if (responsiveUpdated) {
    syncResponsiveStylesheet(iframeDocument);
  }
}

interface UndoState {
  past: EditRecord[][];
  future: EditRecord[][];
  pushHistory(preCommitEdits: EditRecord[]): void;
  undo(iframeDocument: Document | null): void;
  redo(iframeDocument: Document | null): void;
  reset(): void;
}

export const useUndoStore = create<UndoState>((set, get) => ({
  past: [],
  future: [],

  pushHistory: (preCommitEdits) => set((s) => ({ past: [...s.past, [...preCommitEdits]], future: [] })),

  undo: (iframeDocument) => {
    const { past } = get();
    if (past.length === 0) return;
    const current = useChangeSetStore.getState().edits;
    const target = past[past.length - 1];

    set((s) => ({ past: s.past.slice(0, -1), future: [current, ...s.future] }));
    useChangeSetStore.setState({ edits: target });
    reconcileDom(current, target, iframeDocument);
  },

  redo: (iframeDocument) => {
    const { future } = get();
    if (future.length === 0) return;
    const current = useChangeSetStore.getState().edits;
    const target = future[0];

    set((s) => ({ future: s.future.slice(1), past: [...s.past, current] }));
    useChangeSetStore.setState({ edits: target });
    reconcileDom(current, target, iframeDocument);
  },

  reset: () => set({ past: [], future: [] }),
}));
