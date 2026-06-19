// Tiny inline celebration that fires from HomeScreen when the user hits
// 8/8 glasses for the first time today. Lighter than the full-day-done
// modal — it's just a confetti burst + a transient banner that fades
// itself out after a couple seconds.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, Easing } from 'react-native';
import { Droplet } from 'lucide-react-native';
import { useTheme } from '../theme';
import Confetti from './Confetti';

const WATER_COLOR = '#38BDF8';

interface Props {
  visible: boolean;
  onDone: () => void;
}

export default function HydrationGoalCelebration({ visible, onDone }: Props) {
  const theme = useTheme();
  const slide = useRef(new Animated.Value(0)).current;
  const [confettiOn, setConfettiOn] = useState(false);

  useEffect(() => {
    if (!visible) return;
    slide.setValue(0);
    setConfettiOn(true);

    Animated.sequence([
      Animated.spring(slide, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.delay(1900),
      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDone();
    });
  }, [visible, slide, onDone]);

  if (!visible) return null;

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 0],
  });

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <Confetti active={confettiOn} count={18} onComplete={() => setConfettiOn(false)} />
      <Animated.View
        style={{
          position: 'absolute',
          top: 60,
          left: 22,
          right: 22,
          backgroundColor: theme.colors.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: theme.colors.bo,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          opacity: slide,
          transform: [{ translateY }],
          // Subtle elevation feel — RN won't pick up shadow on Android
          // without elevation prop on Android.
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: WATER_COLOR + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Droplet size={20} color={WATER_COLOR} fill={WATER_COLOR} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: theme.colors.th,
              letterSpacing: -0.3,
            }}
          >
            Perfect hydration
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>
            8/8 glasses · your joints thank you
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
