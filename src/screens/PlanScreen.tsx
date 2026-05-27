import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import Card from '../components/Card';
import CategoryTile from '../components/CategoryTile';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { getCategory } from '../theme/categories';
import type { RootStackScreenProps } from '../navigation/types';

export default function PlanScreen({ navigation }: RootStackScreenProps<'Plan'>) {
  const theme = useTheme();
  const plan = useAppStore((s) => s.plan);

  // Defensive fallback: if user lands here without a plan, route them to Welcome
  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🫀</Text>
          <Text style={{ fontSize: 16, color: theme.colors.tm, textAlign: 'center' }}>
            No plan loaded yet.
          </Text>
          <View style={{ height: 16 }} />
          <Button title="Start onboarding" onPress={() => navigation.replace('Welcome')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style="light" />

      {/* Purple header */}
      <SafeAreaView style={{ backgroundColor: theme.colors.pu }} edges={['top']}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Text style={{ fontSize: 14 }}>✨</Text>
            <Text
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: '600',
              }}
            >
              AI Clinical Plan
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 16 }}>
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
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
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
        <Card style={{ marginBottom: 13 }} padding={14}>
          <Text style={{ fontSize: 14, color: theme.colors.tb, lineHeight: 22 }}>
            {plan.summary}
          </Text>
        </Card>

        {/* Clinical goals */}
        <Text style={[styles.sectionLabel, { color: theme.colors.tm }]}>
          🎯 CLINICAL GOALS
        </Text>
        <View
          style={{
            backgroundColor: theme.colors.bl,
            borderColor: theme.colors.bb,
            borderWidth: 1.5,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            marginBottom: 13,
          }}
        >
          {plan.clinicalGoals.map((g, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: i === plan.clinicalGoals.length - 1 ? 0 : 5,
              }}
            >
              <Text style={{ fontSize: 14 }}>🎯</Text>
              <Text style={{ flex: 1, fontSize: 13, color: theme.colors.tb, lineHeight: 20 }}>
                {g}
              </Text>
            </View>
          ))}
        </View>

        {/* Red flags */}
        <Text style={[styles.sectionLabel, { color: theme.colors.tm }]}>
          ⚠️ SEE A DOCTOR IF:
        </Text>
        <View
          style={{
            backgroundColor: theme.colors.rl,
            borderColor: theme.colors.rb,
            borderWidth: 1.5,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            marginBottom: 13,
          }}
        >
          {plan.redFlags.map((r, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: i === plan.redFlags.length - 1 ? 0 : 5,
              }}
            >
              <Text style={{ fontSize: 13 }}>🚨</Text>
              <Text style={{ flex: 1, fontSize: 13, color: theme.colors.tb, lineHeight: 20 }}>
                {r}
              </Text>
            </View>
          ))}
        </View>

        {/* Exercises */}
        <Text style={[styles.sectionLabel, { color: theme.colors.tm }]}>
          📋 ALL EXERCISES IN THIS PLAN
        </Text>
        <Card style={{ marginBottom: 13 }} padding={0}>
          {plan.exercises.map((ex, i) => {
            const c = getCategory(ex.category);
            return (
              <View
                key={ex.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.bo,
                }}
              >
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: c.bar,
                  }}
                />
                <CategoryTile category={ex.category} size={34} />
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
                  <Text style={{ fontSize: 11, color: c.ic, fontWeight: '700' }}>
                    {c.lbl}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Disclaimer */}
        <View
          style={{
            backgroundColor: theme.colors.card2,
            borderColor: theme.colors.bo,
            borderWidth: 1,
            borderRadius: 13,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 18,
          }}
        >
          <Text style={{ fontSize: 12, color: theme.colors.tm, lineHeight: 18 }}>
            ⚕️ Evidence-based protocol. Post-surgical: follow surgeon's restrictions
            first. Stop any exercise causing sharp pain.
          </Text>
        </View>

        <Button
          title="💳 Choose Your Plan →"
          onPress={() => navigation.replace('Subscription')}
        />
      </ScrollView>
    </View>
  );
}

const styles = {
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
};
