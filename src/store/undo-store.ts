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

  // 3. Try resolveElementByStructuralPath (matches AST structural resolution)
  try {
    const byStructural = resolveElementByStructuralPath(root, path);
    if (byStructural) return byStructural;
  } catch {}

  // 4. Try standard querySelector as fallback
  try {
    const byQuery = root.querySelector(path);
    if (byQuery) return byQuery;
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
    if (edit.kind === "duplicate") return `${edit.structuralPath}::duplicate::${edit.duplicateId || edit.timestamp}`;
    if (edit.kind === "insert") return `${edit.structuralPath}::insert::${edit.insertedPath || edit.timestamp}`;
    if (edit.kind === "delete") return `${edit.structuralPath}::delete::${edit.timestamp}`;
    if (edit.kind === "move") return `${edit.structuralPath}::move::${edit.targetPath}::${edit.timestamp}`;
    return `${(edit as any).structuralPath}::${(edit as any).kind}::${(edit as any).timestamp}`;
  }

  const fromByKey = new Map(from.map((e) => [keyFor(e), e]));
  const toByKey = new Map(to.map((e) => [keyFor(e), e]));
  const allKeys = new Set([...fromByKey.keys(), ...toByKey.keys()]);

  let responsiveUpdated = false;

  for (const key of allKeys) {
    const target = toByKey.get(key);
    const source = fromByKey.get(key);
    const structuralPath = target?.structuralPath || source?.structuralPath;
    if (!structuralPath) continue;

    // Handle structural mutations (delete, duplicate, insert, move)
    if (target && !source) {
      // Re-applying / Redoing an edit
      if (target.kind === "delete") {
        const delEl = findLiveElement(iframeDocument, target.structuralPath);
        if (delEl && delEl !== iframeDocument.body) delEl.remove();
        continue;
      } else if (target.kind === "duplicate") {
        const origEl = findLiveElement(iframeDocument, target.structuralPath);
        if (origEl) {
          const clone = origEl.cloneNode(true) as Element;
          if (target.duplicateId) clone.id = target.duplicateId;
          origEl.after(clone);
        }
        continue;
      } else if (target.kind === "insert") {
        const parent = findLiveElement(iframeDocument, target.structuralPath) || iframeDocument.body;
        if (parent) {
          const temp = iframeDocument.createElement("div");
          temp.innerHTML = target.snippet;
          const child = temp.firstElementChild;
          if (child) {
            if (target.position === "inside") {
              parent.appendChild(child);
            } else if (target.position === "before" && parent.parentElement) {
              parent.parentElement.insertBefore(child, parent);
            } else if (target.position === "after" && parent.parentElement) {
              parent.parentElement.insertBefore(child, parent.nextSibling);
            } else {
              iframeDocument.body?.appendChild(child);
            }
          }
        }
        continue;
      } else if (target.kind === "move") {
        let moveEl: Element | null = null;
        if (target.moveToken) {
          moveEl = iframeDocument.querySelector(`[data-vse-move-token="${target.moveToken}"]`);
        }
        if (!moveEl && target.elementId) {
          moveEl = iframeDocument.getElementById(target.elementId);
        }
        if (!moveEl) {
          moveEl = findLiveElement(iframeDocument, target.structuralPath);
        }
        const targetParent = findLiveElement(iframeDocument, target.targetPath);
        if (moveEl && targetParent) {
          if (target.position === "inside") {
            targetParent.appendChild(moveEl);
          } else if (target.position === "before" && targetParent.parentElement) {
            targetParent.parentElement.insertBefore(moveEl, targetParent);
          } else if (target.position === "after" && targetParent.parentElement) {
            targetParent.parentElement.insertBefore(moveEl, targetParent.nextSibling);
          }
        }
        continue;
      }
    } else if (source && !target) {
      // Undoing an edit
      if (source.kind === "delete") {
        if (source.serializedHtml) {
          const parent = source.parentPath ? findLiveElement(iframeDocument, source.parentPath) : iframeDocument.body;
          if (parent) {
            const temp = iframeDocument.createElement("div");
            temp.innerHTML = source.serializedHtml;
            const restored = temp.firstElementChild;
            if (restored) {
              const sibling = parent.children[source.siblingIndex ?? 0];
              if (sibling) {
                parent.insertBefore(restored, sibling);
              } else {
                parent.appendChild(restored);
              }
            }
          }
        }
        continue;
      } else if (source.kind === "duplicate") {
        let dupEl: Element | null = null;
        if (source.duplicateId) {
          dupEl = iframeDocument.getElementById(source.duplicateId);
        }
        if (!dupEl && source.duplicatePath) {
          dupEl = findLiveElement(iframeDocument, source.duplicatePath);
        }
        if (dupEl && dupEl !== iframeDocument.body) {
          dupEl.remove();
        }
        continue;
      } else if (source.kind === "insert") {
        const insertedEl = source.insertedPath
          ? findLiveElement(iframeDocument, source.insertedPath)
          : findLiveElement(iframeDocument, source.structuralPath);
        if (insertedEl && insertedEl !== iframeDocument.body) {
          insertedEl.remove();
        }
        continue;
      } else if (source.kind === "move") {
        let movedEl: Element | null = null;
        if (source.moveToken) {
          movedEl = iframeDocument.querySelector(`[data-vse-move-token="${source.moveToken}"]`);
        }
        if (!movedEl && source.elementId) {
          movedEl = iframeDocument.getElementById(source.elementId);
        }
        if (!movedEl && source.newPath) {
          movedEl = findLiveElement(iframeDocument, source.newPath);
        }
        if (!movedEl && source.newParentPath) {
          const parent = findLiveElement(iframeDocument, source.newParentPath);
          if (parent && source.newSiblingIndex !== undefined) {
            movedEl = parent.children[source.newSiblingIndex] || null;
          }
        }
        if (!movedEl) {
          movedEl = findLiveElement(iframeDocument, source.structuralPath);
        }

        const oldParent = source.oldParentPath ? findLiveElement(iframeDocument, source.oldParentPath) : iframeDocument.body;
        if (movedEl && oldParent) {
          const sibling = oldParent.children[source.oldSiblingIndex ?? 0];
          if (sibling && sibling !== movedEl) {
            oldParent.insertBefore(movedEl, sibling);
          } else {
            oldParent.appendChild(movedEl);
          }
        }
        continue;
      }
    }

    const el = findLiveElement(iframeDocument, structuralPath);
    if (!el) continue;

    if (target) {
      if (target.kind === "class") {
        el.className = target.newClassList.join(" ");
      } else if (target.kind === "style") {
        const vp = target.viewport || "desktop";
        const targetProp = target.property || target.styleProperty;
        if (vp !== "desktop") {
          setResponsiveStyle(el, target.structuralPath, targetProp, target.newStyleValue, vp);
          responsiveUpdated = true;
        } else {
          if ("style" in el) {
            (el as HTMLElement).style.setProperty(target.styleProperty, target.newStyleValue, "important");
            if (target.styleProperty === "color" || target.property === "text-color") {
              try { (el as HTMLElement).style.setProperty("-webkit-text-fill-color", target.newStyleValue, "important"); } catch {}
            }
          }
          setResponsiveStyle(el, target.structuralPath, targetProp, target.newStyleValue, "desktop");
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
        const sourceProp = source.property || source.styleProperty;
        if (vp !== "desktop") {
          setResponsiveStyle(el, source.structuralPath, sourceProp, source.oldStyleValue || "", vp);
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
          setResponsiveStyle(el, source.structuralPath, sourceProp, source.oldStyleValue || "", "desktop");
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
