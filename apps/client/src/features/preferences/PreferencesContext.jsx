/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'learndojo.preferences.v1';

const DEFAULT_PREFERENCES = {
  theme: 'light',
  experienceMode: 'dojo',
  onboardingCompleted: false,
};

const PreferencesContext = createContext(null);

function safeReadPreferences() {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'dark' ? 'dark' : 'light';
}

function applyPreferences(preferences) {
  const root = document.documentElement;
  const activeTheme = resolveTheme(preferences.theme);
  root.dataset.theme = activeTheme;
  root.dataset.mode = preferences.experienceMode;
  root.classList.toggle('dark', activeTheme === 'dark');
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(safeReadPreferences);

  useEffect(() => {
    applyPreferences(preferences);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => {
      if (preferences.theme === 'system') applyPreferences(preferences);
    };
    media.addEventListener('change', syncSystemTheme);
    return () => media.removeEventListener('change', syncSystemTheme);
  }, [preferences]);

  const value = useMemo(
    () => ({
      preferences,
      activeTheme: resolveTheme(preferences.theme),
      setTheme: (theme) => setPreferences((current) => ({ ...current, theme })),
      toggleTheme: () =>
        setPreferences((current) => ({
          ...current,
          theme: resolveTheme(current.theme) === 'dark' ? 'light' : 'dark',
        })),
      setExperienceMode: (experienceMode) =>
        setPreferences((current) => ({ ...current, experienceMode })),
      completeOnboarding: () =>
        setPreferences((current) => ({ ...current, onboardingCompleted: true })),
      resetOnboarding: () =>
        setPreferences((current) => ({ ...current, onboardingCompleted: false })),
    }),
    [preferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider');
  return context;
}
