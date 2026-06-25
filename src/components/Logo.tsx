// Brand mark — Bloom AI spark. A 4-point spark in lime on a near-black
// tile, same visual language as Claude / Gemini's AI marks but with
// curved petal-shaped points that gesture at "bloom". Single source of
// truth for the in-app logo.

import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../theme';

interface Props {
  size?: number;
  /**
   *  filled — spark on a dark tile (primary use: Welcome, Auth, Loading)
   *  ghost  — spark alone, transparent background (small inline use)
   *  light  — spark on a tinted lime card surface (for empty states)
   */
  variant?: 'filled' | 'ghost' | 'light';
}

// Spark path in a 32-unit viewBox. Same geometry the icon generator
// uses, so the in-app mark, the launcher icon, and the splash are all
// pixel-identical at parity sizes.
const SPARK_PATH =
  'M 16 6 Q 17 13 25 16 Q 17 19 16 26 Q 15 19 7 16 Q 15 13 16 6 Z';
const DARK_BG = '#0F0F12';
const LIME_SPARK = '#C8EB6B';

export default function Logo({ size = 56, variant = 'filled' }: Props) {
  const theme = useTheme();

  // The dark tile is always the same near-black on light & dark mode —
  // the spark needs to read as "Bloom AI" wherever it sits. The ghost
  // variant drops the tile and uses the theme lime so the mark adapts
  // when it's inline among text.
  const bg =
    variant === 'filled'
      ? DARK_BG
      : variant === 'light'
        ? theme.colors.pl
        : 'transparent';

  const fg =
    variant === 'filled'
      ? LIME_SPARK
      : variant === 'light'
        ? theme.colors.pu
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
      {/* Spark glyph */}
      <Path d={SPARK_PATH} fill={fg} />
      {/* Centre dot — punches a small hole through the spark so it reads
          as a knot rather than a solid star. Colour matches the tile;
          for ghost variant we use the theme background so it disappears
          into whatever the spark is overlaid on. */}
      <Circle
        cx="16"
        cy="16"
        r="1.3"
        fill={variant === 'ghost' ? theme.colors.bg : bg}
      />
    </Svg>
  );
}

/**
 * Wordmark — the full "Bloom AI" lockup with the spark on the left.
 * Useful at the top of Welcome / Auth instead of the standalone tile.
 */
export function WordMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size * 4.6} height={size} viewBox={`0 0 ${32 * 4.6} 32`}>
      <Rect x="0" y="0" width="32" height="32" rx="9" ry="9" fill={DARK_BG} />
      <Path d={SPARK_PATH} fill={LIME_SPARK} />
      <Circle cx="16" cy="16" r="1.3" fill={DARK_BG} />
    </Svg>
  );
}
