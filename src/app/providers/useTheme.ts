import { useContext, createContext } from 'react';
import type { Theme } from '@/shared/types';

interface ThemeContextValue {
  theme: Theme;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
