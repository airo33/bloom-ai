// In-app purchases via RevenueCat.
//
// Mode selection:
//   - If EXPO_PUBLIC_REVENUECAT_ANDROID_KEY / _IOS_KEY is set, we use the
//     real react-native-purchases SDK against the Google Play / App Store
//     billing infrastructure.
//   - If not set, we run in MOCK mode that mirrors the previous behaviour
//     (tap "subscribe" -> tier is set locally) so the dev flow keeps
//     working until the user wires Play Console + RevenueCat.
//
// The public surface is the same in both modes so callers (Subscription
// screen, app startup) never branch on which mode is active.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { PaidTierId, TierData } from '../data/subscriptionTiers';
import { TIERS } from '../data/subscriptionTiers';

// Lazily required so a missing native module (e.g. running the JS bundle
// on a build that doesn't have the RC native side baked in) doesn't crash
// the bundle parse. We catch and downgrade to mock.
type PurchasesModule = typeof import('react-native-purchases').default;
type Offering = import('react-native-purchases').PurchasesOffering;
type Package = import('react-native-purchases').PurchasesPackage;
type CustomerInfo = import('react-native-purchases').CustomerInfo;

function readKey(key: string): string | undefined {
  const fromEnv = process.env[`EXPO_PUBLIC_${key}`];
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return extra?.[key];
}

const ENTITLEMENT_ID = 'pro';
const ANDROID_KEY = readKey('REVENUECAT_ANDROID_KEY');
const IOS_KEY = readKey('REVENUECAT_IOS_KEY');

let purchasesMod: PurchasesModule | null = null;
let mode: 'real' | 'mock' = 'mock';
let initialized = false;

function loadPurchases(): PurchasesModule | null {
  if (purchasesMod) return purchasesMod;
  try {
    // require so a missing native module doesn't break the JS bundle at parse
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    purchasesMod = require('react-native-purchases').default as PurchasesModule;
    return purchasesMod;
  } catch {
    return null;
  }
}

/** Pick the right RC API key for the current platform. */
function platformKey(): string | null {
  if (Platform.OS === 'android') return ANDROID_KEY ?? null;
  if (Platform.OS === 'ios') return IOS_KEY ?? null;
  return null;
}

/** One-shot init at app startup. Idempotent. */
export async function setupIap(opts: { userId?: string | null }): Promise<void> {
  if (initialized) return;
  initialized = true;

  const key = platformKey();
  const purchases = loadPurchases();

  if (!key || !purchases) {
    mode = 'mock';
    // eslint-disable-next-line no-console
    console.log(
      `[iap] running in MOCK mode (${!key ? 'no RC API key' : 'native module missing'})`,
    );
    return;
  }

  try {
    await purchases.configure({
      apiKey: key,
      appUserID: opts.userId ?? null,
    });
    mode = 'real';
    // eslint-disable-next-line no-console
    console.log('[iap] RevenueCat configured');
  } catch (err) {
    mode = 'mock';
    // eslint-disable-next-line no-console
    console.warn('[iap] RevenueCat init failed, falling back to mock:', err);
  }
}

/** When the user logs in or out, RC needs to know so it scopes the
 *  customer info correctly. No-op in mock mode. */
export async function setIapUser(userId: string | null): Promise<void> {
  if (mode !== 'real') return;
  const purchases = loadPurchases();
  if (!purchases) return;
  try {
    if (userId) await purchases.logIn(userId);
    else await purchases.logOut();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[iap] setIapUser failed:', err);
  }
}

export interface OfferingPackage {
  /** Our internal tier id — used everywhere else in the app. */
  tierId: PaidTierId;
  /** RC package object (real mode) or null (mock). */
  rcPackage: Package | null;
  /** Localized price string ("$4.99" / "₽299") chosen by the platform store. */
  priceString: string;
  /** TierData for UI rendering. */
  tier: TierData;
}

/**
 * Get the offerings to render on the subscription screen.
 * In mock mode we hand back the hardcoded TIERS with their built-in
 * USD price strings.
 */
