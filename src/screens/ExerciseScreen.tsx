import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { getCategory } from '../theme/categories';
import Button from '../components/Button';
import Card from '../components/Card';
import type { RootStackScreenProps } from '../navigation/types';

export default function ExerciseScreen({
  route,
  navigation,
}: RootStackScreenProps<'Exercise'>) {
  const theme = useTheme();
  const { exerciseId } = route.params;

  const exercise = useAppStore((s) =>
    s.plan?.exercises.find((e) => e.id === exerciseId),
  );
  const done = useAppStore((s) => s.progress.doneExerciseIds.includes(exerciseId));
  const toggle = useAppStore((s) => s.toggleExerciseDone);

  if (!exercise) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>❓</Text>
          <Text style={{ fontSize: 16, color: theme.colors.tm, textAlign: 'center' }}>
            Exercise not found.
          </Text>
          <View style={{ height: 16 }} />
          <Button title="Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const c = getCategory(exercise.category);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style="light" />

      {/* Colored hero header */}
      <View style={{ height: 185, backgroundColor: c.bar, position: 'relative' }}>
        <SafeAreaView edges={['top']}>
          <View
            style={{
              paddingHorizontal: 18,
              paddingTop: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.22)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 18 }}>⬅️</Text>
            </Pressable>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.22)',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{c.lbl}</Text>
            </View>
          </View>
        </SafeAreaView>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <Text style={{ fontSize: 56 }}>{exercise.emoji ?? c.em}</Text>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: 'rgba(0,0,0,0.22)',
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>
            {exercise.name}
          </Text>
        </View>
      </View>

      {/* Stat tiles */}
      <View style={{ paddingHorizontal: 22, paddingTop: 12, flexDirection: 'row', gap: 10 }}>
        {(
          [
            { emoji: '⏱️', value: exercise.time ?? '—', label: 'Duration' },
            { emoji: '🔁', value: exercise.dosage ?? exercise.reps ?? '—', label: 'Dosage' },
            { emoji: '📈', value: exercise.tempo ?? '—', label: 'Tempo' },
          ] as const
        ).map((s) => (
          <Card key={s.label} style={{ flex: 1, alignItems: 'center' }} padding={10}>
            <Text style={{ fontSize: 17 }}>{s.emoji}</Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: theme.colors.th,
                marginTop: 2,
              }}
            >
              {s.value}
            </Text>
            <Text style={{ fontSize: 10, color: theme.colors.tm }}>{s.label}</Text>
          </Card>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Steps */}
        <Text style={[styles.sectionLabel, { color: theme.colors.tm }]}>
          📋 HOW TO DO IT
        </Text>
        <Card style={{ marginBottom: 12 }} padding={15}>
          {exercise.steps.map((step, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                gap: 10,
                alignItems: 'flex-start',
                marginBottom: i === exercise.steps.length - 1 ? 0 : 9,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: theme.colors.pl,
                  borderWidth: 1,
                  borderColor: theme.colors.pb,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: theme.colors.pt }}>
                  {i + 1}
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: theme.colors.tb,
                  lineHeight: 20,
                }}
              >
                {step}
              </Text>
            </View>
          ))}
        </Card>

        {/* Clinical rationale */}
        <Text style={[styles.sectionLabel, { color: theme.colors.tm }]}>
          🔬 CLINICAL RATIONALE
        </Text>
        <View
          style={{
            backgroundColor: theme.colors.bl,
            borderColor: theme.colors.bb,
            borderWidth: 1.5,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: theme.colors.tb, lineHeight: 22 }}>
            {exercise.clinicalRationale}
          </Text>
        </View>

        {/* Benefit */}
        <View
          style={{
            backgroundColor: theme.colors.gl,
            borderColor: theme.colors.gb,
            borderWidth: 1.5,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 12,
            flexDirection: 'row',
            gap: 9,
            alignItems: 'flex-start',
          }}
        >
          <Text style={{ fontSize: 17 }}>🌱</Text>
          <Text style={{ flex: 1, fontSize: 14, color: theme.colors.tb, lineHeight: 22 }}>
            {exercise.benefit}
          </Text>
        </View>

        {/* Warning */}
        <View
          style={{
            backgroundColor: theme.colors.yl,
            borderColor: theme.colors.yb,
            borderWidth: 1.5,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 12,
            flexDirection: 'row',
            gap: 9,
            alignItems: 'flex-start',
          }}
        >
          <Text style={{ fontSize: 17 }}>⚠️</Text>
          <Text style={{ flex: 1, fontSize: 14, color: theme.colors.tb, lineHeight: 22 }}>
            {exercise.warning}
          </Text>
        </View>

        {/* Red flag */}
        <View
          style={{
            backgroundColor: theme.colors.rl,
            borderColor: theme.colors.rb,
            borderWidth: 1.5,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 18,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.colors.rd, marginBottom: 3 }}>
            🚑 STOP — SEE DOCTOR IF:
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.tb, lineHeight: 20 }}>
            {exercise.redFlag}
          </Text>
        </View>

        <Button
          title={done ? '↩️ Mark as Incomplete' : '✅ Mark as Complete'}
          onPress={() => toggle(exercise.id)}
          variant={done ? 'secondary' : 'primary'}
        />
      </ScrollView>
    </View>
  );
}

const styles = {
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    marginBottom: 9,
  },
};
