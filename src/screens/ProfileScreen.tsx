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
  Languages,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../lib/i18n';
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
import { archivePlan, deleteAccount } from '../lib/api';
import type { RootStackParamList } from '../navigation/types';
import type { SubscriptionTier, FitnessLevel } from '../types/plan';

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { scheme, toggleScheme } = useThemeControls();
  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const tier = useAppStore((s) => s.subscriptionTier);
  const notifications = useAppStore((s) => s.notifications);
  const language = useAppStore((s) => s.language);
  const setNotificationPref = useAppStore((s) => s.setNotificationPref);
  const resetAll = useAppStore((s) => s.resetAll);
  const clearUserData = useAppStore((s) => s.clearUserData);
  const { user } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const currentLangLabel = language
    ? SUPPORTED_LANGUAGES.find((l) => l.code === language)?.native ?? language
    : t('languagePicker.deviceDefault');

  // Reset plan: wipe local state + bounce to Welcome so user lands in
  // onboarding instead of staring at an empty Profile/Home with no signal
  // anything happened. Two-tap confirm because this is destructive.
  //
  // CRITICAL: archive the current plan to the cloud BEFORE resetAll wipes
  // it. Otherwise users who reset their plan to start a new recovery cycle
  // lose every previous plan and Plan History is permanently empty for
  // them. The archive is best-effort — if it fails (offline / signed out)
  // we still complete the reset so the user isn't stuck.
  const handleResetPlan = useCallback(() => {
    Alert.alert(
      t('profile.resetTitle'),
      t('profile.resetBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.resetCta'),
          style: 'destructive',
          onPress: async () => {
            if (plan) {
              await archivePlan({ plan, source: 'ai' }).catch(() => {});
            }
            resetAll();
            // Welcome lives on the root stack. Use the parent navigator
            // (this screen sits inside MainTabs) to escape the tabs.
            const root = nav.getParent() ?? nav;
            root.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          },
        },
      ],
    );
  }, [plan, resetAll, nav, t]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      t('profile.signOutTitle'),
      t('profile.signOutBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut'),
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
  }, [clearUserData, t]);

  // Account deletion: GDPR + Play Store compliance. Two-step confirm so
  // a rage-tap doesn't nuke a paying user's data.
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('profile.deleteTitle'),
      t('profile.deleteBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.deleteCta'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('profile.deleteConfirmTitle'),
              t('profile.deleteConfirmBody'),
              [
                { text: t('profile.deleteConfirmKeep'), style: 'cancel' },
                {
                  text: t('profile.deleteConfirmGo'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await cancelAllReminders();
                      await deleteAccount();
                      clearUserData();
                      await signOut().catch(() => {});
                    } catch (e: unknown) {
                      const msg = e instanceof Error
                        ? e.message
                        : t('profile.deleteFailedFallback');
                      Alert.alert(t('profile.deleteFailed'), msg);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [clearUserData, t]);

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
          t('profile.notifsDisabledTitle'),
          t('profile.notifsDisabledBody'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('profile.openSettings'), onPress: () => Linking.openSettings().catch(() => {}) },
          ],
        );
      }
      setPending(null);
    },
    [pending, setNotificationPref, t],
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


        <SectionLabel>{t('profile.appearance')}</SectionLabel>
        <Card padding={0} style={{ marginBottom: 20 }}>
          <Row
            iconBg={theme.colors.pl}
            iconColor={theme.colors.pt}
            Icon={scheme === 'dark' ? Sun : Moon}
            title={t('profile.darkTheme')}
            subtitle={t('profile.darkThemeSub')}
            control={
              <Switch
                value={scheme === 'dark'}
                onValueChange={toggleScheme}
                trackColor={switchTrackColors}
                thumbColor={switchThumbColor}
              />
            }
            divider
          />
          <NavRow
            iconBg={theme.colors.bl}
            iconColor={theme.colors.bb}
            Icon={Languages}
            title={t('profile.language')}
            subtitle={currentLangLabel}
            onPress={() => nav.navigate('Language')}
          />
        </Card>

        <SectionLabel>{t('profile.notifications')}</SectionLabel>
        <Card padding={0} style={{ marginBottom: 20 }}>
          <Row
            iconBg={theme.colors.pl}
            iconColor={theme.colors.pt}
            Icon={Activity}
            title={t('profile.exerciseReminders')}
            subtitle={t('profile.exerciseRemindersSub')}
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
            title={t('profile.hydrationReminders')}
            subtitle={t('profile.hydrationRemindersSub')}
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
            title={t('profile.journalReminder')}
            subtitle={t('profile.journalReminderSub')}
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

        <SectionLabel>{t('profile.support')}</SectionLabel>
        <Card padding={0} style={{ marginBottom: 20 }}>
          <NavRow
            iconBg={theme.colors.pl}
            iconColor={theme.colors.pt}
            Icon={MessageSquare}
            title={t('profile.sendFeedback')}
            onPress={() => nav.navigate('Feedback')}
            divider
          />
          <NavRow
            iconBg={theme.colors.bl}
            iconColor={theme.colors.bb}
            Icon={History}
            title={t('profile.planHistory')}
            onPress={() => nav.navigate('PlanHistory')}
          />
        </Card>

        <SectionLabel>{t('profile.about')}</SectionLabel>
        <Card padding={0} style={{ marginBottom: 20 }}>
          <NavRow
            iconBg={theme.colors.bl}
            iconColor={theme.colors.bb}
            Icon={Shield}
            title={t('profile.privacyPolicy')}
            onPress={() => nav.navigate('Legal', { kind: 'privacy' })}
            divider
          />
          <NavRow
            iconBg={theme.colors.card2}
            iconColor={theme.colors.tb}
            Icon={FileText}
            title={t('profile.termsOfService')}
            onPress={() => nav.navigate('Legal', { kind: 'terms' })}
          />
        </Card>

        <SectionLabel>{t('profile.settings')}</SectionLabel>
        <Card padding={0} style={{ marginBottom: 24 }}>
          <Pressable
            onPress={handleResetPlan}
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
              {t('profile.resetPlan')}
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
                {t('profile.signOut')}
              </Text>
              <ChevronRight size={18} color={theme.colors.tl} strokeWidth={2} />
            </Pressable>
          )}
        </Card>

        {user && (
          <>
            <SectionLabel>{t('profile.dangerZone')}</SectionLabel>
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
                    {t('profile.deleteAccount')}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.tm,
                      marginTop: 2,
                    }}
                  >
                    {t('profile.deleteAccountSub')}
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
  subtitle?: string;
  onPress: () => void;
  divider?: boolean;
}

function NavRow({ iconBg, iconColor, Icon, title, subtitle, onPress, divider }: NavRowProps) {
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
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            color: theme.colors.th,
            fontWeight: '700',
            letterSpacing: -0.2,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
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
