import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, MIN_TOUCH } from '../theme';
import { WEEK_DAYS } from '../utils/medicationFormat';

// Mon–Sun multi-select chips. `value` is an array of day abbreviations.
export default function DayOfWeekSelector({ value = [], onChange }) {
  const toggle = (day) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <View style={styles.row}>
      {WEEK_DAYS.map((day) => {
        const selected = value.includes(day);
        return (
          <TouchableOpacity
            key={day}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => toggle(day)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {day}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minWidth: 56,
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  chipTextSelected: { color: colors.white },
});
