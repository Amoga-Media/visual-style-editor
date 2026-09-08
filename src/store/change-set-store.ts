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
      const priorIndex = s.edits.findIndex(
        (e) =>
          e.structuralPath === record.structuralPath &&
          e.property === record.property &&
          (e.viewport || "desktop") === (record.viewport || "desktop")
      );
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
