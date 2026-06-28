// Card surface — Garden redesign uses softer, larger radii so cards
// read as warm paper-like panels rather than tight rectangles. The
// `hero` prop bumps the radius up another notch for feature cards
// (progress ring, hydration, journal-entry card).

import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme, radius } from '../theme';

interface Props extends ViewProps {
  style?: StyleProp<ViewStyle>;
  padding?: number;
  /** Use the larger hero radius (26 vs the default 22). */
  hero?: boolean;
}

export default function Card({ children, style, padding = 16, hero = false, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: hero ? radius.hero : radius.card,
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
