import React from 'react';
import {
  Pressable,
  Text,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'lg' | 'md';

interface Props {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Optional leading icon (already-sized component) — replaces the old emoji prefix pattern. */
  icon?: React.ReactNode;
}

const HEIGHT: Record<ButtonSize, number> = {
  lg: 54,
  md: 46,
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled,
  loading,
  style,
  icon,
}: Props) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  // For lime primary in dark mode the contrast text is dark, not white
  const primaryFg = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  const bg = isPrimary
    ? theme.colors.pu
    : isSecondary
    ? theme.colors.card2
    : 'transparent';
  const fg = isPrimary
    ? primaryFg
    : isSecondary
    ? theme.colors.th
    : theme.colors.tb;
  const border = isPrimary
    ? 'transparent'
    : isSecondary
    ? theme.colors.bo
    : theme.colors.bo2;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          width: '100%',
          height: HEIGHT[size],
          paddingHorizontal: 18,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: isPrimary ? 0 : 1.5,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed || disabled ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text
            style={{
              color: fg,
              fontSize: size === 'lg' ? 16 : 14,
              fontWeight: '700',
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
