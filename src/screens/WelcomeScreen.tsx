import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import { useTheme } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export default function WelcomeScreen({ navigation }: RootStackScreenProps<'Welcome'>) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.pu }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.hero}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.emoji}>🫀</Text>
          <View style={styles.labelRow}>
            <Text style={styles.label}>RECOVA</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proText}>👑 PRO</Text>
            </View>
          </View>
          <Text style={styles.heading}>AI Recovery{'\n'}Coach</Text>
          <Text style={styles.subhead}>
            🏥 Clinical rehab plans · 📅 Weekly schedule{'\n'}
            💧 Hydration · 🔔 Smart reminders
          </Text>
        </ScrollView>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.colors.card }}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.card, borderTopColor: theme.colors.bo },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: theme.colors.bo }]} />
          <Button
            title="🚀 Get Started"
            onPress={() => navigation.navigate('Onboarding1')}
          />
          <View style={{ height: 12 }} />
          <Button
            title="🔑 I already have an account"
            variant="ghost"
            onPress={() => navigation.navigate('Onboarding1')}
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
  emoji: { fontSize: 64, marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  proBadge: {
    backgroundColor: '#FDCB6E',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  proText: { fontSize: 10, fontWeight: '800', color: '#7A4000' },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
  },
  subhead: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 22,
  },
});
