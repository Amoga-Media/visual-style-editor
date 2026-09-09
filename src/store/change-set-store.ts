import { create } from "zustand";
import type { EditRecord } from "@/types";

interface ChangeSetState {
  edits: EditRecord[];
  recordEdit(record: EditRecord): void;
  clear(): void;
}

export const useChangeSetStore = create<ChangeSetState>((set) => ({
  edits: [],
  recordEdit: (record) =>
    set((s) => {
      // Structural operations (delete, duplicate, insert, move) are sequential actions and must never overwrite each other
      const isIdempotent =
        record.kind === "class" ||
        record.kind === "style" ||
        record.kind === "attribute" ||
        record.kind === "text";

      if (!isIdempotent) {
        return { edits: [...s.edits, record] };
      }

      const priorIndex = s.edits.findIndex((e) => {
        if (e.kind !== record.kind || e.structuralPath !== record.structuralPath) return false;
        if (record.kind === "class" && e.kind === "class") {
          return e.property === record.property && (e.viewport || "desktop") === (record.viewport || "desktop");
        }
        if (record.kind === "style" && e.kind === "style") {
          return e.styleProperty === record.styleProperty && (e.viewport || "desktop") === (record.viewport || "desktop");
        }
        if (record.kind === "attribute" && e.kind === "attribute") {
          return e.attributeName === record.attributeName;
        }
        if (record.kind === "text" && e.kind === "text") {
          return true;
        }
        return false;
      });

      if (priorIndex === -1) {
        return { edits: [...s.edits, record] };
      }

      const prior = s.edits[priorIndex];
      const withoutPrior = s.edits.filter((_, i) => i !== priorIndex);

      if (record.kind === "class" && prior.kind === "class") {
        return { edits: [...withoutPrior, { ...record, oldClassList: prior.oldClassList }] };
      }
      if (record.kind === "style" && prior.kind === "style") {
        return { edits: [...withoutPrior, { ...record, oldStyleValue: prior.oldStyleValue }] };
      }
      if (record.kind === "attribute" && prior.kind === "attribute") {
        return { edits: [...withoutPrior, { ...record, oldValue: prior.oldValue }] };
      }
      if (record.kind === "text" && prior.kind === "text") {
        return { edits: [...withoutPrior, { ...record, oldText: prior.oldText }] };
      }
      return { edits: [...withoutPrior, record] };
    }),
  clear: () => set({ edits: [] }),
}));
