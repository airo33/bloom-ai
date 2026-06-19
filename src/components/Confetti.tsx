// Lightweight confetti burst — no native deps. We render N small squares
// that fall from a point above the top edge, drift sideways, and rotate.
// Each particle owns a single Animated.Value driving translateY; we
// derive translateX and rotate via interpolate, so we only schedule N
// animations instead of 3N.
//
// Performance note: we deliberately cap at ~24 particles. Animated on the
// native driver costs nothing per-frame on the JS side, but more shards
// don't read as "more festive" — they just look noisy.

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, Easing } from 'react-native';

const COLORS = [
  '#B5E550', // brand lime
  '#FFB347', // orange
  '#FF6B6B', // coral
  '#4FC3F7', // sky blue
  '#FFE45E', // sunny yellow
  '#A78BFA', // violet
];

interface Particle {
  // start x as fraction of screen width, kept stable per particle
  startX: number;
  // horizontal drift in px from start over full fall
  driftX: number;
  // size in px (small square)
  size: number;
  // rotation revolutions over full fall
  spins: number;
  // delay in ms before this particle starts
  delay: number;
  // total duration in ms for this particle's fall
  duration: number;
  color: string;
}

function buildParticles(count: number, screenW: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      startX: Math.random(),
      driftX: (Math.random() - 0.5) * Math.min(screenW * 0.5, 180),
      size: 6 + Math.random() * 6,
      spins: 0.5 + Math.random() * 2.5,
      delay: Math.random() * 250,
      duration: 1500 + Math.random() * 1100,
      color: COLORS[i % COLORS.length],
    });
  }
  return out;
}

interface Props {
  /** Trigger — when this flips from false→true, the burst plays once. */
  active: boolean;
  count?: number;
  /** Called when every particle has finished falling. */
  onComplete?: () => void;
}

export default function Confetti({ active, count = 22, onComplete }: Props) {
  const screen = useMemo(() => Dimensions.get('window'), []);
  const particles = useMemo(
    () => buildParticles(count, screen.width),
    [count, screen.width],
  );
  // One Animated.Value per particle. We DON'T recreate them on re-render
  // so the loop stays smooth.
  const progress = useRef(particles.map(() => new Animated.Value(0))).current;
  const finishedRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    finishedRef.current = 0;
    progress.forEach((v) => v.setValue(0));
    const anims = particles.map((p, i) =>
      Animated.timing(progress[i], {
        toValue: 1,
        duration: p.duration,
        delay: p.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    Animated.parallel(anims).start(({ finished }) => {
      if (finished && onComplete) onComplete();
    });
  }, [active, particles, progress, onComplete]);

  if (!active) return null;

  const fallHeight = screen.height + 80;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => {
        const v = progress[i];
        const translateY = v.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, fallHeight],
        });
        const translateX = v.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.driftX],
        });
        const rotate = v.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spins * 360}deg`],
        });
        const opacity = v.interpolate({
          inputRange: [0, 0.05, 0.85, 1],
          outputRange: [0, 1, 1, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: p.startX * screen.width - p.size / 2,
              width: p.size,
              height: p.size * 1.4, // confetti is rectangular, not square
              backgroundColor: p.color,
              borderRadius: 1,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
