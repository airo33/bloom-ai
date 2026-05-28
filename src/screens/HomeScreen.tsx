import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Flame, Stethoscope, Lock } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '../theme';
import {
  useAppStore,
  selectTodayExercises,
} from '../store/useAppStore';
import ProgressRing from '../components/ProgressRing';
import HydrationTracker from '../components/HydrationTracker';
import TaskItem from '../components/TaskItem';
import Card from '../components/Card';
import type { RootStackParamList } from '../navigation/types';

const SUB_TIER_BADGE = {
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  annual: 'ANNUAL',
  trial: 'TRIAL',
} as const;

function greetingFor(hour: number) {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const progress = useAppStore((s) => s.progress);
  const tier = useAppStore((s) => s.subscriptionTier);
  const setWater = useAppStore((s) => s.setWater);
  const toggleExerciseDone = useAppStore((s) => s.toggleExerciseDone);
  const advanceDay = useAppStore((s) => s.advanceDay);

  // Advance recovery day once per calendar day (store guards against double-fires)
  useEffect(() => {
    advanceDay();
  }, [advanceDay]);

  // useShallow prevents the infinite-render loop: the selector returns a
  // freshly-built array each call, so without shallow equality Zustand
  // would see "changed" every render and re-trigger us forever.
  const todayExercises = useAppStore(useShallow(selectTodayExercises));
  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);

  const totalToday = todayExercises.length;
  const doneToday = todayExercises.filter((e) =>
    progress.doneExerciseIds.includes(e.id),
  ).length;
  const pct = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;

  const dayLabel = useMemo(() => {
    const dayNames = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
    ];
    return dayNames[new Date().getDay()];
  }, []);

  const subBadge = tier ? SUB_TIER_BADGE[tier as keyof typeof SUB_TIER_BADGE] : null;
  const isPaid = tier === 'monthly' || tier === 'annual';
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
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
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
              {profile.name || 'Friend'}
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

        {/* Progress + stats card */}
        <Card style={{ marginBottom: 12 }} padding={18}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <ProgressRing percent={pct} label={`${pct}%`} size={84} strokeWidth={8} />
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
                Today
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
                  {' / '}{totalToday} done
                </Text>
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 4 }}>
                Day {progress.day} · {dayLabel}
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
              <Flame size={18} color={theme.colors.or} fill={theme.colors.or} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 14, color: theme.colors.tb, flex: 1 }}>
              <Text style={{ fontWeight: '800', color: theme.colors.th }}>
                {progress.streak}-day streak
              </Text>
              {progress.streak > 1 ? ' — keep it going' : ' — start your run'}
            </Text>
          </View>
        </Card>

        {/* Hydration */}
        <HydrationTracker glasses={progress.water} onTap={onWaterTap} />

        {/* Tasks header */}
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
            {totalToday === 0 ? 'Rest day' : "Today's tasks"}
          </Text>
          {totalToday > 0 && (
            <Text style={{ fontSize: 13, color: theme.colors.tm }}>
              {doneToday === totalToday ? 'All done' : `${totalToday - doneToday} left`}
            </Text>
          )}
        </View>

        {/* Tasks list */}
        {!plan ? (
          <Card padding={20} style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.th }}>
              No plan yet
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.tm,
                marginTop: 4,
                textAlign: 'center',
              }}
            >
              Complete onboarding to generate your AI clinical plan.
            </Text>
          </Card>
        ) : totalToday === 0 ? (
          <Card padding={20} style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.th }}>
              Rest day
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
              Your body repairs during rest. Stay hydrated and sleep well tonight.
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

        {/* AI Physio CTA */}
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
            {isPaid ? 'Ask AI Physio anything' : 'AI Physio Chat — subscribe to unlock'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
