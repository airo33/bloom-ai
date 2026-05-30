// Fitness level options used in the onboarding picker. The icon set
// replaces the emoji-sticker look with a consistent Lucide language.

import { Sofa, Bike, Trophy } from 'lucide-react-native';
import type { FitnessLevel } from '../types/plan';

export interface FitnessOption {
  id: FitnessLevel;
  label: string;
  description: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
}

export const FITNESS_LEVELS: FitnessOption[] = [
  { id: 'Sedentary', label: 'Sedentary', description: 'Mostly desk + couch', Icon: Sofa },
  { id: 'Moderate',  label: 'Moderate',  description: 'Active a few times a week', Icon: Bike },
  { id: 'Athletic',  label: 'Athletic',  description: 'Training most days', Icon: Trophy },
];
