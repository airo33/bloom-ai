// Pops the first time during a recovery day that the user marks every
// session done. Confetti + a big animated check + a personal message.
// HomeScreen owns the "celebrated this day" guard so it never fires
// twice for the same day even if the user uncheck/re-checks.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, Animated, Easing } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import Confetti from './Confetti';

interface Props {
  visible: boolean;
  completedCount: number;
  streak: number;
  onDismiss: () => void;
}

export default function AllTasksDoneCelebration({
  visible,
  completedCount,
  streak,
  onDismiss,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const [confettiOn, setConfettiOn] = useState(false);
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  useEffect(() => {
    if (!visible) return;
    cardScale.setValue(0.8);
    cardOpacity.setValue(0);
    checkScale.setValue(0);
    checkRotate.setValue(0);
    setConfettiOn(false);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      // Check pops in with a 1.25 overshoot + small spin so it feels alive
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4.5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(checkRotate, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setConfettiOn(true));
  }, [visible, cardScale, cardOpacity, checkScale, checkRotate]);

  if (!visible) return null;

  const rotateInterp = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <Confetti active={confettiOn} count={26} onComplete={() => setConfettiOn(false)} />

        <Animated.View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 26,
            paddingHorizontal: 26,
            paddingVertical: 30,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.bo,
            transform: [{ scale: cardScale }],
            opacity: cardOpacity,
          }}
        >
          <Animated.View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: theme.colors.pu,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
              transform: [{ scale: checkScale }, { rotate: rotateInterp }],
            }}
          >
            <Check size={52} color={onPrimary} strokeWidth={3.2} />
          </Animated.View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: theme.colors.th,
              letterSpacing: -0.5,
              marginBottom: 6,
              textAlign: 'center',
            }}
          >
            {t('dayComplete.title')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: theme.colors.pu,
              letterSpacing: -0.2,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {t('dayComplete.sessions', { count: completedCount })}
            {streak > 1 ? t('dayComplete.streakSuffix', { count: streak }) : ''}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.tb,
              textAlign: 'center',
              lineHeight: 21,
              marginBottom: 22,
            }}
          >
            {t('dayComplete.body')}
          </Text>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.pu,
              borderRadius: 14,
              paddingHorizontal: 24,
              paddingVertical: 13,
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
              {t('dayComplete.cta')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
