import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Moon,
  Sun,
  Activity,
  Droplet,
  BookOpen,
  RefreshCw,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme, useThemeControls } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import { applyReminderToggle, type ReminderCategory } from '../lib/notifications';

export default function ProfileScreen() {
  const theme = useTheme();
  const { scheme, toggleScheme } = useThemeControls();
  const profile = useAppStore((s) => s.profile);
  const tier = useAppStore((s) => s.subscriptionTier);
  const notifications = useAppStore((s) => s.notifications);
  const setNotificationPref = useAppStore((s) => s.setNotificationPref);
  const resetAll = useAppStore((s) => s.resetAll);

  // Per-category busy flag so two rapid toggles don't race
  const [pending, setPending] = useState<ReminderCategory | null>(null);

  const onToggleReminder = useCallback(
    async (category: ReminderCategory, value: boolean) => {
      if (pending) return;
      setPending(category);
      // Optimistic: update the store first so the switch flips immediately
      setNotificationPref(category, value);
      const ok = await applyReminderToggle(category, value);
      if (!ok && value) {
        // Permission denied — revert the toggle and explain
        setNotificationPref(category, false);
        Alert.alert(
          'Notifications disabled',
          'Enable notifications for RECOVA in your system settings to use reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings().catch(() => {}) },
          ],
        );
      }
      setPending(null);
    },
    [pending, setNotificationPref],
  );

  const switchTrackColors = { true: theme.colors.pu, false: theme.colors.bo2 };
  const switchThumbColor = theme.scheme === 'dark' ? theme.colors.th : '#FFFFFF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
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
          Profile
        </Text>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: theme.colors.th,
            letterSpacing: -0.5,
            marginBottom: 20,
          }}
        >
          {profile.name || 'Friend'}
        </Text>

        <Card style={{ marginBottom: 20 }} padding={16}>
          <Text style={{ fontSize: 13, color: theme.colors.tb }}>
            {profile.fitnessLevel || 'Fitness level not set'} · {profile.age || '—'} years old
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.tm, marginTop: 4 }}>
            Subscription:{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.th }}>
              {tier ?? 'none'}
            </Text>
          </Text>
        </Card>

        <SectionLabel>Appearance</SectionLabel>
        <Card padding={0} style={{ marginBottom: 20 }}>
          <Row
            iconBg={theme.colors.pl}
            iconColor={theme.colors.pt}
            Icon={scheme === 'dark' ? Sun : Moon}
            title="Dark theme"
            subtitle="Easy on eyes at night"
            control={
              <Switch
                value={scheme === 'dark'}
                onValueChange={toggleScheme}
                trackColor={switchTrackColors}
                thumbColor={switchThumbColor}
              />
            }
          />
        </Card>

        <SectionLabel>Notifications</SectionLabel>
        <Card padding={0} style={{ marginBottom: 20 }}>
          <Row
            iconBg={theme.colors.pl}
            iconColor={theme.colors.pt}
            Icon={Activity}
            title="Exercise reminders"
            subtitle="5 times a day · 9 AM – 9 PM"
            control={
              <Switch
                value={notifications.exercise}
                disabled={pending === 'exercise'}
                onValueChange={(v) => onToggleReminder('exercise', v)}
                trackColor={switchTrackColors}
                thumbColor={switchThumbColor}
              />
            }
            divider
          />
          <Row
            iconBg={theme.colors.bl}
            iconColor={theme.colors.bb}
            Icon={Droplet}
            title="Hydration reminders"
            subtitle="Every 90 min · 9 AM – 7:30 PM"
            control={
              <Switch
                value={notifications.water}
                disabled={pending === 'water'}
                onValueChange={(v) => onToggleReminder('water', v)}
                trackColor={switchTrackColors}
                thumbColor={switchThumbColor}
              />
            }
            divider
          />
          <Row
            iconBg={theme.colors.gl}
            iconColor={theme.colors.gn}
            Icon={BookOpen}
            title="Journal reminder"
            subtitle="Evening · 8 PM"
            control={
              <Switch
                value={notifications.journal}
                disabled={pending === 'journal'}
                onValueChange={(v) => onToggleReminder('journal', v)}
                trackColor={switchTrackColors}
                thumbColor={switchThumbColor}
              />
            }
          />
        </Card>

        <SectionLabel>Settings</SectionLabel>
        <Card padding={0} style={{ marginBottom: 24 }}>
          <Pressable
            onPress={resetAll}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 14,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: theme.colors.rl,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={17} color={theme.colors.rd} strokeWidth={2.2} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                color: theme.colors.rd,
                fontWeight: '700',
                letterSpacing: -0.2,
              }}
            >
              Reset plan
            </Text>
            <ChevronRight size={18} color={theme.colors.tl} strokeWidth={2} />
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

interface RowProps {
  iconBg: string;
  iconColor: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  control: React.ReactNode;
  divider?: boolean;
}

function Row({ iconBg, iconColor, Icon, title, subtitle, control, divider }: RowProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: theme.colors.bo,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={17} color={iconColor} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: theme.colors.th, fontWeight: '700', letterSpacing: -0.2 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 1 }}>{subtitle}</Text>
      </View>
      {control}
    </View>
  );
}
