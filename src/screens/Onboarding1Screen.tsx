import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 14 }}>
          <ProgressBar steps={[true, false]} />
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.pu,
              fontWeight: '700',
              letterSpacing: 0.6,
              marginBottom: 4,
            }}
          >
            👤 STEP 1 / 2
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: theme.colors.th, marginBottom: 3 }}>
            About You
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.tm }}>
            Helps calibrate your recovery plan.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.fieldLabel, { color: theme.colors.tb }]}>📝 YOUR NAME</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
            returnKeyType="next"
            style={{ marginBottom: 14 }}
          />

          <Text style={[styles.fieldLabel, { color: theme.colors.tb }]}>🎂 AGE</Text>
          <Input
            value={age}
            onChangeText={setAge}
            placeholder="Years old"
            keyboardType="number-pad"
            returnKeyType="done"
            style={{ marginBottom: 14 }}
          />

          <Text style={[styles.fieldLabel, { color: theme.colors.tb }]}>
            🏃 FITNESS LEVEL BEFORE INJURY
          </Text>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            {LEVELS.map((lv) => {
              const selected = level === lv.id;
              return (
                <Pressable
                  key={lv.id}
                  onPress={() => setLevel(lv.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: selected ? theme.colors.pu : theme.colors.bo2,
                    backgroundColor: selected ? theme.colors.pl : theme.colors.card2,
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{lv.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: selected ? theme.colors.pt : theme.colors.tb,
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
          <Button title="Continue ➡️" onPress={onContinue} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    marginBottom: 7,
  },
};
