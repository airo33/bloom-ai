import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Flame, Activity, Droplet, BookOpen, Share2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import PainChart from '../components/PainChart';
import EmptyState from '../components/EmptyState';
import RecoveryScoreCard from '../components/RecoveryScoreCard';
import ShareProgressModal from '../components/ShareProgressModal';
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
  const { t } = useTranslation();
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
  const [shareOpen, setShareOpen] = useState(false);

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
          {t('progress.eyebrow')}
        </Text>
        <Text
          style={{
            fontSize: 30,
            fontFamily: font.serif,
            color: theme.colors.th,
            letterSpacing: -0.6,
          }}
        >
          {t('progress.title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Recovery Score — hero card, only useful once user has logs */}
        <RecoveryScoreCard breakdown={breakdown} variant="hero" />

        {/* Share progress — only when the score exists (>=2 logs) so
            we don't invite sharing an empty card. */}
        {breakdown && (
          <Pressable
            onPress={() => setShareOpen(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 14,
              backgroundColor: theme.colors.card2,
              borderWidth: 1,
              borderColor: theme.colors.bo,
              marginBottom: 14,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Share2 size={16} color={theme.colors.tb} strokeWidth={2.2} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: font.bodyBold,
                color: theme.colors.tb,
              }}
            >
              {t('share.button')}
            </Text>
          </Pressable>
        )}

        {/* 2x2 stats grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <StatCard
            label={t('progress.statDays')}
            value={String(day)}
            Icon={Calendar}
            iconBg={theme.colors.pl}
            iconFg={theme.colors.pt}
          />
          <StatCard
            label={t('progress.statStreak')}
            value={String(streak)}
            Icon={Flame}
            iconBg={theme.colors.ol}
            iconFg={theme.colors.or}
            filledIcon
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <StatCard
            label={t('progress.statAvgPain')}
            value={avgPain ?? '—'}
            unit={avgPain ? '/ 10' : undefined}
            Icon={Activity}
            iconBg={theme.colors.gl}
            iconFg={theme.colors.gn}
          />
          <StatCard
            label={t('progress.statHydration')}
            value={avgWater}
            unit={t('progress.hydrationUnit')}
            Icon={Droplet}
            iconBg={theme.colors.bl}
            iconFg={theme.colors.bb}
            filledIcon
          />
        </View>

        {/* Pain over time */}
        <SectionLabel>{t('progress.painOverTime')}</SectionLabel>
        <Card style={{ marginBottom: 16 }} padding={16}>
          <PainChart points={painPoints} />
        </Card>

        {/* Log history */}
        <SectionLabel>{t('progress.logHistory')}</SectionLabel>

        {logs.length === 0 ? (
          <EmptyState
            Icon={BookOpen}
            title={t('progress.noLogsTitle')}
            message={t('progress.noLogsBody')}
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
                {t('common.dayNumber', { day: log.day })} ·{' '}
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
            </Card>
          ))
        )}
      </ScrollView>

      <ShareProgressModal
        visible={shareOpen}
        onDismiss={() => setShareOpen(false)}
        breakdown={breakdown}
        day={day}
        streak={streak}
      />
    </SafeAreaView>
  );
}
