import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, MIN_TOUCH } from '../theme';
import { formatTime12h } from '../utils/medicationFormat';

// Logs-tab card: name + dosage, time, frequency, added-on date, and a 3-dot menu
// with Edit / Delete. Matches the medication logs mockup.
export default function MedicationCard({ medication, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const addedOn = formatAddedOn(medication.created_at);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.dosage}>{medication.dosage}</Text>
      </View>

      <View style={styles.middle}>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metaText}>{medication.reminder_time?.slice(0, 5)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metaText}>{medication.frequency}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.addedOn}>Added on{'\n'}{addedOn}</Text>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={8}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onEdit?.(medication);
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.text} />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onDelete?.(medication);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.warning} />
              <Text style={[styles.menuText, { color: colors.warning }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  left: { flex: 1.2 },
  name: { ...typography.sectionLabel, fontSize: 17, fontWeight: '700' },
  dosage: { ...typography.bodySecondary, marginTop: 2 },
  middle: { flex: 1.2, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { ...typography.small, fontSize: 14 },
  right: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  addedOn: { ...typography.small, textAlign: 'right' },
  menuBtn: { minWidth: 24, minHeight: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menu: {
    position: 'absolute',
    top: '30%',
    right: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH,
  },
  menuText: { ...typography.body },
});
