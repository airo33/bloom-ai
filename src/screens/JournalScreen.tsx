import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Moon, Zap, Waves } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Slider from '../components/Slider';
import { MOOD_OPTIONS } from '../data/moods';
import { track } from '../lib/analytics';
import type { RootStackScreenProps } from '../navigation/types';

export default function JournalScreen({ navigation }: RootStackScreenProps<'Journal'>) {
  const theme = useTheme();
  const { t } = useTranslation();
  // Contextual descriptor beneath the big pain number — matters more than
  // the number itself for making the screen feel "human" rather than
  // clinical. Bands mirror the pain scale's green/amber/red gradient.
  const painLabels = t('journal.painLabels', { returnObjects: true }) as string[];
  const day = useAppStore((s) => s.progress.day);
  const water = useAppStore((s) => s.progress.water);
  const addLog = useAppStore((s) => s.addLog);

  const [pain, setPain] = useState(3);
  const [mood, setMood] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [sleep, setSleep] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);

  const save = () => {
    addLog({
      day,
      date: (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      })(),
      pain,
      mood: mood ?? MOOD_OPTIONS[2].value,
      water,
      sleepQuality: sleep ?? undefined,
      energy: energy ?? undefined,
      stress: stress ?? undefined,
      notes: notes.trim() || undefined,
    });
    track('journal_saved', {
      pain,
      has_sleep: sleep !== null,
      has_energy: energy !== null,
      has_stress: stress !== null,
      has_notes: notes.trim().length > 0,
    });
    navigation.goBack();
  };

  // Pain visuals — colour smoothly transitions across the gradient.
  const painAccent =
    pain <= 3 ? theme.colors.gn : pain <= 6 ? theme.colors.yb : theme.colors.rd;

  const painTrackColors = useMemo(
    () => [theme.colors.gn, theme.colors.yb, theme.colors.rd] as [string, string, string],
    [theme.colors.gn, theme.colors.yb, theme.colors.rd],
  );

  const sleepTrackColors = useMemo(
    () => [theme.colors.tl, theme.colors.pu] as [string, string],
    [theme.colors.tl, theme.colors.pu],
  );

  const energyTrackColors = useMemo(
    () => [theme.colors.tl, theme.colors.or] as [string, string],
    [theme.colors.tl, theme.colors.or],
  );

  const stressTrackColors = useMemo(
    () => [theme.colors.gn, theme.colors.rd] as [string, string],
    [theme.colors.gn, theme.colors.rd],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 22,
            paddingTop: 12,
            paddingBottom: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.bo,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ChevronLeft size={20} color={theme.colors.tb} strokeWidth={2.2} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.tm,
                fontFamily: font.bodyBold,
                letterSpacing: 0.9,
                textTransform: 'uppercase',
              }}
            >
              {t('journal.eyebrow')}
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontFamily: font.serif,
                color: theme.colors.th,
                letterSpacing: -0.6,
                marginTop: 1,
              }}
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Pain hero — the visual anchor of the screen */}
          <Card hero padding={22} style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: font.bodyBold,
                color: theme.colors.tm,
                letterSpacing: 1.0,
                textTransform: 'uppercase',
              }}
            >
              {t('journal.painQuestion')}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 88,
                  fontFamily: font.serif,
                  color: painAccent,
                  letterSpacing: -3,
                  lineHeight: 92,
                }}
              >
                {pain}
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: font.serif,
                  color: theme.colors.tl,
                  marginLeft: 6,
                  letterSpacing: -0.4,
                }}
              >
                / 10
              </Text>
            </View>

            <Text
              style={{
                fontSize: 15,
                fontFamily: font.serifItalic,
                color: theme.colors.tb,
                marginBottom: 22,
                letterSpacing: -0.1,
              }}
            >
              {painLabels[pain]}
            </Text>

            <Slider
              value={pain}
              onChange={setPain}
              max={10}
              trackColors={painTrackColors}
              accent={painAccent}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 11, color: theme.colors.tl, fontFamily: font.body }}>
                {t('journal.painNoPain')}
              </Text>
              <Text style={{ fontSize: 11, color: theme.colors.tl, fontFamily: font.body }}>
                {t('journal.painSevere')}
              </Text>
            </View>
          </Card>

          {/* Mood */}
          <Card style={{ marginBottom: 14 }} padding={20}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: font.bodyBold,
                color: theme.colors.tm,
                letterSpacing: 1.0,
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              {t('journal.moodQuestion')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MOOD_OPTIONS.map((m) => {
                const selected = mood === m.value;
                const iconColor = selected
                  ? theme.scheme === 'dark'
                    ? '#1D2A17'
                    : '#FFFFFF'
                  : theme.colors.tb;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setMood(m.value)}
                    style={({ pressed }) => ({
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 18,
                      borderWidth: selected ? 0 : 1,
                      borderColor: theme.colors.bo,
                      backgroundColor: selected ? theme.colors.pu : theme.colors.card2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <m.Icon size={28} color={iconColor} strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
            {mood && (
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: font.serifItalic,
                  color: theme.colors.tm,
                  marginTop: 12,
                  textAlign: 'center',
                }}
              >
                {MOOD_OPTIONS.find((m) => m.value === mood)?.label}
              </Text>
            )}
          </Card>

          {/* Sleep / Energy / Stress — optional compact sliders */}
          <Card style={{ marginBottom: 14 }} padding={20}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: font.bodyBold,
                  color: theme.colors.tm,
                  letterSpacing: 1.0,
                  textTransform: 'uppercase',
                }}
              >
                {t('journal.recoverySignals')}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: theme.colors.tl,
                  fontFamily: font.body,
                  fontStyle: 'italic',
                }}
              >
                {t('journal.optional')}
              </Text>
            </View>

            <MetricRow
              Icon={Moon}
              label={t('journal.sleepQuality')}
              value={sleep}
              onChange={setSleep}
              trackColors={sleepTrackColors}
              accent={theme.colors.pu}
              iconBg={theme.colors.pl}
              iconFg={theme.colors.pu}
            />
            <MetricRow
              Icon={Zap}
              label={t('journal.energy')}
              value={energy}
              onChange={setEnergy}
              trackColors={energyTrackColors}
              accent={theme.colors.or}
              iconBg={theme.colors.ol}
              iconFg={theme.colors.or}
            />
            <MetricRow
              Icon={Waves}
              label={t('journal.stress')}
              value={stress}
              onChange={setStress}
              trackColors={stressTrackColors}
              accent={stress != null && stress > 6 ? theme.colors.rd : theme.colors.gn}
              iconBg={theme.colors.bl}
              iconFg={theme.colors.bb}
              isLast
            />
          </Card>

          {/* Notes */}
          <Card style={{ marginBottom: 18 }} padding={20}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: font.bodyBold,
                  color: theme.colors.tm,
                  letterSpacing: 1.0,
                  textTransform: 'uppercase',
                }}
              >
                {t('journal.notesQuestion')}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: theme.colors.tl,
                  fontFamily: font.body,
                  fontStyle: 'italic',
                }}
              >
                {t('journal.optional')}
              </Text>
            </View>
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder={t('journal.notesPlaceholder')}
              multiline
            />
          </Card>

          <Button title={t('journal.saveEntry')} onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface MetricRowProps {
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  trackColors: [string, string, ...string[]];
  accent: string;
  iconBg: string;
  iconFg: string;
  isLast?: boolean;
}

