import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UserStoreState {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'bolo-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
