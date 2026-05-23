import { ExerciseType, VoicePackId } from './phrase';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  phraseId?: string;
}

export interface IntroduceExercise extends BaseExercise {
  type: 'INTRODUCE';
  phraseId: string;
}

export interface ListenToMeaningExercise extends BaseExercise {
  type: 'L_TO_M';
  phraseId: string;
  distractorPhraseIds: string[];
  prompt: string;
  hint?: string;
}

export interface ListenToImageExercise extends BaseExercise {
  type: 'L_TO_I';
  phraseId: string;
  distractorPhraseIds: string[];
  prompt: string;
  hint?: string;
}

export interface ListenRepeatExercise extends BaseExercise {
  type: 'LISTEN_REPEAT';
  phraseId: string;
}

export interface SpeakExercise extends BaseExercise {
  type: 'SPEAK';
  phraseId: string;
  prompt: string;
  hint?: string | null;
}

export interface ScenarioSpeakerLine {
  audio: string;
  voicePackId?: VoicePackId;
  urdu: string;
  roman: string;
  english: string;
}

export interface ScenarioTurnExercise extends BaseExercise {
  type: 'SCENARIO_TURN';
  speakerLine: ScenarioSpeakerLine;
  expectedPhraseId: string;
  prompt: string;
  hint: string | null;
}

export type Exercise =
  | IntroduceExercise
  | ListenToMeaningExercise
  | ListenToImageExercise
  | ListenRepeatExercise
  | SpeakExercise
  | ScenarioTurnExercise;

export interface ExerciseResult {
  exerciseId: string;
  passed: boolean;
  score: number;
  attempts: number;
  transcript?: string;
  timestamp: number;
}
