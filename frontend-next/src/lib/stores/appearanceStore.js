'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  applyAppearanceTheme,
  DEFAULT_LOGIN_THEME_ID,
  LOGIN_BG_THEMES,
} from '@/lib/loginBgThemes';

export const LOGIN_THEME_STORAGE_KEY = 'onecrm.loginTheme';

const listeners = new Set();

function isBrowser() {
  return typeof window !== 'undefined';
}

function readStoredThemeId() {
  if (!isBrowser()) return DEFAULT_LOGIN_THEME_ID;
  try {
    const stored = window.localStorage.getItem(LOGIN_THEME_STORAGE_KEY);
    if (LOGIN_BG_THEMES.some((t) => t.id === stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_LOGIN_THEME_ID;
}

let currentThemeId = DEFAULT_LOGIN_THEME_ID;
let storageHydrated = false;

function ensureHydrated() {
  if (storageHydrated || !isBrowser()) return;
  storageHydrated = true;
  currentThemeId = readStoredThemeId();
  applyAppearanceTheme(currentThemeId);
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getLoginThemeId() {
  ensureHydrated();
  return currentThemeId;
}

export function getLoginTheme() {
  ensureHydrated();
  return LOGIN_BG_THEMES.find((t) => t.id === currentThemeId) || LOGIN_BG_THEMES[0];
}

export function setLoginThemeId(nextId) {
  ensureHydrated();
  if (!LOGIN_BG_THEMES.some((t) => t.id === nextId)) return;
  currentThemeId = nextId;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(LOGIN_THEME_STORAGE_KEY, nextId);
    } catch {
      // ignore
    }
  }
  applyAppearanceTheme(nextId);
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  ensureHydrated();
  return currentThemeId;
}

function getServerSnapshot() {
  return DEFAULT_LOGIN_THEME_ID;
}

/** Hydrate from localStorage once on the client. */
export function hydrateLoginThemeFromStorage() {
  ensureHydrated();
  emit();
  return currentThemeId;
}

/**
 * Login / appearance color preset (Brand | Aurora | Mist).
 * Persisted in localStorage; applies CSS brand tokens app-wide.
 */
export function useAppearanceStore(selector) {
  const themeId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateLoginThemeFromStorage();
    setHydrated(true);
  }, []);

  const setColorPreset = useCallback((newPreset) => {
    setLoginThemeId(newPreset);
  }, []);

  const storeState = {
    colorPreset: themeId,
    loginThemeId: themeId,
    loginTheme: LOGIN_BG_THEMES.find((t) => t.id === themeId) || LOGIN_BG_THEMES[0],
    themes: LOGIN_BG_THEMES,
    hydrated,
    setColorPreset,
    setLoginThemeId: setColorPreset,
  };

  return selector ? selector(storeState) : storeState;
}

/** Mount once under Providers — keeps document theme in sync. */
export function AppearanceThemeSync() {
  const themeId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrateLoginThemeFromStorage();
  }, []);

  useEffect(() => {
    applyAppearanceTheme(themeId);
  }, [themeId]);

  return null;
}
