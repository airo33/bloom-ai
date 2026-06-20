// Language picker. Lets the user pin a UI language or follow the device.
// Selection persists via Zustand; the App-level effect re-applies i18n.

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { SUPPORTED_LANGUAGES } from '../lib/i18n';

export default function LanguageScreen() {
  const theme = useTheme();
  const nav = useNavigation();
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 18,
            minHeight: 36,
          }}
        >
          <Pressable
            onPress={() => nav.goBack()}
            hitSlop={10}
            style={{ marginRight: 10 }}
          >
            <ArrowLeft size={22} color={theme.colors.th} strokeWidth={2.2} />
          </Pressable>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: theme.colors.th,
              letterSpacing: -0.5,
            }}
          >
            {t('languagePicker.title')}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 14,
            color: theme.colors.tm,
            marginBottom: 22,
            lineHeight: 21,
          }}
        >
          {t('languagePicker.subtitle')}
        </Text>

        {/* Device default */}
        <Row
          icon={<Smartphone size={20} color={theme.colors.tb} strokeWidth={2} />}
          label={t('languagePicker.deviceDefault')}
          selected={language === null}
          onPress={() => setLanguage(null)}
        />

        <View style={{ height: 14 }} />

        {SUPPORTED_LANGUAGES.map(({ code, label, native }) => (
          <Row
            key={code}
            label={native}
            sub={native !== label ? label : undefined}
            selected={language === code}
            onPress={() => setLanguage(code)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  sub,
  selected,
  onPress,
}: {
  icon?: React.ReactNode;
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: theme.colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: selected ? theme.colors.pu : theme.colors.bo,
        marginBottom: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon && (
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
          {icon}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: theme.colors.th,
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
        {sub && (
          <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>{sub}</Text>
        )}
      </View>
      {selected && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.pu,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check
            size={14}
            color={theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF'}
            strokeWidth={3}
          />
        </View>
      )}
    </Pressable>
  );
}
