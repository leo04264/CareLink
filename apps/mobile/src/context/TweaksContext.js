import React, { createContext, useContext, useState } from 'react';

// Mirrors the prototype's TWEAK_DEFAULTS. Exposed via Tweaks panel
// (long-press brand logo) and consumed by screens that care about the
// global elder reporting state.
const DEFAULTS = {
  reportStatus: 'warning', // 'ok' | 'warning' | 'critical'
  accentColor: '#14b8a6',
  elderName: '張秀蘭',
  showHealthPanel: true,
};

const TweaksCtx = createContext({
  tweaks: DEFAULTS,
  setTweak: () => {},
});

export function TweaksProvider({ children }) {
  const [tweaks, setTweaks] = useState(DEFAULTS);
  const setTweak = (k, v) => setTweaks((t) => ({ ...t, [k]: v }));
  return <TweaksCtx.Provider value={{ tweaks, setTweak }}>{children}</TweaksCtx.Provider>;
}

export function useTweaks() {
  return useContext(TweaksCtx);
}
