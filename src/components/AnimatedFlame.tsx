// Living flame — pulses scale + opacity in an infinite loop with a tiny
// rotational wobble so it feels like it's actually burning. Built on the
// Lucide Flame so we don't need to ship a custom SVG.
//
// We deliberately animate with useNativeDriver: false here. The Reanimated
// shim that wraps RN's Animated subsystem on this SDK quietly drops some
// native-driven loops when their target value never moves more than ~10%
// — small flame badges (18dp) were never visibly pulsing in v15 because of
// this. Running on the JS thread is fine: a single Animated.Value driving
// two interpolations costs effectively nothing.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Flame } from 'lucide-react-native';

interface Props {
  size?: number;
  color: string;
  /** Pulse magnitude — 0.22 default. Higher = more dramatic. */
  intensity?: number;
}

export default function AnimatedFlame({ size = 28, color, intensity = 0.22 }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1 - intensity * 0.35, 1 + intensity],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <Flame size={size} color={color} fill={color} strokeWidth={2} />
    </Animated.View>
  );
}
