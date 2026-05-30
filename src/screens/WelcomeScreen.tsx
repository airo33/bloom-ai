import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, KeyRound } from 'lucide-react-native';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { useTheme } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export default function WelcomeScreen({ navigation }: RootStackScreenProps<'Welcome'>) {
  const theme = useTheme();
  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.hero}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand mark */}
          <View style={{ marginBottom: 24 }}>
            <Logo size={84} variant="filled" />
          </View>

          <Text
            style={[
              styles.brand,
              { color: theme.colors.tm },
            ]}
          >
            RECOVA
          </Text>

          <Text style={[styles.heading, { color: theme.colors.th }]}>
            AI Recovery{'\n'}Coach
          </Text>

          <Text style={[styles.subhead, { color: theme.colors.tm }]}>
            Clinical rehab plans, personalized daily schedules, and{'\n'}smart
            reminders to keep your recovery on track.
          </Text>
        </ScrollView>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.colors.bg }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12, gap: 10 }}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Onboarding1')}
            icon={<ArrowRight size={18} color={onPrimary} strokeWidth={2.5} />}
          />
          <Button
            title="I already have an account"
            variant="ghost"
            onPress={() => navigation.navigate('Onboarding1')}
            icon={<KeyRound size={16} color={theme.colors.tb} strokeWidth={2} />}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  brand: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 16,
  },
  heading: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subhead: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
});
