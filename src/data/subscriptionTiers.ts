// Subscription tier metadata — ported from prototype's `PD` object.
// Used by SubscriptionScreen and the badge on Home.
//
// Pricing math (v1.2.2):
//   Weekly  $7.99/wk  ≈ $32.0/mo effective
//   Monthly $19.99/mo (37% off weekly)
//   Annual  $49.99/yr ≈ $4.17/mo effective (87% off weekly, 79% off monthly)
//
// Trial lengths scale with commitment to nudge users toward annual:
// 3d weekly, 7d monthly, 14d annual.

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
    price: '$7.99',
    per: '/week',
    cta: '🚀 Start 3-Day Trial',
    note: '3 days free, then $7.99/week. Cancel anytime.',
    badgeLabel: '3-day trial',
    badgeBg: '#E3F2FD',
    badgeFg: '#0044AA',
    features: [
      'Full AI clinical plan',
      'Weekly schedule',
      'Daily tracker',
      'Pain journal',
      'AI Recovery Chat',
      'Hydration tracker',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: '$19.99',
    per: '/month',
    cta: '🚀 Start 7-Day Trial',
    note: '7 days free, then $19.99/month. Cancel anytime.',
    badgeLabel: 'Most Popular',
    badgeBg: '#EEE9FF',
    badgeFg: '#5248C8',
    features: [
      'Everything in Weekly',
      'Progress analytics',
      'Priority support',
      '37% cheaper than weekly',
    ],
    popular: true,
  },
  annual: {
    id: 'annual',
    name: 'Annual',
    price: '$49.99',
    per: '/year',
    cta: '🏆 Start 14-Day Trial',
    note: '14 days free, then $49.99/year — $4.17/month effective. Cancel anytime.',
    badgeLabel: 'Save 79%',
    badgeBg: '#FFF0D4',
    badgeFg: '#8A4A00',
    features: [
      'Everything in Monthly',
      '14-day free trial',
      '$4.17/month effective',
      'Best value over a recovery cycle',
    ],
    bestValue: true,
  },
};

export const TIER_ORDER: PaidTierId[] = ['weekly', 'monthly', 'annual'];
