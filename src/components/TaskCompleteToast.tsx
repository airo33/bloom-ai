// Lightweight motivational toast that pops at the top of Home every time
// the user checks off a task. Auto-dismisses after ~2s. Smaller and
// snappier than the full-screen celebrations — we want it to feel like
// a high-five, not a parade.
//
// Variant rotation lives in HomeScreen (we just render the message we're
// given). The caller is responsible for cycling through translations so
// the same wording doesn't appear twice in a row.

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, Easing, Pressable } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../theme';

interface Props {
  /** The localised message to show. Pass `null` to hide. */
  message: string | null;
  /** Top inset (px) — typically the safe-area top + a small gap. */
  topInset?: number;
  /** Fires when the auto-dismiss timer ends so the caller can null out the message. */
  onHide: () => void;
}

export default function TaskCompleteToast({ message, topInset = 60, onHide }: Props) {
  const theme = useTheme();
  const slide = useRef(new Animated.Value(0)).current;
  // Track the latest active message so we can clear timers on re-trigger.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    slide.setValue(0);
    Animated.sequence([
      Animated.spring(slide, {
        toValue: 1,
        friction: 7,
        tension: 100,
        useNativeDriver: false,
      }),
      Animated.delay(1700),
      Animated.timing(slide, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) onHide();
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, slide, onHide]);

  if (!message) return null;

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 0],
  });

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: topInset,
        left: 22,
        right: 22,
      }}
    >
      <Animated.View
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.pu,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          opacity: slide,
          transform: [{ translateY }],
          // Subtle depth so it reads as floating over the screen content.
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: theme.colors.pl,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={18} color={theme.colors.pu} strokeWidth={2.4} />
        </View>
        <Pressable
          onPress={onHide}
          style={{ flex: 1 }}
          hitSlop={6}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: theme.colors.th,
              letterSpacing: -0.1,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {message}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
