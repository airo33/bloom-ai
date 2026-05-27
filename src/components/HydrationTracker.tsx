// 8-glass hydration tracker with tap-to-fill and progress bar.
// Ports `renderW()` from prototype.

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

const TIPS = [
  'Start your day with a glass of water 💧',
  'Joints need hydration — drink up!',
  'Consistent hydration supports healing',
  'One more glass before lunch 💪',
  'Great hydration today!',
  '6/8 — almost there!',
  '7/8 — nearly done!',
  '🎉 Perfect hydration today! Great for healing!',
];

interface Props {
  glasses: number;            // 0..8
  onTap: (glassIdx: number) => void;
}

export default function HydrationTracker({ glasses, onTap }: Props) {
  const theme = useTheme();
  const tip = TIPS[Math.min(glasses, TIPS.length - 1)];

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: theme.colors.bo,
        padding: 15,
        marginBottom: 11,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.th }}>
            💧 Hydration
          </Text>
          <Text style={{ fontSize: 11, color: theme.colors.tm, marginTop: 1 }}>
            Drink 8 glasses · Supports joint healing
          </Text>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#0984E3' }}>
          {glasses}
          <Text style={{ fontSize: 12, color: theme.colors.tm }}>/8</Text>
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 7 }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const filled = i < glasses;
          return (
            <Pressable
              key={i}
              onPress={() => onTap(i)}
              hitSlop={4}
              style={{
                width: 34,
                height: 34,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                opacity: filled ? 1 : 0.25,
              }}
            >
              <Text style={{ fontSize: 22 }}>💧</Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          height: 8,
          backgroundColor: theme.colors.bo,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${(glasses / 8) * 100}%`,
            height: '100%',
            backgroundColor: '#0984E3',
          }}
        />
      </View>

      <Text style={{ fontSize: 11, color: theme.colors.tm, marginTop: 5 }}>{tip}</Text>
    </View>
  );
}
