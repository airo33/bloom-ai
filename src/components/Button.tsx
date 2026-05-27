import React from 'react';
import { Pressable, Text, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: Props) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const bg = isPrimary ? theme.colors.pu : isSecondary ? theme.colors.pl : 'transparent';
  const fg = isPrimary ? '#fff' : isSecondary ? theme.colors.pt : theme.colors.tb;
  const border = isPrimary ? 'transparent' : isSecondary ? theme.colors.pb : theme.colors.bo2;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          width: '100%',
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 2,
          borderRadius: theme.radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed || disabled ? 0.85 : 1,
          ...(isPrimary
            ? {
                shadowColor: theme.colors.pu,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 6,
              }
            : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      )}
    </Pressable>
  );
}
