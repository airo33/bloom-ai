// Gesture-driven 0..max slider that snaps to integer stops. Pure-JS
// (PanResponder + measured layout) so it works without a native
// dev-client rebuild. Renders a colored gradient track with a large
// white thumb; caller draws the value label separately so the same
// component powers both the hero pain slider and the compact
// sleep/energy/stress rows.

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  PanResponder,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  /** Colors used for the track gradient. Left → right. */
  trackColors: [string, string, ...string[]];
  /** Solid fill color for the thumb ring accent. */
  accent: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 10,
  trackColors,
  accent,
  height = 44,
  style,
}: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const lastValueRef = useRef(value);
  lastValueRef.current = value;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  }, []);

  const commit = useCallback(
    (locationX: number) => {
      const w = widthRef.current;
      if (w <= 0) return;
      const clamped = Math.max(0, Math.min(w, locationX));
      const ratio = clamped / w;
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw);
      if (snapped !== lastValueRef.current) {
        lastValueRef.current = snapped;
        onChange(snapped);
      }
    },
    [min, max, onChange],
  );

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => commit(e.nativeEvent.locationX),
      onPanResponderMove: (e) => commit(e.nativeEvent.locationX),
    }),
  ).current;

  // Position of thumb centre in pixels.
  const ratio = width > 0 ? (value - min) / (max - min) : 0;
  const thumbSize = height - 4;
  const thumbLeft = width > 0 ? ratio * width - thumbSize / 2 : 0;

  const trackHeight = 10;

  return (
    <View
      style={[{ height, justifyContent: 'center' }, style]}
      onLayout={onLayout}
      {...responder.panHandlers}
    >
      {/* Track */}
      <LinearGradient
        colors={trackColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: trackHeight,
          borderRadius: trackHeight / 2,
        }}
      />

      {/* Thumb — floats over the track, positioned by ratio */}
      {width > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: (height - thumbSize) / 2,
            left: thumbLeft,
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: theme.colors.card,
            borderWidth: 3,
            borderColor: accent,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
              },
              android: {
                elevation: 3,
              },
            }),
          }}
        />
      )}
    </View>
  );
}
