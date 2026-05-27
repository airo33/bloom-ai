import React from 'react';
import PlaceholderScreen from './_PlaceholderScreen';
import type { RootStackScreenProps } from '../navigation/types';

export default function SubscriptionScreen(_p: RootStackScreenProps<'Subscription'>) {
  return (
    <PlaceholderScreen
      emoji="👑"
      title="Subscription"
      hint="Apple StoreKit IAP — three tiers (Weekly/Monthly/Annual)."
    />
  );
}
