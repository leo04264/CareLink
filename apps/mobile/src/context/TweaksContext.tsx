import React, { createContext, useContext, useState, type ReactNode } from 'react';

// Mirrors the prototype's TWEAK_DEFAULTS. Exposed via Tweaks panel
// (long-press brand logo) and consumed by screens that care about the
// global elder reporting state.
export type ReportStatus = 'ok' | 'warning' | 'critical';

export interface Tweaks {
  reportStatus: ReportStatus;
  accentColor: string;
  elderName: string;
  showHealthPanel: boolean;
}

const DEFAULTS: Tweaks = {
  reportStatus: 'warning',
  accentColor: '#14b8a6',
  elderName: '張秀蘭',
  showHealthPanel: true,
};

interface TweaksCtxValue {
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => void;
}

const TweaksCtx = createContext<TweaksCtxValue>({
  tweaks: DEFAULTS,
  setTweak: () => {},
});

export function TweaksProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULTS);
  const setTweak = <K extends keyof Tweaks>(k: K, v: Tweaks[K]) =>
    setTweaks((t) => ({ ...t, [k]: v }));
  return <TweaksCtx.Provider value={{ tweaks, setTweak }}>{children}</TweaksCtx.Provider>;
}

export function useTweaks() {
  return useContext(TweaksCtx);
}
