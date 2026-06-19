// Hydration tracker — 8 droplet pips with tap-to-fill, progress bar, status tip.
//
// Each droplet has its own Animated.Value driving a tiny pop when it becomes
// filled (or shrink when unfilled). The progress bar width animates with
// useNativeDriver: false (width can't be on the native thread). We emit
// `onReachedGoal` when the count crosses 0→8 so the caller can throw
// confetti — the caller owns the "once per day" guard.

import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Droplet } from 'lucide-react-native';
import { useTheme } from '../theme';

const TIPS = [
  'Start your day with a glass of water',
  'Joints need hydration — drink up',
  'Consistent hydration supports healing',
  'One more glass before lunch',
  'Great hydration today',
  '6/8 — almost there',
  '7/8 — nearly done',
  'Perfect hydration today',
];

const WATER_COLOR = '#38BDF8'; // sky-400, a clean water blue

interface Props {
  glasses: number;            // 0..8
  onTap: (glassIdx: number) => void;
  /** Fired once when the count transitions to 8 from a lower value. */
  onReachedGoal?: () => void;
}

export default function HydrationTracker({ glasses, onTap, onReachedGoal }: Props) {
  const theme = useTheme();
  const tip = TIPS[Math.min(glasses, TIPS.length - 1)];

  // Per-droplet pop animation. Value 0 = empty, 1 = filled.
  const drops = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0)),
  ).current;
  // Progress bar fill (0..1).
  const bar = useRef(new Animated.Value(0)).current;
  const prevGlassesRef = useRef(glasses);

  useEffect(() => {
    // Animate each droplet that crossed the threshold relative to glasses.
    drops.forEach((v, i) => {
      const targetFilled = i < glasses ? 1 : 0;
      // Spring pop for newly filled, soft ease for unfilled.
      if (targetFilled === 1) {
        Animated.spring(v, {
          toValue: 1,
          friction: 4.5,
          tension: 220,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(v, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    });

    Animated.timing(bar, {
      toValue: glasses / 8,
      duration: 350,
      useNativeDriver: false,
    }).start();

    // Goal celebration trigger — only when going UP into 8, not down→up→down.
    if (prevGlassesRef.current < 8 && glasses === 8 && onReachedGoal) {
      onReachedGoal();
    }
    prevGlassesRef.current = glasses;
  }, [glasses, drops, bar, onReachedGoal]);

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
            Hydration
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>
            8 glasses · supports joint healing
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
          const v = drops[i];
          // Overshoot then settle for a bouncy pop.
          const scale = v.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          });
          return (
            <Pressable
              key={i}
              onPress={() => onTap(i)}
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
                  transform: [{ scale }],
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
