import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionSheetMenu from './ActionSheetMenu';
import { colors, spacing, radius, typography, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

// Logs-tab card: name + 3-dot menu on top, then dosage/time/frequency as wrapping
// info pills so long frequency strings ("Mon, Wed, Fri") never break mid-word, and
// an added-on date footer. Matches the medication logs mockup.
export default function MedicationCard({ medication, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const addedOn = formatAddedOn(medication.created_at);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_MULT}>
          {medication.name}
        </Text>
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

      <View style={styles.pillRow}>
        <Pill icon="medical-outline" text={medication.dosage} />
        <Pill icon="time-outline" text={medication.reminder_time?.slice(0, 5)} />
        <Pill icon="calendar-outline" text={medication.frequency} />
      </View>

      <Text style={styles.addedOn} maxFontSizeMultiplier={MAX_FONT_MULT}>
        Added on {addedOn}
      </Text>

      <ActionSheetMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onEdit={() => onEdit?.(medication)}
        onDelete={() => onDelete?.(medication)}
      />
    </View>
  );
}

function Pill({ icon, text }) {
  if (!text) return null;
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />
      <Text style={styles.pillText} maxFontSizeMultiplier={MAX_FONT_MULT}>
        {text}
      </Text>
    </View>
  );
}

function formatAddedOn(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  name: { ...typography.sectionLabel, fontSize: 18, fontWeight: '700', flex: 1 },
  menuBtn: {
    minWidth: MIN_TOUCH - 12,
    minHeight: MIN_TOUCH - 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pillText: { ...typography.small, fontSize: 14 },
  addedOn: { ...typography.caption, textAlign: 'right' },
});
