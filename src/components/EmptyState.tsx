// Reusable empty-state card for screens with no content yet. Lucide
// icon in a tinted tile + heading + body + optional CTA.

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({ Icon, title, message, ctaLabel, onCta }: Props) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.bo,
        paddingHorizontal: 22,
        paddingVertical: 28,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: theme.colors.pl,
          borderWidth: 1,
          borderColor: theme.colors.pb,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Icon size={26} color={theme.colors.pt} strokeWidth={2} />
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '800',
          color: theme.colors.th,
          letterSpacing: -0.3,
          marginBottom: 6,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.tm,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: ctaLabel ? 16 : 0,
        }}
      >
        {message}
      </Text>
      {ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => ({
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: theme.colors.pu,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '800',
              color: theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF',
            }}
          >
            {ctaLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
