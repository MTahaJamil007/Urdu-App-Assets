import { ExerciseResult } from './exercise';

export interface LevelProgress {
  levelId: string;
  chapterId: string;
  startedAt: number | null;
  completedAt: number | null;
  bestScore: number;
  attemptCount: number;
}

export interface ChapterProgress {
  chapterId: string;
  startedAt: number | null;
  completedAt: number | null;
  levelProgress: Record<string, LevelProgress>;
}

export interface UserPreferences {
  gender: 'm' | 'f' | 'na';
  hintsEnabled: boolean;
  audioAutoplay: boolean;
  reduceMotion: boolean;
}

export interface UserProgress {
  userName: string | null;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  chaptersCompleted: string[];
  chapterProgress: Record<string, ChapterProgress>;
  preferences: UserPreferences;
}
