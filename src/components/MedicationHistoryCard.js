import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionSheetMenu from './ActionSheetMenu';
import { colors, spacing, radius, typography, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';
import { formatExactTime } from '../utils/mealFormat';

// Medication History card: photo (or generic placeholder — used for both
// skipped and otherwise-missing photos, no distinct "skipped" styling),
// medication name, exact time taken, dosage pill, and a 3-dot menu with
// Edit (replace/remove photo) / Delete. Mirrors MealCard.js's layout.
export default function MedicationHistoryCard({ log, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const medication = log.medications ?? {};

  return (
    <View style={styles.card}>
      {log.photo_url ? (
        <Image source={{ uri: log.photo_url }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="medkit-outline" size={26} color={colors.textSecondary} />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {medication.name}
            </Text>
            <Text style={styles.time} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {formatExactTime(log.taken_at)}
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

        {medication.dosage && (
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Ionicons name="medical-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.pillText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                {medication.dosage}
              </Text>
            </View>
          </View>
        )}
      </View>

      <ActionSheetMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onEdit={() => onEdit?.(log)}
        onDelete={() => onDelete?.(log)}
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
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pillText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
});
