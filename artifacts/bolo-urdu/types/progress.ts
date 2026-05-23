import { ExerciseResult } from './exercise';

export interface LessonProgress {
  lessonId: string;
  startedAt: number | null;
  completedAt: number | null;
  bestScore: number;
  attemptCount: number;
  exerciseResults: ExerciseResult[];
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
  lessonsCompleted: string[];
  lessonProgress: Record<string, LessonProgress>;
  preferences: UserPreferences;
}
