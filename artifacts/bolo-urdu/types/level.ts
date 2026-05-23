import { Exercise } from './exercise';

export type LevelType = 'STANDARD' | 'BOSS';

export interface Level {
  id: string;
  chapterId: string;
  number: number;
  title: string;
  subtitle: string;
  type: LevelType;
  estimatedMinutes: number;
  newPhraseIds: string[];
  reviewPhraseIds: string[];
  exerciseSequence: Exercise[];
  scenarioIntro?: string;
  passingScore?: number;
  rewards: {
    xp: number;
    chapterCompleteBonus?: number;
  };
}
