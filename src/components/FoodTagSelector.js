import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, MIN_TOUCH } from '../theme';

export const FOOD_TAGS = ['Whole grains', 'Protein', 'Vegetables', 'Dairy', 'Fruits'];

// Multi-select chips for food group tags. `value` is an array of tag strings.
export default function FoodTagSelector({ value = [], onChange }) {
  const toggle = (tag) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  return (
    <View style={styles.row}>
      {FOOD_TAGS.map((tag) => {
        const selected = value.includes(tag);
        return (
          <TouchableOpacity
            key={tag}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => toggle(tag)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {tag}
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
