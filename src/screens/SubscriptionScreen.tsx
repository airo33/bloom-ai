import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Crown, Check, Calendar, Star, Trophy, RefreshCcw } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/Button';
import SectionLabel from '../components/SectionLabel';
import { TIER_ORDER, type PaidTierId } from '../data/subscriptionTiers';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isIapMockMode,
  type OfferingPackage,
} from '../lib/iap';
import type { RootStackScreenProps } from '../navigation/types';

const TIER_ICON: Record<PaidTierId, React.FC<{ size: number; color: string; strokeWidth?: number }>> = {
  weekly: Calendar,
  monthly: Star,
  annual: Trophy,
};

export default function SubscriptionScreen({
  navigation,
}: RootStackScreenProps<'Subscription'>) {
  const theme = useTheme();
  const setSubscription = useAppStore((s) => s.setSubscription);
  const [selected, setSelected] = useState<PaidTierId>('monthly');
  const [offerings, setOfferings] = useState<OfferingPackage[] | null>(null);
  const [busy, setBusy] = useState(false);

  const headerFg = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';
  const headerFgMuted = theme.scheme === 'dark' ? 'rgba(10,10,10,0.65)' : 'rgba(255,255,255,0.72)';

  useEffect(() => {
    let cancelled = false;
    getOfferings()
      .then((items) => {
        if (!cancelled) setOfferings(items);
      })
      .catch(() => {
        if (!cancelled) setOfferings([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedItem = offerings?.find((o) => o.tierId === selected) ?? null;

  const confirm = useCallback(async () => {
    if (!selectedItem || busy) return;
    setBusy(true);
    try {
      const result = await purchasePackage(selectedItem);
      if (result.userCancelled) {
        // Don't show an alert — the user actively cancelled
        return;
      }
      if (!result.success) {
        Alert.alert('Purchase failed', result.error ?? 'Please try again.');
        return;
      }
      setSubscription(selected);
      navigation.replace('Main');
    } finally {
      setBusy(false);
    }
  }, [selectedItem, busy, setSubscription, selected, navigation]);

  const restore = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await restorePurchases();
      if (!result.success) {
        Alert.alert('Restore failed', result.error ?? 'Please try again.');
        return;
      }
      if (result.entitlementActive) {
        // Without a customerInfo to inspect we default to monthly; the
        // entitlement detail can be wired up later if needed.
        setSubscription('monthly');
        navigation.replace('Main');
      } else {
        Alert.alert('No purchases', "We didn't find an active subscription on this account.");
      }
    } finally {
      setBusy(false);
    }
  }, [busy, setSubscription, navigation]);

  const skipTrial = () => {
    setSubscription('trial');
    navigation.replace('Main');
  };

  if (!offerings) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.pu} />
          <Text style={{ marginTop: 12, fontSize: 13, color: theme.colors.tm }}>
            Loading subscription options…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.scheme === 'dark' ? 'dark' : 'light'} />

      {/* Lime accent header */}
      <SafeAreaView style={{ backgroundColor: theme.colors.pu }} edges={['top']}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 18 }}>
            <Pressable
              onPress={skipTrial}
              disabled={busy}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: theme.scheme === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                borderColor: theme.scheme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.35)',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: headerFg, fontSize: 13, fontWeight: '700' }}>Skip</Text>
            </Pressable>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: theme.scheme === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Crown size={28} color={headerFg} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: headerFg, letterSpacing: -0.5 }}>
              Unlock RECOVA
            </Text>
            <Text style={{ fontSize: 14, color: headerFgMuted, marginTop: 6 }}>
              Your clinical plan is ready.
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {TIER_ORDER.map((id) => {
          const item = offerings.find((o) => o.tierId === id);
          if (!item) return null;
          const t = item.tier;
          const Icon = TIER_ICON[id];
          const isSelected = selected === id;
          const cardBg = isSelected ? theme.colors.pl : theme.colors.card;
          const borderColor = isSelected ? theme.colors.pu : theme.colors.bo;

          return (
            <Pressable
              key={id}
              onPress={() => setSelected(id)}
              disabled={busy}
              style={({ pressed }) => ({
                borderRadius: 18,
                borderWidth: isSelected ? 2 : 1,
                borderColor,
                backgroundColor: cardBg,
                paddingHorizontal: 16,
                paddingVertical: 16,
                marginBottom: 10,
                overflow: 'hidden',
                opacity: pressed ? 0.92 : 1,
              })}
            >
              {t.bestValue && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: theme.colors.or,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderBottomLeftRadius: 10,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.4 }}>
                    BEST VALUE
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isSelected ? theme.colors.pu : theme.colors.bo2,
                    backgroundColor: isSelected ? theme.colors.pu : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF',
                      }}
                    />
                  )}
                </View>

                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: theme.colors.card2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={theme.colors.tb} strokeWidth={2} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.th, letterSpacing: -0.2 }}>
                      {t.name}
                    </Text>
                    <View
                      style={{
                        backgroundColor: theme.colors.card2,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.tb, letterSpacing: 0.2 }}>
                        {t.badgeLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 3 }}>
                    {id === 'weekly'
                      ? 'Try it out · full access'
                      : id === 'monthly'
                      ? '+ AI Physio Chat 24/7'
                      : `${item.priceString}/year`}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      fontSize: 19,
                      fontWeight: '800',
                      color: theme.colors.th,
                      letterSpacing: -0.5,
                    }}
                  >
                    {item.priceString}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.colors.tm }}>{t.per}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Features card */}
        {selectedItem && (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.colors.bo,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginTop: 4,
              marginBottom: 18,
            }}
          >
            <SectionLabel>Included in {selectedItem.tier.name}</SectionLabel>
            {selectedItem.tier.features.map((f, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 8,
                  borderBottomWidth: i === selectedItem.tier.features.length - 1 ? 0 : 1,
                  borderBottomColor: theme.colors.bo,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: theme.colors.pl,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={13} color={theme.colors.pt} strokeWidth={3} />
                </View>
                <Text style={{ fontSize: 14, color: theme.colors.th, fontWeight: '600', flex: 1 }}>
                  {f}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Button
          title={selectedItem ? selectedItem.tier.cta.replace(/^[^A-Za-z]+/, '') : 'Loading'}
          onPress={confirm}
          loading={busy}
        />

        {!isIapMockMode() && (
          <Pressable
            onPress={restore}
            disabled={busy}
            style={({ pressed }) => ({
              marginTop: 12,
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              opacity: pressed || busy ? 0.6 : 1,
            })}
          >
            <RefreshCcw size={14} color={theme.colors.tm} strokeWidth={2} />
            <Text style={{ fontSize: 13, color: theme.colors.tm, fontWeight: '600' }}>
              Restore purchases
            </Text>
          </Pressable>
        )}

        {selectedItem && (
          <Text
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: theme.colors.tm,
              marginTop: 12,
              lineHeight: 18,
            }}
          >
            {selectedItem.tier.note}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
