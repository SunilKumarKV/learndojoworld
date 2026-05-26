import { create } from "zustand";

import type { LearnerMode } from "@/types/product";

type LearningModeState = {
  mode: LearnerMode;
  setMode: (mode: LearnerMode) => void;
};

export const useLearningModeStore = create<LearningModeState>((set) => ({
  mode: "Builder",
  setMode: (mode) => set({ mode }),
}));
