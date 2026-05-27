import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const MESSAGES = [
  'Identifying injury type and stage...',
  'Selecting evidence-based protocol...',
  'Building varied weekly schedule...',
  'Writing dosage and progression criteria...',
  'Compiling red flags and safety guidelines...',
];

function Dot({ delay, color }: { delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(800 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  return (
    <Animated.View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        marginHorizontal: 4,
        transform: [{ translateY }],
      }}
    />
  );
}

export default function LoadingScreen({ navigation }: RootStackScreenProps<'Loading'>) {
  const theme = useTheme();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, []);

  // Placeholder: navigate to Plan after a short delay.
  // Wire to real generatePlan() once Supabase Edge Function is set up.
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Plan'), 5000);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ fontSize: 64, marginBottom: 20 }}>🫀</Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: theme.colors.th,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Analyzing your case
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.tm,
            marginBottom: 30,
            textAlign: 'center',
          }}
        >
          {MESSAGES[idx]}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <Dot delay={0} color={theme.colors.pu} />
          <Dot delay={200} color={theme.colors.pu} />
          <Dot delay={400} color={theme.colors.pu} />
        </View>
        <Text style={{ fontSize: 12, color: theme.colors.tl, marginTop: 22 }}>
          Building personalized clinical protocol
        </Text>
      </View>
    </SafeAreaView>
  );
}
