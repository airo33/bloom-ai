// Pure-JS pain scale picker: 11 tap targets (0..10) in a single row,
// each tinted green / amber / red by intensity. Replaces the native
// @react-native-community/slider so JournalScreen works without a
// dev-client rebuild.

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

function bandColors(theme: ReturnType<typeof useTheme>, n: number) {
  if (n <= 3) {
    return { active: theme.colors.gn, bg: theme.colors.gl, fg: theme.colors.gn };
  }
  if (n <= 6) {
    return { active: theme.colors.yb, bg: theme.colors.yl, fg: theme.colors.yb };
  }
  return { active: theme.colors.rd, bg: theme.colors.rl, fg: theme.colors.rd };
}

export default function PainScale({ value, onChange }: Props) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: 11 }).map((_, i) => {
        const selected = i === value;
        const cellColors = bandColors(theme, i);
        const bg = selected ? cellColors.active : theme.colors.card2;
        const fg = selected ? (theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF') : theme.colors.tb;

        return (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            hitSlop={4}
            style={{
              flex: 1,
              aspectRatio: 1,
              borderRadius: 12,
              borderWidth: selected ? 0 : 1,
              borderColor: theme.colors.bo,
              backgroundColor: bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: fg,
                letterSpacing: -0.2,
              }}
            >
              {i}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
