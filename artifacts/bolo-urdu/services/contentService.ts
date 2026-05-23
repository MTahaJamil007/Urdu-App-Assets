import { Lesson } from '@/types/lesson';
import { LessonManifest } from '@/types/lesson';

const LESSON_MAP: Record<string, () => unknown> = {
  lesson_01: () => require('@/content/lessons/lesson_01.json'),
};

export const contentService = {
  loadManifest(): LessonManifest {
    return require('@/content/manifest.json') as LessonManifest;
  },

  loadLesson(id: string): Lesson | null {
    try {
      const lessonNumber = parseInt(id.slice(1), 10);
      const key = `lesson_${lessonNumber.toString().padStart(2, '0')}`;
      const loader = LESSON_MAP[key];
      if (!loader) return null;
      return loader() as Lesson;
    } catch {
      return null;
    }
  },
};
