// Celebration modal that pops the first time the user crosses a streak
// milestone (3, 7, 14, 30, 60, 100 days). Driven from HomeScreen by
// comparing progress.streak vs lastCelebratedStreak in the store.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, Animated } from 'react-native';
import { Award, Trophy, Star, Crown } from 'lucide-react-native';
import { useTheme } from '../theme';
import Confetti from './Confetti';
import AnimatedFlame from './AnimatedFlame';

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;
export type StreakMilestone = typeof STREAK_MILESTONES[number];

/**
 * Returns the highest milestone <= streak that the user hasn't seen yet.
 * Returns null if there's nothing new to celebrate.
 */
export function nextUnseenMilestone(
  streak: number,
  lastCelebrated: number,
): StreakMilestone | null {
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    const m = STREAK_MILESTONES[i];
    if (streak >= m && lastCelebrated < m) return m;
  }
  return null;
}

interface MilestoneMeta {
  title: string;
  message: string;
  /** Lucide icon component — `null` means use the AnimatedFlame instead. */
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number; fill?: string }> | null;
}

const MILESTONE_META: Record<StreakMilestone, MilestoneMeta> = {
  3: {
    title: 'Three days down',
    message: 'Three sessions in a row. Your brain is starting to expect this — the habit is taking root.',
    Icon: null, // animated flame
  },
  7: {
    title: 'One week in',
    message: 'Seven days of showing up. The hardest part of any habit is the start — you cleared it.',
    Icon: null, // animated flame
  },
  14: {
    title: 'Two-week streak',
    message: 'Recovery is compounding. Two weeks of consistent work is when real tissue change kicks in.',
    Icon: Award,
  },
  30: {
    title: 'One month strong',
    message: 'A full month. Your nervous system has rewired around movement. Keep going — this is how lasting recovery is built.',
    Icon: Trophy,
  },
  60: {
    title: 'Sixty days',
    message: 'Two months of daily care for your body. This is athlete-tier discipline.',
    Icon: Star,
  },
  100: {
    title: '100 days',
    message: 'A hundred days. Whatever brought you here is far behind you now.',
    Icon: Crown,
  },
};

interface Props {
  milestone: StreakMilestone | null;
  onDismiss: () => void;
}

export default function StreakReward({ milestone, onDismiss }: Props) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [confettiActive, setConfettiActive] = useState(false);

  useEffect(() => {
    if (!milestone) return;
    scale.setValue(0.85);
    opacity.setValue(0);
    setConfettiActive(false);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      // Kick the confetti once the card has popped, so the user looks at
      // the heading first and the confetti reads as a reward, not noise.
      setConfettiActive(true);
    });
  }, [milestone, scale, opacity]);

  if (!milestone) return null;
  const meta = MILESTONE_META[milestone];
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

        <Animated.View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 26,
            paddingHorizontal: 26,
            paddingVertical: 30,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.bo,
            transform: [{ scale }],
            opacity,
          }}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              backgroundColor: theme.colors.ol,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            {meta.Icon ? (
              <meta.Icon size={42} color={theme.colors.or} fill={theme.colors.or} strokeWidth={2} />
            ) : (
              <AnimatedFlame size={44} color={theme.colors.or} intensity={0.3} />
            )}
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: theme.colors.th,
              letterSpacing: -0.6,
              marginBottom: 4,
            }}
          >
            {milestone} days
          </Text>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: theme.colors.pu,
              letterSpacing: -0.3,
              marginBottom: 10,
            }}
          >
            {meta.title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.tb,
              textAlign: 'center',
              lineHeight: 21,
              marginBottom: 22,
            }}
          >
            {meta.message}
          </Text>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.pu,
              borderRadius: 14,
              paddingHorizontal: 24,
              paddingVertical: 13,
              alignSelf: 'stretch',
              alignItems: 'center',
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Text
              style={{
                color: onPrimary,
                fontSize: 15,
                fontWeight: '800',
                letterSpacing: -0.2,
              }}
            >
              Keep going
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
