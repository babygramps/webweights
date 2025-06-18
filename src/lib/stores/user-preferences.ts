import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RestTimerNotification = 'sound' | 'vibrate' | 'both' | 'none';

interface UserPreferencesState {
  restTimerNotification: RestTimerNotification;
  setRestTimerNotification: (value: RestTimerNotification) => void;
}

export const useUserPreferences = create<UserPreferencesState>()(
  persist(
    (set) => ({
      restTimerNotification: 'sound',
      setRestTimerNotification: (value) =>
        set({ restTimerNotification: value }),
    }),
    {
      name: 'user-preferences',
    },
  ),
);
