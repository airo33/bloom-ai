import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Input from '../components/Input';
import ProgressBar from '../components/ProgressBar';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import type { RootStackScreenProps } from '../navigation/types';

const INJURY_PLACEHOLDER =
  'Include: What happened, when (days/weeks ago), exact location, any surgery/diagnosis, current pain (0-10), what makes it better/worse...\n\n' +
  'e.g. ACL reconstruction 10 days ago, right knee. Full weight-bearing with crutches OK. Pain 3/10 rest, 6/10 stairs. Significant swelling. Pre-injury: running 40km/week.';

export default function Onboarding2Screen({
  navigation,
}: RootStackScreenProps<'Onboarding2'>) {
  const theme = useTheme();
  const setProfile = useAppStore((s) => s.setProfile);
  const profile = useAppStore((s) => s.profile);

  const [injury, setInjury] = useState(profile.injury);
  const [invalid, setInvalid] = useState(false);

  const onCreate = () => {
    const trimmed = injury.trim();
    if (!trimmed) {
      setInvalid(true);
      setTimeout(() => setInvalid(false), 2000);
      return;
    }
    setProfile({ injury: trimmed });
    navigation.navigate('Loading');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 14 }}>
          <ProgressBar steps={[true, true]} />
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.pu,
              fontWeight: '700',
              letterSpacing: 0.6,
              marginBottom: 4,
            }}
          >
            🩺 STEP 2 / 2
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: theme.colors.th, marginBottom: 3 }}>
            Describe Your Case
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.tm }}>
            More detail = more specific exercises.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            value={injury}
            onChangeText={(v) => {
              setInjury(v);
              if (invalid) setInvalid(false);
            }}
            placeholder={INJURY_PLACEHOLDER}
            multiline
            invalid={invalid}
            style={{ marginBottom: 13 }}
          />

          <View
            style={{
              backgroundColor: theme.colors.pl,
              borderColor: theme.colors.pb,
              borderWidth: 1.5,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 28 }}>🧠</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.pt }}>
                AI Clinical Plan
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 1 }}>
                Injury-specific · Varied daily schedule · Red flags
              </Text>
            </View>
          </View>
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 22,
            paddingBottom: 20,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <View style={{ flex: 0.42 }}>
            <Button
              title="⬅️ Back"
              variant="secondary"
              onPress={() => navigation.goBack()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="🏥 Create My Plan" onPress={onCreate} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
