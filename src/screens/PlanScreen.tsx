import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Modal, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Sparkles,
  Target,
  TriangleAlert as AlertTriangle,
  ListChecks,
  Wand2,
  X,
} from 'lucide-react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import CategoryTile from '../components/CategoryTile';
import SectionLabel from '../components/SectionLabel';
import Input from '../components/Input';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { getCategory } from '../theme/categories';
import { adjustPlan, archivePlan, ApiError } from '../lib/api';
import { track } from '../lib/analytics';
import type { RootStackScreenProps } from '../navigation/types';

export default function PlanScreen({ navigation }: RootStackScreenProps<'Plan'>) {
  const theme = useTheme();
  const plan = useAppStore((s) => s.plan);
  const profile = useAppStore((s) => s.profile);
  const setPlan = useAppStore((s) => s.setPlan);
  const medicalDisclaimerAccepted = useAppStore((s) => s.medicalDisclaimerAccepted);
  const acceptMedicalDisclaimer = useAppStore((s) => s.acceptMedicalDisclaimer);

  // Plan customization modal state
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustText, setAdjustText] = useState('');
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const submitAdjustment = useCallback(async () => {
    if (!plan || adjustBusy) return;
    const text = adjustText.trim();
    if (text.length < 3) {
      setAdjustError('Tell me what to change');
      return;
    }
    setAdjustBusy(true);
    setAdjustError(null);
    track('plan_adjust_requested', { length: text.length });
    try {
      const result = await adjustPlan({
        plan,
        injury: profile.injury,
        adjustment: text,
        name: profile.name,
        age: profile.age,
        fitnessLevel: profile.fitnessLevel,
      });
      // Archive the OLD plan before overwriting it so the user can see how
      // it changed. Best-effort — if the archive fails (e.g. signed out,
      // offline), we still replace the active plan.
      archivePlan({ plan, source: 'adjusted', adjustment: text }).catch(() => {});
      setPlan(result.plan);
      setAdjustOpen(false);
      setAdjustText('');
      track('plan_adjust_succeeded');
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'off_topic'
          ? err.message || 'Please describe the change in terms of your recovery.'
          : err instanceof Error
            ? err.message
            : String(err);
      setAdjustError(msg);
      track('plan_adjust_failed', { code: err instanceof ApiError ? err.code : 'other' });
    } finally {
      setAdjustBusy(false);
    }
  }, [plan, adjustText, adjustBusy, profile, setPlan]);

  // Defensive fallback: if user lands here without a plan, route them to Welcome
  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, color: theme.colors.tm, textAlign: 'center' }}>
            No plan loaded yet.
          </Text>
          <View style={{ height: 16 }} />
          <Button title="Start onboarding" onPress={() => navigation.replace('Welcome')} />
        </View>
      </SafeAreaView>
    );
  }

  // Header text color flips based on lime brightness — dark text reads better on lime
  const headerFg = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';
  const headerFgMuted = theme.scheme === 'dark' ? 'rgba(10,10,10,0.65)' : 'rgba(255,255,255,0.72)';
  const headerStatBg = theme.scheme === 'dark' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.scheme === 'dark' ? 'dark' : 'light'} />

      {/* Lime accent header */}
      <SafeAreaView style={{ backgroundColor: theme.colors.pu }} edges={['top']}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <Sparkles size={14} color={headerFgMuted} strokeWidth={2.4} />
            <Text style={{ fontSize: 12, color: headerFgMuted, fontWeight: '700', letterSpacing: 0.4 }}>
              AI CLINICAL PLAN
            </Text>
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: headerFg,
              marginBottom: 18,
              letterSpacing: -0.5,
            }}
          >
            {plan.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(
              [
                { value: plan.totalWeeks, label: 'weeks' },
                { value: plan.phases.length, label: 'phases' },
                { value: plan.exercises.length, label: 'exercises' },
              ] as const
            ).map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: headerStatBg,
                  borderRadius: 14,
                  paddingVertical: 13,
                  paddingHorizontal: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: '800', color: headerFg, letterSpacing: -0.5 }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 11, color: headerFgMuted, marginTop: 1 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* Body */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 22, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <Card style={{ marginBottom: 14 }} padding={16}>
          <Text style={{ fontSize: 14, color: theme.colors.tb, lineHeight: 22 }}>
            {plan.summary}
          </Text>
        </Card>

        {/* Clinical goals */}
        <SectionLabel>Clinical goals</SectionLabel>
        <View
          style={{
            backgroundColor: theme.colors.bl,
            borderColor: theme.colors.bb,
            borderWidth: 1,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 14,
            marginBottom: 16,
          }}
        >
          {plan.clinicalGoals.map((g, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: i === plan.clinicalGoals.length - 1 ? 0 : 8,
              }}
            >
              <Target size={15} color={theme.colors.bb} strokeWidth={2.2} />
              <Text style={{ flex: 1, fontSize: 13, color: theme.colors.tb, lineHeight: 20 }}>
                {g}
              </Text>
            </View>
          ))}
        </View>

        {/* Red flags */}
        <SectionLabel>See a doctor if</SectionLabel>
        <View
          style={{
            backgroundColor: theme.colors.rl,
            borderColor: theme.colors.rb,
            borderWidth: 1,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 14,
            marginBottom: 16,
          }}
        >
          {plan.redFlags.map((r, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: i === plan.redFlags.length - 1 ? 0 : 8,
              }}
            >
              <AlertTriangle size={15} color={theme.colors.rd} strokeWidth={2.2} />
              <Text style={{ flex: 1, fontSize: 13, color: theme.colors.tb, lineHeight: 20 }}>
                {r}
              </Text>
            </View>
          ))}
        </View>

        {/* Exercises */}
        <SectionLabel>All exercises in this plan</SectionLabel>
        <Card style={{ marginBottom: 18 }} padding={0}>
          {plan.exercises.map((ex, i) => {
            const c = getCategory(ex.category);
            return (
              <View
                key={ex.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.bo,
                }}
              >
                <CategoryTile category={ex.category} size={36} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 14, fontWeight: '700', color: theme.colors.th }}
                  >
                    {ex.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.colors.tm, marginTop: 1 }}>
                    {ex.time ?? '—'} · {ex.dosage ?? '—'}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: c.bg,
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: c.ic }}>
                    {c.lbl}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Safety note */}
        <View
          style={{
            backgroundColor: theme.colors.card2,
            borderColor: theme.colors.bo,
            borderWidth: 1,
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 14,
            marginBottom: 18,
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <ListChecks size={16} color={theme.colors.tm} strokeWidth={2} />
          <Text style={{ flex: 1, fontSize: 12, color: theme.colors.tm, lineHeight: 18 }}>
            Evidence-based protocol. Post-surgical: follow your surgeon's
            restrictions first. Stop any exercise causing sharp pain.
          </Text>
        </View>

        <Button title="Choose your plan" onPress={() => navigation.navigate('Subscription')} />
        <View style={{ height: 10 }} />
        <Button
          title="Adjust this plan"
          variant="secondary"
          onPress={() => setAdjustOpen(true)}
          icon={<Wand2 size={16} color={theme.colors.th} strokeWidth={2.2} />}
        />
      </ScrollView>

      <Modal
        visible={adjustOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAdjustOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={{
              backgroundColor: theme.colors.bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 22,
              paddingBottom: 32,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: theme.colors.th,
                  letterSpacing: -0.3,
                }}
              >
                Adjust your plan
              </Text>
              <Pressable
                onPress={() => setAdjustOpen(false)}
                hitSlop={10}
                style={{ padding: 4 }}
              >
                <X size={22} color={theme.colors.tm} strokeWidth={2.2} />
              </Pressable>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.tm,
                marginBottom: 16,
                lineHeight: 20,
              }}
            >
              Describe what to change. Examples: "no pool exercises, no gym
              equipment", "make week 1 lighter", "I don't have a foam roller".
            </Text>
            <Input
              value={adjustText}
              onChangeText={(t) => {
                setAdjustText(t);
                if (adjustError) setAdjustError(null);
              }}
              placeholder="What should change?"
              multiline
              editable={!adjustBusy}
              style={{ minHeight: 100, marginBottom: 14 }}
            />
            {adjustError && (
              <View
                style={{
                  backgroundColor: theme.colors.rl,
                  borderColor: theme.colors.rb,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 13, color: theme.colors.rd, fontWeight: '600' }}>
                  {adjustError}
                </Text>
              </View>
            )}
            <Button
              title={adjustBusy ? 'Updating…' : 'Regenerate plan'}
              onPress={submitAdjustment}
              loading={adjustBusy}
              icon={
                adjustBusy ? (
                  <ActivityIndicator color={theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF'} />
                ) : (
                  <Sparkles
                    size={18}
                    color={theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF'}
                    strokeWidth={2.4}
                  />
                )
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* One-time medical disclaimer — shown on first plan view per
          App Store medical-app guidance. Non-dismissable except via the
          explicit accept button. */}
      <MedicalDisclaimer
        visible={!medicalDisclaimerAccepted}
        onAccept={acceptMedicalDisclaimer}
      />
    </View>
  );
}
