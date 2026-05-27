import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  /** Array of 0/1 values representing each step's filled state. */
  steps: boolean[];
}

export default function ProgressBar({ steps }: Props) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
      {steps.map((filled, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: filled ? theme.colors.pu : theme.colors.bo,
          }}
        />
      ))}
    </View>
  );
}
