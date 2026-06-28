// Color palettes — "Garden" visual language (Bloom AI v2 redesign).
// Botanical-green accent on warm near-black / cream paper surfaces.
// Recovery as growth. Replaces the previous Kalo-style lime palette.

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
  // Primary (accent) — botanical green
  pu: string;
  pl: string;
  pb: string;
  pt: string;
  // Green (success)
  gn: string;
  gl: string;
  gb: string;
  // Red (danger) — warm terracotta
  rd: string;
  rl: string;
  rb: string;
  // Yellow (warning)
  yl: string;
  yb: string;
  // Blue (info / water)
  bl: string;
  bb: string;
  // Orange / clay (streak / flame) — warm terracotta
  or: string;
  ol: string;
  ob: string;
}

export const lightPalette: Palette = {
  // Warm cream paper, pure-white cards
  bg: '#F3EFE6',
  bg2: '#ECE6D9',
  card: '#FFFFFF',
  card2: '#F1EDE2',
  // Warm, low-contrast borders
  bo: '#E8E2D5',
  bo2: '#D8D0BF',
  // Deep olive-black → sage greys
  th: '#20251A',
  tb: '#4A4F42',
  tm: '#7D8472',
  tl: '#A89F8C',
  nav: '#FFFFFF',
  nb: '#E8E2D5',
  // Botanical moss-green (deep enough for white surfaces)
  pu: '#5F9437',
  pl: '#EDF3E2',
  pb: '#CFE3AB',
  pt: '#4F7D2C',
  // Slightly bluer success green so it reads distinct from the brand
  gn: '#3F8B5F',
  gl: '#E7F3EA',
  gb: '#C5E2CF',
  // Warm terracotta-red
  rd: '#C0533F',
  rl: '#FBECEA',
  rb: '#F3CFC9',
  // Muted ochre
  yl: '#F5F0D8',
  yb: '#A98F2E',
  // Clean info / water blue
  bl: '#E7F1F8',
  bb: '#2E93B8',
  // Warm terracotta streak / clay
  or: '#B3733F',
  ol: '#F6EBE1',
  ob: '#ECD9C8',
};

export const darkPalette: Palette = {
  // Warm near-black with a hint of olive — not pure black
  bg: '#141310',
  bg2: '#1C1B16',
  card: '#1C1B16',
  card2: '#211F18',
  bo: '#2A2820',
  bo2: '#3A3A30',
  // Warm white → sage grey text
  th: '#F4F1E8',
  tb: '#CFCABB',
  tm: '#8A9479',
  tl: '#5F6B56',
  nav: '#16150F',
  nb: '#2A2820',
  // Soft, bright botanical green (the signature color)
  pu: '#BFE39A',
  pl: '#2A3320',
  pb: '#3D5512',
  pt: '#D4F0A0',
  gn: '#7FD6A0',
  gl: '#102A1C',
  gb: '#1F4A32',
  rd: '#E8857C',
  rl: '#2A1212',
  rb: '#5A2A2A',
  yl: '#2A2A18',
  yb: '#D8C97A',
  bl: '#102030',
  bb: '#7FC6E0',
  or: '#E8A87C',
  ol: '#332420',
  ob: '#5A3A28',
};

export const palettes: Record<ColorScheme, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};
