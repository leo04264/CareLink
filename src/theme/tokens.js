export const C = {
  bg: '#05070a',
  surface: '#0d1017',
  card: '#161c2a',
  card2: '#1a2133',

  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',

  text: '#e2e8f0',
  text2: '#94a3b8',
  text3: '#4b5e78',

  teal: '#14b8a6',
  tealDim: 'rgba(20,184,166,0.3)',
  tealGlow: 'rgba(20,184,166,0.1)',

  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.3)',
  amberGlow: 'rgba(245,158,11,0.12)',

  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.3)',
  redGlow: 'rgba(239,68,68,0.15)',

  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.3)',
  greenGlow: 'rgba(34,197,94,0.12)',

  blue: '#3b82f6',
  blueDim: 'rgba(59,130,246,0.3)',
  blueGlow: 'rgba(59,130,246,0.1)',

  purple: '#a855f7',
  purpleLight: '#c084fc',
  purpleSoft: '#a78bfa',
};

export const FONT = {
  zh: 'NotoSansTC_400Regular',
  zhMed: 'NotoSansTC_500Medium',
  zhBold: 'NotoSansTC_700Bold',
  zhBlack: 'NotoSansTC_900Black',
  num: 'Syne_500Medium',
  numBold: 'Syne_700Bold',
};

// Apply to numeric / display text (Syne) — prototype uses this for
// 血壓、時鐘、品牌字、大數字. Falls back to system if not loaded.
export const numericFont = (weight = 'normal') => ({
  fontFamily: weight === 'bold' ? FONT.numBold : FONT.num,
});

