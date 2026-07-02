import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Flame, Activity, Droplet, BookOpen } from 'lucide-react-native';
import { useTheme, font } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import PainChart from '../components/PainChart';
import EmptyState from '../components/EmptyState';
import RecoveryScoreCard from '../components/RecoveryScoreCard';
import { moodFor } from '../data/moods';
import { computeRecoveryScore } from '../lib/recoveryScore';

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number; fill?: string }>;
  iconBg: string;
  iconFg: string;
  filledIcon?: boolean;
}

function StatCard({ label, value, unit, Icon, iconBg, iconFg, filledIcon }: StatCardProps) {
  const theme = useTheme();
  return (
    <Card style={{ flex: 1 }} padding={14}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Icon
          size={17}
          color={iconFg}
          strokeWidth={2.2}
          fill={filledIcon ? iconFg : undefined}
        />
      </View>
      <Text
        style={{
          fontSize: 11,
          color: theme.colors.tm,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 30,
          fontFamily: font.serif,
          color: theme.colors.th,
          letterSpacing: -0.6,
        }}
      >
        {value}
        {unit ? (
          <Text style={{ fontSize: 14, color: theme.colors.tm, fontFamily: font.body }}>
            {' '}{unit}
          </Text>
        ) : null}
      </Text>
    </Card>
  );
}

export default function ProgressScreen() {
  const theme = useTheme();
  const day = useAppStore((s) => s.progress.day);
  const streak = useAppStore((s) => s.progress.streak);
  const water = useAppStore((s) => s.progress.water);
  const waterHistory = useAppStore((s) => s.progress.waterHistory);
  const logs = useAppStore((s) => s.logs);

  const avgPain = useMemo(() => {
    if (!logs.length) return null;
    const sum = logs.reduce((s, l) => s + l.pain, 0);
    return (sum / logs.length).toFixed(1);
  }, [logs]);

  const avgWater = useMemo(() => {
    const history = waterHistory.slice(-7);
    if (!history.length) return water.toFixed(1);
    const sum = history.reduce((s, h) => s + h.glasses, 0);
    return (sum / history.length).toFixed(1);
  }, [waterHistory, water]);

  const painPoints = useMemo(() => logs.map((l) => l.pain), [logs]);
  const breakdown = useMemo(
    () => computeRecoveryScore({ logs, streak }),
    [logs, streak],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 14 }}>
        <Text
          style={{
            fontSize: 11,
            color: theme.colors.tm,
            fontWeight: '700',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: 3,
          }}
        >
          Analytics
        </Text>
        <Text
          style={{
            fontSize: 30,
            fontFamily: font.serif,
            color: theme.colors.th,
            letterSpacing: -0.6,
          }}
        >
          Your progress
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Recovery Score — hero card, only useful once user has logs */}
        <RecoveryScoreCard breakdown={breakdown} variant="hero" />

        {/* 2x2 stats grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <StatCard
            label="Days"
            value={String(day)}
            Icon={Calendar}
            iconBg={theme.colors.pl}
            iconFg={theme.colors.pt}
          />
          <StatCard
            label="Streak"
            value={String(streak)}
            Icon={Flame}
            iconBg={theme.colors.ol}
            iconFg={theme.colors.or}
            filledIcon
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <StatCard
            label="Avg pain"
            value={avgPain ?? '—'}
            unit={avgPain ? '/ 10' : undefined}
            Icon={Activity}
            iconBg={theme.colors.gl}
            iconFg={theme.colors.gn}
          />
          <StatCard
            label="Hydration"
            value={avgWater}
            unit="avg / day"
            Icon={Droplet}
            iconBg={theme.colors.bl}
            iconFg={theme.colors.bb}
            filledIcon
          />
        </View>

        {/* Pain over time */}
        <SectionLabel>Pain over time</SectionLabel>
        <Card style={{ marginBottom: 16 }} padding={16}>
          <PainChart points={painPoints} />
        </Card>

        {/* Log history */}
        <SectionLabel>Log history</SectionLabel>

        {logs.length === 0 ? (
          <EmptyState
            Icon={BookOpen}
            title="No logs yet"
            message="Tap the plus button on the nav bar to log your first entry. We'll plot trends as you go."
          />
        ) : (
          [...logs].reverse().map((log) => (
            <Card key={`${log.day}-${log.createdAt}`} style={{ marginBottom: 9 }} padding={14}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: theme.colors.th,
                  marginBottom: 8,
                  letterSpacing: -0.2,
                }}
              >
                Day {log.day} ·{' '}
                <Text style={{ fontWeight: '400', color: theme.colors.tm }}>
                  {new Date(log.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
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
                    Pain {log.pain}/10
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
                    {log.water}/8 water
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
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
