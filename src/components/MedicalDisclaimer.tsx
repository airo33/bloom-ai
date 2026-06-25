// One-time medical disclaimer shown on first plan view. Apple's App Store
// review guidelines (1.4.1, health/medical) push every AI-generated
// health app to surface a clear non-medical-advice notice up front. The
// modal is non-dismissable except via the explicit "I understand" button,
// and the acknowledgement persists in the Zustand store so it never
// re-appears for the same install.

import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, Animated, ScrollView } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

interface Props {
  visible: boolean;
  onAccept: () => void;
}

export default function MedicalDisclaimer({ visible, onAccept }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.9);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scale, opacity]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      // No hardware-back dismiss — the user must explicitly acknowledge.
      onRequestClose={() => {}}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 22,
        }}
      >
        <Animated.View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 22,
            paddingHorizontal: 22,
            paddingVertical: 24,
            width: '100%',
            maxWidth: 400,
            maxHeight: '85%',
            borderWidth: 1,
            borderColor: theme.colors.bo,
            transform: [{ scale }],
            opacity,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: theme.colors.rl,
              borderWidth: 1,
              borderColor: theme.colors.rb,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 14,
            }}
          >
            <AlertTriangle size={28} color={theme.colors.rd} strokeWidth={2.2} />
          </View>

          <Text
            style={{
              fontSize: 19,
              fontWeight: '800',
              color: theme.colors.th,
              letterSpacing: -0.3,
              textAlign: 'center',
              marginBottom: 14,
            }}
          >
            {t('disclaimer.title')}
          </Text>

          <ScrollView
            style={{ maxHeight: 280, marginBottom: 18 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.tb,
                lineHeight: 22,
                letterSpacing: -0.1,
              }}
            >
              {t('disclaimer.body')}
            </Text>
          </ScrollView>

          <Pressable
            onPress={onAccept}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.pu,
              borderRadius: 14,
              paddingVertical: 14,
              alignSelf: 'stretch',
              alignItems: 'center',
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Text
              style={{
                color: onPrimary,
                fontSize: 15,
                fontWeight: '800',
                letterSpacing: -0.2,
              }}
            >
              {t('disclaimer.cta')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
