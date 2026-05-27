import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';

import WelcomeScreen from '../screens/WelcomeScreen';
import Onboarding1Screen from '../screens/Onboarding1Screen';
import Onboarding2Screen from '../screens/Onboarding2Screen';
import LoadingScreen from '../screens/LoadingScreen';
import PlanScreen from '../screens/PlanScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ExerciseScreen from '../screens/ExerciseScreen';
import JournalScreen from '../screens/JournalScreen';
import ChatScreen from '../screens/ChatScreen';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const theme = useTheme();
  const hydrated = useAppStore((s) => s.hydrated);
  const plan = useAppStore((s) => s.plan);
  const tier = useAppStore((s) => s.subscriptionTier);

  // Determine the initial route after hydration:
  // - No plan => Welcome
  // - Has plan but no subscription => Plan (so user sees it then goes to Sub)
  // - Otherwise => Main
  const initialRoute: keyof RootStackParamList = !plan
    ? 'Welcome'
    : !tier
      ? 'Plan'
      : 'Main';

  if (!hydrated) {
    // Avoid a flicker — render nothing until persist hydration finishes
    return null;
  }

  return (
    <NavigationContainer
      theme={{
        ...(theme.scheme === 'dark' ? DarkTheme : DefaultTheme),
        colors: {
          ...(theme.scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
          background: theme.colors.bg,
          card: theme.colors.card,
          text: theme.colors.th,
          border: theme.colors.bo,
          primary: theme.colors.pu,
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
        <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
        <Stack.Screen name="Loading" component={LoadingScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Plan" component={PlanScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Main" component={MainTabs} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="Journal" component={JournalScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ presentation: 'card' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
