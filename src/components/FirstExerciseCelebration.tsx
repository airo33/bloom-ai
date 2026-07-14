// The "you've begun" moment. Fires the FIRST time the user marks any
// exercise complete — a bigger celebration than the regular per-task
// toast because starting the habit is the psychologically heaviest
// friction to overcome.
//
// Guarded by firstExerciseCompleted in the store; once fired, never
// fires again for this install.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, Animated, Easing } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import Confetti from './Confetti';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function FirstExerciseCelebration({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const [confettiOn, setConfettiOn] = useState(false);
  const onPrimary = theme.scheme === 'dark' ? '#1D2A17' : '#FFFFFF';

  useEffect(() => {
    if (!visible) return;
    cardScale.setValue(0.85);
    cardOpacity.setValue(0);
    iconScale.setValue(0);
    iconRotate.setValue(0);
    setConfettiOn(false);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1, friction: 6, tension: 90, useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 220, useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1, friction: 4, tension: 110, useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
    ]).start(() => setConfettiOn(true));
  }, [visible, cardScale, cardOpacity, iconScale, iconRotate]);

  if (!visible) return null;

  const rotate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-360deg', '0deg'],
  });

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 26,
        }}
      >
        <Confetti active={confettiOn} count={30} onComplete={() => setConfettiOn(false)} />

        <Animated.View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 26,
            paddingHorizontal: 28,
            paddingVertical: 32,
            width: '100%',
            maxWidth: 380,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.bo,
            transform: [{ scale: cardScale }],
            opacity: cardOpacity,
          }}
        >
          <Animated.View
            style={{
              width: 100, height: 100, borderRadius: 50,
              backgroundColor: theme.colors.pu,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 22,
              transform: [{ scale: iconScale }, { rotate }],
            }}
          >
            <Sparkles size={54} color={onPrimary} strokeWidth={2.4} />
          </Animated.View>

          <Text
            style={{
              fontSize: 32,
              fontFamily: font.serif,
              color: theme.colors.th,
              letterSpacing: -0.7,
              marginBottom: 4,
              textAlign: 'center',
            }}
          >
            {t('firstExercise.title')}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: font.serifItalic,
              color: theme.colors.pu,
              letterSpacing: -0.2,
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            {t('firstExercise.subtitle')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: font.body,
              color: theme.colors.tb,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 26,
            }}
          >
            {t('firstExercise.body')}
          </Text>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.pu,
              borderRadius: 14,
              paddingHorizontal: 24,
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
                fontFamily: font.bodyBold,
                letterSpacing: -0.2,
              }}
            >
              {t('firstExercise.cta')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
