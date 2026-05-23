import { ExerciseType } from './phrase';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  phraseId: string;
}

export interface IntroduceExercise extends BaseExercise {
  type: 'INTRODUCE';
}

export interface ListenToMeaningExercise extends BaseExercise {
  type: 'L_TO_M';
  distractorPhraseIds: string[];
  prompt: string;
  hint?: string;
}

export interface ListenToImageExercise extends BaseExercise {
  type: 'L_TO_I';
  distractorPhraseIds: string[];
  prompt: string;
  hint?: string;
}

export interface ListenRepeatExercise extends BaseExercise {
  type: 'LISTEN_REPEAT';
}

export interface SpeakExercise extends BaseExercise {
  type: 'SPEAK';
  prompt: string;
  hint?: string | null;
}

export type Exercise =
  | IntroduceExercise
  | ListenToMeaningExercise
  | ListenToImageExercise
  | ListenRepeatExercise
  | SpeakExercise;

export interface ExerciseResult {
  exerciseId: string;
  passed: boolean;
  score: number;
  attempts: number;
  transcript?: string;
  timestamp: number;
}
