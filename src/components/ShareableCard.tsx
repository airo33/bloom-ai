// Fixed-layout card rendered off-screen and captured with
// react-native-view-shot to produce a 1080x1350 (4:5 vertical, Instagram
// feed native ratio) image the user can share to Stories, Reels, or
// TikTok. Pure presentational — accepts everything as props.

import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import { Sprout } from 'lucide-react-native';
import { font } from '../theme';
import { scoreBand, type RecoveryBreakdown } from '../lib/recoveryScore';

interface Props {
  breakdown: RecoveryBreakdown;
  day: number;
  streak: number;
}

// Fixed pixel dimensions so the exported PNG is always the same size
// regardless of device DPI. 4:5 hits Instagram's largest feed ratio
// without cropping; still looks fine in Stories/Reels centered.
const CARD_WIDTH = 360;
const CARD_HEIGHT = 450;

const BAND_COLORS: Record<ReturnType<typeof scoreBand>, string> = {
  poor: '#E37878',
  fair: '#E5A44C',
  good: '#89B85F',
  strong: '#5F9437',
};

const BAND_LABELS: Record<ReturnType<typeof scoreBand>, string> = {
  poor: 'BUILDING',
  fair: 'ON TRACK',
  good: 'STRONG',
  strong: 'THRIVING',
};

const ShareableCard = forwardRef<View, Props>(function ShareableCard(
  { breakdown, day, streak },
  ref,
) {
  const band = scoreBand(breakdown.score);
  const accent = BAND_COLORS[band];

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#F3EFE6',
        padding: 28,
        justifyContent: 'space-between',
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: '#141310',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sprout size={15} color="#BFE39A" strokeWidth={2.4} />
          </View>
          <Text
            style={{
              fontSize: 15,
              fontFamily: font.serif,
              color: '#141310',
              letterSpacing: -0.3,
            }}
          >
            Bloom AI
          </Text>
        </View>
        <Text
          style={{
            fontSize: 10,
            fontFamily: font.bodyBold,
            color: '#6B655B',
            letterSpacing: 1.2,
          }}
        >
          MY RECOVERY
        </Text>
      </View>

      {/* Score — the visual anchor */}
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 10,
            fontFamily: font.bodyBold,
            color: '#6B655B',
            letterSpacing: 1.4,
            marginBottom: 8,
          }}
        >
          RECOVERY SCORE
        </Text>
        <Text
          style={{
            fontSize: 128,
            fontFamily: font.serif,
            color: '#141310',
            letterSpacing: -4,
            lineHeight: 128,
          }}
        >
          {breakdown.score}
        </Text>
        <View
          style={{
            marginTop: 10,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: accent,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: font.bodyBold,
              color: '#FFFFFF',
              letterSpacing: 1.2,
            }}
          >
            {BAND_LABELS[band]}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <StatCell value={String(day)} label="days recovering" />
        <StatCell value={String(streak)} label="day streak" />
      </View>

      {/* Footer */}
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: font.serifItalic,
            color: '#6B655B',
          }}
        >
          AI-guided injury recovery
        </Text>
      </View>
    </View>
  );
});

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontFamily: font.serif,
          color: '#141310',
          letterSpacing: -0.8,
          lineHeight: 32,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontFamily: font.body,
          color: '#6B655B',
          marginTop: 2,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default ShareableCard;
export { CARD_WIDTH, CARD_HEIGHT };
