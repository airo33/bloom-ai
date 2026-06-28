import React from 'react';
import {
  Pressable,
  Text,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, font } from '../theme';

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

  // On the Garden green primary the dark olive text reads great in both
  // schemes — slightly softer in light mode where the button bg is the
  // mid-green moss tone.
  const primaryFg = theme.scheme === 'dark' ? '#1D2A17' : '#FFFFFF';

  // Garden gradient stops — slightly darker leading edge gives the
  // button depth without a flat fill. Driven off the active palette so
  // light + dark each have their own native-feeling pair.
  const gradientStops: [string, string] = theme.scheme === 'dark'
    ? ['#BFE39A', '#88B86A']
    : ['#8FC15F', '#5F9437'];

  const bg = isPrimary
    ? 'transparent' // gradient fills it
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

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text
            style={{
              color: fg,
              fontSize: size === 'lg' ? 16 : 14,
              fontFamily: font.bodyBold,
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          width: '100%',
          height: HEIGHT[size],
          borderRadius: 16,
          overflow: 'hidden',
          opacity: pressed || disabled ? 0.88 : 1,
        },
        style,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={gradientStops}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 18,
            backgroundColor: bg,
            borderColor: border,
            borderWidth: 1.5,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}
