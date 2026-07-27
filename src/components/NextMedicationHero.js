import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTodaysMedications } from '../hooks/useTodaysMedications';
import { formatTime12h } from '../utils/medicationFormat';
import { colors, spacing, radius, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

// Home-page focal action: the single most time-sensitive medication, so an elderly
// user doesn't have to parse a grid of stats to know what to do next. Priority:
// missed dose > next upcoming dose > "all caught up" > nothing (renders nothing) if
// no medications are scheduled today at all.
export default function NextMedicationHero() {
  const { meds, loading } = useTodaysMedications();
  const navigation = useNavigation();

  if (loading || meds.length === 0) return null;

  const next = meds.find((m) => !m.taken);

  if (!next) {
    return (
      <View style={[styles.card, styles.successCard]}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.eyebrowSuccess} maxFontSizeMultiplier={MAX_FONT_MULT}>
            All caught up
          </Text>
          <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULT}>
            No medications left to take today.
          </Text>
        </View>
      </View>
    );
  }

  const missed = next.missed;

  const handlePress = () => {
    navigation.navigate('LogMedication', {
      medicationId: next.id,
      medicationName: next.name,
    });
  };

  return (
    <View style={[styles.card, missed ? styles.warningCard : styles.primaryCard]}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={missed ? 'alert' : 'alarm'}
            size={28}
            color={missed ? colors.warning : colors.primary}
          />
        </View>
        <View style={styles.textCol}>
          <Text
            style={missed ? styles.eyebrowWarning : styles.eyebrowPrimary}
            maxFontSizeMultiplier={MAX_FONT_MULT}
          >
            {missed ? 'Missed dose' : 'Next up'}
          </Text>
          <Text style={styles.title} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_MULT}>
            {next.name}
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_MULT}>
            {formatTime12h(next.reminder_time)} · {next.dosage}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, missed ? styles.warningButton : styles.primaryButton]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Mark ${next.name} as taken`}
      >
        <Text style={styles.buttonText} maxFontSizeMultiplier={MAX_FONT_MULT}>
          Mark as Taken
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  primaryCard: { backgroundColor: colors.primaryLight },
  warningCard: { backgroundColor: colors.warningBg },
  successCard: { backgroundColor: colors.successBg, flexDirection: 'row', alignItems: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  eyebrowPrimary: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  eyebrowWarning: { fontSize: 14, fontWeight: '700', color: colors.warning },
  eyebrowSuccess: { fontSize: 14, fontWeight: '700', color: colors.success },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textSecondary },
  button: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: { backgroundColor: colors.primary },
  warningButton: { backgroundColor: colors.warning },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
