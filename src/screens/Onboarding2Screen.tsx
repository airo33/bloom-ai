import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Stethoscope, BrainCircuit } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Input from '../components/Input';
import ProgressBar from '../components/ProgressBar';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import type { RootStackScreenProps } from '../navigation/types';

export default function Onboarding2Screen({
  navigation,
}: RootStackScreenProps<'Onboarding2'>) {
  const theme = useTheme();
  const { t } = useTranslation();
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

  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18 }}>
          <ProgressBar steps={[true, true]} />
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
            {t('onboarding.step2Label')}
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
            {t('onboarding.step2Title')}
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.tm }}>
            {t('onboarding.step2Sub')}
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
            placeholder={t('onboarding.injuryPlaceholder')}
            multiline
            invalid={invalid}
            style={{ marginBottom: 16, minHeight: 180 }}
          />

          <View
            style={{
              backgroundColor: theme.colors.pl,
              borderColor: theme.colors.pb,
              borderWidth: 1,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: theme.colors.pu,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BrainCircuit
                size={20}
                color={theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF'}
                strokeWidth={2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.colors.pt, letterSpacing: -0.2 }}>
                {t('onboarding.aiPlanCard')}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>
                {t('onboarding.aiPlanCardSub')}
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
              title={t('onboarding.back')}
              variant="secondary"
              onPress={() => navigation.goBack()}
              icon={<ArrowLeft size={16} color={theme.colors.th} strokeWidth={2.2} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={t('onboarding.generate')}
              onPress={onCreate}
              icon={<Stethoscope size={18} color={onPrimary} strokeWidth={2.4} />}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
