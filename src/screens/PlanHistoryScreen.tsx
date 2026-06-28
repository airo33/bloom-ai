// Read-only browser for plans the user used to be on. Useful for showing
// "you went from a 6-week shoulder plan to a 4-week tendinopathy plan
// when you said you'd switched to lateral raises." Also a soft trust
// signal: nothing the AI does is destructive.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, History } from 'lucide-react-native';
import { useTheme, font } from '../theme';
import { listPlanHistory, type PlanHistoryEntry } from '../lib/api';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

const SOURCE_LABEL: Record<PlanHistoryEntry['source'], string> = {
  ai: 'AI generated',
  fallback: 'Offline template',
  adjusted: 'AI adjusted',
};

export default function PlanHistoryScreen() {
  const theme = useTheme();
  const nav = useNavigation();
  const [entries, setEntries] = useState<PlanHistoryEntry[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setEntries(null);
    try {
      const list = await listPlanHistory();
      setEntries(list);
    } catch (e: unknown) {
      setEntries([]);
      if (!silent) {
        const msg = e instanceof Error ? e.message : 'Could not load plan history.';
        Alert.alert("Couldn't load", msg);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.pu}
          />
        }
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 18,
            minHeight: 36,
          }}
        >
          <Pressable
            onPress={() => nav.goBack()}
            hitSlop={10}
            style={{ marginRight: 10 }}
          >
            <ArrowLeft size={22} color={theme.colors.th} strokeWidth={2.2} />
          </Pressable>
          <Text
            style={{
              fontSize: 26,
              fontFamily: font.serif,
              color: theme.colors.th,
              letterSpacing: -0.6,
            }}
          >
            Plan history
          </Text>
        </View>

        {entries === null ? (
          <SkeletonList rows={4} rowHeight={84} />
        ) : entries.length === 0 ? (
          <EmptyState
            Icon={History}
            title="No previous plans"
            message="When you regenerate or adjust your plan, the old version is archived here so you can see how it changed."
          />
        ) : (
          entries.map((e) => (
            <View
              key={e.id}
              style={{
                backgroundColor: theme.colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.colors.bo,
                padding: 16,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.tm,
                    fontWeight: '700',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  Archived {fmtDate(e.archived_at)}
                </Text>
                <View
                  style={{
                    backgroundColor: theme.colors.pl,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: theme.colors.pt,
                      letterSpacing: 0.4,
                    }}
                  >
                    {SOURCE_LABEL[e.source].toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: theme.colors.th,
                  letterSpacing: -0.3,
                  marginBottom: 4,
                }}
                numberOfLines={2}
              >
                {e.plan.title ?? 'Recovery plan'}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.tm,
                  marginBottom: 6,
                }}
              >
                {e.plan.phases?.length ?? 0} phases ·{' '}
                {e.plan.exercises?.length ?? 0} exercises
              </Text>
              {e.adjustment && (
                <View
                  style={{
                    backgroundColor: theme.colors.bg,
                    borderRadius: 10,
                    padding: 10,
                    marginTop: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: theme.colors.tm,
                      fontWeight: '700',
                      letterSpacing: 0.5,
                      marginBottom: 2,
                    }}
                  >
                    YOUR REQUEST
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.colors.tb,
                      lineHeight: 18,
                    }}
                    numberOfLines={3}
                  >
                    {e.adjustment}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
