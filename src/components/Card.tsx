// Cleaner card: subtle 1px border, no shadows. Matches the Kalo aesthetic
// where surfaces are differentiated by background tone alone.

import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface Props extends ViewProps {
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export default function Card({ children, style, padding = 16, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.colors.bo,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
