import { useState, useEffect } from 'react';

let mockPreset = 'navy';
const listeners = new Set();

export function useAppearanceStore(selector) {
  const [preset, setPreset] = useState(mockPreset);

  useEffect(() => {
    listeners.add(setPreset);
    return () => {
      listeners.delete(setPreset);
    };
  }, []);

  const setColorPreset = (newPreset) => {
    mockPreset = newPreset;
    listeners.forEach((l) => l(mockPreset));
  };

  const storeState = {
    colorPreset: preset,
    setColorPreset
  };

  return selector ? selector(storeState) : storeState;
}
