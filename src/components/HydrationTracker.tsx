// Hydration tracker — 8 droplet pips with tap-to-fill, progress bar, status tip.
// Refreshed to match the cleaner Kalo-style aesthetic (Lucide droplet, no emoji
// in the title, subtle spacing).

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Droplet } from 'lucide-react-native';
import { useTheme } from '../theme';

const TIPS = [
  'Start your day with a glass of water',
  'Joints need hydration — drink up',
  'Consistent hydration supports healing',
  'One more glass before lunch',
  'Great hydration today',
  '6/8 — almost there',
  '7/8 — nearly done',
  'Perfect hydration today',
];

const WATER_COLOR = '#38BDF8'; // sky-400, a clean water blue

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
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.bo,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: theme.colors.th,
              letterSpacing: -0.2,
            }}
          >
            Hydration
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>
            8 glasses · supports joint healing
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: WATER_COLOR }}>
            {glasses}
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.tm, fontWeight: '600' }}>/8</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 10 }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const filled = i < glasses;
          return (
            <Pressable
              key={i}
              onPress={() => onTap(i)}
              hitSlop={4}
              style={{
                flex: 1,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                backgroundColor: filled ? WATER_COLOR + '22' : theme.colors.card2,
              }}
            >
              <Droplet
                size={18}
                color={filled ? WATER_COLOR : theme.colors.tl}
                fill={filled ? WATER_COLOR : 'transparent'}
                strokeWidth={2}
              />
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          height: 6,
          backgroundColor: theme.colors.card2,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${(glasses / 8) * 100}%`,
            height: '100%',
            backgroundColor: WATER_COLOR,
          }}
        />
      </View>

      <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 8 }}>{tip}</Text>
    </View>
  );
}
