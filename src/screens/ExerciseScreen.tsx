import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronLeft,
  Clock,
  Repeat,
  TrendingUp,
  ClipboardList,
  FlaskConical,
  Sprout,
  TriangleAlert as AlertTriangle,
  Siren,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { getCategory } from '../theme/categories';
import Button from '../components/Button';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
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
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style="light" />

      {/* Category-tinted hero */}
      <View style={{ height: 185, backgroundColor: c.bar, position: 'relative' }}>
        <SafeAreaView edges={['top']}>
          <View
            style={{
              paddingHorizontal: 16,
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
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <ChevronLeft size={22} color="#fff" strokeWidth={2.4} />
            </Pressable>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>
                {c.lbl}
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Centered category emoji as a visual mark (content, not UI chrome) */}
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
            paddingVertical: 14,
            backgroundColor: 'rgba(0,0,0,0.28)',
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>
            {exercise.name}
          </Text>
        </View>
      </View>

      {/* Stat tiles */}
      <View style={{ paddingHorizontal: 22, paddingTop: 14, flexDirection: 'row', gap: 10 }}>
        {(
          [
            { Icon: Clock, value: exercise.time ?? '—', label: 'Duration' },
            { Icon: Repeat, value: exercise.dosage ?? exercise.reps ?? '—', label: 'Dosage' },
            { Icon: TrendingUp, value: exercise.tempo ?? '—', label: 'Tempo' },
          ] as const
        ).map(({ Icon, value, label }) => (
          <Card key={label} style={{ flex: 1, alignItems: 'center' }} padding={12}>
            <Icon size={18} color={theme.colors.tb} strokeWidth={2} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: theme.colors.th,
                marginTop: 6,
                letterSpacing: -0.2,
              }}
            >
              {value}
            </Text>
            <Text style={{ fontSize: 10, color: theme.colors.tm, marginTop: 2 }}>
              {label}
            </Text>
          </Card>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>How to do it</SectionLabel>
        <Card style={{ marginBottom: 14 }} padding={16}>
          {exercise.steps.map((step, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                gap: 12,
                alignItems: 'flex-start',
                marginBottom: i === exercise.steps.length - 1 ? 0 : 12,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: theme.colors.pl,
                  borderWidth: 1,
                  borderColor: theme.colors.pb,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: theme.colors.pt }}>
                  {i + 1}
                </Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: theme.colors.tb, lineHeight: 20 }}>
                {step}
              </Text>
            </View>
          ))}
        </Card>

        <InfoBox
          icon={<FlaskConical size={16} color={theme.colors.bb} strokeWidth={2.2} />}
          title="Clinical rationale"
          body={exercise.clinicalRationale}
          bg={theme.colors.bl}
          border={theme.colors.bb}
          titleColor={theme.colors.bb}
        />

        <InfoBox
          icon={<Sprout size={16} color={theme.colors.gn} strokeWidth={2.2} />}
          title="Benefit"
          body={exercise.benefit}
          bg={theme.colors.gl}
          border={theme.colors.gb}
          titleColor={theme.colors.gn}
        />

        <InfoBox
          icon={<AlertTriangle size={16} color={theme.colors.yb} strokeWidth={2.2} />}
          title="Caution"
          body={exercise.warning}
          bg={theme.colors.yl}
          border={theme.colors.yb}
          titleColor={theme.colors.yb}
        />

        <InfoBox
          icon={<Siren size={16} color={theme.colors.rd} strokeWidth={2.2} />}
          title="Stop and see a doctor if"
          body={exercise.redFlag}
          bg={theme.colors.rl}
          border={theme.colors.rb}
          titleColor={theme.colors.rd}
        />

        <View style={{ height: 6 }} />

        <Button
          title={done ? 'Mark as incomplete' : 'Mark as complete'}
          onPress={() => toggle(exercise.id)}
          variant={done ? 'secondary' : 'primary'}
          icon={
            done ? (
              <RotateCcw size={18} color={theme.colors.th} strokeWidth={2.4} />
            ) : (
              <Check size={20} color={onPrimary} strokeWidth={2.6} />
            )
          }
        />
      </ScrollView>
    </View>
  );
}

interface InfoBoxProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  bg: string;
  border: string;
  titleColor: string;
}

function InfoBox({ icon, title, body, bg, border, titleColor }: InfoBoxProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {icon}
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            color: titleColor,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
      </View>
      <Text style={{ fontSize: 14, color: theme.colors.tb, lineHeight: 21 }}>
        {body}
      </Text>
    </View>
  );
}
