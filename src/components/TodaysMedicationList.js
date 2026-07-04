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
import { formatTime12h } from '../utils/medicationFormat';
import { colors, spacing, radius, typography, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

// Home-page "Today's Medication" card. Shows two-line rows (name, then time ·
// dosage) with a checkbox; taken items sort to the bottom. Only 3 shown until
// "View more". Tapping a row (outside the checkbox) opens the edit screen.
export default function TodaysMedicationList() {
  const navigation = useNavigation();
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getTodaysMedications();
      setMeds(sortForDisplay(data));
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

  const visible = expanded ? meds : meds.slice(0, 3);

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
          {meds.length > 3 && (
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

// Untaken first (by reminder time), taken sink to the bottom.
function sortForDisplay(meds) {
  return [...meds].sort((a, b) => {
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  meta: { ...typography.small },
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
