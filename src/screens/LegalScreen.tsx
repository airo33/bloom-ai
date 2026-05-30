import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme';
import SimpleMarkdown from '../components/SimpleMarkdown';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../data/legalText';
import type { RootStackScreenProps } from '../navigation/types';

const TITLES = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
} as const;

export default function LegalScreen({ route, navigation }: RootStackScreenProps<'Legal'>) {
  const theme = useTheme();
  const { kind } = route.params;
  const source = kind === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.bo,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 38,
            height: 38,
            borderRadius: 13,
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.bo,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ChevronLeft size={20} color={theme.colors.tb} strokeWidth={2.2} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: '800',
            color: theme.colors.th,
            letterSpacing: -0.3,
          }}
        >
          {TITLES[kind]}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={true}
      >
        <SimpleMarkdown source={source} />
      </ScrollView>
    </SafeAreaView>
  );
}
