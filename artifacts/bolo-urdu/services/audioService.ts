import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import audioMap from './audioMap';
import { useChapterStore } from '@/stores/useChapterStore';
import { useUserStore } from '@/stores/useUserStore';
import { Phrase, VoicePackId } from '@/types/phrase';

let currentSound: Audio.Sound | null = null;
let isSpeaking = false;

async function stopCurrent() {
  if (currentSound) {
    try { await currentSound.unloadAsync(); } catch {}
    currentSound = null;
  }
  try { Speech.stop(); } catch {}
  isSpeaking = false;
}

async function playFromAsset(asset: number): Promise<void> {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  } catch {}
  const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: true });
  currentSound = sound;
  isSpeaking = true;
  return new Promise((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        stopCurrent().then(resolve);
      }
    });
  });
}

function playFromTTS(roman: string, speed: 'normal' | 'slow'): Promise<void> {
  isSpeaking = true;
  return new Promise((resolve) => {
    Speech.speak(roman, {
      language: 'ur',
      rate: speed === 'slow' ? 0.6 : 0.85,
      onDone: () => { isSpeaking = false; resolve(); },
      onError: () => { isSpeaking = false; resolve(); },
      onStopped: () => { isSpeaking = false; resolve(); },
    });
  });
}

function resolveVoicePack(override?: VoicePackId): VoicePackId {
  if (override) return override;
  const active = useChapterStore.getState().activeVoicePackId;
  if (active) return active;
  const def = useUserStore.getState().defaultVoicePackId;
  return def ?? 'sabrina';
}

export const audioService = {
  async playPhrase(
    phrase: Phrase,
    speed: 'normal' | 'slow' = 'normal',
    voicePackOverride?: VoicePackId
  ): Promise<void> {
    await stopCurrent();
    const packId = resolveVoicePack(voicePackOverride);
    const path = phrase.audio[packId]?.[speed];

    if (path && audioMap[path] != null) {
      if (__DEV__) console.log(`[audio] playing asset: ${path}`);
      await playFromAsset(audioMap[path]);
    } else {
      if (__DEV__ && path) console.log(`[audio] TTS fallback (no asset for ${path})`);
      await playFromTTS(phrase.roman, speed);
    }
  },

  async playAudioPath(
    path: string,
    romanFallback: string,
    speed: 'normal' | 'slow' = 'normal'
  ): Promise<void> {
    await stopCurrent();
    if (path && audioMap[path] != null) {
      if (__DEV__) console.log(`[audio] playing asset: ${path}`);
      await playFromAsset(audioMap[path]);
    } else {
      if (__DEV__ && path) console.log(`[audio] TTS fallback (no asset for ${path})`);
      await playFromTTS(romanFallback, speed);
    }
  },

  async stop(): Promise<void> {
    await stopCurrent();
  },

  isPlaying(): boolean {
    return isSpeaking;
  },
};
