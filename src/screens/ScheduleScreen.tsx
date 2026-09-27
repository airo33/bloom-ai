import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, ToastAndroid, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronRight, Check, Layers, Calendar, Coffee } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { getCategory } from '../theme/categories';
import CategoryTile from '../components/CategoryTile';
import SectionLabel from '../components/SectionLabel';
import EmptyState from '../components/EmptyState';
import { moodFor } from '../data/moods';
import type { RootStackParamList } from '../navigation/types';
import type { PlanPhase, WeekdayShort } from '../types/plan';

const MO = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DN: WeekdayShort[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as unknown as WeekdayShort[];
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Monday-anchored

function showToast(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert(msg);
  }
}

function getWeekStart(offsetWeeks: number): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function findPhaseForDay(
  recoveryDay: number,
  phases: PlanPhase[] | undefined,
): PlanPhase | null {
  if (!phases || !phases.length) return null;
  let acc = 0;
  for (let i = 0; i < phases.length; i++) {
    const ph = phases[i];
    const wn = ph.weekNumbers || ph.weeks || '1-2';
    const parts = wn.split('-');
    const w1 = parseInt(parts[0], 10) || 1;
    const w2 = parseInt(parts[1], 10) || w1 + 1;
    acc += (w2 - w1 + 1) * 7;
    if (recoveryDay <= acc) return ph;
  }
  return phases[phases.length - 1];
}

type DayType = 'rest' | 'light' | 'regular' | 'full';
function dayTypeFor(count: number): DayType {
  if (count === 0) return 'rest';
  if (count <= 2) return 'light';
  if (count <= 3) return 'regular';
  return 'full';
}

// Maps a DayType to its schedule.* i18n key suffix.
const DAY_TYPE_KEY: Record<DayType, string> = {
  rest: 'schedule.dayTypeRest',
  light: 'schedule.dayTypeLight',
  regular: 'schedule.dayTypeRegular',
  full: 'schedule.dayTypeFull',
};

