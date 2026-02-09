import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '@/shared/types';

const DEFAULT_SETTINGS: Settings = {
  globalSystemPrompt: '',
};

interface SettingsState {
  settings: Settings;
}

interface SettingsActions {
  setGlobalSystemPrompt: (prompt: string) => void;
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      setGlobalSystemPrompt: (prompt) =>
        set((state) => ({
          settings: { ...state.settings, globalSystemPrompt: prompt },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
