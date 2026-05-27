import React from 'react';
import PlaceholderScreen from './_PlaceholderScreen';
import type { RootStackScreenProps } from '../navigation/types';

export default function PlanScreen(_props: RootStackScreenProps<'Plan'>) {
  return (
    <PlaceholderScreen
      emoji="🏥"
      title="Plan"
      hint="Generated rehab protocol — wired to Supabase Edge Function next."
    />
  );
}
