import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, ToastAndroid, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { getCategory } from '../theme/categories';
import CategoryTile from '../components/CategoryTile';
import type { RootStackParamList } from '../navigation/types';
import type { PlanPhase, WeekdayShort } from '../types/plan';

const MO = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DN: WeekdayShort[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as unknown as WeekdayShort[];
// Note: Sunday=0 first to match Date.getDay(); store-side keys still use Mon-Sun strings.
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function showToast(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert(msg);
  }
}

function getWeekStart(offsetWeeks: number): Date {
  const d = new Date();
  // Monday-anchored: shift so Monday is the start of the week
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

export default function ScheduleScreen() {
  const theme = useTheme();
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

  // Derive week start + selected date
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
  const isFuture = diffFromToday > 0;
  const recoveryDayForSelected = day + diffFromToday;

  // Exercises planned for the selected date (based on its weekday)
  const selectedPhase = findPhaseForDay(recoveryDayForSelected, plan?.phases);
  const dayWeekdayName = DN[selectedDate.getDay()];
  const dayExIds = selectedPhase?.weekdays?.[dayWeekdayName] ?? [];
  const dayExercises = dayExIds
    .map((id) => plan?.exercises.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const dayType = dayTypeFor(dayExercises.length);
  const log = logs.find((l) => l.day === recoveryDayForSelected);

  const dayTypeStyles = {
    rest: { bg: theme.colors.gl, border: theme.colors.gb, fg: theme.colors.gn, label: '😌 Rest Day' },
    light: { bg: theme.colors.gl, border: theme.colors.gb, fg: theme.colors.gn, label: '🌿 Light Day' },
    regular: { bg: theme.colors.pl, border: theme.colors.pb, fg: theme.colors.pt, label: '💪 Regular' },
    full: { bg: theme.colors.rl, border: theme.colors.rb, fg: theme.colors.rd, label: '🔥 Full Session' },
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 8,
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
            }}
          >
            📅 RECOVERY SCHEDULE
          </Text>
          <Text style={{ fontSize: 21, fontWeight: '800', color: theme.colors.th }}>
            {MO[weekStart.getMonth()]} {weekStart.getDate()} – {MO[weekEnd.getMonth()]}{' '}
            {weekEnd.getDate()}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {[-1, 1].map((d) => (
            <Pressable
              key={d}
              onPress={() => setWeekOffset(weekOffset + d)}
              style={({ pressed }) => ({
                width: 33,
                height: 33,
                borderRadius: 10,
                backgroundColor: theme.colors.card2,
                borderWidth: 1.5,
                borderColor: theme.colors.bo,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 16, color: theme.colors.tb }}>
                {d === -1 ? '‹' : '›'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Day pills */}
      <View style={{ paddingHorizontal: 22, paddingBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
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
                    width: 44,
                    paddingVertical: 9,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: isTodayPill && !isSel ? theme.colors.pu : 'transparent',
                    backgroundColor: isSel ? theme.colors.pu : 'transparent',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '700',
                      color: isSel
                        ? 'rgba(255,255,255,0.75)'
                        : isTodayPill
                        ? theme.colors.pu
                        : theme.colors.tm,
                    }}
                  >
                    {/* Mon-Sun letter layout */}
                    {DAY_LETTERS[(i + 1) % 7]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: isSel
                        ? '#fff'
                        : isTodayPill
                        ? theme.colors.pu
                        : theme.colors.th,
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
        </ScrollView>
      </View>

      {/* Body */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {!plan ? (
          <View
            style={{
              padding: 20,
              alignItems: 'center',
              backgroundColor: theme.colors.card,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: theme.colors.bo,
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📅</Text>
            <Text style={{ fontSize: 15, color: theme.colors.tm, textAlign: 'center' }}>
              Complete onboarding to see your schedule.
            </Text>
          </View>
        ) : (
          <>
            {/* Day header card */}
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: theme.colors.bo,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 11,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: isToday
                    ? theme.colors.pl
                    : isPast
                    ? theme.colors.gl
                    : theme.colors.card2,
                  borderWidth: 1.5,
                  borderColor: isToday
                    ? theme.colors.pb
                    : isPast
                    ? theme.colors.gb
                    : theme.colors.bo,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>
                  {isToday ? '📅' : isPast ? (log ? '✅' : '📋') : '🔮'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.th }}>
                  {isToday ? 'Today — ' : ''}
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>
                  Day {recoveryDayForSelected > 0 ? recoveryDayForSelected : '—'}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
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
                  }}
                >
                  {dayTypeStyles[dayType].label}
                </Text>
              </View>
            </View>

            {/* Phase info */}
            {selectedPhase && (
              <View
                style={{
                  backgroundColor: theme.colors.pl,
                  borderColor: theme.colors.pb,
                  borderWidth: 1.5,
                  borderRadius: 13,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  marginBottom: 11,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 18 }}>📊</Text>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.pt }}>
                    {selectedPhase.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 1 }}>
                    {selectedPhase.weekNumbers ?? selectedPhase.weeks ?? ''}
                  </Text>
                </View>
              </View>
            )}

            {/* Tasks section label */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: theme.colors.tm,
                letterSpacing: 0.5,
                marginBottom: 9,
              }}
            >
              {isToday
                ? "TODAY'S EXERCISES"
                : isPast
                ? 'PLANNED EXERCISES'
                : 'UPCOMING EXERCISES'}
            </Text>

            {dayExercises.length === 0 ? (
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
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.th }}>
                  Rest Day
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.tm,
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                >
                  Recovery happens during rest. Hydrate well and sleep 7-9h tonight.
                </Text>
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
                          `Available on ${selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}`,
                        );
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: theme.colors.card,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: theme.colors.bo,
                      flexDirection: 'row',
                      overflow: 'hidden',
                      marginBottom: 9,
                      opacity: pressed ? 0.85 : isDoneToday ? 0.55 : 1,
                    })}
                  >
                    <View style={{ width: 5, backgroundColor: c.bar }} />
                    <View
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 13,
                      }}
                    >
                      <CategoryTile category={ex.category} size={44} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: theme.colors.th,
                          }}
                        >
                          {ex.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 3 }}>
                          {c.em} {ex.time ?? '—'} · {ex.dosage ?? ex.reps ?? '—'}
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
                            borderWidth: 2,
                            borderColor: isDoneToday ? theme.colors.pu : theme.colors.bo2,
                            backgroundColor: isDoneToday ? theme.colors.pu : theme.colors.card2,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isDoneToday && (
                            <Text style={{ color: '#fff', fontSize: 13 }}>✓</Text>
                          )}
                        </Pressable>
                      ) : isPast ? (
                        <Text style={{ fontSize: 18 }}>{log ? '✅' : '—'}</Text>
                      ) : (
                        <Text style={{ fontSize: 16 }}>🔮</Text>
                      )}
                    </View>
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
                  borderWidth: 1.5,
                  borderColor: theme.colors.bo,
                  paddingHorizontal: 15,
                  paddingVertical: 13,
                  marginTop: 4,
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: theme.colors.th,
                    marginBottom: 8,
                  }}
                >
                  📓 Day {log.day} Log
                </Text>
                <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 3,
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
                            ? '#C06000'
                            : theme.colors.rd,
                      }}
                    >
                      🤕 Pain {log.pain}/10
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 20,
                      backgroundColor: theme.colors.card2,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: theme.colors.tb }}>{log.mood}</Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 20,
                      backgroundColor: theme.colors.bl,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#0984E3' }}>
                      💧 {log.water}/8
                    </Text>
                  </View>
                </View>
                {log.notes && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.colors.tb,
                      lineHeight: 20,
                      marginTop: 7,
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
