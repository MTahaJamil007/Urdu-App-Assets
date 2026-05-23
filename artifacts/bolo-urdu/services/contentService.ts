import { Chapter } from '@/types/chapter';
import { ChapterManifest } from '@/types/chapter';
import { Level } from '@/types/level';
import { Phrase } from '@/types/phrase';

const CHAPTER_MAP: Record<string, () => unknown> = {
  C01: () => require('@/content/chapters/chapter_01.json'),
};

export const contentService = {
  loadManifest(): ChapterManifest {
    return require('@/content/manifest.json') as ChapterManifest;
  },

  loadChapter(chapterId: string): Chapter | null {
    try {
      const loader = CHAPTER_MAP[chapterId];
      if (!loader) return null;
      return loader() as Chapter;
    } catch {
      return null;
    }
  },

  getLevelById(chapter: Chapter, levelId: string): Level | null {
    return chapter.levels.find((l) => l.id === levelId) ?? null;
  },

  getPhraseById(chapter: Chapter, phraseId: string): Phrase | null {
    return chapter.phrases.find((p) => p.id === phraseId) ?? null;
  },

  buildPhraseMap(chapter: Chapter): Record<string, Phrase> {
    const map: Record<string, Phrase> = {};
    chapter.phrases.forEach((p) => { map[p.id] = p; });
    return map;
  },

  chapterIdFromLevelId(levelId: string): string {
    const chapterNum = parseInt(levelId.split('-')[0].slice(1), 10);
    return `C${chapterNum.toString().padStart(2, '0')}`;
  },
};
