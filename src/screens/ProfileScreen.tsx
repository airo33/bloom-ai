import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Moon,
  Sun,
  Activity,
  Droplet,
  BookOpen,
  RefreshCw,
  ChevronRight,
  LogOut,
  Shield,
  FileText,
  MessageSquare,
  History,
  Trash2,
} from 'lucide-react-native';
import { useTheme, useThemeControls } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import {
  applyReminderToggle,
  cancelAllReminders,
  type ReminderCategory,
} from '../lib/notifications';
import { useAuth, signOut, displayNameFor } from '../lib/auth';
import { deleteAccount } from '../lib/api';
import type { RootStackParamList } from '../navigation/types';
import type { SubscriptionTier, FitnessLevel } from '../types/plan';

export default function ProfileScreen() {
  const theme = useTheme();
  const { scheme, toggleScheme } = useThemeControls();
  const profile = useAppStore((s) => s.profile);
  const tier = useAppStore((s) => s.subscriptionTier);
  const notifications = useAppStore((s) => s.notifications);
  const setNotificationPref = useAppStore((s) => s.setNotificationPref);
  const resetAll = useAppStore((s) => s.resetAll);
  const clearUserData = useAppStore((s) => s.clearUserData);
  const { user } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign out',
      "You'll have to sign back in to access your plan on this device.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            // Tear down BEFORE auth fires so the next session lands on a
            // clean slate. Order: cancel OS-scheduled reminders, then drop
            // local user-scoped state, then sign Supabase out.
            await cancelAllReminders();
            clearUserData();
            await signOut().catch(() => {});
          },
        },
      ],
    );
  }, [clearUserData]);

  // Account deletion: GDPR + Play Store compliance. Two-step confirm so
  // a rage-tap doesn't nuke a paying user's data.
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account?',
      'This permanently erases your plan, journal, chat history, and subscription. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Last chance — your account and all data will be erased forever.',
              [
                { text: 'Keep account', style: 'cancel' },
                {
                  text: 'Delete forever',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await cancelAllReminders();
                      await deleteAccount();
                      // Local cleanup mirrors sign-out — auth state will
                      // flip when the user is gone.
                      clearUserData();
                      await signOut().catch(() => {});
                    } catch (e: unknown) {
                      const msg = e instanceof Error
                        ? e.message
                        : 'Could not delete account. Try again later.';
                      Alert.alert('Deletion failed', msg);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [clearUserData]);

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
          'Enable notifications for Mend in your system settings to use reminders.',
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
        <ProfileHeader
          name={profile.name || displayNameFor(user)}
          email={user?.email ?? null}
          fitnessLevel={profile.fitnessLevel || null}
          age={profile.age || null}
          tier={tier}
        />


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

        <SectionLabel>Support</SectionLabel>
        <Card padding={0} style={{ marginBottom: 20 }}>
          <NavRow
            iconBg={theme.colors.pl}
            iconColor={theme.colors.pt}
            Icon={MessageSquare}
            title="Send feedback"
            onPress={() => nav.navigate('Feedback')}
            divider
          />
          <NavRow
            iconBg={theme.colors.bl}
            iconColor={theme.colors.bb}
            Icon={History}
            title="Plan history"
            onPress={() => nav.navigate('PlanHistory')}
          />
        </Card>

        <SectionLabel>About</SectionLabel>
        <Card padding={0} style={{ marginBottom: 20 }}>
          <NavRow
            iconBg={theme.colors.bl}
            iconColor={theme.colors.bb}
            Icon={Shield}
            title="Privacy Policy"
            onPress={() => nav.navigate('Legal', { kind: 'privacy' })}
            divider
          />
          <NavRow
            iconBg={theme.colors.card2}
            iconColor={theme.colors.tb}
            Icon={FileText}
            title="Terms of Service"
            onPress={() => nav.navigate('Legal', { kind: 'terms' })}
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
              borderBottomWidth: user ? 1 : 0,
              borderBottomColor: theme.colors.bo,
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
          {user && (
            <Pressable
              onPress={handleSignOut}
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
                  backgroundColor: theme.colors.card2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut size={17} color={theme.colors.tb} strokeWidth={2.2} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: theme.colors.th,
                  fontWeight: '700',
                  letterSpacing: -0.2,
                }}
              >
                Sign out
              </Text>
              <ChevronRight size={18} color={theme.colors.tl} strokeWidth={2} />
            </Pressable>
          )}
        </Card>

        {user && (
          <>
            <SectionLabel>Danger zone</SectionLabel>
            <Card padding={0} style={{ marginBottom: 24 }}>
              <Pressable
                onPress={handleDeleteAccount}
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
                  <Trash2 size={17} color={theme.colors.rd} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      color: theme.colors.rd,
                      fontWeight: '700',
                      letterSpacing: -0.2,
                    }}
                  >
                    Delete account
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.tm,
                      marginTop: 2,
                    }}
                  >
                    Permanently erases everything
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.colors.tl} strokeWidth={2} />
              </Pressable>
            </Card>
          </>
        )}
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

