// Recovery Score UI. Two variants:
//   `hero`    — big card for ProgressScreen (big number, breakdown bars,
//               subtitle band label).
//   `compact` — tiny chip for Home (score + band, no breakdown).
// Both read a pre-computed RecoveryBreakdown from the caller so this
// component stays pure and testable.

import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import { scoreBand, type RecoveryBreakdown } from '../lib/recoveryScore';
import Card from './Card';

interface Props {
  breakdown: RecoveryBreakdown | null;
  variant?: 'hero' | 'compact';
}

export default function RecoveryScoreCard({ breakdown, variant = 'hero' }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (variant === 'compact') return <CompactChip breakdown={breakdown} />;

  return (
    <Card hero padding={20} style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 11,
          fontFamily: font.bodyBold,
          color: theme.colors.tm,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {t('recovery.title')}
      </Text>

      {!breakdown ? (
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.tm,
            fontFamily: font.body,
            lineHeight: 20,
            marginTop: 4,
          }}
        >
          {t('recovery.empty')}
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text
              style={{
                fontSize: 46,
                fontFamily: font.serif,
                color: theme.colors.th,
                letterSpacing: -1.2,
              }}
            >
              {breakdown.score}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: font.body,
                color: theme.colors.tm,
              }}
            >
              / 100
            </Text>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontFamily: font.serifItalic,
              color: theme.colors.pu,
              marginTop: 2,
              marginBottom: 4,
            }}
          >
            {t(`recovery.band${cap(scoreBand(breakdown.score))}`)}
          </Text>

          <Text
            style={{
              fontSize: 12,
              fontFamily: font.body,
              color: theme.colors.tm,
              marginBottom: 16,
            }}
          >
            {t('recovery.avgPain', {
              days: breakdown.sampleSize,
              avg: breakdown.avgPainRecent,
            })}
          </Text>

          <Bar label={t('recovery.pain')} value={breakdown.pain} theme={theme} />
          <Bar label={t('recovery.consistency')} value={breakdown.consistency} theme={theme} />
          <Bar label={t('recovery.momentum')} value={breakdown.momentum} theme={theme} last />
        </>
      )}
    </Card>
  );
}

function CompactChip({ breakdown }: { breakdown: RecoveryBreakdown | null }) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (!breakdown) return null;
  const band = scoreBand(breakdown.score);
  const bandColor = bandColorFor(band, theme.colors.pu, theme.colors.pt);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: theme.colors.pl,
        borderWidth: 1,
        borderColor: theme.colors.pb,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontFamily: font.serif,
          color: bandColor,
          letterSpacing: -0.4,
        }}
      >
        {breakdown.score}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontFamily: font.bodyBold,
          color: theme.colors.pt,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          flexShrink: 1,
        }}
        numberOfLines={1}
      >
        {t('recovery.title')}
      </Text>
    </View>
  );
}

function Bar({
  label,
  value,
  theme,
  last = false,
}: {
  label: string;
  value: number;
  theme: ReturnType<typeof useTheme>;
  last?: boolean;
}) {
  return (
    <View style={{ marginBottom: last ? 0 : 10 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 12, color: theme.colors.tb, fontFamily: font.bodyMed }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.tm, fontFamily: font.bodyMed }}>
          {value}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: theme.colors.card2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${value}%`,
            height: '100%',
            backgroundColor: theme.colors.pu,
          }}
        />
      </View>
    </View>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function bandColorFor(
  band: 'poor' | 'fair' | 'good' | 'strong',
  primary: string,
  primaryText: string,
): string {
  // For the compact chip we want the score to feel "on" for good/strong
  // and slightly muted for poor/fair — the label already communicates
  // the state via colour ramp, no need for a red number.
  if (band === 'strong' || band === 'good') return primary;
  return primaryText;
}
