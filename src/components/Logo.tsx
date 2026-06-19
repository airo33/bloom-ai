// Brand mark — Mend sprout. A small plant with a vertical stem and two
// curved leaves emerging from the top. Replaces the previous R monogram.
// Single source of truth for the logo so we can drop the emoji-as-brand
// pattern everywhere in the app.

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme';

interface Props {
  size?: number;
  /**
   *  filled — sprout on a lime tile (primary use: Welcome, Auth, Loading)
   *  ghost  — sprout alone, transparent background (small inline use)
   *  light  — sprout on a tinted lime card surface (for empty states)
   */
  variant?: 'filled' | 'ghost' | 'light';
}

// Sprout glyph paths inside the 32×32 viewBox. Stem + two leaves.
const STEM = 'M16 24 V13';
const LEAF_LEFT  = 'M16 14 C 13.5 11 9.5 11 8 14 C 10 16 14 16 16 14 Z';
const LEAF_RIGHT = 'M16 11 C 18.5 8 22.5 8 24 11 C 22 13 18 13 16 11 Z';

export default function Logo({ size = 56, variant = 'filled' }: Props) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';

  const bg =
    variant === 'filled'
      ? theme.colors.pu
      : variant === 'light'
        ? theme.colors.pl
        : 'transparent';

  const fg =
    variant === 'filled'
      ? dark
        ? '#0A0A0A'
        : '#0A0A0A'  // sprout always dark — even on light tile reads as brand
      : variant === 'light'
        ? theme.colors.pt
        : theme.colors.pu;

  const cornerRadius = 9; // viewBox 32×32 — ~28% radius

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {variant !== 'ghost' && (
        <Rect
          x="0"
          y="0"
          width="32"
          height="32"
          rx={cornerRadius}
          ry={cornerRadius}
          fill={bg}
        />
      )}
      {/* Stem */}
      <Path
        d={STEM}
        stroke={fg}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Two leaves */}
      <Path d={LEAF_LEFT} fill={fg} />
      <Path d={LEAF_RIGHT} fill={fg} />
    </Svg>
  );
}

/**
 * Wordmark — the full "Mend" lockup with the sprout on the left.
 * Useful at the top of Welcome / Auth instead of the standalone tile.
 */
export function WordMark({ size = 28 }: { size?: number }) {
  const theme = useTheme();
  const fg = theme.scheme === 'dark' ? '#0A0A0A' : '#0A0A0A';

  return (
    <Svg width={size * 4.6} height={size} viewBox={`0 0 ${32 * 4.6} 32`}>
      {/* Rounded lime tile + sprout */}
      <Rect x="0" y="0" width="32" height="32" rx="9" ry="9" fill={theme.colors.pu} />
      <Path d={STEM} stroke={fg} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Path d={LEAF_LEFT} fill={fg} />
      <Path d={LEAF_RIGHT} fill={fg} />
    </Svg>
  );
}
