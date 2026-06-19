// First-launch coach-marks tour shown on Home. We render a translucent
// scrim over the whole screen and put a centered card with paginated
// tips. Cheap, reliable, no measurement required — much more robust than
// trying to spotlight specific elements with screen coords.

import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, Pressable, Animated } from 'react-native';
import {
  Sparkles,
  Activity,
  Droplet,
  Stethoscope,
  Calendar,
  BarChart3,
} from 'lucide-react-native';
import { useTheme } from '../theme';

interface Step {
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    Icon: Sparkles,
    title: 'Welcome to Mend',
    body: "Your AI-generated rehab plan is ready. Here's a quick tour — under 30 seconds.",
  },
  {
    Icon: Activity,
    title: 'Daily exercises',
    body: 'Tap any exercise card on Home to see step-by-step instructions. Tap the circle to mark it done.',
  },
  {
    Icon: Droplet,
    title: 'Hydration tracking',
    body: 'Tap a glass to log it. Aim for 8 a day — your tissues heal faster when hydrated.',
  },
  {
    Icon: Calendar,
    title: 'Schedule',
    body: 'Open the calendar tab to see all your sessions for the week and reorder them around your life.',
  },
  {
    Icon: BarChart3,
    title: 'Progress',
    body: 'The chart tab tracks pain, mobility and adherence so you can see your recovery curve.',
  },
  {
    Icon: Stethoscope,
    title: 'AI Physio Chat',
    body: 'Stuck on a movement or have a flare-up? The chat tab gives you 24/7 expert physio answers grounded in your plan.',
  },
];

interface Props {
  visible: boolean;
  onDone: () => void;
}

export default function OnboardingTutorial({ visible, onDone }: Props) {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  useEffect(() => {
    slide.setValue(0);
    Animated.spring(slide, { toValue: 1, friction: 7, useNativeDriver: true }).start();
  }, [step, slide]);

  if (!visible) return null;
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const dy = slide.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const opacity = slide;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDone}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 26,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: theme.colors.bo,
            paddingHorizontal: 24,
            paddingVertical: 28,
            width: '100%',
            maxWidth: 380,
            alignItems: 'center',
          }}
        >
          {/* Skip button top-right */}
          <Pressable
            onPress={onDone}
            hitSlop={10}
            style={({ pressed }) => ({
              position: 'absolute',
              top: 14,
              right: 18,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 13, color: theme.colors.tm, fontWeight: '600' }}>
              Skip
            </Text>
          </Pressable>

          <Animated.View
            style={{
              alignItems: 'center',
              opacity,
              transform: [{ translateY: dy }],
              marginTop: 10,
            }}
          >
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
                marginBottom: 18,
              }}
            >
              <s.Icon size={30} color={theme.colors.pt} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: theme.colors.th,
                letterSpacing: -0.4,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {s.title}
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
              {s.body}
            </Text>
          </Animated.View>

          {/* Step dots */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === step ? theme.colors.pu : theme.colors.bo2,
                }}
              />
            ))}
          </View>

          <Pressable
            onPress={() => (isLast ? onDone() : setStep((v) => v + 1))}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.pu,
              borderRadius: 14,
              paddingHorizontal: 26,
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
              {isLast ? "Let's go" : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
