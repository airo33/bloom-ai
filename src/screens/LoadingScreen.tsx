import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, ToastAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { genericFallbackPlan } from '../data/fallbackPlan';
import { generatePlan, ApiError } from '../lib/api';
import { track } from '../lib/analytics';
import Logo from '../components/Logo';
import type { RootStackScreenProps } from '../navigation/types';

const NUM_MESSAGES = 5;

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
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const setPlan = useAppStore((s) => s.setPlan);
  const profile = useAppStore((s) => s.profile);

  // Cycle status text every 1.8s while we wait
  useEffect(() => {
    const tt = setInterval(() => setIdx((i) => (i + 1) % NUM_MESSAGES), 1800);
    return () => clearInterval(tt);
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
        track('plan_generated', { tokens: result.usage?.output_tokens ?? 0 });
        setPlan(result.plan);
        navigation.replace('Plan');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);

        // The Edge Function refused the input as "not an injury description"
        // — don't fall back to a generic plan, send the user back to the
        // description field so they can fix it.
        if (err instanceof ApiError && err.code === 'not_an_injury') {
          track('plan_input_rejected');
          toast(err.message || t('loading.errNotInjury'));
          navigation.replace('Onboarding2');
          return;
        }
        track('plan_generation_failed', { reason: err instanceof Error ? err.name : 'unknown' });

        console.warn('[generate-plan] failed, using fallback:', msg);
        const short = msg.length > 110 ? msg.slice(0, 110) + '…' : msg;
        toast(t('loading.errAiFallback', { message: short }));
        setPlan(genericFallbackPlan);
        navigation.replace('Plan');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigation, profile, setPlan, t]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <PulsingBrand />
        <Text
          style={{
            fontSize: 26,
            fontFamily: font.serif,
            color: theme.colors.th,
            marginBottom: 10,
            textAlign: 'center',
            letterSpacing: -0.5,
          }}
        >
          {t('loading.title')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.tm,
            marginBottom: 30,
            textAlign: 'center',
          }}
        >
          {t(`loading.msg${idx}`)}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <Dot delay={0} color={theme.colors.pu} />
          <Dot delay={200} color={theme.colors.pu} />
          <Dot delay={400} color={theme.colors.pu} />
        </View>
        <Text style={{ fontSize: 12, color: theme.colors.tl, marginTop: 24, letterSpacing: 0.2 }}>
          {t('loading.footer')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
