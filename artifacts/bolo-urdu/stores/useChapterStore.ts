import { create } from 'zustand';
import { Chapter } from '@/types/chapter';
import { Level } from '@/types/level';

interface ChapterState {
  activeChapter: Chapter | null;
  activeLevel: Level | null;
  currentExerciseIndex: number;
  scenarioIntroShown: boolean;
  setActive: (chapter: Chapter, level: Level) => void;
  advance: () => void;
  markScenarioIntroShown: () => void;
  reset: () => void;
}

export const useChapterStore = create<ChapterState>((set) => ({
  activeChapter: null,
  activeLevel: null,
  currentExerciseIndex: 0,
  scenarioIntroShown: false,

  setActive: (chapter, level) =>
    set({
      activeChapter: chapter,
      activeLevel: level,
      currentExerciseIndex: 0,
      scenarioIntroShown: false,
    }),

  advance: () => set((s) => ({ currentExerciseIndex: s.currentExerciseIndex + 1 })),

  markScenarioIntroShown: () => set({ scenarioIntroShown: true }),

  reset: () =>
    set({
      activeChapter: null,
      activeLevel: null,
      currentExerciseIndex: 0,
      scenarioIntroShown: false,
    }),
}));
