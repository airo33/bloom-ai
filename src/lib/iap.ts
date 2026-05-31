// In-app purchases — MOCK-ONLY implementation.
//
// We removed the react-native-purchases native module after it caused
// "Error loading app" crashes on Android devices without Google Mobile
// Services. The subscription UI keeps working exactly as before: tapping
// a tier records it locally as if a purchase happened. When the project
// is ready for real Google Play billing, reinstall react-native-purchases
// and restore the real-mode path from git history (commit 31f1a34).

import type { PaidTierId, TierData } from '../data/subscriptionTiers';
import { TIERS } from '../data/subscriptionTiers';

export interface OfferingPackage {
  /** Our internal tier id — used everywhere else in the app. */
  tierId: PaidTierId;
  /** RC package object — always null in mock mode. */
  rcPackage: null;
  /** Localized price string. Hardcoded USD in mock mode. */
  priceString: string;
  /** TierData for UI rendering. */
  tier: TierData;
}

export interface PurchaseResult {
  success: boolean;
  entitlementActive: boolean;
  userCancelled?: boolean;
  error?: string;
}

/** One-shot init at app startup. No-op in mock mode. */
export async function setupIap(_opts: { userId?: string | null }): Promise<void> {
  // Nothing to set up. Kept so callers (App.tsx) don't need to change.
}

/** When the user logs in / out. No-op in mock mode. */
export async function setIapUser(_userId: string | null): Promise<void> {
  // No-op.
}

/** Get the offerings to render on the subscription screen. */
export async function getOfferings(): Promise<OfferingPackage[]> {
  return (['weekly', 'monthly', 'annual'] as PaidTierId[]).map((id) => ({
    tierId: id,
    rcPackage: null,
    priceString: TIERS[id].price,
    tier: TIERS[id],
  }));
}

/**
 * Initiate purchase. In mock mode we pretend it succeeded — the caller
 * records the tier in local state.
 */
export async function purchasePackage(_item: OfferingPackage): Promise<PurchaseResult> {
  return { success: true, entitlementActive: true };
}

/** Restore purchases. No-op in mock mode. */
export async function restorePurchases(): Promise<PurchaseResult> {
  return { success: true, entitlementActive: false };
}

/** Entitlement status check. Always returns "no active entitlement" in mock. */
export async function getEntitlementStatus(): Promise<{ active: boolean; tier: PaidTierId | null }> {
  return { active: false, tier: null };
}

/** Subscription screen hides the "Restore purchases" link when this is true. */
export function isIapMockMode(): boolean {
  return true;
}
