import React from 'react';
import PlaceholderScreen from './_PlaceholderScreen';
import type { RootStackScreenProps } from '../navigation/types';

export default function ExerciseScreen(_p: RootStackScreenProps<'Exercise'>) {
  return (
    <PlaceholderScreen
      emoji="💪"
      title="Exercise Detail"
      hint="Steps · Clinical rationale · Red flags · Mark complete"
    />
  );
}
