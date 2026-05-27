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

export default function LoadingScreen({ navigation }: RootStackScreenProps<'Loading'>) {
  const theme = useTheme();
  const [idx, setIdx] = useState(0);
  const setPlan = useAppStore((s) => s.setPlan);

  // Cycle status text every 1.8s while we "compute"
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, []);

  // Inject the fallback plan and advance to Plan screen.
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
        <Text style={{ fontSize: 64, marginBottom: 20 }}>🫀</Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: theme.colors.th,
            marginBottom: 8,
            textAlign: 'center',
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
        <Text style={{ fontSize: 12, color: theme.colors.tl, marginTop: 22 }}>
          Building personalized clinical protocol
        </Text>
      </View>
    </SafeAreaView>
  );
}
