import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../lib/auth';

import AuthScreen from '../screens/AuthScreen';
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
  const auth = useAuth();

  // Wait for both Zustand hydration AND the initial auth lookup so we
  // never flash the wrong stack.
  if (!hydrated || auth.loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.colors.pu} />
      </View>
    );
  }

  const isAuthenticated = !!auth.user;

  // Compute the start screen of the authenticated flow:
  //   no plan       -> Welcome (run onboarding)
  //   plan, no tier -> Plan    (show the plan, then prompt to subscribe)
  //   else          -> Main
  const authedInitial: keyof RootStackParamList = !plan
    ? 'Welcome'
    : !tier
      ? 'Plan'
      : 'Main';

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
        initialRouteName={isAuthenticated ? authedInitial : 'Auth'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        {isAuthenticated ? (
          // Authenticated stack — all screens registered, initialRouteName
          // picks where we land.
          <Stack.Group key="authed">
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
            <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
            <Stack.Screen
              name="Loading"
              component={LoadingScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="Plan" component={PlanScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="Exercise" component={ExerciseScreen} />
            <Stack.Screen
              name="Journal"
              component={JournalScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group key="auth">
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
