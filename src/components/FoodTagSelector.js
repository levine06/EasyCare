import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, MIN_TOUCH } from '../theme';
import { FOOD_TAGS } from '../constants/foodTags';
import { listCustomTags } from '../api/customTags';

// Multi-select chips for food group tags. `value` is an array of tag strings.
// Renders the 5 built-in tags plus any user-created custom tags (fetched from
// Supabase). Tag creation/editing/deletion happens on ManageFoodTagsScreen, not here.
export default function FoodTagSelector({ value = [], onChange }) {
  const [customTags, setCustomTags] = useState([]);

  useEffect(() => {
    let active = true;
    listCustomTags()
      .then((data) => active && setCustomTags(data))
      .catch(() => active && setCustomTags([]));
    return () => {
      active = false;
    };
  }, []);

  const allTags = [...FOOD_TAGS, ...customTags.map((t) => t.name)];

  const toggle = (tag) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  return (
    <View style={styles.row}>
      {allTags.map((tag) => {
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
