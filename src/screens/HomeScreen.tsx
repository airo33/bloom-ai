import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Stethoscope, Lock, Sparkles } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import {
  useAppStore,
  selectCurrentPhase,
  selectTodayExercises,
} from '../store/useAppStore';
import ProgressRing from '../components/ProgressRing';
import HydrationTracker from '../components/HydrationTracker';
import TaskItem from '../components/TaskItem';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import OnboardingTutorial from '../components/OnboardingTutorial';
import StreakReward, { nextUnseenMilestone } from '../components/StreakReward';
import AllTasksDoneCelebration from '../components/AllTasksDoneCelebration';
import AnimatedFlame from '../components/AnimatedFlame';
import PhaseTransition from '../components/PhaseTransition';
import HydrationGoalCelebration from '../components/HydrationGoalCelebration';
import type { RootStackParamList } from '../navigation/types';

const SUB_TIER_BADGE = {
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  annual: 'ANNUAL',
  trial: 'TRIAL',
} as const;

function greetingKeyFor(hour: number): string {
  if (hour < 5) return 'home.greetingNight';
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

/**
 * Renders a child stagger-animated on mount. We compute the
 * translateY/opacity off a single Animated.Value here so every section
 * can share the same spring config without juggling refs in the parent.
 */
function MountIn({
  delay,
  children,
  style,
}: {
  delay: number;
  children: React.ReactNode;
  style?: object;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return (
    <Animated.View style={[{ opacity: v, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const progress = useAppStore((s) => s.progress);
  const tier = useAppStore((s) => s.subscriptionTier);
  const setWater = useAppStore((s) => s.setWater);
  const toggleExerciseDone = useAppStore((s) => s.toggleExerciseDone);
  const advanceDay = useAppStore((s) => s.advanceDay);
  const onboardingTourCompleted = useAppStore((s) => s.onboardingTourCompleted);
  const setOnboardingTourCompleted = useAppStore((s) => s.setOnboardingTourCompleted);
  const lastCelebratedStreak = useAppStore((s) => s.lastCelebratedStreak);
  const celebrateStreak = useAppStore((s) => s.celebrateStreak);
  const lastAllDoneCelebratedDay = useAppStore((s) => s.lastAllDoneCelebratedDay);
  const celebrateAllDone = useAppStore((s) => s.celebrateAllDone);
  const lastHydrationCelebratedDay = useAppStore((s) => s.lastHydrationCelebratedDay);
  const celebrateHydration = useAppStore((s) => s.celebrateHydration);
  const lastSeenPhaseName = useAppStore((s) => s.lastSeenPhaseName);
  const setLastSeenPhaseName = useAppStore((s) => s.setLastSeenPhaseName);

  // Advance recovery day once per calendar day (store guards against double-fires)
  useEffect(() => {
    advanceDay();
  }, [advanceDay]);

  // First-launch coach-marks: only after a plan exists, so users see real
  // content under the tutorial referenced cards. Defer one tick so the
  // screen paints first.
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (!onboardingTourCompleted && plan) {
      const t = setTimeout(() => setShowTour(true), 400);
      return () => clearTimeout(t);
    }
  }, [onboardingTourCompleted, plan]);

  // Streak celebration check — runs whenever streak changes.
  const streakMilestone = useMemo(
    () => nextUnseenMilestone(progress.streak, lastCelebratedStreak),
    [progress.streak, lastCelebratedStreak],
  );

  // useShallow prevents the infinite-render loop: the selector returns a
  // freshly-built array each call, so without shallow equality Zustand
  // would see "changed" every render and re-trigger us forever.
  const todayExercises = useAppStore(useShallow(selectTodayExercises));
  const currentPhase = useAppStore(selectCurrentPhase);
  const greeting = t(greetingKeyFor(new Date().getHours()));

  const totalToday = todayExercises.length;
  const doneToday = todayExercises.filter((e) =>
    progress.doneExerciseIds.includes(e.id),
  ).length;
  const pct = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;

  // "All tasks done today" celebration. Only fires when:
  // - there were real tasks to do (totalToday > 0)
  // - the user finished them all (doneToday === totalToday)
  // - we haven't already celebrated for THIS recovery day
  const [showAllDone, setShowAllDone] = useState(false);
  useEffect(() => {
    if (
      totalToday > 0 &&
      doneToday === totalToday &&
      lastAllDoneCelebratedDay !== progress.day
    ) {
      // Tiny defer so the check animation on the task row plays first.
      const t = setTimeout(() => setShowAllDone(true), 320);
      return () => clearTimeout(t);
    }
  }, [doneToday, totalToday, lastAllDoneCelebratedDay, progress.day]);

  // Hydration goal — the tracker calls this when count crosses to 8.
  // We guard against re-firing for the same day at this layer.
  const [showHydrationGoal, setShowHydrationGoal] = useState(false);
  const onHydrationReached = useCallback(() => {
    if (lastHydrationCelebratedDay !== progress.day) {
      setShowHydrationGoal(true);
    }
  }, [lastHydrationCelebratedDay, progress.day]);

  // Phase transition. On first ever load with a plan, silently seed the
  // store with the current phase name so the modal doesn't fire spuriously
  // for someone who just generated their plan.
  const [showPhase, setShowPhase] = useState(false);
  useEffect(() => {
    if (!currentPhase || !plan) return;
    if (lastSeenPhaseName === null) {
      setLastSeenPhaseName(currentPhase.name);
      return;
    }
    if (lastSeenPhaseName !== currentPhase.name) {
      const t = setTimeout(() => setShowPhase(true), 500);
      return () => clearTimeout(t);
    }
  }, [currentPhase, plan, lastSeenPhaseName, setLastSeenPhaseName]);

  // Localised long weekday name from JS Intl. Picks up i18n.language so the
  // weekday automatically follows the user's chosen language.
  const dayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(new Date());
    } catch {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayNames[new Date().getDay()];
    }
  }, [i18n.language]);

  const subBadge = tier ? SUB_TIER_BADGE[tier as keyof typeof SUB_TIER_BADGE] : null;
  // Chat is part of all paid tiers per subscriptionTiers.ts; "trial" is the
  // skip-onboarding path which gets read-only access.
  const isPaid = tier === 'weekly' || tier === 'monthly' || tier === 'annual';
  const ctaIconColor = isPaid ? theme.colors.pt : theme.colors.tm;

  // Tap-to-toggle: tapping current count "unfills" it (mirrors prototype)
  const onWaterTap = (idx: number) => {
    setWater(idx + 1 === progress.water ? idx : idx + 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting header */}
        <MountIn delay={0} style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.colors.tm, letterSpacing: -0.1 }}>
                {greeting}
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: theme.colors.th,
                  marginTop: 2,
                  letterSpacing: -0.5,
                }}
              >
                {profile.name || t('common.friend')}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {subBadge && (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 20,
                    backgroundColor: theme.colors.pl,
                    borderWidth: 1,
                    borderColor: theme.colors.pb,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: theme.colors.pt,
                      letterSpacing: 0.5,
                    }}
                  >
                    {subBadge}
                  </Text>
                </View>
              )}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.card,
                  borderWidth: 1,
                  borderColor: theme.colors.bo,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: theme.colors.th,
                    fontSize: 15,
                    fontWeight: '700',
                  }}
                >
                  {(profile.name || 'F')[0].toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </MountIn>

        {/* Progress + stats card */}
        <MountIn delay={70}>
          <Card style={{ marginBottom: 12 }} padding={18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <ProgressRing percent={pct} label="auto" size={84} strokeWidth={8} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.tm,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('home.today')}
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: theme.colors.th,
                    marginTop: 2,
                    letterSpacing: -0.5,
                  }}
                >
                  {doneToday}
                  <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.tm }}>
                    {' / '}{totalToday} {t('home.doneSuffix')}
                  </Text>
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 4 }}>
                  {t('home.dayLabel', { day: progress.day, weekday: dayLabel })}
                </Text>
              </View>
            </View>

            {/* Streak row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 14,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: theme.colors.bo,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: theme.colors.ol,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AnimatedFlame size={18} color={theme.colors.or} intensity={0.25} />
              </View>
              <Text style={{ fontSize: 14, color: theme.colors.tb, flex: 1 }}>
                <Text style={{ fontWeight: '800', color: theme.colors.th }}>
                  {t('home.streak', { count: progress.streak })}
                </Text>
                {progress.streak > 1 ? t('home.streakKeep') : t('home.streakStart')}
              </Text>
            </View>
          </Card>
        </MountIn>

        {/* Hydration */}
        <MountIn delay={140}>
          <HydrationTracker
            glasses={progress.water}
            onTap={onWaterTap}
            onReachedGoal={onHydrationReached}
          />
        </MountIn>

        {/* Tasks header */}
        <MountIn delay={210}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 14,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: theme.colors.th,
                letterSpacing: -0.3,
              }}
            >
              {totalToday === 0 ? t('home.restDay') : t('home.tasksTitle')}
            </Text>
            {totalToday > 0 && (
              <Text style={{ fontSize: 13, color: theme.colors.tm }}>
                {doneToday === totalToday
                  ? t('home.allDone')
                  : t('home.leftCount', { count: totalToday - doneToday })}
              </Text>
            )}
          </View>
        </MountIn>

        {/* Tasks list */}
        <MountIn delay={260}>
          {!plan ? (
            <View style={{ marginBottom: 12 }}>
              <EmptyState
                Icon={Sparkles}
                title={t('home.noPlanTitle')}
                message={t('home.noPlanBody')}
                ctaLabel={t('home.noPlanCta')}
                onCta={() => nav.navigate('Welcome')}
              />
            </View>
          ) : totalToday === 0 ? (
            <Card padding={20} style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.th }}>
                {t('home.restDay')}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.tm,
                  marginTop: 5,
                  textAlign: 'center',
                  lineHeight: 19,
                }}
              >
                {t('home.restBody')}
              </Text>
            </Card>
          ) : (
            todayExercises.map((ex) => (
              <TaskItem
                key={ex.id}
                exercise={ex}
                done={progress.doneExerciseIds.includes(ex.id)}
                onPress={() => nav.navigate('Exercise', { exerciseId: ex.id })}
                onToggle={() => toggleExerciseDone(ex.id)}
              />
            ))
          )}
        </MountIn>

        {/* AI Physio CTA */}
        <MountIn delay={320}>
          <Pressable
            onPress={() => {
              if (isPaid) nav.navigate('Chat');
              else nav.navigate('Subscription');
            }}
            style={({ pressed }) => ({
              marginTop: 6,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isPaid ? theme.colors.pb : theme.colors.bo,
              backgroundColor: isPaid ? theme.colors.pl : theme.colors.card2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {isPaid ? (
              <Stethoscope size={18} color={ctaIconColor} strokeWidth={2} />
            ) : (
              <Lock size={16} color={ctaIconColor} strokeWidth={2} />
            )}
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isPaid ? theme.colors.pt : theme.colors.tm,
                letterSpacing: -0.2,
              }}
            >
              {isPaid ? t('home.ctaPhysio') : t('home.ctaPhysioLocked')}
            </Text>
          </Pressable>
        </MountIn>
      </ScrollView>

      <OnboardingTutorial
        visible={showTour}
        onDone={() => {
          setShowTour(false);
          setOnboardingTourCompleted(true);
        }}
      />

      <StreakReward
        milestone={streakMilestone}
        onDismiss={() => streakMilestone && celebrateStreak(streakMilestone)}
      />

      <AllTasksDoneCelebration
        visible={showAllDone}
        completedCount={totalToday}
        streak={progress.streak}
        onDismiss={() => {
          setShowAllDone(false);
          celebrateAllDone(progress.day);
        }}
      />

      <PhaseTransition
        visible={showPhase}
        phase={currentPhase}
        onDismiss={() => {
          setShowPhase(false);
          if (currentPhase) setLastSeenPhaseName(currentPhase.name);
        }}
      />

      <HydrationGoalCelebration
        visible={showHydrationGoal}
        onDone={() => {
          setShowHydrationGoal(false);
          celebrateHydration(progress.day);
        }}
      />
    </SafeAreaView>
  );
}
