import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import EmptyState from './EmptyState';
import {
  getTodaysMedications,
  markTaken,
  unmarkTaken,
} from '../api/medications';
import { formatTime12h, reminderTimeOnDate } from '../utils/medicationFormat';
import { colors, spacing, radius, typography, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

// Home-page "Today's Medication" card. Untaken medications show first (up to 3);
// taken ones are always tucked behind "View more", even if fewer than 3 are shown,
// so the default view stays focused on what's still left to do today. Missed doses
// (due time passed, not taken) get a red "Missed" badge. Tapping a row (outside the
// checkbox) opens the edit screen.
export default function TodaysMedicationList() {
  const navigation = useNavigation();
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getTodaysMedications();
      setMeds(annotateAndSort(data));
    } catch (e) {
      setMeds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleTaken = async (med) => {
    setBusyId(med.id);
    try {
      if (med.taken) {
        if (med.takenLogId) await unmarkTaken(med.takenLogId);
      } else {
        await markTaken(med.id);
      }
      await load();
    } catch (e) {
      // leave the list as-is on error
    } finally {
      setBusyId(null);
    }
  };

  const untaken = meds.filter((m) => !m.taken);
  const taken = meds.filter((m) => m.taken);
  const hasHidden = untaken.length > 3 || taken.length > 0;
  const visible = expanded ? [...untaken, ...taken] : untaken.slice(0, 3);

  return (
    <SectionCard
      icon="medkit"
      title="Today's Medication"
      onPressChevron={() => navigation.navigate('Tabs', { screen: 'Logs', params: { tab: 'Medication' } })}
    >
      {loading ? (
        <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primary} />
      ) : meds.length === 0 ? (
        <EmptyState icon="checkmark-circle-outline" message="Nothing scheduled for today" />
      ) : (
        <>
          {visible.length === 0 && (
            <EmptyState icon="checkmark-circle-outline" message="All medications taken for today" />
          )}
          {visible.map((med) => (
            <MedRow
              key={med.id}
              med={med}
              busy={busyId === med.id}
              onToggle={() => toggleTaken(med)}
              onOpen={() =>
                navigation.navigate('AddMedication', { medicationId: med.id })
              }
            />
          ))}
          {hasHidden && (
            <TouchableOpacity
              style={styles.viewMore}
              onPress={() => setExpanded((v) => !v)}
            >
              <Text style={styles.viewMoreText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                {expanded ? 'View less' : 'View more'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </SectionCard>
  );
}

function MedRow({ med, busy, onToggle, onOpen }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} onPress={onOpen} activeOpacity={0.7}>
        <Text
          style={[styles.name, med.taken && styles.nameTaken]}
          numberOfLines={2}
          maxFontSizeMultiplier={MAX_FONT_MULT}
        >
          {med.name}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.meta} maxFontSizeMultiplier={MAX_FONT_MULT}>
            {formatTime12h(med.reminder_time)} · {med.dosage}
          </Text>
          {med.missed && (
            <View style={styles.missedBadge}>
              <View style={styles.missedIconCircle}>
                <Ionicons name="alert" size={13} color={colors.warning} />
              </View>
              <Text style={styles.missedText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Missed
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.checkbox, med.taken && styles.checkboxChecked]}
        onPress={onToggle}
        disabled={busy}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: med.taken }}
        accessibilityLabel={`Mark ${med.name} as taken`}
        hitSlop={8}
      >
        {med.taken && <Ionicons name="checkmark" size={22} color={colors.white} />}
      </TouchableOpacity>
    </View>
  );
}

// Adds a `missed` flag (due time passed, not taken) to each medication, then sorts
// untaken-first by reminder time, taken sunk to the bottom.
function annotateAndSort(meds) {
  const now = new Date();
  const annotated = meds.map((m) => ({
    ...m,
    missed: !m.taken && Boolean(m.reminder_time) && reminderTimeOnDate(m.reminder_time) < now,
  }));
  return annotated.sort((a, b) => {
    if (a.taken !== b.taken) return a.taken ? 1 : -1;
    return (a.reminder_time || '').localeCompare(b.reminder_time || '');
  });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: MIN_TOUCH + 12,
  },
  rowMain: { flex: 1, gap: spacing.xs, marginRight: spacing.md },
  name: { ...typography.body, fontWeight: '700' },
  nameTaken: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  meta: { ...typography.small },
  missedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: spacing.xs },
  missedIconCircle: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missedText: { fontSize: 14, fontWeight: '700', color: colors.warning },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm + 2,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  viewMore: { alignItems: 'center', paddingVertical: spacing.md },
  viewMoreText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
