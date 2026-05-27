import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/Card';
import PainChart from '../components/PainChart';

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
    if (!history.length) return water;
    const sum = history.reduce((s, h) => s + h.glasses, 0);
    return (sum / history.length).toFixed(1);
  }, [waterHistory, water]);

  const painPoints = useMemo(() => logs.map((l) => l.pain), [logs]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 13 }}>
        <Text
          style={{
            fontSize: 11,
            color: theme.colors.tm,
            fontWeight: '700',
            letterSpacing: 0.8,
            marginBottom: 3,
          }}
        >
          📊 ANALYTICS
        </Text>
        <Text style={{ fontSize: 23, fontWeight: '800', color: theme.colors.th }}>
          Your Progress
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2x2 stats grid */}
        <View style={{ flexDirection: 'row', gap: 11, marginBottom: 11 }}>
          <Card style={{ flex: 1 }} padding={16}>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.tm,
                fontWeight: '700',
                marginBottom: 5,
              }}
            >
              📅 DAYS
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: theme.colors.pu }}>
              {day}
            </Text>
          </Card>
          <Card style={{ flex: 1 }} padding={16}>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.tm,
                fontWeight: '700',
                marginBottom: 5,
              }}
            >
              🔥 STREAK
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#E17055' }}>
              {streak}
            </Text>
          </Card>
        </View>

        <View style={{ flexDirection: 'row', gap: 11, marginBottom: 15 }}>
          <Card style={{ flex: 1 }} padding={16}>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.tm,
                fontWeight: '700',
                marginBottom: 5,
              }}
            >
              🤕 AVG PAIN
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: theme.colors.gn }}>
              {avgPain ?? '—'}
            </Text>
          </Card>
          <Card style={{ flex: 1 }} padding={16}>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.tm,
                fontWeight: '700',
                marginBottom: 5,
              }}
            >
              💧 HYDRATION
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#0984E3' }}>
              {avgWater}
            </Text>
            <Text style={{ fontSize: 10, color: theme.colors.tm, marginTop: 1 }}>
              avg / day
            </Text>
          </Card>
        </View>

        {/* Pain over time */}
        <Text
          style={{
            fontSize: 11,
            color: theme.colors.tm,
            fontWeight: '700',
            letterSpacing: 0.5,
            marginBottom: 9,
          }}
        >
          📉 PAIN OVER TIME
        </Text>
        <Card style={{ marginBottom: 15 }} padding={15}>
          <PainChart points={painPoints} />
        </Card>

        {/* Log history */}
        <Text
          style={{
            fontSize: 11,
            color: theme.colors.tm,
            fontWeight: '700',
            letterSpacing: 0.5,
            marginBottom: 9,
          }}
        >
          📓 LOG HISTORY
        </Text>

        {logs.length === 0 ? (
          <Card padding={18}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📓</Text>
              <Text style={{ fontSize: 14, color: theme.colors.tl, fontWeight: '600' }}>
                No logs yet
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.tm,
                  textAlign: 'center',
                  marginTop: 5,
                }}
              >
                Tap the journal icon to log your first entry.
              </Text>
            </View>
          </Card>
        ) : (
          [...logs].reverse().map((log) => (
            <Card key={`${log.day}-${log.createdAt}`} style={{ marginBottom: 9 }} padding={13}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: theme.colors.th,
                  marginBottom: 6,
                }}
              >
                📓 Day {log.day} ·{' '}
                <Text style={{ fontWeight: '400', color: theme.colors.tm }}>
                  {new Date(log.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
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
                    🤕 {log.pain}/10
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
                  <Text style={{ fontSize: 12, color: '#0984E3' }}>💧 {log.water}/8</Text>
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
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
