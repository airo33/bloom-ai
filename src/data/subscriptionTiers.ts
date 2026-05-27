// Subscription tier metadata — ported from prototype's `PD` object.
// Used by SubscriptionScreen and the badge on Home.

import type { SubscriptionTier } from '../types/plan';

export type PaidTierId = Exclude<SubscriptionTier, null | 'trial'>;

export interface TierData {
  id: PaidTierId;
  name: string;
  price: string;
  per: string;
  cta: string;
  note: string;
  badgeLabel: string;
  badgeBg: string;
  badgeFg: string;
  features: string[];
  popular?: boolean;
  bestValue?: boolean;
}

export const TIERS: Record<PaidTierId, TierData> = {
  weekly: {
    id: 'weekly',
    name: 'Weekly',
    price: '$4.99',
    per: '/week',
    cta: '🚀 Start 3-Day Trial',
    note: '3 days free, then $4.99/week. Cancel anytime.',
    badgeLabel: '3-day trial',
    badgeBg: '#E3F2FD',
    badgeFg: '#0044AA',
    features: [
      'Full AI clinical plan',
      'Weekly schedule',
      'Daily tracker',
      'Pain journal',
      'AI Physio Chat',
      'Hydration tracker',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: '$14.99',
    per: '/month',
    cta: '🚀 Start 7-Day Trial',
    note: '7 days free, then $14.99/month. Cancel anytime.',
    badgeLabel: 'Most Popular',
    badgeBg: '#EEE9FF',
    badgeFg: '#5248C8',
    features: [
      'Everything in Weekly',
      'Progress analytics',
      'Priority support',
      '72% cheaper per month than weekly',
    ],
    popular: true,
  },
  annual: {
    id: 'annual',
    name: 'Annual',
    price: '$49.99',
    per: '/year',
    cta: '🏆 Get Annual Plan',
    note: '$49.99/year = $4.17/month effective. Cancel anytime.',
    badgeLabel: 'Save 72%',
    badgeBg: '#FFF0D4',
    badgeFg: '#8A4A00',
    features: [
      'Everything in Monthly',
      '$4.17/month effective',
      'Priority support',
      'Best value over a recovery cycle',
    ],
    bestValue: true,
  },
};

export const TIER_ORDER: PaidTierId[] = ['weekly', 'monthly', 'annual'];
