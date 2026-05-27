import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import type { RootStackScreenProps } from '../navigation/types';

const MOOD_OPTIONS = ['😔', '😐', '🙂', '😄'];

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
      mood: mood ?? '🙂',
      water,
      notes: notes.trim() || undefined,
    });
    navigation.goBack();
  };

  const painColor =
    pain <= 3 ? theme.colors.gn : pain <= 6 ? '#C06000' : theme.colors.rd;
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
            paddingTop: 8,
            paddingBottom: 13,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: theme.colors.card,
              borderWidth: 2,
              borderColor: theme.colors.bo2,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 18 }}>⬅️</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.tm,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              📝 DAILY LOG
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.th }}>
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
          {/* Pain card */}
          <Card style={{ marginBottom: 11 }} padding={17}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.th }}>
                🤕 Pain Level
              </Text>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: painBg,
                  borderWidth: 2,
                  borderColor: painBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '800', color: painColor }}>
                  {pain}
                </Text>
              </View>
            </View>
            <Slider
              value={pain}
              minimumValue={0}
              maximumValue={10}
              step={1}
              minimumTrackTintColor={theme.colors.pu}
              maximumTrackTintColor={theme.colors.bo2}
              thumbTintColor={theme.colors.pu}
              onValueChange={(v) => setPain(Math.round(v))}
              style={{ width: '100%' }}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 5,
              }}
            >
              <Text style={{ fontSize: 11, color: theme.colors.tl }}>😌 No pain</Text>
              <Text style={{ fontSize: 11, color: theme.colors.tl }}>😣 Severe</Text>
            </View>
          </Card>

          {/* Mood card */}
          <Card style={{ marginBottom: 11 }} padding={17}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: theme.colors.th,
                marginBottom: 12,
              }}
            >
              😊 How do you feel?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MOOD_OPTIONS.map((m) => {
                const selected = mood === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMood(m)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 13,
                      borderWidth: 2,
                      borderColor: selected ? theme.colors.pu : theme.colors.bo2,
                      backgroundColor: selected ? theme.colors.pl : theme.colors.card,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{m}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Notes */}
          <Card style={{ marginBottom: 13 }} padding={17}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: theme.colors.th,
                marginBottom: 9,
              }}
            >
              📝 Notes{' '}
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

          <Button title="💾 Save Entry" onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
