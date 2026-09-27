// Renders ShareableCard off-screen, captures it via view-shot, and hands
// the PNG to the system share sheet. Fires only when `visible` and
// `breakdown` are both truthy — the caller (Progress/Home) shouldn't
// show the share button at all before the user has enough logs, but we
// still guard here so it never renders an empty card.

import React, { useRef, useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import ViewShot, { captureRef, type ViewShotRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { X, Share2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import type { RecoveryBreakdown } from '../lib/recoveryScore';
import ShareableCard from './ShareableCard';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  breakdown: RecoveryBreakdown | null;
  day: number;
  streak: number;
}

export default function ShareProgressModal({
  visible,
  onDismiss,
  breakdown,
  day,
  streak,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cardRef = useRef<ViewShotRef>(null);
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        // 3x native for crisp export on modern phone screens.
        result: 'tmpfile',
      });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(t('share.errNotAvailable'));
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('share.modalTitle'),
        UTI: 'public.png',
      });
    } catch (e) {
      Alert.alert(t('share.errShare'));
    } finally {
      setBusy(false);
    }
  };

  if (!breakdown) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.bo,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontFamily: font.serif,
                color: theme.colors.th,
                letterSpacing: -0.4,
              }}
            >
              {t('share.modalTitle')}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: font.body,
                color: theme.colors.tm,
                marginTop: 2,
              }}
            >
              {t('share.modalSub')}
            </Text>
          </View>
          <Pressable
            onPress={onDismiss}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: theme.colors.card2,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <X size={18} color={theme.colors.tb} strokeWidth={2.4} />
          </Pressable>
        </View>

        {/* Card preview — actually captured */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ViewShot
            ref={cardRef}
            options={{ format: 'png', quality: 1 }}
            style={{ borderRadius: 20, overflow: 'hidden' }}
          >
            <ShareableCard breakdown={breakdown} day={day} streak={streak} />
          </ViewShot>
        </View>

        {/* CTA */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 30,
            paddingTop: 12,
            gap: 10,
          }}
        >
          <Pressable
            onPress={handleShare}
            disabled={busy}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.pu,
              borderRadius: 16,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: pressed || busy ? 0.8 : 1,
            })}
          >
            {busy ? (
              <ActivityIndicator color={theme.scheme === 'dark' ? '#1D2A17' : '#FFFFFF'} />
            ) : (
              <Share2
                size={18}
                color={theme.scheme === 'dark' ? '#1D2A17' : '#FFFFFF'}
                strokeWidth={2.4}
              />
            )}
            <Text
              style={{
                fontSize: 16,
                fontFamily: font.bodyBold,
                color: theme.scheme === 'dark' ? '#1D2A17' : '#FFFFFF',
              }}
            >
              {busy ? t('share.preparing') : t('share.shareCta')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
