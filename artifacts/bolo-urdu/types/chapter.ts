import { Phrase } from './phrase';
import { Level } from './level';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  goal: string;
  estimatedMinutes: number;
  culturalNote: string;
  passingScore: number;
  phrases: Phrase[];
  levels: Level[];
  rewards: {
    xp: number;
    completionMessage: string;
  };
}

export interface ManifestLevel {
  id: string;
  number: number;
  title: string;
  type: 'STANDARD' | 'BOSS';
  xp: number;
}

export interface ChapterManifestEntry {
  id: string;
  number: number;
  stage: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  contentFile: string;
  levels: ManifestLevel[];
}

export interface ChapterManifest {
  chapters: ChapterManifestEntry[];
}
