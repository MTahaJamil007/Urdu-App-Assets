import { Phrase } from './phrase';
import { Exercise } from './exercise';

export interface Lesson {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  goal: string;
  estimatedMinutes: number;
  culturalNote: string;
  passingScore: number;
  phrases: Phrase[];
  reviewPhraseIds: string[];
  exerciseSequence: Exercise[];
  masteryCheck: Exercise[];
  rewards: LessonRewards;
}

export interface LessonRewards {
  xp: number;
  completionMessage: string;
}

export interface LessonManifestEntry {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  contentFile: string;
}

export interface LessonManifest {
  lessons: LessonManifestEntry[];
}
