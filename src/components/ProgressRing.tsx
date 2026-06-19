// Animated circular progress indicator built with react-native-svg.
// Ports the SVG ring from the prototype's home screen.
//
// The ring stroke and the % label both animate to the new value over
// the same 600ms window so the number "fills" the ring instead of
// snapping to it.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  /** Percent done, 0..100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Center label text. If you pass `auto`, the ring shows an animated
   *  count-up to `percent`. Pass a custom string for any other label. */
  label?: string | 'auto';
}

export default function ProgressRing({
  percent,
  size = 76,
  strokeWidth = 7,
  label,
}: Props) {
  const theme = useTheme();
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const safePct = Math.max(0, Math.min(100, percent));

  const anim = useRef(new Animated.Value(safePct)).current;
  // Separate state for the label so we can render an integer that
  // matches the ring fill at every frame.
  const [displayPct, setDisplayPct] = useState(safePct);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: safePct,
      duration: 600,
      useNativeDriver: false,
    }).start();
    const sub = anim.addListener(({ value }) => setDisplayPct(Math.round(value)));
    return () => anim.removeListener(sub);
  }, [safePct, anim]);

  const offset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [c, 0],
  });

  const resolvedLabel =
    label === 'auto' ? `${displayPct}%` : (label ?? null);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={theme.colors.bo}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={theme.colors.pu}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={offset as unknown as number}
          />
        </G>
      </Svg>
      {resolvedLabel != null ? (
        <View
          // `inset: 0` is a web-only CSS shorthand — RN expects each side
          // spelled out, otherwise the label doesn't center over the ring.
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '800', color: theme.colors.th }}>
            {resolvedLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
