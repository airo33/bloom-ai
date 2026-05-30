import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import PainScale from '../components/PainScale';
import { MOOD_OPTIONS } from '../data/moods';
import type { RootStackScreenProps } from '../navigation/types';

export default function JournalScreen({ navigation }: RootStackScreenProps<'Journal'>) {
  const theme = useTheme();
  const day = useAppStore((s) => s.progress.day);
  const water = useAppStore((s) => s.progress.water);
  const addLog = useAppStore((s) => s.addLog);

  const [pain, setPain] = useState(0);
  const [mood, setMood] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const save = () => {
    addLog({
      day,
      date: new Date().toISOString().slice(0, 10),
      pain,
      mood: mood ?? MOOD_OPTIONS[2].value, // default "Good"
      water,
      notes: notes.trim() || undefined,
    });
    navigation.goBack();
  };

  const painColor =
    pain <= 3 ? theme.colors.gn : pain <= 6 ? theme.colors.yb : theme.colors.rd;
  const painBg = pain <= 3 ? theme.colors.gl : pain <= 6 ? theme.colors.yl : theme.colors.rl;
  const painBorder = pain <= 3 ? theme.colors.gb : pain <= 6 ? theme.colors.yb : theme.colors.rb;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            paddingHorizontal: 22,
            paddingTop: 12,
            paddingBottom: 16,
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
                fontWeight: '700',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Daily log
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.th, letterSpacing: -0.3 }}>
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
        >
          {/* Pain */}
          <Card style={{ marginBottom: 12 }} padding={18}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.th, letterSpacing: -0.2 }}>
                Pain level
              </Text>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: painBg,
                  borderWidth: 1,
                  borderColor: painBorder,
                  minWidth: 56,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: painColor, letterSpacing: -0.3 }}>
                  {pain}/10
                </Text>
              </View>
            </View>
            <PainScale value={pain} onChange={setPain} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 11, color: theme.colors.tl }}>No pain</Text>
              <Text style={{ fontSize: 11, color: theme.colors.tl }}>Severe</Text>
            </View>
          </Card>

          {/* Mood */}
          <Card style={{ marginBottom: 12 }} padding={18}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: theme.colors.th,
                marginBottom: 12,
                letterSpacing: -0.2,
              }}
            >
              How do you feel?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MOOD_OPTIONS.map((m) => {
                const selected = mood === m.value;
                const iconColor = selected
                  ? theme.scheme === 'dark'
                    ? '#0A0A0A'
                    : '#FFFFFF'
                  : theme.colors.tb;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setMood(m.value)}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 14,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? theme.colors.pu : theme.colors.bo,
                      backgroundColor: selected ? theme.colors.pu : theme.colors.card2,
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <m.Icon size={26} color={iconColor} strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Notes */}
          <Card style={{ marginBottom: 14 }} padding={18}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: theme.colors.th,
                marginBottom: 10,
                letterSpacing: -0.2,
              }}
            >
              Notes{' '}
              <Text style={{ fontSize: 12, color: theme.colors.tm, fontWeight: '400' }}>
                (optional)
              </Text>
            </Text>
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="How did exercises feel? Any changes in pain or mobility?..."
              multiline
            />
          </Card>

          <Button title="Save entry" onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
