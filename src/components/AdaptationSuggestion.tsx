// Adaptive-plan suggestion — a non-intrusive Home card + acceptance
// modal. The caller (HomeScreen) computes the suggestion via
// planAdaptation.detectAdaptation and passes it in; this component
// handles the UI, the "apply" flow (calls adjust-plan through the
// existing API wrapper), and reports success/dismiss back so the caller
// can update the "already suggested today" guard.

import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Sparkles, TrendingDown, TrendingUp, Wand2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import { adjustPlan, archivePlan, ApiError } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { track } from '../lib/analytics';
import type { AdaptationSuggestion as Suggestion } from '../lib/planAdaptation';

interface Props {
  suggestion: Suggestion | null;
  /** Fired when the user dismisses (or accepts) — caller stamps the
   *  "already suggested today" flag so we don't nag again. */
  onSeen: () => void;
}

export default function AdaptationSuggestion({ suggestion, onSeen }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const plan = useAppStore((s) => s.plan);
  const profile = useAppStore((s) => s.profile);
  const setPlan = useAppStore((s) => s.setPlan);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const onPrimary = theme.scheme === 'dark' ? '#1D2A17' : '#FFFFFF';

  if (!suggestion) return null;

  const Icon =
    suggestion.kind === 'de_escalate'
      ? TrendingDown
      : suggestion.kind === 'progress'
        ? TrendingUp
        : Wand2;

  const kindLabel = t(`adaptation.kind${kindKey(suggestion.kind)}`);
  const kindBody = t(`adaptation.kind${kindKey(suggestion.kind)}Body`);
  const summary = t(suggestion.summaryKey, suggestion.stats);

  const apply = async () => {
    if (!plan || busy) return;
    setBusy(true);
    track('adaptation_applied', { kind: suggestion.kind });
    try {
      const result = await adjustPlan({
        plan,
        injury: profile.injury,
        adjustment: suggestion.adjustmentPrompt,
        name: profile.name,
        age: profile.age,
        fitnessLevel: profile.fitnessLevel,
      });
      // Archive the OLD plan before overwriting so the user can see how
      // the plan changed in Plan History.
      archivePlan({
        plan,
        source: 'adjusted',
        adjustment: `[auto: ${suggestion.kind}] ${summary}`,
      }).catch(() => {});
      setPlan(result.plan);
      setOpen(false);
      onSeen();
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'off_topic'
          ? err.message || t('adaptation.errFallback')
          : err instanceof Error
            ? err.message
            : t('adaptation.errFallback');
      Alert.alert(t('adaptation.errTitle'), msg);
      track('adaptation_failed', { kind: suggestion.kind });
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    setOpen(false);
    onSeen();
  };

  return (
    <>
      {/* Home card */}
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 14,
          borderRadius: 20,
          backgroundColor: theme.colors.pl,
          borderWidth: 1,
          borderColor: theme.colors.pb,
          marginBottom: 12,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: theme.colors.pu,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={onPrimary} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: font.bodyBold,
              color: theme.colors.pt,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            {t('adaptation.cardTitle')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: font.body,
              color: theme.colors.tb,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {summary}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 12,
            fontFamily: font.bodyBold,
            color: theme.colors.pt,
            letterSpacing: -0.1,
          }}
        >
          {t('adaptation.cardCta')} →
        </Text>
      </Pressable>

      {/* Modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={dismiss}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 22,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 22,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              borderWidth: 1,
              borderColor: theme.colors.bo,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: theme.colors.pl,
                borderWidth: 1,
                borderColor: theme.colors.pb,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'flex-start',
                marginBottom: 14,
              }}
            >
              <Sparkles size={26} color={theme.colors.pt} strokeWidth={2.2} />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontFamily: font.serif,
                color: theme.colors.th,
                letterSpacing: -0.5,
                marginBottom: 6,
              }}
            >
              {t('adaptation.modalTitle')}
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontFamily: font.bodyBold,
                color: theme.colors.pu,
                marginBottom: 12,
                letterSpacing: -0.2,
              }}
            >
              {kindLabel}
            </Text>

            <View
              style={{
                backgroundColor: theme.colors.card2,
                borderRadius: 14,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: font.body,
                  color: theme.colors.tb,
                  lineHeight: 19,
                }}
              >
                {summary}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 14,
                fontFamily: font.body,
                color: theme.colors.tb,
                lineHeight: 21,
                marginBottom: 22,
              }}
            >
              {kindBody}
            </Text>

            <Pressable
              onPress={apply}
              disabled={busy}
              style={({ pressed }) => ({
                backgroundColor: theme.colors.pu,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: pressed || busy ? 0.85 : 1,
                marginBottom: 8,
              })}
            >
              {busy ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color={onPrimary} size="small" />
                  <Text
                    style={{
                      color: onPrimary,
                      fontSize: 15,
                      fontFamily: font.bodyBold,
                    }}
                  >
                    {t('adaptation.applying')}
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    color: onPrimary,
                    fontSize: 15,
                    fontFamily: font.bodyBold,
                    letterSpacing: -0.2,
                  }}
                >
                  {t('adaptation.apply')}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={dismiss}
              disabled={busy}
              style={({ pressed }) => ({
                paddingVertical: 12,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  color: theme.colors.tm,
                  fontSize: 14,
                  fontFamily: font.bodyMed,
                }}
              >
                {t('adaptation.notNow')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function kindKey(k: Suggestion['kind']): string {
  switch (k) {
    case 'de_escalate': return 'DeEscalate';
    case 'modify':      return 'Modify';
    case 'progress':    return 'Progress';
  }
}