function MetricRow({
  Icon,
  label,
  value,
  onChange,
  trackColors,
  accent,
  iconBg,
  iconFg,
  isLast,
}: MetricRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const empty = value == null;

  return (
    <View style={{ marginBottom: isLast ? 0 : 20 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} color={iconFg} strokeWidth={2.2} />
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            fontFamily: font.bodyBold,
            color: theme.colors.tb,
            letterSpacing: -0.1,
          }}
        >
          {label}
        </Text>
        {empty ? (
          <Pressable hitSlop={8} onPress={() => onChange(5)}>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.pu,
                fontFamily: font.bodyBold,
              }}
            >
              {t('journal.add')}
            </Text>
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text
              style={{
                fontSize: 22,
                fontFamily: font.serif,
                color: theme.colors.th,
                letterSpacing: -0.5,
                lineHeight: 26,
              }}
            >
              {value}
            </Text>
            <Pressable hitSlop={8} onPress={() => onChange(null)}>
              <Text style={{ fontSize: 11, color: theme.colors.tl, fontFamily: font.body }}>
                {t('journal.clear')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      {!empty && (
        <Slider
          value={value ?? 5}
          onChange={onChange}
          max={10}
          trackColors={trackColors}
          accent={accent}
          height={36}
        />
      )}
    </View>
  );
}
