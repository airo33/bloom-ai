import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { genericFallbackPlan } from '../data/fallbackPlan';
import type { RootStackScreenProps } from '../navigation/types';

const MESSAGES = [
  'Identifying injury type and stage...',
  'Selecting evidence-based protocol...',
  'Building varied weekly schedule...',
  'Writing dosage and progression criteria...',
  'Compiling red flags and safety guidelines...',
];

// While the Supabase Edge Function isn't wired yet we always use the
// fallback plan. Once the AI is connected, swap this for a real fetch.
const SIMULATED_DELAY_MS = 4500;

function Dot({ delay, color }: { delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(800 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  return (
    <Animated.View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        marginHorizontal: 4,
        transform: [{ translateY }],
      }}
    />
  );
}

function PulsingBrand({ color }: { color: string }) {
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
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return (
    <Animated.View
      style={{
        width: 96,
        height: 96,
        borderRadius: 28,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        transform: [{ scale }],
        opacity,
      }}
    >
      <Text style={{ fontSize: 48 }}>🫀</Text>
    </Animated.View>
  );
}

export default function LoadingScreen({ navigation }: RootStackScreenProps<'Loading'>) {
  const theme = useTheme();
  const [idx, setIdx] = useState(0);
  const setPlan = useAppStore((s) => s.setPlan);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPlan(genericFallbackPlan);
      navigation.replace('Plan');
    }, SIMULATED_DELAY_MS);
    return () => clearTimeout(t);
  }, [navigation, setPlan]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <PulsingBrand color={theme.colors.pl} />
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: theme.colors.th,
            marginBottom: 10,
            textAlign: 'center',
            letterSpacing: -0.4,
          }}
        >
          Analyzing your case
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.tm,
            marginBottom: 30,
            textAlign: 'center',
          }}
        >
          {MESSAGES[idx]}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <Dot delay={0} color={theme.colors.pu} />
          <Dot delay={200} color={theme.colors.pu} />
          <Dot delay={400} color={theme.colors.pu} />
        </View>
        <Text style={{ fontSize: 12, color: theme.colors.tl, marginTop: 24, letterSpacing: 0.2 }}>
          Building personalized clinical protocol
        </Text>
      </View>
    </SafeAreaView>
  );
}
