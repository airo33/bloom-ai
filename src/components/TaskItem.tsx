// Single task row used on Home + Schedule.
// Left colored bar -> category tile -> name/meta -> checkbox.

import React from 'react';
import { Pressable, View, Text } from 'react-native';
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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.colors.bo,
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: 10,
        opacity: pressed ? 0.85 : done ? 0.55 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.scheme === 'dark' ? 0.25 : 0.05,
        shadowRadius: 8,
        elevation: 2,
      })}
    >
      <View style={{ width: 5, backgroundColor: c.bar }} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          flex: 1,
        }}
      >
        <CategoryTile category={exercise.category} size={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: theme.colors.th,
              textDecorationLine: done ? 'line-through' : 'none',
            }}
          >
            {exercise.name}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 3 }}>
            {c.em} {c.lbl} · {exercise.time ?? '—'}
          </Text>
        </View>
        <Pressable
          hitSlop={10}
          onPress={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: done ? theme.colors.pu : theme.colors.bo2,
            backgroundColor: done ? theme.colors.pu : theme.colors.card2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done ? <Text style={{ color: '#fff', fontSize: 13 }}>✓</Text> : null}
        </Pressable>
      </View>
    </Pressable>
  );
}
