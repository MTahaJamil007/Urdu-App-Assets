import { create } from 'zustand';
import { Chapter } from '@/types/chapter';
import { Level } from '@/types/level';
import { VoicePackId } from '@/types/phrase';

interface ChapterState {
  activeChapter: Chapter | null;
  activeLevel: Level | null;
  currentExerciseIndex: number;
  scenarioIntroShown: boolean;
  activeVoicePackId: VoicePackId | null;
  setActive: (chapter: Chapter, level: Level) => void;
  advance: () => void;
  markScenarioIntroShown: () => void;
  setActiveVoicePack: (id: VoicePackId | null) => void;
  reset: () => void;
}

export const useChapterStore = create<ChapterState>((set) => ({
  activeChapter: null,
  activeLevel: null,
  currentExerciseIndex: 0,
  scenarioIntroShown: false,
  activeVoicePackId: null,

  setActive: (chapter, level) =>
    set({
      activeChapter: chapter,
      activeLevel: level,
      currentExerciseIndex: 0,
      scenarioIntroShown: false,
    }),

  advance: () => set((s) => ({ currentExerciseIndex: s.currentExerciseIndex + 1 })),

  markScenarioIntroShown: () => set({ scenarioIntroShown: true }),

  setActiveVoicePack: (id) => set({ activeVoicePackId: id }),

  reset: () =>
    set({
      activeChapter: null,
      activeLevel: null,
      currentExerciseIndex: 0,
      scenarioIntroShown: false,
      activeVoicePackId: null,
    }),
}));
