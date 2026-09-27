// In-app feedback form. Lets users send bug reports / ideas / praise
// directly from the app — much higher response rate than a "contact us"
// email, and it auto-tags the app version so we know what build hit the
// issue.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bug, Lightbulb, Heart, MoreHorizontal } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import { submitFeedback, type FeedbackCategory } from '../lib/api';

interface CatOption {
  key: FeedbackCategory;
  labelKey: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
}

const CATEGORIES: CatOption[] = [
  { key: 'bug', labelKey: 'feedback.catBug', Icon: Bug },
  { key: 'idea', labelKey: 'feedback.catIdea', Icon: Lightbulb },
  { key: 'praise', labelKey: 'feedback.catPraise', Icon: Heart },
  { key: 'other', labelKey: 'feedback.catOther', Icon: MoreHorizontal },
];

export default function FeedbackScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const nav = useNavigation();
  const [category, setCategory] = useState<FeedbackCategory>('idea');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  const appVersion = (Constants.expoConfig?.version ?? 'dev') as string;

  const submit = async () => {
    const text = message.trim();
    if (text.length < 5) {
      Alert.alert(t('feedback.tooShortTitle'), t('feedback.tooShortBody'));
      return;
    }
    setSending(true);
    try {
      await submitFeedback({ category, message: text, appVersion });
      Alert.alert(t('feedback.thanksTitle'), t('feedback.thanksBody'), [
        { text: t('common.ok'), onPress: () => nav.goBack() },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('feedback.errFallback');
      Alert.alert(t('feedback.errTitle'), msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
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
                fontSize: 26,
                fontFamily: font.serif,
                color: theme.colors.th,
                letterSpacing: -0.6,
              }}
            >
              {t('feedback.title')}
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
            {t('feedback.intro')}
          </Text>

          {/* Category picker */}
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.tm,
              fontWeight: '700',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            {t('feedback.categoryLabel')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 22,
            }}
          >
            {CATEGORIES.map(({ key, labelKey, Icon }) => {
              const active = key === category;
              return (
                <Pressable
                  key={key}
                  onPress={() => setCategory(key)}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.pu : theme.colors.bo,
                    backgroundColor: active ? theme.colors.pl : theme.colors.card,
                    alignItems: 'center',
                    gap: 5,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Icon
                    size={20}
                    color={active ? theme.colors.pt : theme.colors.tb}
                    strokeWidth={2}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: active ? theme.colors.pt : theme.colors.tb,
                      letterSpacing: -0.1,
                    }}
                  >
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={{
              fontSize: 11,
              color: theme.colors.tm,
              fontWeight: '700',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            {t('feedback.messageLabel')}
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholder={
              category === 'bug'
                ? t('feedback.phBug')
                : category === 'idea'
                  ? t('feedback.phIdea')
                  : category === 'praise'
                    ? t('feedback.phPraise')
                    : t('feedback.phOther')
            }
            placeholderTextColor={theme.colors.tl}
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.bo,
              padding: 14,
              fontSize: 15,
              color: theme.colors.th,
              minHeight: 140,
              marginBottom: 6,
            }}
          />
          <Text style={{ fontSize: 11, color: theme.colors.tl, marginBottom: 22 }}>
            {t('feedback.appVersionLabel', { version: appVersion })}
          </Text>

          <Pressable
            onPress={submit}
            disabled={sending}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.pu,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: pressed || sending ? 0.85 : 1,
            })}
          >
            {sending ? (
              <ActivityIndicator color={onPrimary} />
            ) : (
              <Text
                style={{
                  color: onPrimary,
                  fontSize: 15,
                  fontWeight: '800',
                  letterSpacing: -0.2,
                }}
              >
                {t('feedback.title')}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
