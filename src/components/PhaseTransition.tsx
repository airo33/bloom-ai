// Modal that pops the first time the user crosses into a new plan phase.
// Phases are the big milestones of a rehab plan ("Foundation", "Strength
// rebuild", "Return to sport"), so this is a meaningful psychological
// marker — bigger payoff than the per-day check-in.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, Animated } from 'react-native';
import { Layers, Target } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import Confetti from './Confetti';
import type { PlanPhase } from '../types/plan';

interface Props {
  phase: PlanPhase | null;
  visible: boolean;
  onDismiss: () => void;
}

export default function PhaseTransition({ phase, visible, onDismiss }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const badgeRotate = useRef(new Animated.Value(0)).current;
  const [confettiOn, setConfettiOn] = useState(false);
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.85);
    opacity.setValue(0);
    badgeRotate.setValue(0);
    setConfettiOn(false);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(badgeRotate, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => setConfettiOn(true));
  }, [visible, scale, opacity, badgeRotate]);

  if (!visible || !phase) return null;

  const rotate = badgeRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-25deg', '0deg'],
  });
  const badgeScale = badgeRotate.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.6, 1.15, 1],
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
            maxWidth: 380,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.bo,
            transform: [{ scale }],
            opacity,
          }}
        >
          <Animated.View
            style={{
              width: 92,
              height: 92,
              borderRadius: 28,
              backgroundColor: theme.colors.pl,
              borderWidth: 1,
              borderColor: theme.colors.pb,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
              transform: [{ scale: badgeScale }, { rotate }],
            }}
          >
            <Layers size={44} color={theme.colors.pt} strokeWidth={2.2} />
          </Animated.View>

          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: theme.colors.tm,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {t('phase.tagline')}
          </Text>

          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: theme.colors.th,
              letterSpacing: -0.5,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            {phase.name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.tm,
              marginBottom: 18,
            }}
          >
            {t('phase.week', { weeks: phase.weekNumbers ?? phase.weeks ?? '' })}
          </Text>

          {phase.goals && phase.goals.length > 0 && (
            <View style={{ alignSelf: 'stretch', marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.colors.tm,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {t('phase.goalsLabel')}
              </Text>
              {phase.goals.slice(0, 3).map((g, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: i === Math.min(phase.goals!.length, 3) - 1 ? 0 : 8,
                  }}
                >
                  <Target size={14} color={theme.colors.pu} strokeWidth={2.2} style={{ marginTop: 3 }} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: theme.colors.tb,
                      lineHeight: 20,
                    }}
                  >
                    {g}
                  </Text>
                </View>
              ))}
            </View>
          )}

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
              {t('phase.cta')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
