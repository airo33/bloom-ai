import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import {
  useAppStore,
  selectTodayExercises,
} from '../store/useAppStore';
import ProgressRing from '../components/ProgressRing';
import HydrationTracker from '../components/HydrationTracker';
import TaskItem from '../components/TaskItem';
import type { RootStackParamList } from '../navigation/types';

const SUB_TIER_BADGE = {
  weekly: { label: 'WEEKLY', bg: '#E3F2FD', fg: '#0044AA' },
  monthly: { label: 'MONTHLY', bg: '#FDCB6E', fg: '#7A4000' },
  annual: { label: 'ANNUAL', bg: '#FFF0D4', fg: '#8A4A00' },
  trial: { label: 'TRIAL', bg: '#EEE9FF', fg: '#5248C8' },
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

  // Advance recovery day once per calendar day (the store guards against double-fires)
  useEffect(() => {
    advanceDay();
  }, [advanceDay]);

  const todayExercises = useAppStore(selectTodayExercises);
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

  // Water tap: tap-to-toggle pattern from prototype — tapping the current count "unfills" it
  const onWaterTap = (idx: number) => {
    setWater(idx + 1 === progress.water ? idx : idx + 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.colors.tm }}>{greeting}</Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: theme.colors.th,
                marginTop: 2,
              }}
            >
              {profile.name || 'Friend'} 👋
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
            {subBadge && (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: subBadge.bg,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: subBadge.fg }}>
                  {subBadge.label}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => nav.navigate('Main', undefined as never)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.pu,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: theme.colors.pu,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 14,
                elevation: 5,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                {(profile.name || 'F')[0].toUpperCase()}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Progress ring card */}
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: theme.colors.bo,
            padding: 16,
            marginBottom: 11,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <ProgressRing percent={pct} label={`${pct}%`} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.th }}>
              {doneToday}
              <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.tm }}>
                {' / '}{totalToday}
              </Text>
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.tm, marginTop: 4 }}>
              🔥 {progress.streak}d streak · 📅 Day {progress.day}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.pu,
                fontWeight: '600',
                marginTop: 3,
              }}
            >
              {dayLabel}
            </Text>
          </View>
        </View>

        {/* Hydration */}
        <HydrationTracker glasses={progress.water} onTap={onWaterTap} />

        {/* Tasks header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
            marginBottom: 9,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.th }}>
            {totalToday === 0 ? 'Rest Day 😌' : "Today's Tasks"}
          </Text>
          {totalToday > 0 && (
            <Text style={{ fontSize: 13, color: theme.colors.tm }}>
              {doneToday === totalToday ? 'All done! 🎉' : `${totalToday - doneToday} left`}
            </Text>
          )}
        </View>

        {/* Tasks list */}
        {!plan ? (
          <View
            style={{
              padding: 20,
              alignItems: 'center',
              backgroundColor: theme.colors.card,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: theme.colors.bo,
              marginBottom: 11,
            }}
          >
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🫀</Text>
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
          </View>
        ) : totalToday === 0 ? (
          <View
            style={{
              padding: 20,
              alignItems: 'center',
              backgroundColor: theme.colors.card,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: theme.colors.bo,
              marginBottom: 11,
            }}
          >
            <Text style={{ fontSize: 36, marginBottom: 8 }}>😌</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.th }}>
              Rest Day
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.tm,
                marginTop: 5,
                textAlign: 'center',
              }}
            >
              Your body repairs during rest. Stay hydrated and sleep well tonight.
            </Text>
          </View>
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
            padding: 13,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: isPaid ? theme.colors.pb : theme.colors.bo,
            backgroundColor: isPaid ? theme.colors.pl : theme.colors.card2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: isPaid ? 20 : 18 }}>{isPaid ? '🩺' : '🔒'}</Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: isPaid ? '700' : '600',
              color: isPaid ? theme.colors.pt : theme.colors.tm,
            }}
          >
            {isPaid ? 'Ask AI Physio anything' : 'AI Physio Chat — Subscribe to unlock'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
