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
import {
  getTodaysMedications,
  markTaken,
  unmarkTaken,
} from '../api/medications';
import { formatTime12h } from '../utils/medicationFormat';
import { colors, spacing, radius, typography, MIN_TOUCH } from '../theme';

// Home-page "Today's Medication" card. Shows time · name · dosage · checkbox rows;
// taken items sort to the bottom; only 3 shown until "View more". Tapping a row
// (outside the checkbox) opens the edit screen. Exported for Person 3's dashboard.
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
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="medkit" size={18} color={colors.white} />
        <Text style={styles.headerText}>Today's Medication</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primary} />
      ) : meds.length === 0 ? (
        <Text style={styles.empty}>Nothing scheduled for today.</Text>
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
              <Text style={styles.viewMoreText}>
                {expanded ? 'View less' : 'View more'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

function MedRow({ med, busy, onToggle, onOpen }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} onPress={onOpen} activeOpacity={0.7}>
        <View style={styles.timeCol}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.time}>{formatTime12h(med.reminder_time)}</Text>
        </View>
        <Text style={[styles.name, med.taken && styles.nameTaken]} numberOfLines={1}>
          {med.name}
        </Text>
        <Text style={styles.dosage}>{med.dosage}</Text>
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
        {med.taken && <Ionicons name="checkmark" size={18} color={colors.white} />}
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  empty: { ...typography.bodySecondary, padding: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: MIN_TOUCH + 4,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timeCol: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 78 },
  time: { ...typography.bodySecondary, fontSize: 14 },
  name: { ...typography.body, flex: 1, fontWeight: '600' },
  nameTaken: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  dosage: { ...typography.small },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  checkboxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  viewMore: { alignItems: 'center', paddingVertical: spacing.md },
  viewMoreText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
