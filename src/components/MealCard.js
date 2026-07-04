import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionSheetMenu from './ActionSheetMenu';
import { colors, spacing, radius, typography, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';
import { formatRelativeTime } from '../utils/mealFormat';

// Logs-tab card: photo, title (meal type), relative time, food tags, and a 3-dot
// menu with Edit / Delete. Matches the food logs mockup.
export default function MealCard({ meal, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tags = Array.isArray(meal.food_tags) ? meal.food_tags : [];

  return (
    <View style={styles.card}>
      {meal.photo_url ? (
        <Image source={{ uri: meal.photo_url }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="restaurant-outline" size={26} color={colors.textSecondary} />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {meal.meal_type}
            </Text>
            <Text style={styles.time} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {formatRelativeTime(meal.created_at)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <ActionSheetMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onEdit={() => onEdit?.(meal)}
        onDelete={() => onDelete?.(meal)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    ...cardShadow,
  },
  photo: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.border },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: spacing.sm, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleCol: { flex: 1 },
  title: { ...typography.sectionLabel, fontSize: 18, fontWeight: '700' },
  time: { ...typography.small, marginTop: 2 },
  menuBtn: {
    minWidth: MIN_TOUCH - 12,
    minHeight: MIN_TOUCH - 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  tagText: { fontSize: 14, fontWeight: '600', color: colors.primaryDark },
});
