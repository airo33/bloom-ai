// Pulsing placeholder block — shows while content is loading instead of a
// blank spinner. Use it to mock the layout of what's about to appear so
// the UI doesn't "jump".

import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: Props) {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.card2,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Convenience: vertical stack of bars to mimic a row-list. */
export function SkeletonList({
  rows = 3,
  rowHeight = 56,
  gap = 10,
}: {
  rows?: number;
  rowHeight?: number;
  gap?: number;
}) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          height={rowHeight}
          radius={14}
          style={{ marginBottom: i === rows - 1 ? 0 : gap }}
        />
      ))}
    </View>
  );
}
