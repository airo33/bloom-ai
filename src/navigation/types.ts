// Navigation type-safety for React Navigation v7.

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Welcome: undefined;
  Onboarding1: undefined;
  Onboarding2: undefined;
  Loading: undefined;
  Plan: undefined;
  Subscription: undefined;
  Main: undefined;          // bottom tabs
  Exercise: { exerciseId: string };
  Journal: undefined;
  Chat: undefined;
  Legal: { kind: 'privacy' | 'terms' };
  Feedback: undefined;
  PlanHistory: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Schedule: undefined;
  /** Pseudo-tab that hosts the center FAB — never actually navigates */
  _FAB: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
