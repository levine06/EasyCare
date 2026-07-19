import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTodaysMedications } from '../api/medications';
import { getTodaysMeals } from '../api/meals';
import { formatTime12h } from '../utils/medicationFormat';
import {
  colors,
  spacing,
  radius,
  cardShadow,
} from '../theme';

export default function TodaysSummary() {
  const [medications, setMedications] = useState([]);
  const [meals, setMeals] = useState([]);

  const load = useCallback(async () => {
    try {
      const meds = await getTodaysMedications();
      setMedications(meds);
    } catch {
      setMedications([]);
    }

    try {
      const mealData = await getTodaysMeals();
      setMeals(mealData);
    } catch {
      setMeals([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalMeds = medications.length;
  const completedMeds = medications.filter((m) => m.taken).length;

  const nextMedication = medications
    .filter((m) => !m.taken)
    .sort((a, b) =>
      (a.reminder_time || '').localeCompare(b.reminder_time || '')
    )[0];

  return (
    <View style={styles.card}>

      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="calendar"
          size={20}
          color="white"
        />

        <Text style={styles.headerTitle}>
          Today's Summary
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsRow}>

        {/* Medicine */}
        <View style={styles.infoCard}>
          <Ionicons
            name="medkit"
            size={30}
            color={colors.primary}
          />

          <Text style={styles.bigValue}>
            {completedMeds}/{totalMeds}
          </Text>

          <Text style={styles.label}>
            Medicine
          </Text>

          <Text style={styles.subLabel}>
            Taken
          </Text>
        </View>

        {/* Meals */}
        <View style={styles.infoCard}>
          <Ionicons
            name="restaurant"
            size={30}
            color={colors.primary}
          />

          <Text style={styles.bigValue}>
            {meals.length}/3
          </Text>

          <Text style={styles.label}>
            Meals
          </Text>

          <Text style={styles.subLabel}>
            Logged
          </Text>
        </View>

        {/* Next Medicine */}
        <View style={styles.infoCard}>
          <Ionicons
            name="alarm"
            size={30}
            color={colors.primary}
          />

          <Text style={styles.timeValue}>
            {nextMedication
              ? formatTime12h(nextMedication.reminder_time)
              : "--"}
          </Text>

          <Text style={styles.label}>
            Next
          </Text>

          <Text style={styles.subLabel}>
            Medicine
          </Text>
        </View>

      </View>

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
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },

  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },

  infoCard: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginHorizontal: 5,
  },

  bigValue: {
    marginTop: spacing.sm,
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  timeValue: {
    marginTop: spacing.sm,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  label: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
  },

  subLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },

});