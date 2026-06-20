// Task row — refreshed to a cleaner style with subtle borders,
// Lucide check mark, no shadows.
//
// Pop animation strategy: we fire it INSIDE the onPress handler instead
// of an effect that watches `done`. The earlier mountedRef approach
// silently failed for re-checks because the dependency-driven effect
// didn't always run for back-to-back toggles. Tapping IS the trigger.

import React, { useRef } from 'react';
import { Pressable, View, Text, Animated } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme';
import { getCategory } from '../theme/categories';
import CategoryTile from './CategoryTile';
import type { Exercise } from '../types/plan';

interface Props {
  exercise: Exercise;
  done: boolean;
  onPress: () => void;
  onToggle: () => void;
}

export default function TaskItem({ exercise, done, onPress, onToggle }: Props) {
  const theme = useTheme();
  const c = getCategory(exercise.category);
  const checkFg = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  const scale = useRef(new Animated.Value(1)).current;

  const popCheckbox = () => {
    scale.setValue(0.55);
    Animated.spring(scale, {
      toValue: 1,
      friction: 3.8,
      tension: 240,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.bo,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingLeft: 14,
        paddingRight: 12,
        paddingVertical: 12,
        marginBottom: 10,
        opacity: pressed ? 0.85 : done ? 0.55 : 1,
      })}
    >
      <CategoryTile category={exercise.category} size={42} />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: theme.colors.th,
            letterSpacing: -0.2,
            textDecorationLine: done ? 'line-through' : 'none',
          }}
        >
          {exercise.name}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>
          {c.lbl} · {exercise.time ?? '—'}
        </Text>
      </View>

      <Pressable
        hitSlop={10}
        onPress={(e) => {
          e.stopPropagation();
          popCheckbox();
          onToggle();
        }}
      >
        <Animated.View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: done ? theme.colors.pu : theme.colors.bo2,
            backgroundColor: done ? theme.colors.pu : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale }],
          }}
        >
          {done && <Check size={16} color={checkFg} strokeWidth={3} />}
        </Animated.View>
      </Pressable>

      <ChevronRight size={18} color={theme.colors.tl} strokeWidth={2} />
    </Pressable>
  );
}
