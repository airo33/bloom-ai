import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import ProgressBar from '../components/ProgressBar';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import type { RootStackScreenProps } from '../navigation/types';
import type { FitnessLevel } from '../types/plan';

const LEVELS: { id: FitnessLevel; emoji: string; label: string }[] = [
  { id: 'Sedentary', emoji: '🛋️', label: 'Sedentary' },
  { id: 'Moderate', emoji: '🚴', label: 'Moderate' },
  { id: 'Athletic', emoji: '🏅', label: 'Athletic' },
];

export default function Onboarding1Screen({
  navigation,
}: RootStackScreenProps<'Onboarding1'>) {
  const theme = useTheme();
  const setProfile = useAppStore((s) => s.setProfile);
  const profile = useAppStore((s) => s.profile);

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [level, setLevel] = useState<FitnessLevel | ''>(profile.fitnessLevel);

  const onContinue = () => {
    setProfile({ name: name.trim() || 'Friend', age, fitnessLevel: level });
    navigation.navigate('Onboarding2');
  };

  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18 }}>
          <ProgressBar steps={[true, false]} />
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.pu,
              fontWeight: '700',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Step 1 of 2
          </Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: theme.colors.th,
              marginBottom: 4,
              letterSpacing: -0.5,
            }}
          >
            About you
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.tm }}>
            Helps calibrate your recovery plan.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <FieldLabel>Your name</FieldLabel>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex"
            autoCapitalize="words"
            returnKeyType="next"
            style={{ marginBottom: 18 }}
          />

          <FieldLabel>Age</FieldLabel>
          <Input
            value={age}
            onChangeText={setAge}
            placeholder="Years old"
            keyboardType="number-pad"
            returnKeyType="done"
            style={{ marginBottom: 18 }}
          />

          <FieldLabel>Fitness level before injury</FieldLabel>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {LEVELS.map((lv) => {
              const selected = level === lv.id;
              return (
                <Pressable
                  key={lv.id}
                  onPress={() => setLevel(lv.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    paddingHorizontal: 4,
                    borderRadius: 16,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? theme.colors.pu : theme.colors.bo,
                    backgroundColor: selected ? theme.colors.pl : theme.colors.card,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{lv.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: selected ? theme.colors.pt : theme.colors.tb,
                      letterSpacing: -0.1,
                    }}
                  >
                    {lv.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 22, paddingBottom: 20 }}>
          <Button
            title="Continue"
            onPress={onContinue}
            icon={<ArrowRight size={18} color={onPrimary} strokeWidth={2.5} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.tm,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}
