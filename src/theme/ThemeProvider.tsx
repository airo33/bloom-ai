import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme, Palette, palettes } from './colors';
import { spacing, radius, fontSize, fontWeight, shadow } from './tokens';
import { CATEGORIES, getCategory } from './categories';

const STORAGE_KEY = '@recova/theme';

export interface Theme {
  scheme: ColorScheme;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  shadow: typeof shadow;
  categories: typeof CATEGORIES;
  getCategory: typeof getCategory;
}

interface ThemeContextValue {
  theme: Theme;
  toggleScheme: () => void;
  setScheme: (s: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>('light');

  // Hydrate preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark') setSchemeState(v);
    }).catch(() => {});
  }, []);

  const setScheme = useCallback((s: ColorScheme) => {
    setSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY, s).catch(() => {});
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme(scheme === 'light' ? 'dark' : 'light');
  }, [scheme, setScheme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme: {
      scheme,
      colors: palettes[scheme],
      spacing,
      radius,
      fontSize,
      fontWeight,
      shadow,
      categories: CATEGORIES,
      getCategory,
    },
    toggleScheme,
    setScheme,
  }), [scheme, toggleScheme, setScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.theme;
}

export function useThemeControls() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls must be used inside <ThemeProvider>');
  const { toggleScheme, setScheme, theme } = ctx;
  return { toggleScheme, setScheme, scheme: theme.scheme };
}
