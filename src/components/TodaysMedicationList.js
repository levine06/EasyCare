import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import EmptyState from './EmptyState';
import { useTodaysMedications } from '../hooks/useTodaysMedications';
import { formatTime12h } from '../utils/medicationFormat';
import { colors, spacing, radius, typography, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

const PREVIEW_COUNT = 3;

// Home-page "Today's Medication" card. A single list, untaken medications first
// (soonest reminder_time first), taken ones sorted to the bottom — only the first
// three rows show by default, the rest sit behind "View more". Missed doses (due
// time passed, not taken) get a red "Missed" badge. Tapping a row (outside the
// checkbox) opens the edit screen.
export default function TodaysMedicationList() {
  const navigation = useNavigation();
  const { meds, loading, toggleTaken } = useTodaysMedications();
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const handleToggle = async (med) => {
    setBusyId(med.id);
    try {
      await toggleTaken(med);
    } finally {
      setBusyId(null);
    }
  };

  const hasHidden = meds.length > PREVIEW_COUNT;
  const visible = expanded ? meds : meds.slice(0, PREVIEW_COUNT);

  const openMed = (med) =>
    navigation.navigate('AddMedication', { medicationId: med.id });

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
              onToggle={() => handleToggle(med)}
              onOpen={() => openMed(med)}
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
