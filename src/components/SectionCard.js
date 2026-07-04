import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, cardShadow, MAX_FONT_MULT } from '../theme';

// Shared teal-header card used for each Home dashboard section (Today's Medication,
// Today's Meals, Today's Feedback). `onPressChevron` shows a tappable chevron on
// the right of the header that deep-links to the section's full list.
export default function SectionCard({ icon, title, onPressChevron, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon} size={18} color={colors.white} />
        <Text style={styles.headerText} maxFontSizeMultiplier={MAX_FONT_MULT}>
          {title}
        </Text>
        {onPressChevron && (
          <TouchableOpacity
            style={styles.chevronBtn}
            onPress={onPressChevron}
            accessibilityRole="button"
            accessibilityLabel={`View all ${title}`}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerText: { color: colors.white, fontSize: 17, fontWeight: '700', flex: 1 },
  chevronBtn: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
