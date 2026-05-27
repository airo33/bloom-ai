// Reusable placeholder for screens not yet implemented.
// Lets the navigator compile while we wire one screen at a time.

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

interface Props {
  emoji: string;
  title: string;
  hint?: string;
}

export default function PlaceholderScreen({ emoji, title, hint }: Props) {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.th, marginBottom: 6 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: theme.colors.tm, textAlign: 'center' }}>
          {hint ?? 'Coming next in the build.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
