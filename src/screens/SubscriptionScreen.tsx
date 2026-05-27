import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/Button';
import { TIERS, TIER_ORDER, type PaidTierId } from '../data/subscriptionTiers';
import type { RootStackScreenProps } from '../navigation/types';

export default function SubscriptionScreen({
  navigation,
}: RootStackScreenProps<'Subscription'>) {
  const theme = useTheme();
  const setSubscription = useAppStore((s) => s.setSubscription);
  const [selected, setSelected] = useState<PaidTierId>('monthly');

  const tier = TIERS[selected];

  const confirm = () => {
    setSubscription(selected);
    navigation.replace('Main');
  };

  const skipTrial = () => {
    setSubscription('trial');
    navigation.replace('Main');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style="light" />

      {/* Purple header */}
      <SafeAreaView style={{ backgroundColor: theme.colors.pu }} edges={['top']}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Pressable
              onPress={skipTrial}
              style={({ pressed }) => ({
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderColor: 'rgba(255,255,255,0.35)',
                borderWidth: 1.5,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 7,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Skip</Text>
            </Pressable>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>👑</Text>
            <Text style={{ fontSize: 23, fontWeight: '800', color: '#fff', marginBottom: 7 }}>
              Unlock RECOVA
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)' }}>
              Your clinical plan is ready.
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {TIER_ORDER.map((id) => {
          const t = TIERS[id];
          const isSelected = selected === id;
          const accentColor = id === 'annual' ? '#C09000' : theme.colors.pu;
          const cardBg = isSelected
            ? id === 'annual'
              ? theme.colors.yl
              : theme.colors.pl
            : theme.colors.card;
          const borderColor = isSelected ? accentColor : theme.colors.bo2;

          return (
            <Pressable
              key={id}
              onPress={() => setSelected(id)}
              style={({ pressed }) => ({
                borderRadius: 16,
                borderWidth: 2,
                borderColor,
                backgroundColor: cardBg,
                paddingHorizontal: 17,
                paddingVertical: 15,
                marginBottom: 10,
                overflow: 'hidden',
                opacity: pressed ? 0.92 : 1,
              })}
            >
              {/* Best value ribbon */}
              {t.bestValue && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#C09000',
                    paddingHorizontal: 12,
                    paddingVertical: 3,
                    borderBottomLeftRadius: 10,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
                    BEST VALUE
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                {/* Radio */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isSelected ? accentColor : theme.colors.bo2,
                    backgroundColor: isSelected ? accentColor : theme.colors.card2,
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
                        backgroundColor: '#fff',
                      }}
                    />
                  )}
                </View>

                {/* Label + sub-label */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.th }}>
                      {id === 'weekly' ? '🗓 ' : id === 'monthly' ? '⭐ ' : '🏆 '}
                      {t.name}
                    </Text>
                    <View
                      style={{
                        backgroundColor: t.badgeBg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: t.badgeFg }}>
                        {t.badgeLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.colors.tm, marginTop: 2 }}>
                    {id === 'weekly'
                      ? 'Try it out · Full access'
                      : id === 'monthly'
                      ? '+ AI Physio Chat 24/7'
                      : `${t.price.replace('$', '$')}/year ≈ $4.17/mo`}
                  </Text>
                </View>

                {/* Price */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      fontSize: 19,
                      fontWeight: '800',
                      color: isSelected ? accentColor : theme.colors.th,
                    }}
                  >
                    {t.price}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.colors.tm }}>{t.per}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Features card */}
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: theme.colors.bo,
            paddingHorizontal: 16,
            paddingVertical: 13,
            marginBottom: 15,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: theme.colors.tm,
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            INCLUDED IN {tier.name.toUpperCase()}
          </Text>
          {tier.features.map((f, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 9,
                paddingVertical: 7,
                borderBottomWidth: i === tier.features.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.bo,
              }}
            >
              <Text style={{ fontSize: 14 }}>✅</Text>
              <Text style={{ fontSize: 14, color: theme.colors.th, fontWeight: '600' }}>
                {f}
              </Text>
            </View>
          ))}
        </View>

        <Button
          title={tier.cta}
          onPress={confirm}
          style={{
            backgroundColor: selected === 'annual' ? '#C09000' : theme.colors.pu,
            shadowColor: selected === 'annual' ? '#C09000' : theme.colors.pu,
          }}
        />
        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: theme.colors.tm,
            marginTop: 9,
          }}
        >
          {tier.note}
        </Text>
      </ScrollView>
    </View>
  );
}
