import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ExerciseResult } from '@/types/exercise';
import { LessonProgress, UserProgress } from '@/types/progress';
import { getTodayString, getYesterdayString } from '@/utils/dateHelpers';

const DEFAULT_LESSON_PROGRESS: Omit<LessonProgress, 'lessonId'> = {
  startedAt: null,
  completedAt: null,
  bestScore: 0,
  attemptCount: 0,
  exerciseResults: [],
};

interface ProgressState extends UserProgress {
  setUserName: (name: string) => void;
  setPreference: <K extends keyof UserProgress['preferences']>(
    key: K,
    value: UserProgress['preferences'][K]
  ) => void;
  startLesson: (lessonId: string) => void;
  recordExerciseResult: (lessonId: string, result: ExerciseResult) => void;
  completeLesson: (lessonId: string, score: number) => void;
  addXP: (amount: number) => void;
  updateStreak: () => void;
  isLessonUnlocked: (lessonId: string) => boolean;
  getLessonProgress: (lessonId: string) => LessonProgress | null;
  reset: () => void;
}

const initialState: UserProgress = {
  userName: null,
  totalXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  lessonsCompleted: [],
  lessonProgress: {},
  preferences: {
    gender: 'na',
    hintsEnabled: true,
    audioAutoplay: true,
    reduceMotion: false,
  },
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUserName: (name) => set({ userName: name }),

      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),

      startLesson: (lessonId) =>
        set((state) => {
          const existing = state.lessonProgress[lessonId];
          if (existing?.startedAt) return state;
          return {
            lessonProgress: {
              ...state.lessonProgress,
              [lessonId]: {
                lessonId,
                ...DEFAULT_LESSON_PROGRESS,
                startedAt: Date.now(),
              },
            },
          };
        }),

      recordExerciseResult: (lessonId, result) =>
        set((state) => {
          const lp = state.lessonProgress[lessonId];
          if (!lp) return state;
          return {
            lessonProgress: {
              ...state.lessonProgress,
              [lessonId]: {
                ...lp,
                exerciseResults: [...lp.exerciseResults, result],
              },
            },
          };
        }),

      completeLesson: (lessonId, score) =>
        set((state) => {
          const lp = state.lessonProgress[lessonId] ?? {
            lessonId,
            ...DEFAULT_LESSON_PROGRESS,
            startedAt: Date.now(),
          };
          const wasAlreadyComplete = state.lessonsCompleted.includes(lessonId);
          const passed = score >= 0.75;
          return {
            lessonProgress: {
              ...state.lessonProgress,
              [lessonId]: {
                ...lp,
                completedAt: passed ? (lp.completedAt ?? Date.now()) : lp.completedAt,
                bestScore: Math.max(lp.bestScore, score),
                attemptCount: lp.attemptCount + 1,
              },
            },
            lessonsCompleted:
              passed && !wasAlreadyComplete
                ? [...state.lessonsCompleted, lessonId]
                : state.lessonsCompleted,
          };
        }),

      addXP: (amount) =>
        set((state) => ({ totalXP: state.totalXP + amount })),

      updateStreak: () =>
        set((state) => {
          const today = getTodayString();
          if (state.lastActivityDate === today) return state;
          const yesterday = getYesterdayString();
          const newStreak =
            state.lastActivityDate === yesterday ? state.currentStreak + 1 : 1;
          return {
            currentStreak: newStreak,
            longestStreak: Math.max(state.longestStreak, newStreak),
            lastActivityDate: today,
          };
        }),

      isLessonUnlocked: (lessonId) => {
        const state = get();
        if (lessonId === 'L01') return true;
        const lessonNum = parseInt(lessonId.slice(1), 10);
        const prevId = `L${(lessonNum - 1).toString().padStart(2, '0')}`;
        return state.lessonsCompleted.includes(prevId);
      },

      getLessonProgress: (lessonId) => {
        return get().lessonProgress[lessonId] ?? null;
      },

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'bolo-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
