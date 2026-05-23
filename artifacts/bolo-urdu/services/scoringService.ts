import { Phrase } from '@/types/phrase';
import { similarity } from '@/utils/similarity';

export interface ScoringResult {
  score: number;
  passed: boolean;
  matchedAgainst: 'roman' | 'urdu' | 'self-report' | 'neither';
  transcript: string;
}

export const scoringService = {
  score(transcript: string, phrase: Phrase, threshold = 0.70): ScoringResult {
    if (!transcript) {
      return { score: 0, passed: false, matchedAgainst: 'neither', transcript };
    }

    if (transcript === '__SELF_REPORT_YES__') {
      return { score: 0.85, passed: true, matchedAgainst: 'self-report', transcript: phrase.roman };
    }

    if (transcript === '__SELF_REPORT_NO__') {
      return { score: 0.1, passed: false, matchedAgainst: 'self-report', transcript: '' };
    }

    const romanScore = similarity(transcript, phrase.roman);
    const urduScore = similarity(transcript, phrase.urdu);
    const bestScore = Math.max(romanScore, urduScore);

    return {
      score: bestScore,
      passed: bestScore >= threshold,
      matchedAgainst: romanScore >= urduScore ? 'roman' : 'urdu',
      transcript,
    };
  },

  getScoreLabel(score: number): string {
    if (score >= 0.9) return 'Bohot accha!';
    if (score >= 0.8) return 'Accha!';
    if (score >= 0.7) return 'Theek hai!';
    if (score >= 0.5) return 'Almost — try again';
    return "Let's try again";
  },
};