interface NavRowProps {
  iconBg: string;
  iconColor: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
  title: string;
  onPress: () => void;
  divider?: boolean;
}

function NavRow({ iconBg, iconColor, Icon, title, onPress, divider }: NavRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: theme.colors.bo,
        opacity: pressed ? 0.7 : 1,
      })}
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
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          color: theme.colors.th,
          fontWeight: '700',
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>
      <ChevronRight size={18} color={theme.colors.tl} strokeWidth={2} />
    </Pressable>
  );
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

// ────────────────────────────────────────────────────────────────────────────
// Profile header card — avatar + name + email + tier badge + stats pills.
// Pulled out as its own component to keep the main screen body tidy and
// give the design space to breathe at the top of the scroll.
// ────────────────────────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  name: string;
  email: string | null;
  fitnessLevel: FitnessLevel | null;
  age: string | null;
  tier: SubscriptionTier;
}

function ProfileHeader({ name, email, fitnessLevel, age, tier }: ProfileHeaderProps) {
  const theme = useTheme();
  const initial = (name?.trim() || 'F').charAt(0).toUpperCase();
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  // Tier badge styling — each tier gets its own pill aesthetic so the
  // subscription status reads at a glance.
  const tierStyle = (() => {
    switch (tier) {
      case 'monthly':
      case 'annual':
        return { label: tier === 'annual' ? 'PRO · ANNUAL' : 'PRO · MONTHLY', bg: theme.colors.pu, fg: onPrimary };
      case 'weekly':
        return { label: 'TRIAL · WEEKLY', bg: theme.colors.pl, fg: theme.colors.pt };
      case 'trial':
        return { label: 'TRIAL', bg: theme.colors.card2, fg: theme.colors.tb };
      default:
        return { label: 'FREE', bg: theme.colors.card2, fg: theme.colors.tm };
    }
  })();

  return (
    <View style={{ marginBottom: 22 }}>
      <Text
        style={{
          fontSize: 11,
          color: theme.colors.tm,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Account
      </Text>

      {/* Top row: avatar + name/email block + tier chip */}
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: theme.colors.bo,
          padding: 18,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.colors.pu,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: onPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>
              {initial}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 19,
                fontWeight: '800',
                color: theme.colors.th,
                letterSpacing: -0.4,
                marginBottom: 2,
              }}
            >
              {name}
            </Text>
            {email && (
              <Text
                numberOfLines={1}
                style={{ fontSize: 13, color: theme.colors.tm, letterSpacing: -0.1 }}
              >
                {email}
              </Text>
            )}
          </View>
        </View>

        {/* Tier chip — full-width, easy to tap visually */}
        <View
          style={{
            marginTop: 14,
            backgroundColor: tierStyle.bg,
            borderRadius: 14,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: tierStyle.fg,
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 0.8,
            }}
          >
            {tierStyle.label}
          </Text>
        </View>

        {/* Stats pills — fitness level + age, only render the ones we have */}
        {(fitnessLevel || age) && (
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginTop: 12,
              flexWrap: 'wrap',
            }}
          >
            {fitnessLevel && (
              <View
                style={{
                  backgroundColor: theme.colors.card2,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 10, color: theme.colors.tm, fontWeight: '700', letterSpacing: 0.4 }}>
                  FITNESS
                </Text>
                <Text style={{ fontSize: 13, color: theme.colors.th, fontWeight: '700', letterSpacing: -0.2 }}>
                  {fitnessLevel}
                </Text>
              </View>
            )}
            {age && (
              <View
                style={{
                  backgroundColor: theme.colors.card2,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 10, color: theme.colors.tm, fontWeight: '700', letterSpacing: 0.4 }}>
                  AGE
                </Text>
                <Text style={{ fontSize: 13, color: theme.colors.th, fontWeight: '700', letterSpacing: -0.2 }}>
                  {age}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