export async function getOfferings(): Promise<OfferingPackage[]> {
  if (mode !== 'real') {
    return mockOfferings();
  }

  const purchases = loadPurchases();
  if (!purchases) return mockOfferings();

  try {
    const offerings = await purchases.getOfferings();
    const current: Offering | null = offerings.current;
    if (!current) return mockOfferings();

    // Map RC packages back to our 3 known tiers by identifier convention:
    //   "$rc_weekly" / "$rc_monthly" / "$rc_annual" (RC defaults) OR
    //   product IDs we configured in RC dashboard: recova_weekly etc.
    const mapped: OfferingPackage[] = [];
    for (const tierId of ['weekly', 'monthly', 'annual'] as PaidTierId[]) {
      const tier = TIERS[tierId];
      const pkg = current.availablePackages.find((p) =>
        p.identifier.toLowerCase().includes(tierId) ||
        p.product.identifier.toLowerCase().includes(tierId),
      );
      mapped.push({
        tierId,
        rcPackage: pkg ?? null,
        priceString: pkg?.product.priceString ?? tier.price,
        tier,
      });
    }
    return mapped;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[iap] getOfferings failed, using mock:', err);
    return mockOfferings();
  }
}

function mockOfferings(): OfferingPackage[] {
  return (['weekly', 'monthly', 'annual'] as PaidTierId[]).map((id) => ({
    tierId: id,
    rcPackage: null,
    priceString: TIERS[id].price,
    tier: TIERS[id],
  }));
}

export interface PurchaseResult {
  success: boolean;
  /** True iff the user has the "pro" entitlement active after the call. */
  entitlementActive: boolean;
  /** Set when the user cancelled the purchase dialog mid-flow. */
  userCancelled?: boolean;
  /** Raw error for diagnostic surfaces. */
  error?: string;
}

/**
 * Initiate purchase of a package. In mock mode this just returns success
 * — the caller writes the tier into the local store as before.
 */
export async function purchasePackage(item: OfferingPackage): Promise<PurchaseResult> {
  if (mode !== 'real' || !item.rcPackage) {
    // Mock: pretend it succeeded.
    return { success: true, entitlementActive: true };
  }

  const purchases = loadPurchases();
  if (!purchases) {
    return { success: true, entitlementActive: true };
  }

  try {
    const { customerInfo } = await purchases.purchasePackage(item.rcPackage);
    return {
      success: true,
      entitlementActive: hasProEntitlement(customerInfo),
    };
  } catch (err) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e?.userCancelled) {
      return { success: false, entitlementActive: false, userCancelled: true };
    }
    return {
      success: false,
      entitlementActive: false,
      error: e?.message ?? String(err),
    };
  }
}

/** Check the current entitlement state without a purchase attempt. */
export async function getEntitlementStatus(): Promise<{ active: boolean; tier: PaidTierId | null }> {
  if (mode !== 'real') return { active: false, tier: null };
  const purchases = loadPurchases();
  if (!purchases) return { active: false, tier: null };
  try {
    const customerInfo = await purchases.getCustomerInfo();
    const ent = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!ent) return { active: false, tier: null };
    return { active: true, tier: tierFromProductId(ent.productIdentifier) };
  } catch {
    return { active: false, tier: null };
  }
}

/** "Restore purchases" button handler — re-syncs with the store. */
export async function restorePurchases(): Promise<PurchaseResult> {
  if (mode !== 'real') {
    return { success: true, entitlementActive: false };
  }
  const purchases = loadPurchases();
  if (!purchases) return { success: true, entitlementActive: false };
  try {
    const customerInfo = await purchases.restorePurchases();
    return { success: true, entitlementActive: hasProEntitlement(customerInfo) };
  } catch (err) {
    return {
      success: false,
      entitlementActive: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function hasProEntitlement(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

function tierFromProductId(productId: string): PaidTierId {
  const id = productId.toLowerCase();
  if (id.includes('weekly')) return 'weekly';
  if (id.includes('annual')) return 'annual';
  return 'monthly';
}

export function isIapMockMode(): boolean {
  return mode === 'mock';
}
