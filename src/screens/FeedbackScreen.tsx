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
import { useTheme } from '../theme';
import { submitFeedback, type FeedbackCategory } from '../lib/api';

interface CatOption {
  key: FeedbackCategory;
  label: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
}

const CATEGORIES: CatOption[] = [
  { key: 'bug', label: 'Bug', Icon: Bug },
  { key: 'idea', label: 'Idea', Icon: Lightbulb },
  { key: 'praise', label: 'Praise', Icon: Heart },
  { key: 'other', label: 'Other', Icon: MoreHorizontal },
];

export default function FeedbackScreen() {
  const theme = useTheme();
  const nav = useNavigation();
  const [category, setCategory] = useState<FeedbackCategory>('idea');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  const appVersion = (Constants.expoConfig?.version ?? 'dev') as string;

  const submit = async () => {
    const text = message.trim();
    if (text.length < 5) {
      Alert.alert('Too short', 'Please write at least a few words so we can act on it.');
      return;
    }
    setSending(true);
    try {
      await submitFeedback({ category, message: text, appVersion });
      Alert.alert('Thanks', 'Your feedback was sent. We read every one.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not send feedback. Try again later.';
      Alert.alert("Couldn't send", msg);
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
                fontSize: 22,
                fontWeight: '800',
                color: theme.colors.th,
                letterSpacing: -0.5,
              }}
            >
              Send feedback
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
            Bug, idea, or kind word — we read everything. App version is attached automatically so we can match it to a specific build.
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
            Category
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 22,
            }}
          >
            {CATEGORIES.map(({ key, label, Icon }) => {
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
                    {label}
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
            Your message
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholder={
              category === 'bug'
                ? 'Tell us what happened, what you expected, and how to reproduce.'
                : category === 'idea'
                  ? 'Describe what would make Bloom AI more useful for your recovery.'
                  : category === 'praise'
                    ? 'What worked well for you?'
                    : 'Anything on your mind.'
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
            App version: {appVersion}
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
                Send feedback
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
