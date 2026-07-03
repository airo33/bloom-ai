// Small pill button that shows the current time and opens a native
// time picker on tap. Cross-platform:
//   Android — DateTimePicker mounts as its own native modal
//   iOS     — we wrap the inline picker in a bottom-sheet Modal with a
//             Done button so the UX matches Android's dismiss-to-commit
//             flow.
//
// Emits `HH:MM` strings via onChange so callers stay independent of the
// picker's Date-based API.

import React, { useState } from 'react';
import { Text, View, Pressable, Modal, Platform } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme, font } from '../theme';
import { formatTime, type TimeOfDay } from '../lib/notifications';

interface Props {
  value: TimeOfDay;
  onChange: (v: TimeOfDay) => void;
}

function toHHMM(date: Date): TimeOfDay {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function TimeInput({ value, onChange }: Props) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const [showing, setShowing] = useState(false);
  const [draft, setDraft] = useState<Date | null>(null);

  const parts = value.split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  const current = new Date();
  current.setHours(h, m, 0, 0);

  const onAndroidChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowing(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    onChange(toHHMM(selectedDate));
  };

  const onIosChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) setDraft(selectedDate);
  };

  const commitIos = () => {
    if (draft) onChange(toHHMM(draft));
    setShowing(false);
    setDraft(null);
  };

  return (
    <>
      <Pressable
        onPress={() => setShowing(true)}
        style={({ pressed }) => ({
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.colors.bo,
          backgroundColor: theme.colors.card2,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 13,
            fontFamily: font.bodyMed,
            color: theme.colors.th,
            letterSpacing: -0.1,
          }}
        >
          {formatTime(value, i18n.language)}
        </Text>
      </Pressable>

      {Platform.OS === 'android' && showing && (
        <DateTimePicker
          value={current}
          mode="time"
          is24Hour={false}
          onChange={onAndroidChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showing}
          transparent
          animationType="slide"
          onRequestClose={() => setShowing(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                paddingBottom: 26,
                paddingHorizontal: 20,
                paddingTop: 12,
              }}
            >
              <DateTimePicker
                value={draft ?? current}
                mode="time"
                display="spinner"
                onChange={onIosChange}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Pressable
                  onPress={() => setShowing(false)}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.bo,
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: font.bodyBold,
                      color: theme.colors.tb,
                      fontSize: 15,
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={commitIos}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: theme.colors.pu,
                    alignItems: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: font.bodyBold,
                      color:
                        theme.scheme === 'dark' ? '#1D2A17' : '#FFFFFF',
                      fontSize: 15,
                    }}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
