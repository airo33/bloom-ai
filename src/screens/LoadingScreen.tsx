import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, ToastAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { genericFallbackPlan } from '../data/fallbackPlan';
import { generatePlan } from '../lib/api';
import Logo from '../components/Logo';
import type { RootStackScreenProps } from '../navigation/types';

const MESSAGES = [
  'Identifying injury type and stage...',
  'Selecting evidence-based protocol...',
  'Building varied weekly schedule...',
  'Writing dosage and progression criteria...',
  'Compiling red flags and safety guidelines...',
];

function toast(msg: string) {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.LONG);
  // iOS: silent fallback — would use a Snackbar lib in prod
}

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

function PulsingBrand() {
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
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return (
    <Animated.View
      style={{
        marginBottom: 28,
        transform: [{ scale }],
        opacity,
      }}
    >
      <Logo size={96} variant="filled" />
    </Animated.View>
  );
}

export default function LoadingScreen({ navigation }: RootStackScreenProps<'Loading'>) {
  const theme = useTheme();
  const [idx, setIdx] = useState(0);
  const setPlan = useAppStore((s) => s.setPlan);
  const profile = useAppStore((s) => s.profile);

  // Cycle status text every 1.8s while we wait
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, []);

  // Fire the Edge Function on mount. Falls back to the static plan on any error.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const result = await generatePlan({
          name: profile.name,
          age: profile.age,
          fitnessLevel: profile.fitnessLevel,
          injury: profile.injury,
        });
        if (cancelled) return;
        setPlan(result.plan);
        navigation.replace('Plan');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[generate-plan] failed, using fallback:', msg);
        // Surface the real error in dev so we can debug; truncate so it
        // fits the toast.
        const short = msg.length > 110 ? msg.slice(0, 110) + '…' : msg;
        toast(`AI error — fallback: ${short}`);
        setPlan(genericFallbackPlan);
        navigation.replace('Plan');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigation, profile, setPlan]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <PulsingBrand />
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
