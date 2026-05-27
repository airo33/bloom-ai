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
          borderRadius: theme.radius.xxl,
          borderWidth: 1.5,
          borderColor: theme.colors.bo,
          padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.scheme === 'dark' ? 0.35 : 0.06,
          shadowRadius: 12,
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
