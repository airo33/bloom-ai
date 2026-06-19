// Living flame — pulses scale + opacity in an infinite loop with a tiny
// rotational wobble so it feels like it's actually burning. Built on the
// Lucide Flame so we don't need to ship a custom SVG.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Flame } from 'lucide-react-native';

interface Props {
  size?: number;
  color: string;
  /** Pulse magnitude — 0.08 default. Higher = more dramatic. */
  intensity?: number;
}

export default function AnimatedFlame({ size = 28, color, intensity = 0.08 }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1 + intensity],
  });
  const rotate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale }, { rotate }], opacity }}>
      <Flame size={size} color={color} fill={color} strokeWidth={2} />
    </Animated.View>
  );
}