export default function ScheduleScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const plan = useAppStore((s) => s.plan);
  const day = useAppStore((s) => s.progress.day);
  const doneIds = useAppStore((s) => s.progress.doneExerciseIds);
  const logs = useAppStore((s) => s.logs);
  const selectedDayIndex = useAppStore((s) => s.progress.selectedDayIndex);
  const weekOffset = useAppStore((s) => s.progress.weekOffset);
  const setSelectedDay = useAppStore((s) => s.setSelectedDay);
  const setWeekOffset = useAppStore((s) => s.setWeekOffset);
  const toggleExerciseDone = useAppStore((s) => s.toggleExerciseDone);

  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset]);
  const weekEnd = useMemo(() => {
    const e = new Date(weekStart);
    e.setDate(weekStart.getDate() + 6);
    return e;
  }, [weekStart]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const selectedDate = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + selectedDayIndex);
    return d;
  }, [weekStart, selectedDayIndex]);

  const diffFromToday = Math.round(
    (selectedDate.getTime() - today.getTime()) / 86400000,
  );
  const isToday = diffFromToday === 0;
  const isPast = diffFromToday < 0;
  const recoveryDayForSelected = day + diffFromToday;

  const selectedPhase = findPhaseForDay(recoveryDayForSelected, plan?.phases);
  const dayWeekdayName = DN[selectedDate.getDay()];
  const dayExIds = selectedPhase?.weekdays?.[dayWeekdayName] ?? [];
  const dayExercises = dayExIds
    .map((id) => plan?.exercises.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const dayType = dayTypeFor(dayExercises.length);
  const log = logs.find((l) => l.day === recoveryDayForSelected);

  const dayTypeStyles = {
    rest: { bg: theme.colors.gl, border: theme.colors.gb, fg: theme.colors.gn },
    light: { bg: theme.colors.gl, border: theme.colors.gb, fg: theme.colors.gn },
    regular: { bg: theme.colors.pl, border: theme.colors.pb, fg: theme.colors.pt },
    full: { bg: theme.colors.rl, border: theme.colors.rb, fg: theme.colors.rd },
  } as const;

  const checkFg = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 12,
          paddingBottom: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.tm,
              fontWeight: '700',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            {t('schedule.eyebrow')}
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontFamily: font.serif,
              color: theme.colors.th,
              letterSpacing: -0.6,
              marginTop: 2,
            }}
          >
            {MO[weekStart.getMonth()]} {weekStart.getDate()} – {MO[weekEnd.getMonth()]}{' '}
            {weekEnd.getDate()}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setWeekOffset(weekOffset - 1)}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.bo,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ChevronLeft size={18} color={theme.colors.tb} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={() => setWeekOffset(weekOffset + 1)}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.bo,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ChevronRight size={18} color={theme.colors.tb} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* Day pills */}
      <View style={{ paddingHorizontal: 22, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            const isTodayPill = d.getTime() === today.getTime();
            const isSel = i === selectedDayIndex;
            const pDay = day + Math.round((d.getTime() - today.getTime()) / 86400000);
            const hasLog = logs.some((l) => l.day === pDay);

            return (
              <Pressable
                key={i}
                onPress={() => setSelectedDay(i)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isTodayPill && !isSel ? theme.colors.pu : isSel ? theme.colors.pu : theme.colors.bo,
                  backgroundColor: isSel ? theme.colors.pu : theme.colors.card,
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: isSel
                      ? (theme.scheme === 'dark' ? 'rgba(10,10,10,0.55)' : 'rgba(255,255,255,0.75)')
                      : isTodayPill
                      ? theme.colors.pu
                      : theme.colors.tm,
                  }}
                >
                  {DAY_LETTERS[i]}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: isSel
                      ? (theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF')
                      : isTodayPill
                      ? theme.colors.pu
                      : theme.colors.th,
                    letterSpacing: -0.3,
                  }}
                >
                  {d.getDate()}
                </Text>
                {hasLog && !isSel && (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: theme.colors.pu,
                      marginTop: 1,
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {!plan ? (
          <EmptyState
            Icon={Calendar}
            title={t('schedule.noScheduleTitle')}
            message={t('schedule.noScheduleBody')}
            ctaLabel={t('schedule.startOnboarding')}
            onCta={() => nav.navigate('Welcome')}
          />
        ) : (
          <>
            {/* Day header card */}
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.bo,
                paddingHorizontal: 18,
                paddingVertical: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.th, letterSpacing: -0.3 }}>
                    {isToday ? t('schedule.todayPrefix') : ''}
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 3 }}>
                    {t('common.dayNumber', {
                      day: recoveryDayForSelected > 0 ? recoveryDayForSelected : '—',
                    })}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    backgroundColor: dayTypeStyles[dayType].bg,
                    borderColor: dayTypeStyles[dayType].border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: dayTypeStyles[dayType].fg,
                      letterSpacing: 0.3,
                    }}
                  >
                    {t(DAY_TYPE_KEY[dayType])}
                  </Text>
                </View>
              </View>
            </View>

            {/* Phase info */}
            {selectedPhase && (
              <View
                style={{
                  backgroundColor: theme.colors.pl,
                  borderColor: theme.colors.pb,
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Layers size={18} color={theme.colors.pt} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.pt, letterSpacing: -0.2 }}>
                    {selectedPhase.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 1 }}>
                    {selectedPhase.weekNumbers ?? selectedPhase.weeks ?? ''}
                  </Text>
                </View>
              </View>
            )}

            <SectionLabel>
              {isToday
                ? t('schedule.todaysExercises')
                : isPast
                ? t('schedule.plannedExercises')
                : t('schedule.upcomingExercises')}
            </SectionLabel>

            {dayExercises.length === 0 ? (
              <View style={{ marginBottom: 12 }}>
                <EmptyState
                  Icon={Coffee}
                  title={t('schedule.restDayTitle')}
                  message={t('schedule.restDayBody')}
                />
              </View>
            ) : (
              dayExercises.map((ex) => {
                const c = getCategory(ex.category);
                const isDoneToday = isToday && doneIds.includes(ex.id);
                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => {
                      if (isToday) nav.navigate('Exercise', { exerciseId: ex.id });
                      else
                        showToast(
                          t('schedule.availableOn', {
                            date: selectedDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            }),
                          }),
                        );
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: theme.colors.card,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: theme.colors.bo,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      marginBottom: 9,
                      opacity: pressed ? 0.85 : isDoneToday ? 0.55 : 1,
                    })}
                  >
                    <CategoryTile category={ex.category} size={40} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 14,
                          fontWeight: '700',
                          color: theme.colors.th,
                          letterSpacing: -0.2,
                        }}
                      >
                        {ex.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>
                        {ex.time ?? '—'} · {ex.dosage ?? ex.reps ?? '—'} · {c.lbl}
                      </Text>
                    </View>
                    {isToday ? (
                      <Pressable
                        hitSlop={10}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleExerciseDone(ex.id);
                        }}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: isDoneToday ? theme.colors.pu : theme.colors.bo2,
                          backgroundColor: isDoneToday ? theme.colors.pu : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isDoneToday && <Check size={15} color={checkFg} strokeWidth={3} />}
                      </Pressable>
                    ) : (
                      <ChevronRight size={18} color={theme.colors.tl} strokeWidth={2} />
                    )}
                  </Pressable>
                );
              })
            )}

            {/* Log card for past days */}
            {log && (
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: theme.colors.bo,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginTop: 4,
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: theme.colors.th,
                    marginBottom: 10,
                  }}
                >
                  {t('schedule.dayLog', { day: log.day })}
                </Text>
                <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor:
                        log.pain <= 3
                          ? theme.colors.gl
                          : log.pain <= 6
                          ? theme.colors.yl
                          : theme.colors.rl,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color:
                          log.pain <= 3
                            ? theme.colors.gn
                            : log.pain <= 6
                            ? theme.colors.yb
                            : theme.colors.rd,
                      }}
                    >
                      {t('common.painValue', { pain: log.pain })}
                    </Text>
                  </View>
                  {(() => {
                    const m = moodFor(log.mood);
                    return (
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 20,
                          backgroundColor: theme.colors.card2,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <m.Icon size={12} color={theme.colors.tb} strokeWidth={2.2} />
                        <Text style={{ fontSize: 12, color: theme.colors.tb, fontWeight: '600' }}>
                          {m.label}
                        </Text>
                      </View>
                    );
                  })()}
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: theme.colors.bl,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: theme.colors.bb, fontWeight: '700' }}>
                      {t('common.waterValue', { count: log.water })}
                    </Text>
                  </View>
                </View>
                {log.notes && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.colors.tb,
                      lineHeight: 20,
                      marginTop: 9,
                    }}
                  >
                    {log.notes}
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
