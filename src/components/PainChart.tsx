// Simple SVG line chart for pain history (0-10 scale).
// X axis = log index, Y axis = inverted pain level so lower = better visually.

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme';

interface Props {
  points: number[];   // pain values in chronological order
  height?: number;
  width?: number;
}

export default function PainChart({ points, height = 140, width = 290 }: Props) {
  const theme = useTheme();

  const padding = { left: 24, right: 8, top: 12, bottom: 22 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const safe = points.length ? points : [];
  const denom = Math.max(safe.length - 1, 1);

  const path = useMemo(() => {
    if (!safe.length) return '';
    return safe
      .map((p, i) => {
        const x = padding.left + (i * innerW) / denom;
        // Invert so low pain = top
        const y = padding.top + ((10 - Math.max(0, Math.min(10, p))) / 10) * innerH;
        return `${x},${y}`;
      })
      .join(' ');
  }, [safe, innerW, innerH, denom]);

  if (!safe.length) {
    return (
      <Text
        style={{
          fontSize: 13,
          color: theme.colors.tl,
          textAlign: 'center',
          paddingVertical: 18,
        }}
      >
        Log entries to see your pain trend
      </Text>
    );
  }

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Y-axis grid lines: 0, 5, 10 */}
        {[0, 5, 10].map((tick) => {
          const y = padding.top + ((10 - tick) / 10) * innerH;
          return (
            <React.Fragment key={tick}>
              <Line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke={theme.colors.bo}
                strokeWidth={1}
                strokeDasharray={tick === 0 || tick === 10 ? '0' : '3 3'}
              />
              <SvgText
                x={padding.left - 6}
                y={y + 4}
                fontSize="10"
                fill={theme.colors.tm}
                textAnchor="end"
              >
                {tick}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Line */}
        <Polyline
          points={path}
          fill="none"
          stroke={theme.colors.pu}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {safe.map((p, i) => {
          const x = padding.left + (i * innerW) / denom;
          const y = padding.top + ((10 - p) / 10) * innerH;
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={3.5}
              fill={theme.colors.card}
              stroke={theme.colors.pu}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    </View>
  );
}
