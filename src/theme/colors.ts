// Color palettes — refreshed to a more premium "Kalo-style" aesthetic:
// lime green accent (replaces the original purple), near-black dark mode,
// subtle borders, minimal shadows.

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  // Backgrounds
  bg: string;
  bg2: string;
  card: string;
  card2: string;
  // Borders
  bo: string;
  bo2: string;
  // Text
  th: string;   // heading
  tb: string;   // body
  tm: string;   // muted
  tl: string;   // light/disabled
  // Nav
  nav: string;
  nb: string;
  // Primary (accent) — formerly purple, now lime green
  pu: string;
  pl: string;
  pb: string;
  pt: string;
  // Green (success)
  gn: string;
  gl: string;
  gb: string;
  // Red (danger)
  rd: string;
  rl: string;
  rb: string;
  // Yellow (warning)
  yl: string;
  yb: string;
  // Blue (info)
  bl: string;
  bb: string;
  // Orange (streak / flame) — new accent for stats
  or: string;
  ol: string;
  ob: string;
}

export const lightPalette: Palette = {
  // Cleaner light bg, more like Kalo's day mode if it had one
  bg: '#FAFAFA',
  bg2: '#F4F4F5',
  card: '#FFFFFF',
  card2: '#F4F4F5',
  bo: '#E4E4E7',
  bo2: '#D4D4D8',
  th: '#0A0A0A',
  tb: '#3F3F46',
  tm: '#71717A',
  tl: '#A1A1AA',
  nav: '#FFFFFF',
  nb: '#E4E4E7',
  // Lime green accent
  pu: '#84CC16',
  pl: '#F0FDE0',
  pb: '#BEF264',
  pt: '#3F6212',
  gn: '#10B981',
  gl: '#ECFDF5',
  gb: '#A7F3D0',
  rd: '#EF4444',
  rl: '#FEF2F2',
  rb: '#FCA5A5',
  yl: '#FEFCE8',
  yb: '#FDE047',
  bl: '#EFF6FF',
  bb: '#BFDBFE',
  or: '#F97316',
  ol: '#FFF7ED',
  ob: '#FDBA74',
};

export const darkPalette: Palette = {
  // Deep near-black, single source of truth for surfaces
  bg: '#0A0A0A',
  bg2: '#111111',
  card: '#171717',
  card2: '#1F1F1F',
  bo: '#262626',
  bo2: '#3F3F46',
  th: '#FAFAFA',
  tb: '#D4D4D8',
  tm: '#71717A',
  tl: '#52525B',
  nav: '#0A0A0A',
  nb: '#262626',
  // Bright lime for dark mode — the signature Kalo color
  pu: '#B5E550',
  pl: '#1F2509',
  pb: '#3D5512',
  pt: '#D4F082',
  gn: '#10B981',
  gl: '#022C22',
  gb: '#065F46',
  rd: '#F87171',
  rl: '#2A0F0F',
  rb: '#7F1D1D',
  yl: '#1F1A08',
  yb: '#854D0E',
  bl: '#0A1828',
  bb: '#1E3A8A',
  or: '#FB923C',
  ol: '#2A1408',
  ob: '#9A3412',
};

export const palettes: Record<ColorScheme, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};
