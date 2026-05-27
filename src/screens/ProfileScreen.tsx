import React from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemeControls } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/Card';

export default function ProfileScreen() {
  const theme = useTheme();
  const { scheme, toggleScheme } = useThemeControls();
  const profile = useAppStore((s) => s.profile);
  const tier = useAppStore((s) => s.subscriptionTier);
  const notifications = useAppStore((s) => s.notifications);
  const setNotificationPref = useAppStore((s) => s.setNotificationPref);
  const resetAll = useAppStore((s) => s.resetAll);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 22 }}>
        <Text style={{ fontSize: 11, color: theme.colors.tm, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 }}>
          👤 PROFILE
        </Text>
        <Text style={{ fontSize: 23, fontWeight: '800', color: theme.colors.th, marginBottom: 18 }}>
          {profile.name || 'Friend'}
        </Text>

        <Card style={{ marginBottom: 16, padding: 14 }}>
          <Text style={{ fontSize: 13, color: theme.colors.tm }}>
            {profile.fitnessLevel || 'Fitness level not set'} · {profile.age || 'age ?'} y.o.
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.tm, marginTop: 4 }}>
            Subscription: {tier ?? 'none'}
          </Text>
        </Card>

        <Text style={[styles.section, { color: theme.colors.tm }]}>🎨 APPEARANCE</Text>
        <Card padding={0} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>{scheme === 'dark' ? '☀️' : '🌙'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: theme.colors.th, fontWeight: '600' }}>Dark Theme</Text>
              <Text style={{ fontSize: 12, color: theme.colors.tm }}>Easy on eyes at night</Text>
            </View>
            <Switch value={scheme === 'dark'} onValueChange={toggleScheme} />
          </View>
        </Card>

        <Text style={[styles.section, { color: theme.colors.tm }]}>🔔 NOTIFICATIONS</Text>
        <Card padding={0} style={{ marginBottom: 16 }}>
          {(
            [
              { key: 'exercise', emoji: '🏃', title: 'Exercise Reminders', sub: 'Every 3 hours' },
              { key: 'water', emoji: '💧', title: 'Hydration Reminders', sub: 'Every 90 minutes' },
              { key: 'journal', emoji: '📝', title: 'Journal Reminder', sub: 'Evening' },
            ] as const
          ).map((row, i, arr) => (
            <View
              key={row.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: theme.colors.bo,
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>{row.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: theme.colors.th, fontWeight: '600' }}>{row.title}</Text>
                <Text style={{ fontSize: 12, color: theme.colors.tm }}>{row.sub}</Text>
              </View>
              <Switch
                value={notifications[row.key]}
                onValueChange={(v) => setNotificationPref(row.key, v)}
              />
            </View>
          ))}
        </Card>

        <Text style={[styles.section, { color: theme.colors.tm }]}>⚙️ SETTINGS</Text>
        <Card padding={0} style={{ marginBottom: 24 }}>
          <Pressable
            onPress={resetAll}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>🔄</Text>
            <Text style={{ flex: 1, fontSize: 15, color: theme.colors.rd, fontWeight: '600' }}>
              Reset Plan
            </Text>
            <Text style={{ color: theme.colors.tl, fontSize: 16 }}>›</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  section: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    marginBottom: 9,
  },
};
