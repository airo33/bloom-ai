// Brand mark — a stylized "R" monogram inside a rounded lime tile.
// Single source of truth for the logo so we can drop the emoji-as-brand
// pattern everywhere in the app.

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme';

interface Props {
  size?: number;
  /**
   *  filled — R on a lime tile (primary use: Welcome, Auth, Loading)
   *  ghost  — R alone, transparent background (small inline use)
   *  light  — R on a tinted lime card surface (for empty states)
   */
  variant?: 'filled' | 'ghost' | 'light';
}

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
        : '#FFFFFF'
      : variant === 'light'
        ? theme.colors.pt
        : theme.colors.pu;

  // The corner radius scales with the tile so the mark stays visually
  // consistent at every size.
  const cornerRadius = 9; // viewBox is 32×32, so 9/32 ≈ 28% corner radius

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
      {/*
        Stylized R, drawn as one continuous path:
          - Vertical stroke (10,8) -> (10,24)
          - Top arm (10,8) -> (17,8)
          - Bowl arc top-right -> (17,16)
          - Bowl bottom (17,16) -> (10,16)
          - Leg (15,16) -> (22,24) diagonal
      */}
      <Path
        d="M10 8 V24 M10 8 H17 Q21.5 8 21.5 12 Q21.5 16 17 16 H10 M15 16 L21.5 24"
        stroke={fg}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Wordmark — the full "RECOVA" lockup with the monogram on the left.
 * Useful at the top of Welcome / Auth instead of the standalone tile.
 */
export function WordMark({ size = 28 }: { size?: number }) {
  const theme = useTheme();
  return (
    <Svg width={size * 4.8} height={size} viewBox={`0 0 ${32 * 4.8} 32`}>
      {/* Rounded lime tile */}
      <Rect x="0" y="0" width="32" height="32" rx="9" ry="9" fill={theme.colors.pu} />
      {/* R monogram */}
      <Path
        d="M10 8 V24 M10 8 H17 Q21.5 8 21.5 12 Q21.5 16 17 16 H10 M15 16 L21.5 24"
        stroke={theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF'}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
