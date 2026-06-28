import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Input from '../components/Input';
import ProgressBar from '../components/ProgressBar';
import { useTheme, font } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { FITNESS_LEVELS } from '../data/fitnessLevels';
import type { RootStackScreenProps } from '../navigation/types';
import type { FitnessLevel } from '../types/plan';

export default function Onboarding1Screen({
  navigation,
}: RootStackScreenProps<'Onboarding1'>) {
  const theme = useTheme();
  const { t } = useTranslation();
  const setProfile = useAppStore((s) => s.setProfile);
  const profile = useAppStore((s) => s.profile);

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [level, setLevel] = useState<FitnessLevel | ''>(profile.fitnessLevel);

  const onContinue = () => {
    setProfile({ name: name.trim() || t('common.friend'), age, fitnessLevel: level });
    navigation.navigate('Onboarding2');
  };

  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
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
            {t('onboarding.step1Label')}
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontFamily: font.serif,
              color: theme.colors.th,
              marginBottom: 4,
              letterSpacing: -0.5,
            }}
          >
            {t('onboarding.step1Title')}
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.tm }}>
            {t('onboarding.step1Sub')}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <FieldLabel>{t('onboarding.nameLabel')}</FieldLabel>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('onboarding.namePlaceholder')}
            autoCapitalize="words"
            returnKeyType="next"
            style={{ marginBottom: 18 }}
          />

          <FieldLabel>{t('onboarding.ageLabel')}</FieldLabel>
          <Input
            value={age}
            onChangeText={setAge}
            placeholder={t('onboarding.agePlaceholder')}
            keyboardType="number-pad"
            returnKeyType="done"
            style={{ marginBottom: 18 }}
          />

          <FieldLabel>{t('onboarding.fitnessLabel')}</FieldLabel>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {FITNESS_LEVELS.map((lv) => {
              const selected = level === lv.id;
              const iconColor = selected ? theme.colors.pt : theme.colors.tb;
              return (
                <Pressable
                  key={lv.id}
                  onPress={() => setLevel(lv.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 18,
                    paddingHorizontal: 6,
                    borderRadius: 16,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? theme.colors.pu : theme.colors.bo,
                    backgroundColor: selected ? theme.colors.pl : theme.colors.card,
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: selected ? theme.colors.pu : theme.colors.card2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <lv.Icon
                      size={20}
                      color={selected ? (theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF') : iconColor}
                      strokeWidth={2}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: selected ? theme.colors.pt : theme.colors.tb,
                      letterSpacing: -0.1,
                    }}
                  >
                    {t(`onboarding.fitness${lv.id}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 22, paddingBottom: 20 }}>
          <Button
            title={t('common.continue')}
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
