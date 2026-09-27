import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Stethoscope, Trash2, ImagePlus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import { useAppStore } from '../store/useAppStore';
import TypingDots from '../components/TypingDots';
import { chatPhysio } from '../lib/api';
import { pickInjuryPhoto, type InjuryPhoto } from '../lib/injuryPhoto';
import { track } from '../lib/analytics';
import type { RootStackScreenProps } from '../navigation/types';

const SUGGESTED_PROMPT_KEYS = ['prompt1', 'prompt2', 'prompt3', 'prompt4'] as const;

export default function ChatScreen({ navigation }: RootStackScreenProps<'Chat'>) {
  const theme = useTheme();
  const { t } = useTranslation();
  const plan = useAppStore((s) => s.plan);
  const chatHistory = useAppStore((s) => s.chatHistory);
  const appendChat = useAppStore((s) => s.appendChat);
  const clearChat = useAppStore((s) => s.clearChat);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<InjuryPhoto | null>(null);
  const [attaching, setAttaching] = useState(false);
  // Local URIs that failed to load (e.g. cache evicted after an app restart) —
  // we hide those thumbnails and just show the text.
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to the bottom whenever messages, typing, or the photo preview change
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [chatHistory.length, sending, pendingPhoto]);

  const sendMessage = useCallback(
    async (text: string, photo?: InjuryPhoto | null) => {
      const trimmed = text.trim();
      if ((!trimmed && !photo) || sending) return;

      appendChat('user', trimmed, photo?.uri);
      setInput('');
      setPendingPhoto(null);
      setSending(true);
      track('chat_sent', { length: trimmed.length, hasPhoto: !!photo });

      try {
        const result = await chatPhysio({
          plan,
          history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
          userMessage: trimmed,
          image: photo ? { base64: photo.base64, mimeType: photo.mimeType } : undefined,
        });
        appendChat('assistant', result.reply);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        appendChat('assistant', t('chat.serverErr', { error: msg.slice(0, 80) }));
      } finally {
        setSending(false);
      }
    },
    [appendChat, chatHistory, plan, sending, t],
  );

  const attachPhoto = useCallback(async (source: 'camera' | 'library') => {
    setAttaching(true);
    try {
      const res = await pickInjuryPhoto(source);
      if (res.ok) {
        setPendingPhoto(res.photo);
      } else if (res.reason === 'permission') {
        Alert.alert(
          source === 'camera' ? t('chat.permCameraTitle') : t('chat.permPhotoTitle'),
          source === 'camera' ? t('chat.permCameraBody') : t('chat.permPhotoBody'),
        );
      } else if (res.reason === 'error') {
        Alert.alert(t('chat.photoErrTitle'), res.message ?? t('chat.photoErrBody'));
      }
    } finally {
      setAttaching(false);
    }
  }, [t]);

  const promptPhotoSource = useCallback(() => {
    if (sending || attaching) return;
    Alert.alert(t('chat.photoSheetTitle'), t('chat.photoSheetBody'), [
      { text: t('chat.takePhoto'), onPress: () => attachPhoto('camera') },
      { text: t('chat.chooseLibrary'), onPress: () => attachPhoto('library') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }, [attachPhoto, sending, attaching, t]);

  const canSend = (!!input.trim() || !!pendingPhoto) && !sending && !attaching;

  const userBg = theme.colors.pu;
  const userFg = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 18,
            paddingTop: 10,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.bo,
            backgroundColor: theme.colors.bg,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 13,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.bo,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ChevronLeft size={20} color={theme.colors.tb} strokeWidth={2.2} />
          </Pressable>

          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.pu,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stethoscope size={22} color={userFg} strokeWidth={2.2} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 19,
                fontFamily: font.serif,
                color: theme.colors.th,
                letterSpacing: -0.4,
              }}
            >
              {t('chat.headerTitle')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: theme.colors.gn,
                }}
              />
              <Text style={{ fontSize: 12, color: theme.colors.tm }}>{t('chat.headerStatus')}</Text>
            </View>
          </View>

          {chatHistory.length > 0 && (
            <Pressable
              onPress={clearChat}
              hitSlop={10}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 13,
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.bo,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Trash2 size={17} color={theme.colors.tm} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 16,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {chatHistory.length === 0 ? (
            <View style={{ paddingTop: 24, paddingHorizontal: 6 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: theme.colors.pl,
                  borderWidth: 1,
                  borderColor: theme.colors.pb,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Stethoscope size={30} color={theme.colors.pt} strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '800',
                  color: theme.colors.th,
                  letterSpacing: -0.4,
                  marginBottom: 6,
                }}
              >
                {t('chat.emptyTitle')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.tm,
                  lineHeight: 21,
                  marginBottom: 22,
                }}
              >
                {t('chat.emptyBody')}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.colors.tm,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {t('chat.suggestedLabel')}
              </Text>
              {SUGGESTED_PROMPT_KEYS.map((k) => {
                const label = t(`chat.${k}`);
                return (
                  <Pressable
                    key={k}
                    onPress={() => sendMessage(label)}
                    disabled={sending}
                    style={({ pressed }) => ({
                      backgroundColor: theme.colors.card,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: theme.colors.bo,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      marginBottom: 8,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 14, color: theme.colors.th, fontWeight: '600' }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            chatHistory.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View
                    style={{
                      maxWidth: '85%',
                      backgroundColor: isUser ? userBg : theme.colors.card,
                      borderColor: isUser ? userBg : theme.colors.bo,
                      borderWidth: 1,
                      borderRadius: 18,
                      borderTopLeftRadius: isUser ? 18 : 4,
                      borderTopRightRadius: isUser ? 4 : 18,
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                    }}
                  >
                    {m.imageUri && !failedImages[m.imageUri] && (
                      <Image
                        source={{ uri: m.imageUri }}
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [m.imageUri as string]: true }))
                        }
                        style={{
                          width: 200,
                          height: 200,
                          borderRadius: 12,
                          marginBottom: m.content ? 8 : 0,
                          backgroundColor: theme.colors.card2,
                        }}
                        resizeMode="cover"
                      />
                    )}
                    {!!m.content && (
                      <Text
                        style={{
                          fontSize: 14,
                          lineHeight: 21,
                          color: isUser ? userFg : theme.colors.th,
                        }}
                      >
                        {m.content}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}

          {sending && (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.bo,
                  borderWidth: 1,
                  borderRadius: 18,
                  borderTopLeftRadius: 4,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <TypingDots />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: 14,
            borderTopWidth: 1,
            borderTopColor: theme.colors.bo,
            backgroundColor: theme.colors.bg,
          }}
        >
          {/* Pending injury photo preview */}
          {pendingPhoto && (
            <View style={{ flexDirection: 'row', marginBottom: 10, paddingLeft: 2 }}>
              <View>
                <Image
                  source={{ uri: pendingPhoto.uri }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    backgroundColor: theme.colors.card2,
                  }}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => setPendingPhoto(null)}
                  hitSlop={8}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: theme.colors.th,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: theme.colors.bg,
                  }}
                >
                  <X size={12} color={theme.colors.bg} strokeWidth={3} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Row: attach · text · send */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <Pressable
              onPress={promptPhotoSource}
              disabled={sending || attaching}
              hitSlop={4}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.bo,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : sending || attaching ? 0.5 : 1,
              })}
            >
              {attaching ? (
                <ActivityIndicator size="small" color={theme.colors.tm} />
              ) : (
                <ImagePlus size={20} color={theme.colors.tb} strokeWidth={2.2} />
              )}
            </Pressable>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('chat.inputPlaceholder')}
              placeholderTextColor={theme.colors.tm}
              multiline
              editable={!sending}
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 120,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.bo,
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                color: theme.colors.th,
                lineHeight: 20,
              }}
            />
            <Pressable
              onPress={() => sendMessage(input, pendingPhoto)}
              disabled={!canSend}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: canSend ? theme.colors.pu : theme.colors.card2,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Send
                size={20}
                color={
                  canSend ? (theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF') : theme.colors.tl
                }
                strokeWidth={2.2}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
