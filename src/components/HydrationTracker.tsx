// Hydration tracker — 8 droplet pips with tap-to-fill, progress bar, status tip.
//
// Each glass pops on tap regardless of whether it's filling or emptying —
// we drive the animation imperatively from onPress instead of from an
// effect watching `glasses`. The effect-based approach kept failing
// silently for re-taps on glasses that had been filled+unfilled+refilled.
//
// We emit `onReachedGoal` when the count crosses 0→8 so the caller can
// throw confetti — the caller owns the "once per day" guard.

import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Droplet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

const WATER_COLOR = '#38BDF8'; // sky-400, a clean water blue

interface Props {
  glasses: number;            // 0..8
  onTap: (glassIdx: number) => void;
  /** Fired once when the count transitions to 8 from a lower value. */
  onReachedGoal?: () => void;
}

export default function HydrationTracker({ glasses, onTap, onReachedGoal }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  // Tips are indexed by glasses 0..8 (tip0 = "start your day", tip8 =
  // "perfect"). Clamp to 8 since glasses never exceeds 8.
  const tip = t(`hydration.tip${Math.min(glasses, 8)}`);

  // Per-glass scale value. Seeded at 1 so the first paint isn't shrunken.
  const scales = useRef<Animated.Value[] | null>(null);
  if (scales.current === null) {
    scales.current = Array.from({ length: 8 }, () => new Animated.Value(1));
  }
  // Progress bar fill (0..1).
  const bar = useRef(new Animated.Value(glasses / 8)).current;
  const prevGlassesRef = useRef(glasses);

  // Watch glasses changes only to (a) animate the bar smoothly and (b)
  // fire the goal callback exactly once when we cross into 8.
  useEffect(() => {
    Animated.timing(bar, {
      toValue: glasses / 8,
      duration: 350,
      useNativeDriver: false,
    }).start();
    if (prevGlassesRef.current < 8 && glasses === 8 && onReachedGoal) {
      onReachedGoal();
    }
    prevGlassesRef.current = glasses;
  }, [glasses, bar, onReachedGoal]);

  const popGlass = (i: number) => {
    const v = scales.current![i];
    v.setValue(0.6);
    Animated.spring(v, {
      toValue: 1,
      friction: 3.8,
      tension: 240,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.bo,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: theme.colors.th,
              letterSpacing: -0.2,
            }}
          >
            {t('hydration.title')}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>
            {t('hydration.subtitle')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: WATER_COLOR }}>
            {glasses}
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.tm, fontWeight: '600' }}>/8</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 10 }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const filled = i < glasses;
          const v = scales.current![i];
          return (
            <Pressable
              key={i}
              onPress={() => {
                popGlass(i);
                onTap(i);
              }}
              hitSlop={4}
              style={{
                flex: 1,
                aspectRatio: 1,
              }}
            >
              <Animated.View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  backgroundColor: filled ? WATER_COLOR + '22' : theme.colors.card2,
                  transform: [{ scale: v }],
                }}
              >
                <Droplet
                  size={18}
                  color={filled ? WATER_COLOR : theme.colors.tl}
                  fill={filled ? WATER_COLOR : 'transparent'}
                  strokeWidth={2}
                />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          height: 6,
          backgroundColor: theme.colors.card2,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            width: bar.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            height: '100%',
            backgroundColor: WATER_COLOR,
          }}
        />
      </View>

      <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 8 }}>{tip}</Text>
    </View>
  );
}
