import { create } from 'zustand';
import { Lesson } from '@/types/lesson';

interface LessonState {
  activeLesson: Lesson | null;
  currentExerciseIndex: number;
  inMasteryCheck: boolean;
  masteryResults: number[];
  setActiveLesson: (lesson: Lesson) => void;
  advance: () => void;
  startMasteryCheck: () => void;
  recordMasteryResult: (score: number) => void;
  reset: () => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  activeLesson: null,
  currentExerciseIndex: 0,
  inMasteryCheck: false,
  masteryResults: [],

  setActiveLesson: (lesson) =>
    set({ activeLesson: lesson, currentExerciseIndex: 0, inMasteryCheck: false, masteryResults: [] }),

  advance: () =>
    set((s) => ({ currentExerciseIndex: s.currentExerciseIndex + 1 })),

  startMasteryCheck: () =>
    set({ currentExerciseIndex: 0, inMasteryCheck: true, masteryResults: [] }),

  recordMasteryResult: (score) =>
    set((s) => ({ masteryResults: [...s.masteryResults, score] })),

  reset: () =>
    set({ activeLesson: null, currentExerciseIndex: 0, inMasteryCheck: false, masteryResults: [] }),
}));
