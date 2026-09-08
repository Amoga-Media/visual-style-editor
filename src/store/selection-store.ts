import { create } from "zustand";

interface SelectionState {
  selectedPath: string | null;
  hoveredPath: string | null;
  select(path: string | null): void;
  hover(path: string | null): void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedPath: null,
  hoveredPath: null,
  select: (path) => set({ selectedPath: path }),
  hover: (path) => set({ hoveredPath: path }),
}));
