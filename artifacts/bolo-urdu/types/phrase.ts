export type Gender = 'm' | 'f' | 'neutral' | 'na';

export type PhraseCategory =
  | 'greeting'
  | 'response'
  | 'courtesy'
  | 'farewell'
  | 'family'
  | 'pronoun'
  | 'number'
  | 'color'
  | 'object'
  | 'food'
  | 'question'
  | 'other';

export type ExerciseType =
  | 'INTRODUCE'
  | 'L_TO_I'
  | 'L_TO_M'
  | 'LISTEN_REPEAT'
  | 'SPEAK';

export interface AudioAssets {
  normal: string;
  slow: string;
}

export interface Phrase {
  id: string;
  lessonId: string;
  order: number;
  urdu: string;
  roman: string;
  english: string;
  englishContextual: string;
  gender: Gender;
  category: PhraseCategory;
  audio: AudioAssets;
  image: string | null;
  exerciseTypes: ExerciseType[];
  notes: string;
}
