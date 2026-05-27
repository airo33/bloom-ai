// Color palettes ported from the HTML prototype (CSS vars `--bg`, `--th`, `--pu`, etc.)
// Light theme uses the original `.ph` variables, dark theme uses the `.ph.dk` overrides.

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
  // Purple (primary)
  pu: string;
  pl: string;   // purple light bg
  pb: string;   // purple border
  pt: string;   // purple text
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
}

export const lightPalette: Palette = {
  bg: '#F4F5FA',
  bg2: '#ECEDF6',
  card: '#FFFFFF',
  card2: '#F0F1F8',
  bo: '#DDE0EE',
  bo2: '#C8CADC',
  th: '#1A1C2E',
  tb: '#4A4C6A',
  tm: '#9098B8',
  tl: '#C4C6D8',
  nav: '#FFFFFF',
  nb: '#DDE0EE',
  pu: '#6C5CE7',
  pl: '#EEE9FF',
  pb: '#C0BAE8',
  pt: '#5248C8',
  gn: '#00B894',
  gl: '#E0F5F0',
  gb: '#90CCBE',
  rd: '#E04820',
  rl: '#FEE8E8',
  rb: '#E8A0A0',
  yl: '#FFFAEC',
  yb: '#E0C860',
  bl: '#E3F2FD',
  bb: '#90B8E0',
};

export const darkPalette: Palette = {
  bg: '#0F1018',
  bg2: '#14151F',
  card: '#1C1D2E',
  card2: '#181927',
  bo: '#272840',
  bo2: '#303252',
  th: '#E8EAF8',
  tb: '#9098C0',
  tm: '#555870',
  tl: '#383A54',
  nav: '#131420',
  nb: '#272840',
  pu: '#8B7CF8',
  pl: '#1E1C38',
  pb: '#4840A0',
  pt: '#A89BF8',
  gn: '#00D2A8',
  gl: '#0A2822',
  gb: '#1A5048',
  rd: '#FF6040',
  rl: '#2A1010',
  rb: '#882010',
  yl: '#1E1A08',
  yb: '#6A5010',
  bl: '#0A1828',
  bb: '#1A3858',
};

export const palettes: Record<ColorScheme, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};
