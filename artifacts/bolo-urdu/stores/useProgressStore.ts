import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ExerciseResult } from '@/types/exercise';
import { ChapterProgress, LevelProgress, UserProgress } from '@/types/progress';
import { getTodayString, getYesterdayString } from '@/utils/dateHelpers';

interface ProgressState extends UserProgress {
  setUserName: (name: string) => void;
  setPreference: <K extends keyof UserProgress['preferences']>(
    key: K,
    value: UserProgress['preferences'][K]
  ) => void;
  startLevel: (levelId: string, chapterId: string) => void;
  completeLevel: (levelId: string, chapterId: string, score: number) => void;
  completeChapter: (chapterId: string) => void;
  addXP: (amount: number) => void;
  updateStreak: () => void;
  isLevelUnlocked: (levelId: string) => boolean;
  isLevelComplete: (levelId: string) => boolean;
  isChapterComplete: (chapterId: string) => boolean;
  getLevelProgress: (levelId: string) => LevelProgress | null;
  getCurrentLevel: () => { chapterId: string; levelId: string } | null;
  reset: () => void;
}

const initialState: UserProgress = {
  userName: null,
  totalXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  chaptersCompleted: [],
  chapterProgress: {},
  preferences: {
    gender: 'na',
    hintsEnabled: true,
    audioAutoplay: true,
    reduceMotion: false,
  },
};

function parseLevel(levelId: string): { chapterNum: number; levelNum: number } {
  const [chapterPart, levelPart] = levelId.split('-');
  return {
    chapterNum: parseInt(chapterPart.slice(1), 10),
    levelNum: parseInt(levelPart, 10),
  };
}

function chapterId(chapterNum: number): string {
  return `C${chapterNum.toString().padStart(2, '0')}`;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUserName: (name) => set({ userName: name }),

      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),

      startLevel: (levelId, cId) =>
        set((state) => {
          const cp: ChapterProgress = state.chapterProgress[cId] ?? {
            chapterId: cId,
            startedAt: Date.now(),
            completedAt: null,
            levelProgress: {},
          };
          if (cp.levelProgress[levelId]?.startedAt) return state;
          const lp: LevelProgress = {
            levelId,
            chapterId: cId,
            startedAt: Date.now(),
            completedAt: null,
            bestScore: 0,
            attemptCount: 0,
          };
          return {
            chapterProgress: {
              ...state.chapterProgress,
              [cId]: {
                ...cp,
                levelProgress: { ...cp.levelProgress, [levelId]: lp },
              },
            },
          };
        }),

      completeLevel: (levelId, cId, score) =>
        set((state) => {
          const cp: ChapterProgress = state.chapterProgress[cId] ?? {
            chapterId: cId,
            startedAt: Date.now(),
            completedAt: null,
            levelProgress: {},
          };
          const existing: LevelProgress = cp.levelProgress[levelId] ?? {
            levelId,
            chapterId: cId,
            startedAt: Date.now(),
            completedAt: null,
            bestScore: 0,
            attemptCount: 0,
          };
          const passed = score >= 0.75;
          const updated: LevelProgress = {
            ...existing,
            completedAt: passed ? (existing.completedAt ?? Date.now()) : null,
            bestScore: Math.max(existing.bestScore, score),
            attemptCount: existing.attemptCount + 1,
          };
          return {
            chapterProgress: {
              ...state.chapterProgress,
              [cId]: {
                ...cp,
                levelProgress: { ...cp.levelProgress, [levelId]: updated },
              },
            },
          };
        }),

      completeChapter: (cId) =>
        set((state) => {
          const already = state.chaptersCompleted.includes(cId);
          const cp = state.chapterProgress[cId];
          return {
            chaptersCompleted: already ? state.chaptersCompleted : [...state.chaptersCompleted, cId],
            chapterProgress: {
              ...state.chapterProgress,
              [cId]: { ...(cp ?? { chapterId: cId, startedAt: Date.now(), levelProgress: {} }), completedAt: Date.now() },
            },
          };
        }),

      addXP: (amount) => set((state) => ({ totalXP: state.totalXP + amount })),

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

      isLevelUnlocked: (levelId) => {
        const state = get();
        const { chapterNum, levelNum } = parseLevel(levelId);
        if (chapterNum === 1 && levelNum === 1) return true;
        if (levelNum === 1) {
          const prevCId = chapterId(chapterNum - 1);
          return state.chaptersCompleted.includes(prevCId);
        }
        const prevLevelId = `L${chapterNum}-${levelNum - 1}`;
        return get().isLevelComplete(prevLevelId);
      },

      isLevelComplete: (levelId) => {
        const state = get();
        const { chapterNum } = parseLevel(levelId);
        const cId = chapterId(chapterNum);
        const lp = state.chapterProgress[cId]?.levelProgress[levelId];
        return lp?.completedAt != null;
      },

      isChapterComplete: (cId) => {
        return get().chaptersCompleted.includes(cId);
      },

      getLevelProgress: (levelId) => {
        const state = get();
        const { chapterNum } = parseLevel(levelId);
        const cId = chapterId(chapterNum);
        return state.chapterProgress[cId]?.levelProgress[levelId] ?? null;
      },

      getCurrentLevel: () => {
        const state = get();
        const manifest: { chapters: Array<{ id: string; levels: Array<{ id: string }> }> } =
          require('@/content/manifest.json');
        for (const chapter of manifest.chapters) {
          for (const level of chapter.levels) {
            if (
              state.isLevelUnlocked(level.id) &&
              !state.isLevelComplete(level.id)
            ) {
              return { chapterId: chapter.id, levelId: level.id };
            }
          }
        }
        return null;
      },

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'bolo-progress-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
