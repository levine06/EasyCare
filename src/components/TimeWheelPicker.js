import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius, typography, MIN_TOUCH } from '../theme';

// 24-hour time picker. `value` is a "HH:MM" string; `onChange` receives "HH:MM".
// iOS renders the inline spinner wheel (matches the mockup). Android opens the
// system clock dialog from a tappable field, since it has no inline spinner.
export default function TimeWheelPicker({ value, onChange }) {
  const [showAndroid, setShowAndroid] = useState(false);
  const date = timeStringToDate(value);

  const handleChange = (event, selected) => {
    if (Platform.OS === 'android') setShowAndroid(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(dateToTimeString(selected));
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.iosWrap}>
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          is24Hour
          onChange={handleChange}
          style={styles.iosPicker}
        />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.androidField}
        onPress={() => setShowAndroid(true)}
        accessibilityRole="button"
      >
        <Text style={styles.androidValue}>{value || 'Select time'}</Text>
      </TouchableOpacity>
      {showAndroid && (
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          is24Hour
          onChange={handleChange}
        />
      )}
    </>
  );
}

function timeStringToDate(value) {
  const d = new Date();
  if (value) {
    const [h, m] = value.split(':').map((n) => parseInt(n, 10));
    d.setHours(h || 0, m || 0, 0, 0);
  } else {
    d.setHours(8, 0, 0, 0); // sensible default
  }
  return d;
}

function dateToTimeString(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const styles = StyleSheet.create({
  iosWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  iosPicker: { alignSelf: 'center' },
  androidField: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  androidValue: { ...typography.body },
});
