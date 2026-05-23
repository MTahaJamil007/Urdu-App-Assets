import * as Speech from 'expo-speech';
import { Phrase } from '@/types/phrase';

let isSpeaking = false;

export const audioService = {
  async playPhrase(phrase: Phrase, speed: 'normal' | 'slow' = 'normal'): Promise<void> {
    if (isSpeaking) {
      await audioService.stop();
    }

    isSpeaking = true;
    const rate = speed === 'slow' ? 0.6 : 0.85;

    return new Promise((resolve) => {
      Speech.speak(phrase.roman, {
        language: 'ur',
        rate,
        onDone: () => {
          isSpeaking = false;
          resolve();
        },
        onError: () => {
          isSpeaking = false;
          resolve();
        },
        onStopped: () => {
          isSpeaking = false;
          resolve();
        },
      });
    });
  },

  async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch {}
    isSpeaking = false;
  },

  isPlaying(): boolean {
    return isSpeaking;
  },
};
