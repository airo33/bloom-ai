// Uppercase muted section label — used above lists/cards. Single source of
// truth so spacing, casing and color are consistent across screens.

import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export default function SectionLabel({ children, style }: Props) {
  const theme = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: 11,
          fontWeight: '700',
          color: theme.colors.tm,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 10,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
