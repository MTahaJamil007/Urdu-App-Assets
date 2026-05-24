import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { VoicePackId } from '@/types/phrase';

interface UserStoreState {
  hasCompletedOnboarding: boolean;
  defaultVoicePackId: VoicePackId | null;
  completeOnboarding: () => void;
  setDefaultVoicePack: (id: VoicePackId) => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      defaultVoicePackId: 'taha' as VoicePackId,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setDefaultVoicePack: (id) => set({ defaultVoicePackId: id }),
    }),
    {
      name: 'bolo-user-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
